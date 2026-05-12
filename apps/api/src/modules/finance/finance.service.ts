import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { PaymentStatus, PaymentGateway, FeeType } from '@prisma/client'
import Stripe from 'stripe'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class FinanceService {
  private stripe: Stripe | null = null

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const stripeKey = config.get<string>('STRIPE_SECRET_KEY')
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
    }
  }

  // ── Fee Structures ────────────────────────────────────────────────────────────

  async createFeeStructure(dto: {
    name: string; nameAr?: string; schoolId: string; academicYearId: string
    gradeLevelId?: string; feeType: FeeType; amount: number; currency: string
    dueDate?: string; installmentsAllowed?: boolean
  }) {
    return this.prisma.feeStructure.create({ data: dto as any })
  }

  async getFeeStructures(schoolId: string) {
    return this.prisma.feeStructure.findMany({
      where: { schoolId },
      include: { gradeLevel: { select: { name: true, nameAr: true } } },
    })
  }

  async updateFeeStructure(id: string, data: any) {
    return this.prisma.feeStructure.update({ where: { id }, data })
  }

  async deleteFeeStructure(id: string) {
    return this.prisma.feeStructure.delete({ where: { id } })
  }

  // ── Invoices ──────────────────────────────────────────────────────────────────

  async createInvoice(dto: {
    studentId: string; schoolId: string; academicYearId: string
    feeStructureId: string; dueDate: string; description?: string
  }) {
    const feeStructure = await this.prisma.feeStructure.findUnique({
      where: { id: dto.feeStructureId },
    })
    if (!feeStructure) throw new NotFoundException('Fee structure not found')

    const amount = (feeStructure as any).amount
    const invoiceNumber = await this.generateInvoiceNumber(dto.schoolId)

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        studentId: dto.studentId,
        schoolId: dto.schoolId,
        academicYearId: dto.academicYearId,
        subtotal: amount,
        discount: 0,
        tax: 0,
        total: amount,
        currency: (feeStructure as any).currency,
        dueDate: new Date(dto.dueDate),
        status: PaymentStatus.PENDING,
        items: {
          create: [{
            feeStructureId: dto.feeStructureId,
            description: dto.description || (feeStructure as any).name,
            descriptionAr: (feeStructure as any).nameAr,
            amount,
          }],
        },
      } as any,
    })
  }

  async bulkCreateInvoices(schoolId: string, feeStructureId: string, academicYearId: string, studentIds: string[], dueDate: string) {
    const results = await Promise.allSettled(
      studentIds.map((studentId) =>
        this.createInvoice({ studentId, schoolId, academicYearId, feeStructureId, dueDate }),
      ),
    )
    return {
      created: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    }
  }

  async getInvoices(schoolId: string, query: {
    studentId?: string; status?: PaymentStatus; page?: number; limit?: number
  }) {
    const { studentId, status, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit
    const where: any = { schoolId }
    if (studentId) where.studentId = studentId
    if (status) where.status = status

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where, skip, take: +limit,
        include: {
          items: { include: { feeStructure: { select: { name: true, nameAr: true, feeType: true } } } },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ])
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) } }
  }

  async getStudentInvoices(studentId: string) {
    return this.prisma.invoice.findMany({
      where: { studentId },
      include: {
        items: { include: { feeStructure: { select: { name: true, feeType: true } } } },
        payments: true,
      },
      orderBy: { dueDate: 'asc' },
    })
  }

  // ── Payments ──────────────────────────────────────────────────────────────────

  async processPayment(dto: {
    invoiceId: string; gateway: PaymentGateway; amount: number; currency: string
    gatewayTransactionId?: string; paymentMethodId?: string
  }) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: dto.invoiceId } })
    if (!invoice) throw new NotFoundException('Invoice not found')
    if ((invoice as any).status === PaymentStatus.PAID) throw new BadRequestException('Invoice already paid')

    let gatewayTransactionId = dto.gatewayTransactionId
    if (dto.gateway === PaymentGateway.STRIPE && dto.paymentMethodId && this.stripe) {
      const pi = await this.stripe.paymentIntents.confirm(dto.paymentMethodId)
      gatewayTransactionId = pi.id
    }

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        currency: dto.currency,
        gateway: dto.gateway,
        gatewayTransactionId: gatewayTransactionId || `MANUAL-${Date.now()}`,
        status: 'SUCCESS',
        paidAt: new Date(),
      } as any,
    })

    // Check if invoice fully paid
    const allPayments = await this.prisma.payment.aggregate({
      where: { invoiceId: dto.invoiceId, status: 'SUCCESS' } as any,
      _sum: { amount: true },
    })
    const totalPaid = allPayments._sum.amount || 0
    const invoiceTotal = (invoice as any).total

    await this.prisma.invoice.update({
      where: { id: dto.invoiceId },
      data: {
        status: totalPaid >= invoiceTotal ? PaymentStatus.PAID : PaymentStatus.PARTIAL,
        paidAt: totalPaid >= invoiceTotal ? new Date() : null,
      } as any,
    })

    return { payment, totalPaid, invoiceTotal }
  }

  async getFinancialSummary(schoolId: string, academicYearId?: string) {
    const where: any = { schoolId }
    if (academicYearId) where.academicYearId = academicYearId

    const [totalResult, paidResult, overdue, pending] = await Promise.all([
      this.prisma.invoice.aggregate({ where, _sum: { total: true } }),
      this.prisma.invoice.aggregate({ where: { ...where, status: PaymentStatus.PAID }, _sum: { total: true } }),
      this.prisma.invoice.count({ where: { ...where, status: PaymentStatus.OVERDUE } }),
      this.prisma.invoice.count({ where: { ...where, status: PaymentStatus.PENDING } }),
    ])

    const totalInvoiced = totalResult._sum.total || 0
    const totalPaid = paidResult._sum.total || 0

    return {
      totalInvoiced,
      totalPaid,
      totalCollected: totalPaid,  // alias for frontend compatibility
      totalOutstanding: totalInvoiced - totalPaid,
      overdueCount: overdue,
      pendingCount: pending,
    }
  }

  async createStripePaymentIntent(amount: number, currency: string, metadata?: Record<string, string>) {
    if (!this.stripe) throw new BadRequestException('Stripe not configured')
    return this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata,
    })
  }

  private async generateInvoiceNumber(schoolId: string): Promise<string> {
    const count = await this.prisma.invoice.count({ where: { schoolId } })
    const year = new Date().getFullYear()
    return `INV-${year}-${String(count + 1).padStart(6, '0')}`
  }
}
