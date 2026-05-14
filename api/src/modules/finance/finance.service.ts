import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { PaymentStatus, PaymentGateway, FeeType } from '@prisma/client'
import Stripe from 'stripe'
import { ConfigService } from '@nestjs/config'

const FINANCE_DB = (prisma: any) => ({
  chartOfAccount:     prisma.chartOfAccount,
  journalEntry:       prisma.journalEntry,
  journalEntryLine:   prisma.journalEntryLine,
  budget:             prisma.budget,
  budgetItem:         prisma.budgetItem,
  feeTemplate:        prisma.feeTemplate,
  feeTemplateItem:    prisma.feeTemplateItem,
  paymentPlan:        prisma.paymentPlan,
  paymentInstallment: prisma.paymentInstallment,
  discountRule:       prisma.discountRule,
  fineRule:           prisma.fineRule,
  creditNote:         prisma.creditNote,
  payrollRun:         prisma.payrollRun,
  payslipRecord:      prisma.payslipRecord,
  staffLoan:          prisma.staffLoan,
  expenseClaim:       prisma.expenseClaim,
  bankAccount:        prisma.bankAccount,
  bankStatement:      prisma.bankStatement,
})

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

  private get db() { return FINANCE_DB(this.prisma) }

  // ── Fee Structures ────────────────────────────────────────────────────────────

  async createFeeStructure(dto: {
    name: string; nameAr?: string; schoolId: string; academicYearId: string
    gradeLevelId?: string; feeType: FeeType; amount: number; currency: string
    dueDate?: string; installmentsAllowed?: boolean
  }) {
    const data: any = { ...dto }
    if (data.dueDate) data.dueDate = new Date(data.dueDate)
    return this.prisma.feeStructure.create({ data })
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

  // ── Fee Templates ─────────────────────────────────────────────────────────────

  async createFeeTemplate(dto: any) {
    const { items, ...rest } = dto
    return this.db.feeTemplate.create({
      data: {
        ...rest,
        items: items?.length ? { create: items } : undefined,
      },
      include: { items: true },
    })
  }

  async getFeeTemplates(schoolId: string) {
    return this.db.feeTemplate.findMany({
      where: { schoolId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async updateFeeTemplate(id: string, dto: any) {
    const { items, ...rest } = dto
    return this.db.feeTemplate.update({ where: { id }, data: rest })
  }

  async deleteFeeTemplate(id: string) {
    return this.db.feeTemplate.delete({ where: { id } })
  }

  async applyFeeTemplate(templateId: string, studentIds: string[], academicYearId: string, dueDate: string) {
    const template = await this.db.feeTemplate.findUnique({
      where: { id: templateId },
      include: { items: true },
    })
    if (!template) throw new NotFoundException('Fee template not found')

    const results = await Promise.allSettled(
      studentIds.map(async (studentId: string) => {
        const subtotal = template.items.reduce((s: number, i: any) => s + Number(i.amount), 0)
        const invoiceNumber = await this.generateInvoiceNumber(template.schoolId)
        return this.prisma.invoice.create({
          data: {
            invoiceNumber,
            studentId,
            schoolId: template.schoolId,
            academicYearId,
            subtotal,
            discount: 0,
            tax: 0,
            total: subtotal,
            currency: template.items[0]?.currency || 'SAR',
            dueDate: new Date(dueDate),
            status: PaymentStatus.PENDING,
            items: {
              create: template.items.map((item: any) => ({
                feeStructureId: null,
                description: item.label || item.feeType,
                amount: Number(item.amount),
              })),
            },
          } as any,
        })
      }),
    )
    return {
      created: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    }
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

  async getInvoiceStatement(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        payments: true,
        paymentPlan: { include: { installments: true } } as any,
      } as any,
    })
    if (!invoice) throw new NotFoundException('Invoice not found')
    return invoice
  }

  // ── Payment Plans ─────────────────────────────────────────────────────────────

  async createPaymentPlan(invoiceId: string, installments: { dueDate: string; amount: number }[]) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) throw new NotFoundException('Invoice not found')

    const totalInstallments = installments.reduce((s, i) => s + i.amount, 0)
    if (Math.abs(totalInstallments - (invoice as any).total) > 0.01) {
      throw new BadRequestException('Installment amounts must equal invoice total')
    }

    return this.db.paymentPlan.create({
      data: {
        invoiceId,
        installments: {
          create: installments.map((i) => ({
            dueDate: new Date(i.dueDate),
            amount: i.amount,
            status: 'PENDING',
          })),
        },
      },
      include: { installments: true },
    })
  }

  // ── Discount Rules ────────────────────────────────────────────────────────────

  async getDiscountRules(schoolId: string) {
    return this.db.discountRule.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } })
  }

  async createDiscountRule(dto: any) {
    return this.db.discountRule.create({ data: dto })
  }

  async updateDiscountRule(id: string, dto: any) {
    return this.db.discountRule.update({ where: { id }, data: dto })
  }

  async deleteDiscountRule(id: string) {
    return this.db.discountRule.delete({ where: { id } })
  }

  // ── Fine Rules ────────────────────────────────────────────────────────────────

  async getFineRules(schoolId: string) {
    return this.db.fineRule.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } })
  }

  async createFineRule(dto: any) {
    return this.db.fineRule.create({ data: dto })
  }

  async updateFineRule(id: string, dto: any) {
    return this.db.fineRule.update({ where: { id }, data: dto })
  }

  async applyLatePaymentFines(schoolId: string) {
    const rules = await this.db.fineRule.findMany({ where: { schoolId, isActive: true } })
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: { schoolId, status: PaymentStatus.OVERDUE },
    })

    let finesApplied = 0
    const today = new Date()

    for (const invoice of overdueInvoices) {
      for (const rule of rules) {
        const inv = invoice as any
        const daysOverdue = Math.floor((today.getTime() - new Date(inv.dueDate).getTime()) / 86400000)
        if (daysOverdue <= rule.graceDays) continue

        let fineAmount = 0
        if (rule.fineType === 'FIXED_AMOUNT') {
          fineAmount = Number(rule.fineValue)
        } else if (rule.fineType === 'FIXED_PER_DAY') {
          fineAmount = Number(rule.fineValue) * (daysOverdue - rule.graceDays)
        } else if (rule.fineType === 'PERCENTAGE_PER_DAY') {
          fineAmount = (Number(rule.fineValue) / 100) * Number(inv.total) * (daysOverdue - rule.graceDays)
        }

        if (rule.maxFine) fineAmount = Math.min(fineAmount, Number(rule.maxFine))

        if (fineAmount > 0) {
          await this.prisma.invoice.update({
            where: { id: inv.id },
            data: { total: { increment: fineAmount } as any } as any,
          })
          finesApplied++
        }
      }
    }
    return { finesApplied }
  }

  // ── Credit Notes ──────────────────────────────────────────────────────────────

  async getCreditNotes(orgId: string, schoolId?: string) {
    const where: any = { orgId }
    if (schoolId) where.schoolId = schoolId
    return this.db.creditNote.findMany({ where, orderBy: { createdAt: 'desc' } })
  }

  async createCreditNote(dto: any) {
    return this.db.creditNote.create({ data: dto })
  }

  async approveCreditNote(id: string, approvedById: string) {
    return this.db.creditNote.update({
      where: { id },
      data: { status: 'APPROVED', approvedById, approvedAt: new Date() },
    })
  }

  async applyCreditNote(id: string) {
    const note = await this.db.creditNote.findUnique({ where: { id } })
    if (!note) throw new NotFoundException('Credit note not found')
    if (note.status !== 'APPROVED') throw new BadRequestException('Credit note must be approved first')

    if (note.invoiceId) {
      await this.prisma.invoice.update({
        where: { id: note.invoiceId },
        data: { discount: { increment: Number(note.amount) } as any } as any,
      })
    }

    return this.db.creditNote.update({
      where: { id },
      data: { status: 'APPLIED', appliedAt: new Date() },
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

  // ── Payment History ───────────────────────────────────────────────────────────

  async getPaymentHistory(schoolId: string, query: {
    studentId?: string; gateway?: string; status?: string
    from?: string; to?: string; page?: number; limit?: number
  }) {
    const { studentId, gateway, status, from, to, page = 1, limit = 30 } = query
    const skip = (page - 1) * +limit
    const where: any = { invoice: { schoolId } }
    if (studentId) where.invoice = { ...where.invoice, studentId }
    if (gateway) where.gateway = gateway
    if (status) where.status = status
    if (from || to) {
      where.paidAt = {}
      if (from) where.paidAt.gte = new Date(from)
      if (to) where.paidAt.lte = new Date(to)
    }
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          invoice: {
            select: {
              invoiceNumber: true, total: true, studentId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: +limit,
      }),
      this.prisma.payment.count({ where }),
    ])
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) } }
  }

  async reversePayment(paymentId: string, reversedById: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId }, include: { invoice: true } as any })
    if (!payment) throw new NotFoundException('Payment not found')
    if ((payment as any).status === 'REVERSED') throw new BadRequestException('Payment already reversed')

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REVERSED', reversedAt: new Date(), reversedById } as any,
    })

    // Recalculate invoice paid amount
    const allPayments = await this.prisma.payment.aggregate({
      where: { invoiceId: payment.invoiceId, status: 'SUCCESS' } as any,
      _sum: { amount: true },
    })
    const totalPaid = allPayments._sum.amount || 0
    const invoice = payment.invoice as any
    await this.prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        status: totalPaid >= invoice.total ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID',
        paidAt: totalPaid >= invoice.total ? invoice.paidAt : null,
      } as any,
    })
    return { success: true }
  }

  // ── Advance Payments ──────────────────────────────────────────────────────────

  async createAdvancePayment(dto: {
    schoolId: string; studentId: string; orgId?: string; amount: number
    currency?: string; gateway?: string; reference?: string; notes?: string; createdById?: string
  }) {
    return this.prisma.advancePayment.create({
      data: {
        schoolId: dto.schoolId,
        studentId: dto.studentId,
        orgId: dto.orgId,
        amount: dto.amount,
        currency: (dto.currency || 'SAR') as any,
        gateway: (dto.gateway || 'CASH') as any,
        reference: dto.reference,
        notes: dto.notes,
        balance: dto.amount,
        createdById: dto.createdById,
      },
    })
  }

  async getAdvancePayments(schoolId: string) {
    return (this.prisma as any).advancePayment.findMany({
      where: { schoolId },
      include: {
        student: { select: { profile: { select: { firstName: true, lastName: true, studentId: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // ── Chart of Accounts ─────────────────────────────────────────────────────────

  async getChartOfAccounts(orgId: string, schoolId?: string) {
    const where: any = { orgId }
    if (schoolId) where.schoolId = schoolId
    const accounts = await this.db.chartOfAccount.findMany({
      where,
      orderBy: { code: 'asc' },
    })
    return this.buildAccountTree(accounts)
  }

  async createAccount(dto: any) {
    return this.db.chartOfAccount.create({ data: dto })
  }

  async updateAccount(id: string, dto: any) {
    return this.db.chartOfAccount.update({ where: { id }, data: dto })
  }

  async deleteAccount(id: string) {
    return this.db.chartOfAccount.update({ where: { id }, data: { isActive: false } })
  }

  private buildAccountTree(accounts: any[]): any[] {
    const map = new Map(accounts.map((a) => [a.id, { ...a, children: [] }]))
    const roots: any[] = []
    for (const acc of map.values()) {
      if (acc.parentId) {
        const parent = map.get(acc.parentId)
        if (parent) parent.children.push(acc)
        else roots.push(acc)
      } else {
        roots.push(acc)
      }
    }
    return roots
  }

  async seedDefaultChartOfAccounts(orgId: string) {
    const defaults = [
      { code: '1000', name: 'Assets', nameAr: 'الأصول', type: 'ASSET' },
      { code: '1100', name: 'Current Assets', nameAr: 'الأصول المتداولة', type: 'ASSET', subType: 'Current' },
      { code: '1110', name: 'Cash', nameAr: 'النقدية', type: 'ASSET', subType: 'Current' },
      { code: '1120', name: 'Bank', nameAr: 'البنك', type: 'ASSET', subType: 'Current' },
      { code: '1130', name: 'Accounts Receivable', nameAr: 'ذمم مدينة', type: 'ASSET', subType: 'Current' },
      { code: '2000', name: 'Liabilities', nameAr: 'الالتزامات', type: 'LIABILITY' },
      { code: '2100', name: 'Accounts Payable', nameAr: 'ذمم دائنة', type: 'LIABILITY' },
      { code: '3000', name: 'Equity', nameAr: 'حقوق الملكية', type: 'EQUITY' },
      { code: '4000', name: 'Revenue', nameAr: 'الإيرادات', type: 'REVENUE' },
      { code: '4100', name: 'Tuition Fees', nameAr: 'رسوم الدراسة', type: 'REVENUE' },
      { code: '4200', name: 'Other Fees', nameAr: 'رسوم أخرى', type: 'REVENUE' },
      { code: '5000', name: 'Expenses', nameAr: 'المصروفات', type: 'EXPENSE' },
      { code: '5100', name: 'Salaries & Wages', nameAr: 'الرواتب والأجور', type: 'EXPENSE' },
      { code: '5200', name: 'Utilities', nameAr: 'المرافق', type: 'EXPENSE' },
      { code: '5300', name: 'Maintenance', nameAr: 'الصيانة', type: 'EXPENSE' },
    ]

    for (const acc of defaults) {
      await this.db.chartOfAccount.upsert({
        where: { orgId_code: { orgId, code: acc.code } },
        create: { ...acc, orgId },
        update: {},
      })
    }
    return { seeded: defaults.length }
  }

  // ── Journal Entries ───────────────────────────────────────────────────────────

  async getJournalEntries(orgId: string, schoolId?: string, filters: any = {}) {
    const where: any = { orgId }
    if (schoolId) where.schoolId = schoolId
    if (filters.status) where.status = filters.status
    if (filters.from || filters.to) {
      where.date = {}
      if (filters.from) where.date.gte = new Date(filters.from)
      if (filters.to) where.date.lte = new Date(filters.to)
    }

    const page = +filters.page || 1
    const limit = +filters.limit || 20
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.db.journalEntry.findMany({
        where, skip, take: limit,
        include: { lines: { include: { account: { select: { code: true, name: true } } } } },
        orderBy: { date: 'desc' },
      }),
      this.db.journalEntry.count({ where }),
    ])
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }

  async createJournalEntry(dto: any) {
    const { lines, orgId, ...rest } = dto
    if (!lines || lines.length < 2) throw new BadRequestException('Journal entry requires at least 2 lines')

    const totalDebit = lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0)
    const totalCredit = lines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException('Debit and credit totals must be equal')
    }

    const count = await this.db.journalEntry.count({ where: { orgId } })
    const entryNumber = `JE-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`

    return this.db.journalEntry.create({
      data: {
        ...rest,
        orgId,
        entryNumber,
        status: 'DRAFT',
        lines: { create: lines },
      },
      include: { lines: { include: { account: { select: { code: true, name: true } } } } },
    })
  }

  async postJournalEntry(id: string) {
    const entry = await this.db.journalEntry.findUnique({ where: { id } })
    if (!entry) throw new NotFoundException('Journal entry not found')
    if (entry.status === 'POSTED') throw new BadRequestException('Entry already posted')
    return this.db.journalEntry.update({ where: { id }, data: { status: 'POSTED' } })
  }

  async reverseJournalEntry(id: string, reversedById: string) {
    const entry = await this.db.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    })
    if (!entry) throw new NotFoundException('Journal entry not found')
    if (entry.status !== 'POSTED') throw new BadRequestException('Only posted entries can be reversed')
    if (entry.isReversed) throw new BadRequestException('Entry already reversed')

    const count = await this.db.journalEntry.count({ where: { orgId: entry.orgId } })
    const entryNumber = `JE-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`

    const reversal = await this.db.journalEntry.create({
      data: {
        orgId: entry.orgId,
        schoolId: entry.schoolId,
        entryNumber,
        date: new Date(),
        description: `Reversal of ${entry.entryNumber}: ${entry.description}`,
        reference: entry.id,
        refType: 'REVERSAL',
        status: 'POSTED',
        createdById: reversedById,
        lines: {
          create: entry.lines.map((l: any) => ({
            accountId: l.accountId,
            debit: l.credit,
            credit: l.debit,
            memo: l.memo,
            costCenter: l.costCenter,
          })),
        },
      },
      include: { lines: true },
    })

    await this.db.journalEntry.update({
      where: { id },
      data: { isReversed: true, reversedBy: reversedById },
    })

    return reversal
  }

  // ── Budgets ───────────────────────────────────────────────────────────────────

  async getBudgets(orgId: string, schoolId?: string, fiscalYear?: number) {
    const where: any = { orgId }
    if (schoolId) where.schoolId = schoolId
    if (fiscalYear) where.fiscalYear = +fiscalYear
    return this.db.budget.findMany({
      where,
      include: { items: true },
      orderBy: { fiscalYear: 'desc' },
    })
  }

  async createBudget(dto: any) {
    const { items, startDate, endDate, ...rest } = dto
    return this.db.budget.create({
      data: {
        ...rest,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        items: items?.length ? { create: items } : undefined,
      },
      include: { items: true },
    })
  }

  async updateBudget(id: string, dto: any) {
    const { items, ...rest } = dto
    return this.db.budget.update({ where: { id }, data: rest })
  }

  async approveBudget(id: string, approvedById: string) {
    return this.db.budget.update({
      where: { id },
      data: { status: 'APPROVED', approvedById, approvedAt: new Date() },
    })
  }

  async getBudgetVariance(id: string) {
    const budget = await this.db.budget.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!budget) throw new NotFoundException('Budget not found')

    const items = budget.items.map((item: any) => ({
      ...item,
      variance: Number(item.amount) - Number(item.actualSpent),
      variancePct: Number(item.amount) > 0
        ? ((Number(item.amount) - Number(item.actualSpent)) / Number(item.amount) * 100).toFixed(1)
        : '0',
    }))

    const totalBudgeted = items.reduce((s: number, i: any) => s + Number(i.amount), 0)
    const totalSpent = items.reduce((s: number, i: any) => s + Number(i.actualSpent), 0)

    return { budget: { ...budget, items }, totalBudgeted, totalSpent, totalVariance: totalBudgeted - totalSpent }
  }

  // ── Payroll ───────────────────────────────────────────────────────────────────

  async getPayrollRuns(orgId: string, schoolId?: string, year?: number) {
    const where: any = { orgId }
    if (schoolId) where.schoolId = schoolId
    if (year) where.year = +year
    return this.db.payrollRun.findMany({
      where,
      include: { slips: { select: { id: true, staffId: true, netPay: true, status: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })
  }

  async createPayrollRun(dto: { orgId: string; schoolId: string; month: number; year: number }) {
    const exists = await this.db.payrollRun.findFirst({
      where: { schoolId: dto.schoolId, month: dto.month, year: dto.year },
    })
    if (exists) throw new BadRequestException('Payroll run already exists for this period')

    return this.db.payrollRun.create({ data: { ...dto, status: 'DRAFT' } })
  }

  async getPayrollRun(id: string) {
    const run = await this.db.payrollRun.findUnique({
      where: { id },
      include: {
        slips: {
          include: {
            staff: {
              include: {
                user: { select: { profile: { select: { firstName: true, lastName: true } } } },
              },
            },
          },
        },
      },
    })
    if (!run) throw new NotFoundException('Payroll run not found')
    return run
  }

  async processPayrollRun(id: string, processedById: string) {
    const run = await this.db.payrollRun.findUnique({ where: { id } })
    if (!run) throw new NotFoundException('Payroll run not found')
    if (run.status !== 'DRAFT') throw new BadRequestException('Can only process DRAFT runs')

    // Get all staff in this school with their contracts
    const staff = await (this.prisma as any).staffProfile.findMany({
      where: { schoolId: run.schoolId },
      include: {
        contracts: { where: { status: 'ACTIVE' }, take: 1 },
        attendances: {
          where: { date: { gte: new Date(run.year, run.month - 1, 1), lt: new Date(run.year, run.month, 1) } },
        },
        loans: { where: { status: 'ACTIVE' } },
      },
    })

    const slips = []
    let totalGross = 0, totalDeductions = 0, totalNet = 0

    for (const s of staff) {
      const baseSalary = s.salary || (s.contracts[0]?.salary) || 0
      if (!baseSalary) continue

      // Attendance deductions
      const workingDays = 22
      const absences = s.attendances.filter((a: any) => a.status === 'ABSENT').length
      const leaveDeduction = (baseSalary / workingDays) * absences

      // Loan deductions
      const activeLoan = s.loans[0]
      const loanDeduction = activeLoan ? Number(activeLoan.monthlyDeduction) : 0

      const grossPay = baseSalary
      const totalDed = leaveDeduction + loanDeduction
      const netPay = grossPay - totalDed

      totalGross += grossPay
      totalDeductions += totalDed
      totalNet += netPay

      slips.push({
        runId: id,
        staffId: s.id,
        baseSalary,
        overtime: 0,
        bonus: 0,
        allowances: 0,
        grossPay,
        taxDeduction: 0,
        insuranceDeduction: 0,
        loanDeduction,
        leaveDeduction,
        otherDeductions: 0,
        totalDeductions: totalDed,
        netPay,
        bankAccount: s.bankAccount || null,
        status: 'PENDING',
      })
    }

    await this.db.payslipRecord.deleteMany({ where: { runId: id } })
    if (slips.length > 0) {
      await this.db.payslipRecord.createMany({ data: slips })
    }

    return this.db.payrollRun.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        processedById,
        totalGross,
        totalDeductions,
        totalNet,
      },
    })
  }

  async approvePayrollRun(id: string, approvedById: string) {
    return this.db.payrollRun.update({
      where: { id },
      data: { status: 'APPROVED', approvedById },
    })
  }

  async deletePayrollRun(id: string) {
    const run = await this.db.payrollRun.findUnique({ where: { id } })
    if (!run) throw new NotFoundException('Payroll run not found')
    if (run.status !== 'DRAFT') throw new BadRequestException('Only DRAFT payroll runs can be deleted')
    return this.db.payrollRun.delete({ where: { id } })
  }

  async rejectPayrollRun(id: string) {
    const run = await this.db.payrollRun.findUnique({ where: { id } })
    if (!run) throw new NotFoundException('Payroll run not found')
    if (run.status !== 'APPROVED') throw new BadRequestException('Only APPROVED payroll runs can be rejected')
    return this.db.payrollRun.update({ where: { id }, data: { status: 'REJECTED' as any } })
  }

  async payPayrollRun(id: string) {
    const run = await this.db.payrollRun.findUnique({ where: { id } })
    if (!run) throw new NotFoundException('Payroll run not found')
    if (run.status !== 'APPROVED') throw new BadRequestException('Payroll run must be approved before payment')

    await this.db.payslipRecord.updateMany({ where: { runId: id }, data: { status: 'PAID' } })
    return this.db.payrollRun.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } })
  }

  async getPayslip(runId: string, staffId: string) {
    const slip = await this.db.payslipRecord.findFirst({
      where: { runId, staffId },
      include: { run: true, staff: { include: { user: true } } },
    })
    if (!slip) throw new NotFoundException('Payslip not found')
    return slip
  }

  // ── Staff Loans ───────────────────────────────────────────────────────────────

  async getLoans(orgId: string, schoolId?: string) {
    const where: any = schoolId ? { schoolId } : {}
    return this.db.staffLoan.findMany({
      where,
      include: { staff: { include: { user: { select: { profile: { select: { firstName: true, lastName: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createLoan(dto: any) {
    return this.db.staffLoan.create({ data: dto })
  }

  async approveLoan(id: string, approvedById: string) {
    return this.db.staffLoan.update({
      where: { id },
      data: { status: 'APPROVED', approvedById, startDate: new Date() },
    })
  }

  async rejectLoan(id: string) {
    return this.db.staffLoan.update({ where: { id }, data: { status: 'REJECTED' } })
  }

  // ── Expense Claims ────────────────────────────────────────────────────────────

  async getExpenses(orgId: string, schoolId?: string, status?: string) {
    const where: any = { orgId }
    if (schoolId) where.schoolId = schoolId
    if (status) where.status = status
    return this.db.expenseClaim.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
  }

  async createExpense(dto: any) {
    return this.db.expenseClaim.create({ data: dto })
  }

  async approveExpense(id: string, approvedById: string) {
    return this.db.expenseClaim.update({
      where: { id },
      data: { status: 'APPROVED', approvedById, approvedAt: new Date() },
    })
  }

  async rejectExpense(id: string, notes?: string) {
    return this.db.expenseClaim.update({
      where: { id },
      data: { status: 'REJECTED', rejectedAt: new Date(), notes },
    })
  }

  async reimburseExpense(id: string) {
    return this.db.expenseClaim.update({
      where: { id },
      data: { status: 'REIMBURSED' },
    })
  }

  // ── Bank Accounts ─────────────────────────────────────────────────────────────

  async getBankAccounts(orgId: string, schoolId?: string) {
    const where: any = { orgId }
    if (schoolId) where.schoolId = schoolId
    return this.db.bankAccount.findMany({
      where,
      include: { statements: { orderBy: { date: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createBankAccount(dto: any) {
    return this.db.bankAccount.create({ data: dto })
  }

  async addBankStatement(bankAccountId: string, statements: any[]) {
    return this.db.bankStatement.createMany({
      data: statements.map((s) => ({ ...s, bankAccountId })),
    })
  }

  async getBankReconciliation(bankAccountId: string) {
    return this.db.bankStatement.findMany({
      where: { bankAccountId, isReconciled: false },
      orderBy: { date: 'desc' },
    })
  }

  // ── Reports ───────────────────────────────────────────────────────────────────

  async getTrialBalance(orgId: string, schoolId?: string, year?: number, month?: number) {
    const accounts = await this.db.chartOfAccount.findMany({
      where: { orgId, ...(schoolId ? { schoolId } : {}) },
      include: {
        lines: {
          where: {
            entry: {
              status: 'POSTED',
              ...(year ? { date: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } } : {}),
            },
          },
          include: { entry: { select: { date: true } } },
        },
      },
      orderBy: { code: 'asc' },
    })

    const rows = accounts.map((acc: any) => {
      const totalDebit = acc.lines.reduce((s: number, l: any) => s + Number(l.debit), 0)
      const totalCredit = acc.lines.reduce((s: number, l: any) => s + Number(l.credit), 0)
      return {
        code: acc.code,
        name: acc.name,
        nameAr: acc.nameAr,
        type: acc.type,
        totalDebit,
        totalCredit,
        balance: totalDebit - totalCredit,
      }
    }).filter((r: any) => r.totalDebit !== 0 || r.totalCredit !== 0)

    const grandDebit = rows.reduce((s: number, r: any) => s + r.totalDebit, 0)
    const grandCredit = rows.reduce((s: number, r: any) => s + r.totalCredit, 0)

    return { rows, grandDebit, grandCredit, isBalanced: Math.abs(grandDebit - grandCredit) < 0.01 }
  }

  async getIncomeStatement(orgId: string, schoolId: string, year: number, month?: number) {
    const dateFilter: any = { gte: new Date(year, (month ? month - 1 : 0), 1) }
    if (month) dateFilter.lt = new Date(year, month, 1)
    else dateFilter.lt = new Date(year + 1, 0, 1)

    const [revenueResult, expenseResult] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { schoolId, status: 'PAID' as any, paidAt: dateFilter },
        _sum: { total: true },
      }),
      this.db.expenseClaim.aggregate({
        where: { schoolId, status: 'REIMBURSED', approvedAt: dateFilter },
        _sum: { amount: true },
      }),
    ])

    const totalRevenue = Number(revenueResult._sum.total || 0)
    const totalExpenses = Number(expenseResult._sum.amount || 0)

    return {
      period: month ? `${year}-${String(month).padStart(2, '0')}` : String(year),
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
    }
  }

  async getOutstandingReport(schoolId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { schoolId, status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] } as any },
      include: { payments: true },
      orderBy: { dueDate: 'asc' },
    })

    const today = new Date()
    const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }

    const rows = invoices.map((inv: any) => {
      const totalPaid = inv.payments.reduce((s: number, p: any) => s + p.amount, 0)
      const outstanding = inv.total - totalPaid
      const daysOverdue = Math.max(0, Math.floor((today.getTime() - new Date(inv.dueDate).getTime()) / 86400000))

      if (daysOverdue <= 30) buckets['0-30'] += outstanding
      else if (daysOverdue <= 60) buckets['31-60'] += outstanding
      else if (daysOverdue <= 90) buckets['61-90'] += outstanding
      else buckets['90+'] += outstanding

      return { invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, studentId: inv.studentId, total: inv.total, paid: totalPaid, outstanding, daysOverdue, dueDate: inv.dueDate }
    })

    return { rows, buckets, totalOutstanding: rows.reduce((s: number, r: any) => s + r.outstanding, 0) }
  }

  async getAgingReport(schoolId: string) {
    return this.getOutstandingReport(schoolId)
  }

  async getCollectionReport(schoolId: string, year: number, month?: number) {
    const dateFilter: any = {}
    if (month) {
      dateFilter.gte = new Date(year, month - 1, 1)
      dateFilter.lt = new Date(year, month, 1)
    } else {
      dateFilter.gte = new Date(year, 0, 1)
      dateFilter.lt = new Date(year + 1, 0, 1)
    }

    const payments = await this.prisma.payment.findMany({
      where: { invoice: { schoolId } as any, status: 'SUCCESS', paidAt: dateFilter } as any,
      include: { invoice: { select: { schoolId: true, currency: true } } },
    })

    const total = payments.reduce((s: number, p: any) => s + p.amount, 0)
    const byGateway: Record<string, number> = {}
    for (const p of payments) {
      byGateway[p.gateway] = (byGateway[p.gateway] || 0) + p.amount
    }

    return { period: month ? `${year}-${month}` : String(year), totalCollected: total, transactionCount: payments.length, byGateway }
  }

  async getSchoolProfitability(orgId: string, year: number) {
    const schools = await this.prisma.school.findMany({ where: { organizationId: orgId } })

    const results = await Promise.all(
      schools.map(async (school) => {
        const income = await this.getIncomeStatement(orgId, school.id, year)
        return { schoolId: school.id, schoolName: (school as any).name, ...income }
      }),
    )

    return results
  }

  // ── Financial Summary (existing) ──────────────────────────────────────────────

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
      totalCollected: totalPaid,
      totalOutstanding: totalInvoiced - totalPaid,
      overdueCount: overdue,
      pendingCount: pending,
    }
  }

  async getCashierTodaySummary(schoolId: string) {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const payments = await this.prisma.payment.findMany({
      where: {
        invoice: { schoolId },
        createdAt: { gte: todayStart, lte: todayEnd },
      },
      select: { amount: true, gateway: true },
    })

    const totalCollected = payments.reduce((s: number, p: any) => s + Number(p.amount), 0)
    const transactionCount = payments.length

    const byMethod = { cashAmount: 0, cardAmount: 0, bankAmount: 0, chequeAmount: 0 }
    for (const p of payments) {
      const gw = (p.gateway ?? '').toUpperCase()
      if (gw === 'CASH')   byMethod.cashAmount   += Number(p.amount)
      else if (gw === 'CARD')   byMethod.cardAmount   += Number(p.amount)
      else if (gw === 'BANK_TRANSFER' || gw === 'BANK') byMethod.bankAmount += Number(p.amount)
      else if (gw === 'CHEQUE' || gw === 'CHECK') byMethod.chequeAmount += Number(p.amount)
    }

    return { totalCollected, transactionCount, ...byMethod }
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

  // ── Fiscal Years ─────────────────────────────────────────────────────────
  async getFiscalYears(orgId: string) {
    return (this.prisma as any).fiscalYear.findMany({
      where: { orgId },
      include: { periods: { orderBy: { month: 'asc' } } },
      orderBy: { startDate: 'desc' },
    })
  }

  async createFiscalYear(dto: { orgId: string; name: string; startDate: string; endDate: string }) {
    const fy = await (this.prisma as any).fiscalYear.create({
      data: {
        orgId: dto.orgId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    })
    // Auto-generate 12 monthly periods
    const start = new Date(dto.startDate)
    const periods = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0) // last day of month
      periods.push({
        fiscalYearId: fy.id,
        name: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        startDate: d,
        endDate: end,
      })
    }
    await (this.prisma as any).accountingPeriod.createMany({ data: periods })
    return (this.prisma as any).fiscalYear.findUnique({ where: { id: fy.id }, include: { periods: { orderBy: { month: 'asc' } } } })
  }

  async closeFiscalYear(id: string, closedById: string) {
    // Close all open periods first
    await (this.prisma as any).accountingPeriod.updateMany({
      where: { fiscalYearId: id, status: 'OPEN' },
      data: { status: 'CLOSED', closedAt: new Date(), closedById },
    })
    return (this.prisma as any).fiscalYear.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), closedById },
    })
  }

  async closeAccountingPeriod(id: string, closedById: string) {
    return (this.prisma as any).accountingPeriod.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), closedById },
    })
  }

  // ── Opening Balances ──────────────────────────────────────────────────────
  async getOpeningBalances(orgId: string, fiscalYearId: string) {
    return (this.prisma as any).openingBalance.findMany({
      where: { orgId, fiscalYearId },
      include: { account: { select: { id: true, code: true, name: true, nameAr: true, type: true } } },
      orderBy: { account: { code: 'asc' } },
    })
  }

  async bulkSetOpeningBalances(orgId: string, fiscalYearId: string, balances: { accountId: string; debit: number; credit: number }[]) {
    const ops = balances.map(b =>
      (this.prisma as any).openingBalance.upsert({
        where: { fiscalYearId_accountId: { fiscalYearId, accountId: b.accountId } },
        create: { orgId, fiscalYearId, accountId: b.accountId, debit: b.debit, credit: b.credit },
        update: { debit: b.debit, credit: b.credit },
      })
    )
    return this.prisma.$transaction(ops)
  }

  // ── Cost Centers ──────────────────────────────────────────────────────────
  async getCostCenters(orgId: string, schoolId?: string | null) {
    return (this.prisma as any).costCenter.findMany({
      where: { orgId, ...(schoolId ? { schoolId } : {}), isActive: true },
      include: { children: true },
      orderBy: { code: 'asc' },
    })
  }

  async createCostCenter(dto: { orgId: string; schoolId?: string; code: string; name: string; nameAr?: string; description?: string; parentId?: string }) {
    return (this.prisma as any).costCenter.create({ data: dto })
  }

  async updateCostCenter(id: string, dto: Partial<{ name: string; nameAr: string; description: string; isActive: boolean }>) {
    return (this.prisma as any).costCenter.update({ where: { id }, data: dto })
  }

  // ── General Ledger ────────────────────────────────────────────────────────
  async getGeneralLedger(orgId: string, accountId: string, startDate?: string, endDate?: string) {
    const account = await this.prisma.chartOfAccount.findUnique({
      where: { id: accountId },
      select: { id: true, code: true, name: true, nameAr: true, type: true },
    })
    if (!account) throw new Error('Account not found')

    const where: any = {
      accountId,
      entry: { orgId, status: 'POSTED' },
    }
    if (startDate || endDate) {
      where.entry = { ...where.entry, date: {} }
      if (startDate) where.entry.date.gte = new Date(startDate)
      if (endDate) where.entry.date.lte = new Date(endDate)
    }

    const lines = await this.prisma.journalEntryLine.findMany({
      where,
      include: {
        entry: { select: { id: true, entryNumber: true, date: true, description: true, reference: true } },
      },
      orderBy: { entry: { date: 'asc' } },
    })

    // Calculate running balance
    let runningBalance = 0
    const isDebitNormal = ['ASSET', 'EXPENSE'].includes(account.type)
    const rows = lines.map(line => {
      const debit = Number(line.debit)
      const credit = Number(line.credit)
      if (isDebitNormal) {
        runningBalance += debit - credit
      } else {
        runningBalance += credit - debit
      }
      return {
        date: line.entry.date,
        entryNumber: line.entry.entryNumber,
        description: line.entry.description,
        reference: line.entry.reference,
        debit,
        credit,
        balance: runningBalance,
        memo: line.memo,
        costCenter: line.costCenter,
      }
    })

    return { account, lines: rows, totalDebit: rows.reduce((s, r) => s + r.debit, 0), totalCredit: rows.reduce((s, r) => s + r.credit, 0), closingBalance: runningBalance }
  }

  // ── Balance Sheet ─────────────────────────────────────────────────────────
  async getBalanceSheet(orgId: string, schoolId?: string | null, asOfDate?: string) {
    const dateFilter = asOfDate ? { lte: new Date(asOfDate) } : undefined
    const entryWhere: any = { orgId, status: 'POSTED', ...(schoolId ? { schoolId } : {}) }
    if (dateFilter) entryWhere.date = dateFilter

    // Get all posted journal lines grouped by account
    const lines = await this.prisma.journalEntryLine.findMany({
      where: { entry: entryWhere },
      include: { account: { select: { id: true, code: true, name: true, nameAr: true, type: true, subType: true, parentId: true } } },
    })

    const accountBalances = new Map<string, { account: any; debit: number; credit: number }>()
    for (const line of lines) {
      const key = line.accountId
      if (!accountBalances.has(key)) {
        accountBalances.set(key, { account: line.account, debit: 0, credit: 0 })
      }
      const entry = accountBalances.get(key)!
      entry.debit += Number(line.debit)
      entry.credit += Number(line.credit)
    }

    const assets: any[] = []
    const liabilities: any[] = []
    const equity: any[] = []

    for (const [, { account, debit, credit }] of accountBalances) {
      const balance = account.type === 'ASSET' ? debit - credit : credit - debit
      if (balance === 0) continue
      const row = { ...account, balance }
      if (account.type === 'ASSET') assets.push(row)
      else if (account.type === 'LIABILITY') liabilities.push(row)
      else if (account.type === 'EQUITY') equity.push(row)
    }

    const totalAssets = assets.reduce((s, a) => s + a.balance, 0)
    const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0)
    const totalEquity = equity.reduce((s, a) => s + a.balance, 0)

    return {
      asOfDate: asOfDate || new Date().toISOString(),
      assets: assets.sort((a, b) => a.code.localeCompare(b.code)),
      liabilities: liabilities.sort((a, b) => a.code.localeCompare(b.code)),
      equity: equity.sort((a, b) => a.code.localeCompare(b.code)),
      totalAssets,
      totalLiabilities,
      totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    }
  }

  // ── Cash Flow Statement ───────────────────────────────────────────────────
  async getCashFlowStatement(orgId: string, schoolId?: string | null, year?: number, month?: number) {
    const y = year || new Date().getFullYear()
    const startDate = month ? new Date(y, month - 1, 1) : new Date(y, 0, 1)
    const endDate = month ? new Date(y, month, 0, 23, 59, 59) : new Date(y, 11, 31, 23, 59, 59)

    const schoolFilter = schoolId ? { schoolId } : {}

    // Operating: payments received
    const payments = await this.prisma.payment.findMany({
      where: {
        invoice: { schoolId: schoolId || undefined },
        status: 'SUCCESS',
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { amount: true, gateway: true },
    })
    const operatingInflows = payments.reduce((s, p) => s + p.amount, 0)

    // Operating: expense payments (reimbursed)
    const expenses = await this.prisma.expenseClaim.findMany({
      where: { orgId, ...schoolFilter, status: 'REIMBURSED', updatedAt: { gte: startDate, lte: endDate } },
      select: { amount: true, category: true },
    })
    const operatingOutflows = expenses.reduce((s, e) => s + Number(e.amount), 0)

    // Operating: payroll paid
    const payrollRuns = await this.prisma.payrollRun.findMany({
      where: { orgId, ...schoolFilter, status: 'PAID', paidAt: { gte: startDate, lte: endDate } },
      select: { totalNet: true },
    })
    const payrollOutflows = payrollRuns.reduce((s, r) => s + Number(r.totalNet), 0)

    // Financing: staff loans disbursed
    const loans = await (this.prisma as any).staffLoan.findMany({
      where: { ...schoolFilter, status: 'ACTIVE', startDate: { gte: startDate, lte: endDate } },
      select: { amount: true },
    })
    const loanOutflows = loans.reduce((s: number, l: any) => s + Number(l.amount), 0)

    const operatingActivities = [
      { label: 'Student Fee Collections', labelAr: 'تحصيل رسوم الطلاب', amount: operatingInflows, type: 'inflow' },
      { label: 'Expense Reimbursements', labelAr: 'مصاريف مدفوعة', amount: -operatingOutflows, type: 'outflow' },
      { label: 'Payroll Payments', labelAr: 'مدفوعات الرواتب', amount: -payrollOutflows, type: 'outflow' },
    ]
    const financingActivities = [
      { label: 'Staff Loans Disbursed', labelAr: 'سلف موظفين صرفت', amount: -loanOutflows, type: 'outflow' },
    ]

    const netOperating = operatingInflows - operatingOutflows - payrollOutflows
    const netFinancing = -loanOutflows

    return {
      period: { year: y, month, startDate, endDate },
      operatingActivities,
      investingActivities: [],
      financingActivities,
      netOperating,
      netInvesting: 0,
      netFinancing,
      netCashChange: netOperating + netFinancing,
    }
  }

  // ── Financial Forecast ────────────────────────────────────────────────────
  async getFinancialForecast(orgId: string, schoolId?: string | null, months: number = 6) {
    // Use last 3 months average to project forward
    const now = new Date()
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

    const recentPayments = await this.prisma.payment.findMany({
      where: {
        invoice: { schoolId: schoolId || undefined },
        status: 'SUCCESS',
        createdAt: { gte: threeMonthsAgo },
      },
      select: { amount: true, createdAt: true },
    })

    // Group by month
    const monthlyRevenue: Record<string, number> = {}
    for (const p of recentPayments) {
      const key = `${p.createdAt.getFullYear()}-${p.createdAt.getMonth() + 1}`
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + p.amount
    }

    const values = Object.values(monthlyRevenue)
    const avgMonthlyRevenue = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0

    // Simple linear projection with 5% growth assumption
    const forecast = []
    for (let i = 1; i <= months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      forecast.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        projectedRevenue: avgMonthlyRevenue * Math.pow(1.05, i / 12),
      })
    }

    return { avgMonthlyRevenue, forecast, basedOnMonths: values.length }
  }

  // ── Department-wise Report ────────────────────────────────────────────────
  async getDepartmentWiseReport(orgId: string, schoolId?: string | null, year?: number) {
    const y = year || new Date().getFullYear()
    const startDate = new Date(y, 0, 1)
    const endDate = new Date(y, 11, 31, 23, 59, 59)
    const schoolFilter = schoolId ? { schoolId } : {}

    const expenses = await this.prisma.expenseClaim.groupBy({
      by: ['costCenter'],
      where: { orgId, ...schoolFilter, createdAt: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      _count: true,
    })

    const costCenters = await (this.prisma as any).costCenter.findMany({
      where: { orgId, ...(schoolId ? { schoolId } : {}) },
      select: { code: true, name: true, nameAr: true },
    })
    const ccMap = Object.fromEntries(costCenters.map((c: any) => [c.code, c]))

    return expenses.map(e => ({
      costCenter: e.costCenter || 'Unassigned',
      name: e.costCenter ? (ccMap[e.costCenter]?.name || e.costCenter) : 'Unassigned',
      nameAr: e.costCenter ? (ccMap[e.costCenter]?.nameAr || e.costCenter) : 'غير مصنف',
      totalExpenses: Number(e._sum.amount || 0),
      claimCount: e._count,
    }))
  }
}
