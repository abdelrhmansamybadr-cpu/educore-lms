import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

const STAFF_INCLUDE = {
  include: {
    user: {
      select: {
        id: true,
        email: true,
        profile: { select: { firstName: true, lastName: true, avatar: true } },
      },
    },
  },
}

@Injectable()
export class SalaryService {
  constructor(private db: PrismaService) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  private recalcTotals(lines: any[]) {
    return lines.reduce(
      (acc, l) => ({
        totalBaseSalary: acc.totalBaseSalary + Number(l.baseSalary ?? 0),
        totalBonus:      acc.totalBonus      + Number(l.bonus      ?? 0),
        totalDeductions: acc.totalDeductions + Number(l.deductions ?? 0),
        totalNet:        acc.totalNet        + Number(l.netPay     ?? 0),
      }),
      { totalBaseSalary: 0, totalBonus: 0, totalDeductions: 0, totalNet: 0 },
    )
  }

  private batchInclude() {
    return {
      lines: {
        include: {
          staff: STAFF_INCLUDE,
        },
        orderBy: { createdAt: 'asc' as const },
      },
      school: { select: { id: true, name: true, nameAr: true, logo: true, currency: true } },
    }
  }

  /** Fetch the currency for a given orgId */
  async getOrgCurrency(orgId: string): Promise<string> {
    const org = await this.db.organization.findUnique({
      where: { id: orgId },
      select: { currency: true },
    })
    return org?.currency ?? 'SAR'
  }

  // ── HR: List batches for a school (or company) ───────────────────────────

  async listBatches(
    schoolId: string | null,
    orgId: string | null,
    isCompany: boolean,
    filters: { month?: number; year?: number },
  ) {
    const where: any = {}
    if (schoolId)       { where.schoolId = schoolId }        // specific school
    else if (isCompany) { where.orgId = orgId; where.schoolId = null } // company-only batches
    else if (orgId)     { where.orgId = orgId }              // all-schools view
    else return []
    if (filters.month) where.month = filters.month
    if (filters.year)  where.year  = filters.year

    return this.db.salaryBatch.findMany({
      where,
      include: this.batchInclude(),
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })
  }

  // ── HR: Get or auto-create a batch for a school/company/month/year ────────

  async getOrCreateBatch(
    schoolId: string | null,
    orgId: string,
    month: number,
    year: number,
    preparedById: string,
  ) {
    // Find existing batch
    let existing: any = null
    if (schoolId) {
      existing = await this.db.salaryBatch.findUnique({
        where: { schoolId_month_year: { schoolId, month, year } },
        include: this.batchInclude(),
      })
    } else {
      // Company-level batch: unique by orgId + null schoolId + period
      existing = await this.db.salaryBatch.findFirst({
        where: { orgId, schoolId: null, month, year },
        include: this.batchInclude(),
      })
    }
    // If an existing company DRAFT batch has 0 lines (created before staff profiles existed),
    // delete it so it gets recreated with the correct staff list
    if (existing && !schoolId && existing.lines?.length === 0 && existing.status === 'DRAFT') {
      await this.db.salaryBatch.delete({ where: { id: existing.id } })
      existing = null
    }

    if (existing) return existing

    // Copy from previous month if available
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear  = month === 1 ? year - 1 : year
    const prevSalaryMap = new Map<string, any>()
    try {
      let prevBatch: any = null
      if (schoolId) {
        prevBatch = await this.db.salaryBatch.findUnique({
          where: { schoolId_month_year: { schoolId, month: prevMonth, year: prevYear } },
          select: { lines: { select: { staffId: true, baseSalary: true, bonus: true, deductions: true } } },
        })
      } else {
        prevBatch = await this.db.salaryBatch.findFirst({
          where: { orgId, schoolId: null, month: prevMonth, year: prevYear },
          select: { lines: { select: { staffId: true, baseSalary: true, bonus: true, deductions: true } } },
        })
      }
      for (const l of prevBatch?.lines ?? []) prevSalaryMap.set(l.staffId, l)
    } catch {}

    let staff: any[]

    if (schoolId) {
      // School batch: find existing StaffProfiles for this school
      staff = await this.db.staffProfile.findMany({
        where: { schoolId },
        ...STAFF_INCLUDE,
      })
    } else {
      // Company batch: find all org users who are staff (not student/parent)
      // and auto-create a StaffProfile (schoolId=null) for any who lack one
      const EXCLUDED_ROLES = ['STUDENT', 'PARENT', 'SUPER_ADMIN', 'DEVELOPER']
      const orgUsers = await this.db.user.findMany({
        where: {
          organizationId: orgId,
          isActive: true,
          role: { notIn: EXCLUDED_ROLES as any[] },
        },
        select: { id: true },
      })

      // Upsert a StaffProfile for each org user
      for (const u of orgUsers) {
        await this.db.staffProfile.upsert({
          where: { userId: u.id },
          create: { userId: u.id, schoolId: null },
          update: {},
        })
      }

      // Now query all company-level StaffProfiles (schoolId = null) for this org
      staff = await this.db.staffProfile.findMany({
        where: { schoolId: null, user: { organizationId: orgId } },
        ...STAFF_INCLUDE,
      })
    }

    const batch = await this.db.salaryBatch.create({
      data: {
        orgId,
        schoolId: schoolId ?? null,
        month,
        year,
        preparedById,
        lines: {
          create: staff.map((s) => {
            const prev = prevSalaryMap.get(s.id)
            const base  = prev ? Number(prev.baseSalary) : (s.salary ?? 0)
            const bonus = prev ? Number(prev.bonus) : 0
            const ded   = prev ? Number(prev.deductions) : 0
            return { staffId: s.id, baseSalary: base, bonus, deductions: ded, netPay: base + bonus - ded }
          }),
        },
      },
      include: this.batchInclude(),
    })

    // Attach org currency for company-level batches (no school)
    if (!schoolId) {
      const orgCurrency = await this.getOrgCurrency(orgId)
      return { ...batch, orgCurrency }
    }
    return batch
  }

  // ── HR: Bulk-save salary lines ────────────────────────────────────────────

  async saveLines(batchId: string, lines: { staffId: string; baseSalary: number; bonus: number; deductions: number; notes?: string }[]) {
    const batch = await this.db.salaryBatch.findUnique({ where: { id: batchId } })
    if (!batch) throw new NotFoundException('Salary batch not found')
    if (!['DRAFT', 'FINANCE_REJECTED', 'OWNER_REJECTED'].includes(batch.status)) {
      throw new BadRequestException('Batch is locked — cannot edit after submission')
    }

    for (const l of lines) {
      const netPay = Number(l.baseSalary) + Number(l.bonus) - Number(l.deductions)
      await this.db.salaryBatchLine.upsert({
        where: { batchId_staffId: { batchId, staffId: l.staffId } },
        create: { batchId, staffId: l.staffId, baseSalary: l.baseSalary, bonus: l.bonus, deductions: l.deductions, netPay, notes: l.notes },
        update: { baseSalary: l.baseSalary, bonus: l.bonus, deductions: l.deductions, netPay, notes: l.notes },
      })
    }

    const updatedLines = await this.db.salaryBatchLine.findMany({ where: { batchId } })
    const totals = this.recalcTotals(updatedLines)

    return this.db.salaryBatch.update({
      where: { id: batchId },
      data: totals,
      include: this.batchInclude(),
    })
  }

  // ── HR: Submit batch to Finance ───────────────────────────────────────────

  async submitToFinance(batchId: string, userId: string, note?: string) {
    const batch = await this.db.salaryBatch.findUnique({ where: { id: batchId } })
    if (!batch) throw new NotFoundException('Salary batch not found')
    if (!['DRAFT', 'FINANCE_REJECTED', 'OWNER_REJECTED'].includes(batch.status)) {
      throw new BadRequestException(`Batch status is ${batch.status} — cannot submit`)
    }
    if (batch.preparedById !== userId) throw new BadRequestException('Only the preparer can submit')

    return this.db.salaryBatch.update({
      where: { id: batchId },
      data: { status: 'SUBMITTED', submittedAt: new Date(), submissionNote: note ?? null },
      include: this.batchInclude(),
    })
  }

  // ── Finance: List batches submitted to Finance ────────────────────────────

  async listForFinance(orgId: string, filters: { status?: string; month?: number; year?: number }) {
    const where: any = { orgId }
    if (filters.status) where.status = filters.status
    if (filters.month)  where.month  = filters.month
    if (filters.year)   where.year   = filters.year

    return this.db.salaryBatch.findMany({
      where,
      include: this.batchInclude(),
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })
  }

  // ── Finance: Approve and send to Owner ────────────────────────────────────

  async financeApprove(batchId: string, userId: string, note?: string) {
    const batch = await this.db.salaryBatch.findUnique({ where: { id: batchId } })
    if (!batch) throw new NotFoundException('Salary batch not found')
    if (batch.status !== 'SUBMITTED') throw new BadRequestException('Batch must be SUBMITTED to approve')

    return this.db.salaryBatch.update({
      where: { id: batchId },
      data: {
        status: 'OWNER_PENDING',
        financeReviewedById: userId,
        financeReviewedAt:   new Date(),
        financeNote:         note ?? null,
      },
      include: this.batchInclude(),
    })
  }

  // ── Finance: Reject back to HR ────────────────────────────────────────────

  async financeReject(batchId: string, userId: string, reason: string) {
    const batch = await this.db.salaryBatch.findUnique({ where: { id: batchId } })
    if (!batch) throw new NotFoundException('Salary batch not found')
    if (batch.status !== 'SUBMITTED') throw new BadRequestException('Batch must be SUBMITTED to reject')

    return this.db.salaryBatch.update({
      where: { id: batchId },
      data: {
        status: 'FINANCE_REJECTED',
        financeReviewedById: userId,
        financeReviewedAt:   new Date(),
        rejectionReason:     reason,
      },
      include: this.batchInclude(),
    })
  }

  // ── Finance: Mark salaries as paid/transferred ────────────────────────────

  async markPaid(batchId: string, userId: string, note?: string) {
    const batch = await this.db.salaryBatch.findUnique({ where: { id: batchId } })
    if (!batch) throw new NotFoundException('Salary batch not found')
    if (batch.status !== 'OWNER_APPROVED') throw new BadRequestException('Owner must approve before payment')

    return this.db.salaryBatch.update({
      where: { id: batchId },
      data: { status: 'IN_PAYMENT', paidById: userId, paidAt: new Date(), paymentNote: note ?? null },
      include: this.batchInclude(),
    })
  }

  // ── Finance: Close the salary month ──────────────────────────────────────

  async closeBatch(batchId: string, userId: string) {
    const batch = await this.db.salaryBatch.findUnique({ where: { id: batchId } })
    if (!batch) throw new NotFoundException('Salary batch not found')
    if (batch.status !== 'IN_PAYMENT') throw new BadRequestException('Batch must be IN_PAYMENT to close')

    return this.db.salaryBatch.update({
      where: { id: batchId },
      data: { status: 'CLOSED', closedAt: new Date(), closedById: userId },
      include: this.batchInclude(),
    })
  }

  // ── Owner: List batches pending or all ───────────────────────────────────

  async listForOwner(orgId: string, filters: { status?: string; year?: number; month?: number }) {
    const where: any = { orgId }
    if (filters.status) where.status = filters.status
    if (filters.year)   where.year   = filters.year
    if (filters.month)  where.month  = filters.month

    return this.db.salaryBatch.findMany({
      where,
      include: this.batchInclude(),
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })
  }

  // ── Owner: Approve batch ──────────────────────────────────────────────────

  async ownerApprove(batchId: string, userId: string) {
    const batch = await this.db.salaryBatch.findUnique({ where: { id: batchId } })
    if (!batch) throw new NotFoundException('Salary batch not found')
    if (batch.status !== 'OWNER_PENDING') throw new BadRequestException('Batch must be pending owner review')

    return this.db.salaryBatch.update({
      where: { id: batchId },
      data: { status: 'OWNER_APPROVED', ownerReviewedById: userId, ownerReviewedAt: new Date() },
      include: this.batchInclude(),
    })
  }

  // ── Owner: Reject batch ───────────────────────────────────────────────────

  async ownerReject(batchId: string, userId: string, reason: string) {
    const batch = await this.db.salaryBatch.findUnique({ where: { id: batchId } })
    if (!batch) throw new NotFoundException('Salary batch not found')
    if (batch.status !== 'OWNER_PENDING') throw new BadRequestException('Batch must be pending owner review')

    return this.db.salaryBatch.update({
      where: { id: batchId },
      data: {
        status: 'OWNER_REJECTED',
        ownerReviewedById: userId,
        ownerReviewedAt:   new Date(),
        rejectionReason:   reason,
      },
      include: this.batchInclude(),
    })
  }

  // ── Single batch detail ───────────────────────────────────────────────────

  async getBatch(batchId: string) {
    const batch = await this.db.salaryBatch.findUnique({
      where: { id: batchId },
      include: this.batchInclude(),
    })
    if (!batch) throw new NotFoundException('Salary batch not found')
    return batch
  }
}
