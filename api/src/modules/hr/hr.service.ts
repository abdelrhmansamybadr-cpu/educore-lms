import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  // ─── School context helper ────────────────────────────────────────────────

  /** Returns a Prisma filter for schoolId. When schoolId is null (All Schools), returns { in: allOrgSchoolIds } */
  private async resolveSchoolFilter(schoolId: string | null, orgId?: string | null): Promise<any> {
    if (schoolId) return schoolId
    if (!orgId) return null
    const schools = await this.prisma.school.findMany({ where: { organizationId: orgId }, select: { id: true } })
    return { in: schools.map((s) => s.id) }
  }

  // ─── Staff Directory ──────────────────────────────────────────────────────

  async getStaff(schoolId: string | null, filters: { department?: string; role?: string; search?: string }, orgId?: string | null) {
    const schoolFilter = await this.resolveSchoolFilter(schoolId, orgId)
    if (!schoolFilter) return []
    const where: any = { schoolId: schoolFilter }
    if (filters.department) where.department = filters.department
    if (filters.search) {
      where.OR = [
        { user: { profile: { firstName: { contains: filters.search, mode: 'insensitive' } } } },
        { user: { profile: { lastName: { contains: filters.search, mode: 'insensitive' } } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
        { employeeId: { contains: filters.search, mode: 'insensitive' } },
        { jobTitle: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const staffProfiles = await this.prisma.staffProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            profile: { select: { firstName: true, lastName: true, avatar: true, phone: true } },
          },
        },
        contracts: { where: { status: 'ACTIVE' }, take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (filters.role) {
      return staffProfiles.filter((s) => s.user.role === filters.role)
    }
    return staffProfiles
  }

  async getStaffById(schoolId: string, staffId: string) {
    const staff = await this.prisma.staffProfile.findFirst({
      where: { id: staffId, schoolId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            profile: true,
          },
        },
        contracts: { orderBy: { createdAt: 'desc' } },
        leaveRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
        reviews: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })
    if (!staff) throw new NotFoundException('Staff member not found')
    return staff
  }

  async getStaffByUserId(userId: string) {
    const staffProfile = await this.prisma.staffProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, email: true, role: true, profile: true } },
        contracts: { where: { status: 'ACTIVE' }, take: 1 },
        leaveRequests: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })

    // If no StaffProfile exists, return the user's basic info so the self-service page still works
    if (!staffProfile) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, profile: true, createdAt: true },
      })
      if (!user) return null
      return {
        id: null,
        userId: user.id,
        employeeId: null,
        department: null,
        jobTitle: user.role,
        hireDate: user.createdAt,
        salary: null,
        user,
        contracts: [],
        leaveRequests: [],
      }
    }

    return staffProfile
  }

  // Returns ALL school users, merged with their StaffProfile if one exists.
  // This is what the Employees page uses so existing users always appear.
  async getAllSchoolUsers(schoolId: string | null, filters: { search?: string; role?: string }, orgId?: string | null) {
    const schoolFilter = await this.resolveSchoolFilter(schoolId, orgId)
    if (!schoolFilter) return []
    const where: any = { schoolId: schoolFilter }
    if (filters.role) where.role = filters.role
    if (filters.search) {
      where.OR = [
        { profile: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: filters.search, mode: 'insensitive' } } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { staffProfile: { employeeId: { contains: filters.search, mode: 'insensitive' } } },
        { staffProfile: { jobTitle: { contains: filters.search, mode: 'insensitive' } } },
      ]
    }

    const users = await this.prisma.user.findMany({
      where,
      include: {
        profile: true,
        staffProfile: true,   // flat include — no nested contracts to avoid regeneration issues
      },
      orderBy: { createdAt: 'desc' },
    })

    // Normalize to the same shape the employees page expects
    return users.map((u) => {
      const sp = (u as any).staffProfile ?? null
      return {
        id: sp?.id ?? u.id,           // staffProfileId if exists, fallback userId
        _userId: u.id,
        hasStaffProfile: !!sp,
        employeeId: sp?.employeeId ?? null,
        department: sp?.department ?? null,
        jobTitle: sp?.jobTitle ?? null,
        hireDate: sp?.hireDate ?? null,
        salary: sp?.salary ?? null,
        contracts: [],
        user: {
          id: u.id,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          profile: (u as any).profile
            ? { firstName: (u as any).profile.firstName, lastName: (u as any).profile.lastName, avatar: (u as any).profile.avatar ?? null }
            : null,
        },
      }
    })
  }

  async createStaffProfile(schoolId: string, data: {
    userId: string
    employeeId?: string
    department?: string
    jobTitle?: string
    hireDate?: string
    salary?: number
    nationalId?: string
    emergencyContact?: string
    emergencyPhone?: string
    address?: string
    notes?: string
  }) {
    return this.prisma.staffProfile.create({
      data: {
        schoolId,
        userId: data.userId,
        employeeId: data.employeeId,
        department: data.department,
        jobTitle: data.jobTitle,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
        salary: data.salary,
        nationalId: data.nationalId,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        address: data.address,
        notes: data.notes,
      },
      include: { user: { select: { id: true, email: true, role: true, profile: true } } },
    })
  }

  async updateStaffProfile(schoolId: string, staffId: string, data: any) {
    await this.getStaffById(schoolId, staffId)
    const { hireDate, ...rest } = data
    return this.prisma.staffProfile.update({
      where: { id: staffId },
      data: { ...rest, hireDate: hireDate ? new Date(hireDate) : undefined },
      include: { user: { select: { id: true, email: true, role: true, profile: true } } },
    })
  }

  async getHrStats(schoolId: string) {
    const [totalStaff, activeContracts, pendingLeaves, recentReviews] = await Promise.all([
      this.prisma.staffProfile.count({ where: { schoolId } }),
      this.prisma.staffContract.count({ where: { schoolId, status: 'ACTIVE' } }),
      this.prisma.leaveRequest.count({ where: { schoolId, status: 'PENDING' } }),
      this.prisma.performanceReview.count({ where: { schoolId } }),
    ])

    // Staff by role/department breakdown
    const staffByDepartment = await this.prisma.staffProfile.groupBy({
      by: ['department'],
      where: { schoolId },
      _count: true,
    })

    return {
      totalStaff,
      activeContracts,
      pendingLeaves,
      totalReviews: recentReviews,
      byDepartment: staffByDepartment.map((d) => ({
        department: d.department || 'Unassigned',
        count: d._count,
      })),
    }
  }

  // ─── Leave Management ─────────────────────────────────────────────────────

  async getLeaveRequests(schoolId: string, filters: { status?: string; staffId?: string }) {
    const where: any = { schoolId }
    if (filters.status) where.status = filters.status
    if (filters.staffId) where.staffId = filters.staffId

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        staff: {
          include: {
            user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async requestLeave(staffProfileId: string, schoolId: string, data: {
    type: string
    startDate: string
    endDate: string
    reason: string
  }) {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return this.prisma.leaveRequest.create({
      data: {
        staffId: staffProfileId,
        schoolId,
        type: data.type as any,
        startDate: start,
        endDate: end,
        days,
        reason: data.reason,
      },
    })
  }

  async updateLeaveStatus(schoolId: string, leaveId: string, approverId: string, status: 'APPROVED' | 'REJECTED', note?: string) {
    const leave = await this.prisma.leaveRequest.findFirst({ where: { id: leaveId, schoolId } })
    if (!leave) throw new NotFoundException('Leave request not found')
    if (leave.status !== 'PENDING') throw new ForbiddenException('Leave request already processed')

    return this.prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status, approvedById: approverId, approverNote: note },
    })
  }

  async cancelLeave(staffProfileId: string, leaveId: string) {
    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id: leaveId, staffId: staffProfileId },
    })
    if (!leave) throw new NotFoundException('Leave request not found')
    if (leave.status !== 'PENDING') throw new ForbiddenException('Cannot cancel a processed request')
    return this.prisma.leaveRequest.update({ where: { id: leaveId }, data: { status: 'CANCELLED' } })
  }

  // ─── Contracts ────────────────────────────────────────────────────────────

  async getContracts(schoolId: string | null, filters: { status?: string; staffId?: string }, orgId?: string | null) {
    const schoolFilter = await this.resolveSchoolFilter(schoolId, orgId)
    if (!schoolFilter) return []
    const where: any = { schoolId: schoolFilter }
    if (filters.status) where.status = filters.status
    if (filters.staffId) where.staffId = filters.staffId

    return this.prisma.staffContract.findMany({
      where,
      include: {
        staff: {
          include: {
            user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createContract(schoolId: string | null, data: {
    staffId: string
    type: string
    startDate: string
    endDate?: string
    salary: number
    position: string
    terms?: string
  }) {
    // Derive schoolId from the staff member when not provided (org-level HR Manager)
    let resolvedSchoolId = schoolId
    if (!resolvedSchoolId && data.staffId) {
      const staff = await this.prisma.staffProfile.findUnique({ where: { id: data.staffId }, select: { schoolId: true } })
      resolvedSchoolId = staff?.schoolId ?? null
    }
    if (!resolvedSchoolId) throw new Error('Cannot determine school for this contract')

    return this.prisma.staffContract.create({
      data: {
        schoolId: resolvedSchoolId,
        staffId: data.staffId,
        type: data.type as any,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        salary: data.salary,
        position: data.position,
        terms: data.terms,
      },
    })
  }

  async updateContractStatus(schoolId: string | null, contractId: string, status: string) {
    // When schoolId is null (org-level HR Manager), find by id only
    const where = schoolId ? { id: contractId, schoolId } : { id: contractId }
    const contract = await this.prisma.staffContract.findFirst({ where })
    if (!contract) throw new NotFoundException('Contract not found')
    return this.prisma.staffContract.update({ where: { id: contractId }, data: { status: status as any } })
  }

  // ─── Job Applications (HR view) ───────────────────────────────────────────

  async getJobApplications(schoolId: string) {
    return this.prisma.jobApplication.findMany({
      where: { schoolId },
      orderBy: { appliedAt: 'desc' },
      include: { school: { select: { name: true } } },
    })
  }

  async requestOwnerApproval(applicationId: string, schoolId: string) {
    const app = await this.prisma.jobApplication.findFirst({
      where: { id: applicationId, schoolId },
    })
    if (!app) throw new NotFoundException('Application not found')
    return this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        ownerApprovalStatus: 'PENDING',
        ownerApprovalRequestedAt: new Date(),
      },
    })
  }

  // ─── Performance Reviews ──────────────────────────────────────────────────

  async getReviews(schoolId: string, filters: { staffId?: string; period?: string }) {
    const where: any = { schoolId }
    if (filters.staffId) where.staffId = filters.staffId
    if (filters.period) where.period = filters.period

    return this.prisma.performanceReview.findMany({
      where,
      include: {
        staff: {
          include: {
            user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createReview(schoolId: string, reviewerId: string, data: {
    staffId: string
    period: string
    score: number
    communication: number
    punctuality: number
    teamwork: number
    performance: number
    strengths?: string
    improvements?: string
    goals?: string
  }) {
    return this.prisma.performanceReview.create({
      data: {
        schoolId,
        reviewerId,
        staffId: data.staffId,
        period: data.period,
        score: data.score,
        communication: data.communication,
        punctuality: data.punctuality,
        teamwork: data.teamwork,
        performance: data.performance,
        strengths: data.strengths,
        improvements: data.improvements,
        goals: data.goals,
      },
    })
  }

  async updateReview(schoolId: string, id: string, data: any) {
    await this.prisma.performanceReview.findFirstOrThrow({ where: { id, schoolId } })
    return this.prisma.performanceReview.update({ where: { id }, data })
  }

  async deleteReview(schoolId: string, id: string) {
    await this.prisma.performanceReview.findFirstOrThrow({ where: { id, schoolId } })
    return this.prisma.performanceReview.delete({ where: { id } })
  }

  // ─── HR Departments ───────────────────────────────────────────────────────

  async getHrDepartments(schoolId: string) {
    return (this.prisma as any).hrDepartment.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    })
  }

  async createHrDepartment(schoolId: string, data: { name: string; description?: string; headId?: string; budget?: number }) {
    return (this.prisma as any).hrDepartment.create({ data: { schoolId, ...data } })
  }

  async updateHrDepartment(schoolId: string, id: string, data: any) {
    await (this.prisma as any).hrDepartment.findFirstOrThrow({ where: { id, schoolId } })
    return (this.prisma as any).hrDepartment.update({ where: { id }, data })
  }

  async deleteHrDepartment(schoolId: string, id: string) {
    await (this.prisma as any).hrDepartment.findFirstOrThrow({ where: { id, schoolId } })
    return (this.prisma as any).hrDepartment.delete({ where: { id } })
  }

  // ─── Payroll ──────────────────────────────────────────────────────────────

  async getPayrolls(schoolId: string | null, filters: { month?: number; year?: number; staffId?: string }, orgId?: string | null) {
    const schoolFilter = await this.resolveSchoolFilter(schoolId, orgId)
    if (!schoolFilter) return []

    const where: any = { schoolId: schoolFilter }
    if (filters.month) where.month = filters.month
    if (filters.year) where.year = filters.year
    if (filters.staffId) where.staffId = filters.staffId

    const staffInclude = {
      include: { user: { select: { email: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } } },
    }

    const [hrRecords, payslips] = await Promise.all([
      (this.prisma as any).hrPayroll.findMany({
        where,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        include: { staff: staffInclude },
      }),
      (this.prisma as any).payslipRecord.findMany({
        where: {
          run: {
            schoolId: schoolFilter,
            ...(filters.month ? { month: filters.month } : {}),
            ...(filters.year ? { year: filters.year } : {}),
          },
          ...(filters.staffId ? { staffId: filters.staffId } : {}),
        },
        include: {
          staff: staffInclude,
          run: { select: { month: true, year: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Normalize payslips to match hrPayroll shape
    const normalizedPayslips = payslips.map((p: any) => ({
      id: p.id,
      source: 'PAYROLL_RUN',
      runStatus: p.run.status,
      schoolId,
      staffId: p.staffId,
      staff: p.staff,
      month: p.run.month,
      year: p.run.year,
      baseSalary: Number(p.baseSalary),
      bonus: Number(p.bonus) + Number(p.allowances ?? 0) + Number(p.overtime ?? 0),
      deductions: Number(p.totalDeductions),
      netPay: Number(p.netPay),
      status: p.status,
      notes: null,
      paidAt: null,
      createdAt: p.createdAt,
    }))

    // Deduplicate: if Finance already generated a payslip for staffId+month+year, skip the manual hrPayroll entry
    const payslipKeys = new Set(normalizedPayslips.map((p: any) => `${p.staffId}-${p.month}-${p.year}`))
    const filteredHrRecords = hrRecords
      .filter((r: any) => !payslipKeys.has(`${r.staffId}-${r.month}-${r.year}`))
      .map((r: any) => ({ ...r, source: 'HR_MANUAL' }))

    return [...normalizedPayslips, ...filteredHrRecords].sort(
      (a: any, b: any) => b.year - a.year || b.month - a.month,
    )
  }

  async createPayroll(schoolId: string, data: { staffId: string; month: number; year: number; baseSalary: number; bonus?: number; deductions?: number; notes?: string }) {
    const bonus = data.bonus ?? 0
    const deductions = data.deductions ?? 0
    const netPay = data.baseSalary + bonus - deductions
    return (this.prisma as any).hrPayroll.create({ data: { schoolId, ...data, bonus, deductions, netPay } })
  }

  async updatePayroll(schoolId: string, id: string, data: any) {
    await (this.prisma as any).hrPayroll.findFirstOrThrow({ where: { id, schoolId } })
    const updated = { ...data }
    if (data.baseSalary !== undefined || data.bonus !== undefined || data.deductions !== undefined) {
      const existing = await (this.prisma as any).hrPayroll.findUnique({ where: { id } })
      const base = data.baseSalary ?? existing.baseSalary
      const bonus = data.bonus ?? existing.bonus
      const deductions = data.deductions ?? existing.deductions
      updated.netPay = base + bonus - deductions
    }
    return (this.prisma as any).hrPayroll.update({ where: { id }, data: updated })
  }

  async markPayrollPaid(schoolId: string, id: string) {
    await (this.prisma as any).hrPayroll.findFirstOrThrow({ where: { id, schoolId } })
    return (this.prisma as any).hrPayroll.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } })
  }

  async deletePayroll(schoolId: string, id: string) {
    await (this.prisma as any).hrPayroll.findFirstOrThrow({ where: { id, schoolId } })
    return (this.prisma as any).hrPayroll.delete({ where: { id } })
  }

  async bulkGeneratePayroll(schoolId: string, month: number, year: number) {
    const staff = await this.prisma.staffProfile.findMany({ where: { schoolId }, include: { user: true } })
    const results = []
    for (const s of staff) {
      const exists = await (this.prisma as any).hrPayroll.findFirst({ where: { staffId: s.id, month, year } })
      if (!exists) {
        const baseSalary = s.salary ?? 0
        results.push(await (this.prisma as any).hrPayroll.create({
          data: { schoolId, staffId: s.id, month, year, baseSalary, bonus: 0, deductions: 0, netPay: baseSalary },
        }))
      }
    }
    return { created: results.length, skipped: staff.length - results.length }
  }

  // ─── Shifts ───────────────────────────────────────────────────────────────

  async getShifts(schoolId: string) {
    return (this.prisma as any).hrShift.findMany({
      where: { schoolId },
      include: { assignments: { include: { staff: { include: { user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } } } } } } },
    })
  }

  async createShift(schoolId: string, data: { name: string; startTime: string; endTime: string; activeDays?: string[]; color?: string; description?: string }) {
    return (this.prisma as any).hrShift.create({ data: { schoolId, ...data } })
  }

  async updateShift(schoolId: string, id: string, data: any) {
    await (this.prisma as any).hrShift.findFirstOrThrow({ where: { id, schoolId } })
    return (this.prisma as any).hrShift.update({ where: { id }, data })
  }

  async deleteShift(schoolId: string, id: string) {
    await (this.prisma as any).hrShift.findFirstOrThrow({ where: { id, schoolId } })
    return (this.prisma as any).hrShift.delete({ where: { id } })
  }

  async assignShift(shiftId: string, staffIdOrUserId: string) {
    // Accept either a StaffProfile ID or a User ID.
    // Try to find an existing StaffProfile by the given ID first.
    let staffProfile = await this.prisma.staffProfile.findUnique({ where: { id: staffIdOrUserId } })

    if (!staffProfile) {
      // Maybe it's a userId — look up the user then find/create their StaffProfile.
      const user = await this.prisma.user.findUnique({ where: { id: staffIdOrUserId } })
      if (user) {
        staffProfile = await this.prisma.staffProfile.upsert({
          where: { userId: staffIdOrUserId },
          create: { userId: staffIdOrUserId, schoolId: user.schoolId! },
          update: {},
        })
      }
    }

    if (!staffProfile) throw new Error('Could not resolve staff profile for the given ID')

    // One shift per employee — remove any prior assignment first
    await (this.prisma as any).hrShiftAssignment.deleteMany({ where: { staffId: staffProfile.id } })
    return (this.prisma as any).hrShiftAssignment.create({ data: { shiftId, staffId: staffProfile.id } })
  }

  async removeShiftAssignment(staffIdOrUserId: string) {
    // Try by staffProfile.id first, then by userId lookup
    const byStaff = await (this.prisma as any).hrShiftAssignment.count({ where: { staffId: staffIdOrUserId } })
    if (byStaff > 0) {
      return (this.prisma as any).hrShiftAssignment.deleteMany({ where: { staffId: staffIdOrUserId } })
    }
    // It might be a userId — find the StaffProfile
    const sp = await this.prisma.staffProfile.findUnique({ where: { userId: staffIdOrUserId } })
    if (sp) return (this.prisma as any).hrShiftAssignment.deleteMany({ where: { staffId: sp.id } })
    return { count: 0 }
  }

  // ─── Job Postings ─────────────────────────────────────────────────────────

  async getJobPostings(schoolId: string) {
    return (this.prisma as any).hrJobPosting.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } },
    })
  }

  async createJobPosting(schoolId: string, data: any) {
    return (this.prisma as any).hrJobPosting.create({ data: { schoolId, ...data } })
  }

  async updateJobPosting(schoolId: string, id: string, data: any) {
    await (this.prisma as any).hrJobPosting.findFirstOrThrow({ where: { id, schoolId } })
    return (this.prisma as any).hrJobPosting.update({ where: { id }, data })
  }

  async deleteJobPosting(schoolId: string, id: string) {
    await (this.prisma as any).hrJobPosting.findFirstOrThrow({ where: { id, schoolId } })
    return (this.prisma as any).hrJobPosting.delete({ where: { id } })
  }

  // ─── Job Applications (HR-internal) ──────────────────────────────────────

  async getHrJobApplications(schoolId: string, filters: { postingId?: string; status?: string }) {
    const where: any = { schoolId }
    if (filters.postingId) where.postingId = filters.postingId
    if (filters.status) where.status = filters.status
    return (this.prisma as any).hrJobApplication.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      include: { posting: { select: { title: true } } },
    })
  }

  async createHrJobApplication(schoolId: string, data: any) {
    return (this.prisma as any).hrJobApplication.create({ data: { schoolId, ...data } })
  }

  async updateHrJobApplication(schoolId: string, id: string, data: any) {
    await (this.prisma as any).hrJobApplication.findFirstOrThrow({ where: { id, schoolId } })
    return (this.prisma as any).hrJobApplication.update({ where: { id }, data })
  }

  // ─── Talent Pool ──────────────────────────────────────────────────────────

  async getTalentCandidates(schoolId: string, filters: { department?: string; status?: string }) {
    const where: any = { schoolId }
    if (filters.department) where.department = filters.department
    if (filters.status) where.status = filters.status
    return (this.prisma as any).talentCandidate.findMany({ where, orderBy: { createdAt: 'desc' } })
  }

  async createTalentCandidate(schoolId: string, data: any) {
    return (this.prisma as any).talentCandidate.create({ data: { schoolId, ...data } })
  }

  async updateTalentCandidate(schoolId: string, id: string, data: any) {
    await (this.prisma as any).talentCandidate.findFirstOrThrow({ where: { id, schoolId } })
    return (this.prisma as any).talentCandidate.update({ where: { id }, data })
  }

  async deleteTalentCandidate(schoolId: string, id: string) {
    await (this.prisma as any).talentCandidate.findFirstOrThrow({ where: { id, schoolId } })
    return (this.prisma as any).talentCandidate.delete({ where: { id } })
  }

  // ─── Staff Attendance ─────────────────────────────────────────────────────

  async getHrAttendances(schoolId: string, filters: { staffId?: string; date?: string; month?: number; year?: number }) {
    const where: any = { schoolId }
    if (filters.staffId) where.staffId = filters.staffId
    if (filters.date) where.date = new Date(filters.date)
    if (filters.month && filters.year) {
      const from = new Date(filters.year, filters.month - 1, 1)
      const to = new Date(filters.year, filters.month, 0)
      where.date = { gte: from, lte: to }
    }
    return (this.prisma as any).hrAttendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { staff: { include: { user: { select: { profile: { select: { firstName: true, lastName: true, avatar: true } } } } } } },
    })
  }

  async logHrAttendance(schoolId: string, data: { staffId: string; date: string; checkIn?: string; checkOut?: string; status: string; notes?: string; hoursWorked?: number }) {
    const date = new Date(data.date)
    return (this.prisma as any).hrAttendance.upsert({
      where: { staffId_date: { staffId: data.staffId, date } },
      create: { schoolId, ...data, date },
      update: { checkIn: data.checkIn, checkOut: data.checkOut, status: data.status, notes: data.notes, hoursWorked: data.hoursWorked },
    })
  }

  async updateHrAttendance(schoolId: string, id: string, data: any) {
    await (this.prisma as any).hrAttendance.findFirstOrThrow({ where: { id, schoolId } })
    return (this.prisma as any).hrAttendance.update({ where: { id }, data })
  }

  // ─── HR Announcements ─────────────────────────────────────────────────────

  async getHrAnnouncements(schoolId: string, targetDept?: string) {
    const where: any = { schoolId }
    if (targetDept) where.OR = [{ targetType: 'ALL_STAFF' }, { targetDept }]
    return (this.prisma as any).hrAnnouncement.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: { author: { select: { profile: { select: { firstName: true, lastName: true, avatar: true } } } } },
    })
  }

  async createHrAnnouncement(schoolId: string, authorId: string, data: { title: string; content: string; priority?: string; targetType?: string; targetDept?: string }) {
    return (this.prisma as any).hrAnnouncement.create({ data: { schoolId, authorId, ...data } })
  }

  async updateHrAnnouncement(schoolId: string, id: string, data: any) {
    await (this.prisma as any).hrAnnouncement.findFirstOrThrow({ where: { id, schoolId } })
    return (this.prisma as any).hrAnnouncement.update({ where: { id }, data })
  }

  async deleteHrAnnouncement(schoolId: string, id: string) {
    await (this.prisma as any).hrAnnouncement.findFirstOrThrow({ where: { id, schoolId } })
    return (this.prisma as any).hrAnnouncement.delete({ where: { id } })
  }

  // ─── Employee Documents ───────────────────────────────────────────────────

  async getDocumentTypes(schoolId: string) {
    return (this.prisma as any).hrDocumentType.findMany({ where: { schoolId }, orderBy: { sortOrder: 'asc' } })
  }

  async createDocumentType(schoolId: string, data: { name: string; required?: boolean; hasExpiry?: boolean }) {
    const count = await (this.prisma as any).hrDocumentType.count({ where: { schoolId } })
    return (this.prisma as any).hrDocumentType.create({ data: { schoolId, ...data, sortOrder: count } })
  }

  async deleteDocumentType(schoolId: string, id: string) {
    await (this.prisma as any).hrDocumentType.findFirstOrThrow({ where: { id, schoolId } })
    return (this.prisma as any).hrDocumentType.delete({ where: { id } })
  }

  async getStaffDocuments(schoolId: string, staffId?: string) {
    const where: any = staffId ? { staffId } : {}
    return (this.prisma as any).hrDocument.findMany({
      where,
      include: {
        docType: true,
        staff: { include: { user: { select: { profile: { select: { firstName: true, lastName: true } } } } } },
      },
      orderBy: { uploadedAt: 'desc' },
    })
  }

  async upsertDocument(staffId: string, data: { typeId: string; fileUrl?: string; fileName?: string; expiresAt?: string }) {
    return (this.prisma as any).hrDocument.upsert({
      where: { staffId_typeId: { staffId, typeId: data.typeId } } as any,
      create: { staffId, ...data, expiresAt: data.expiresAt ? new Date(data.expiresAt) : null },
      update: { fileUrl: data.fileUrl, fileName: data.fileName, status: 'PENDING', uploadedAt: new Date(), expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined },
    }).catch(() =>
      // upsert by unique key may fail if no unique constraint; fall back to create
      (this.prisma as any).hrDocument.create({ data: { staffId, ...data, expiresAt: data.expiresAt ? new Date(data.expiresAt) : null } })
    )
  }

  async reviewDocument(schoolId: string, id: string, reviewerId: string, status: 'APPROVED' | 'REJECTED') {
    return (this.prisma as any).hrDocument.update({ where: { id }, data: { status, reviewedById: reviewerId, reviewedAt: new Date() } })
  }

  // ─── Leave Policy ─────────────────────────────────────────────────────────

  async getLeavePolicy(schoolId: string) {
    const policy = await (this.prisma as any).hrLeavePolicy.findFirst({ where: { schoolId } })
    if (policy) return policy
    return {
      schoolId, scope: 'SCHOOL', monthlyLimit: 2, yearlyLimit: 21,
      annualLimit: 21, sickLimit: 10, unpaidLimit: 5, maternityLimit: 90, paternityLimit: 7, notes: null,
    }
  }

  async upsertLeavePolicy(schoolId: string, updatedById: string, data: any) {
    const existing = await (this.prisma as any).hrLeavePolicy.findFirst({ where: { schoolId } })
    if (existing) {
      return (this.prisma as any).hrLeavePolicy.update({ where: { id: existing.id }, data: { updatedById, ...data } })
    }
    return (this.prisma as any).hrLeavePolicy.create({ data: { schoolId, updatedById, ...data } })
  }

  async getEmployeeLeaveAnalysis(schoolId: string, year: number) {
    const users = await this.prisma.user.findMany({
      where: { schoolId, isActive: true },
      select: {
        id: true, email: true, role: true,
        profile: { select: { firstName: true, lastName: true, avatar: true } },
        staffProfile: { select: { id: true, jobTitle: true, department: true } },
      },
    })

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year, 11, 31)

    const staffIds = users.map(u => (u as any).staffProfile?.id).filter(Boolean) as string[]
    const allLeaves = staffIds.length > 0 ? await this.prisma.leaveRequest.findMany({
      where: { staffId: { in: staffIds }, startDate: { gte: yearStart, lte: yearEnd } },
    }) : []

    return users.map(u => {
      const sid = (u as any).staffProfile?.id
      const userLeaves = sid ? allLeaves.filter(l => l.staffId === sid) : []
      const approvedThisMonth = userLeaves
        .filter(l => l.status === 'APPROVED' && new Date(l.startDate) >= monthStart && new Date(l.startDate) <= monthEnd)
        .reduce((s, l) => s + l.days, 0)
      const approvedThisYear = userLeaves.filter(l => l.status === 'APPROVED').reduce((s, l) => s + l.days, 0)
      const pending = userLeaves.filter(l => l.status === 'PENDING').length
      const onLeave = userLeaves.some(l =>
        l.status === 'APPROVED' && new Date(l.startDate) <= now && new Date(l.endDate) >= now
      )
      return {
        userId: u.id, email: u.email, role: u.role,
        name: (u as any).profile ? `${(u as any).profile.firstName} ${(u as any).profile.lastName}` : u.email,
        avatar: (u as any).profile?.avatar ?? null,
        jobTitle: (u as any).staffProfile?.jobTitle ?? null,
        department: (u as any).staffProfile?.department ?? null,
        onLeave, approvedThisMonth, approvedThisYear, pending,
        leaves: userLeaves,
      }
    })
  }

  // ─── Enhanced HR Stats ────────────────────────────────────────────────────

  async getFullHrStats(schoolId: string) {
    const [totalStaff, pendingLeaves, openJobs, pendingReviews, todayAttendances] = await Promise.all([
      this.prisma.staffProfile.count({ where: { schoolId } }),
      this.prisma.leaveRequest.count({ where: { schoolId, status: 'PENDING' } }),
      (this.prisma as any).hrJobPosting.count({ where: { schoolId, status: 'OPEN' } }),
      this.prisma.performanceReview.count({ where: { schoolId } }),
      (this.prisma as any).hrAttendance.findMany({ where: { schoolId, date: new Date(new Date().toDateString()) } }),
    ])
    const onLeaveToday = await this.prisma.leaveRequest.count({
      where: { schoolId, status: 'APPROVED', startDate: { lte: new Date() }, endDate: { gte: new Date() } },
    })
    const thisMonth = new Date()
    const payrolls = await (this.prisma as any).hrPayroll.findMany({
      where: { schoolId, month: thisMonth.getMonth() + 1, year: thisMonth.getFullYear() },
    })
    const monthlyPayroll = payrolls.reduce((s: number, p: any) => s + p.netPay, 0)
    const newApplications = await (this.prisma as any).hrJobApplication.count({
      where: { schoolId, appliedAt: { gte: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1) } },
    })
    const byDepartment = await this.prisma.staffProfile.groupBy({ by: ['department'], where: { schoolId }, _count: true })

    return {
      totalStaff,
      onLeaveToday,
      openJobs,
      pendingLeaves,
      pendingReviews,
      monthlyPayroll,
      newApplications,
      todayPresent: todayAttendances.filter((a: any) => a.status === 'PRESENT').length,
      byDepartment: byDepartment.map((d: any) => ({ department: d.department ?? 'Unassigned', count: d._count })),
    }
  }

  // ─── IT Complaints (HR view) ───────────────────────────────────────────────

  async getItComplaints(schoolId: string, statusFilter?: string) {
    const where: any = { schoolId }
    if (statusFilter) where.status = statusFilter
    else where.status = { in: ['ESCALATED_TO_HR', 'RESOLVED', 'DISMISSED'] }

    return (this.prisma as any).itComplaint.findMany({
      where,
      orderBy: { escalatedToHrAt: 'desc' },
      include: {
        submitter: { select: { id: true, email: true, role: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        against:   { select: { id: true, email: true, role: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        ticket:    { select: { id: true, title: true, ticketNumber: true } },
        messages:  {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, email: true, role: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
          },
        },
        _count: { select: { messages: true } },
      },
    })
  }

  async updateItComplaint(id: string, dto: { status?: string; hrNotes?: string }) {
    const data: any = {}
    if (dto.status) {
      data.status = dto.status
      if (dto.status === 'RESOLVED' || dto.status === 'DISMISSED') data.resolvedAt = new Date()
    }
    if (dto.hrNotes !== undefined) data.hrNotes = dto.hrNotes
    return (this.prisma as any).itComplaint.update({ where: { id }, data })
  }
}
