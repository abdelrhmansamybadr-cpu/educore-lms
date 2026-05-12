import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  // ─── Staff Directory ──────────────────────────────────────────────────────

  async getStaff(schoolId: string, filters: { department?: string; role?: string; search?: string }) {
    const where: any = { schoolId }
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
    return this.prisma.staffProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, email: true, role: true, profile: true } },
        contracts: { where: { status: 'ACTIVE' }, take: 1 },
      },
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

  async getContracts(schoolId: string, filters: { status?: string; staffId?: string }) {
    const where: any = { schoolId }
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

  async createContract(schoolId: string, data: {
    staffId: string
    type: string
    startDate: string
    endDate?: string
    salary: number
    position: string
    terms?: string
  }) {
    return this.prisma.staffContract.create({
      data: {
        schoolId,
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

  async updateContractStatus(schoolId: string, contractId: string, status: string) {
    const contract = await this.prisma.staffContract.findFirst({ where: { id: contractId, schoolId } })
    if (!contract) throw new NotFoundException('Contract not found')
    return this.prisma.staffContract.update({ where: { id: contractId }, data: { status: status as any } })
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
}
