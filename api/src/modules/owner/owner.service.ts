import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import * as bcrypt from 'bcryptjs'

// All roles the system supports — keep in sync with the Role enum in schema.prisma.
// Stored here so new roles work immediately after a DB migration, even before
// the Prisma client is regenerated (raw-SQL fallback is used for unlisted roles).
const ALL_VALID_ROLES = new Set([
  'SUPER_ADMIN','DEVELOPER','SCHOOL_ADMIN','VICE_PRINCIPAL','ACADEMIC_DIRECTOR',
  'DEPARTMENT_HEAD','TEACHER','SUB_TEACHER','COUNSELOR','STUDENT','PARENT',
  'LIBRARIAN','NURSE','FINANCE_OFFICER','HR_MANAGER','STORE_MANAGER',
  'CANTEEN_MANAGER','IT_ADMIN','IT_MANAGER','IT_STAFF','TRANSPORT_MANAGER','RECEPTIONIST',
  'ADMISSION_OFFICER','MATRON','EVENT_COORDINATOR','SUPPORT_AGENT',
  'ACTIVITIES_COORDINATOR','REQUISITIONS_MANAGER',
  'CFO','FINANCE_MANAGER','SCHOOL_ACCOUNTANT','CASHIER','PAYROLL_OFFICER',
  'PROCUREMENT_OFFICER','AUDITOR','BRANCH_FINANCE_ADMIN',
])

@Injectable()
export class OwnerService {
  constructor(private prisma: PrismaService) {}

  // ── Find org for this user ─────────────────────────────────────────────────
  private async getOrgId(userId: string): Promise<string> {
    const member = await this.prisma.orgMember.findFirst({ where: { userId } })
    if (!member) throw new ForbiddenException('No organization linked to this account')
    return member.organizationId
  }

  // ── Overview stats ─────────────────────────────────────────────────────────
  async getOverview(userId: string) {
    const orgId = await this.getOrgId(userId)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      org,
      totalSchools,
      totalStudents,
      totalStaff,
      subscription,
      pendingPurchases,
      pendingRequisitions,
      openJobApps,
      recentPurchases,
      recentJobApps,
      schoolList,
    ] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: orgId } }),
      this.prisma.school.count({ where: { organizationId: orgId } }),
      this.prisma.user.count({ where: { school: { organizationId: orgId }, role: 'STUDENT' } }),
      this.prisma.user.count({ where: { school: { organizationId: orgId }, role: { not: 'STUDENT' } } }),
      this.prisma.orgSubscription.findFirst({ where: { organizationId: orgId } }),
      this.prisma.purchaseRequest.count({ where: { organizationId: orgId, status: 'PENDING' } }),
      this.prisma.requisition.count({ where: { organizationId: orgId, status: 'PENDING' } }),
      this.prisma.jobApplication.count({ where: { organizationId: orgId, status: { in: ['RECEIVED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED'] } } }),
      this.prisma.purchaseRequest.findMany({
        where: { organizationId: orgId },
        orderBy: { requestedAt: 'desc' },
        take: 5,
        include: { requestedBy: { include: { profile: true } }, school: { select: { name: true } } },
      }),
      this.prisma.jobApplication.findMany({
        where: { organizationId: orgId },
        orderBy: { appliedAt: 'desc' },
        take: 5,
      }),
      this.prisma.school.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true, logo: true, curriculumType: true, isActive: true, _count: { select: { users: true } } },
      }),
    ])

    const totalPurchaseValue = await this.prisma.purchaseRequest.aggregate({
      where: { organizationId: orgId, status: { in: ['APPROVED', 'COMPLETED'] } },
      _sum: { approvedCost: true },
    })

    return {
      organization: org,
      stats: {
        totalSchools,
        totalStudents,
        totalStaff,
        pendingPurchases,
        pendingRequisitions,
        openJobApps,
        approvedBudget: totalPurchaseValue._sum.approvedCost ?? 0,
        subscription: {
          plan: subscription?.plan,
          status: subscription?.status,
          maxSchools: subscription?.maxSchools,
          maxStudents: subscription?.maxStudents,
          currentPeriodEnd: subscription?.currentPeriodEnd,
        },
      },
      recentPurchases,
      recentJobApps,
      schools: schoolList,
    }
  }

  // ── Purchase Requests ──────────────────────────────────────────────────────
  async getPurchaseRequests(userId: string, query: {
    status?: string; schoolId?: string; category?: string; page?: number; limit?: number
  }) {
    const orgId = await this.getOrgId(userId)
    const { status, schoolId, category, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit
    const where: any = { organizationId: orgId }
    if (status) where.status = status
    if (schoolId) where.schoolId = schoolId
    if (category) where.category = category

    const [data, total] = await Promise.all([
      this.prisma.purchaseRequest.findMany({
        where,
        skip,
        take: +limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          requestedBy: { include: { profile: true } },
          reviewedBy: { include: { profile: true } },
          school: { select: { name: true, logo: true } },
        },
      }),
      this.prisma.purchaseRequest.count({ where }),
    ])
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) } }
  }

  async createPurchaseRequest(userId: string, schoolId: string | undefined, dto: {
    title: string; description: string; category: string; estimatedCost: number
    currency?: string; quantity?: number; vendor?: string; urgency?: string
    justification?: string; neededBy?: string
  }) {
    const orgId = await this.getOrgId(userId)
    return this.prisma.purchaseRequest.create({
      data: {
        organizationId: orgId,
        schoolId: schoolId || null,
        requestedById: userId,
        title: dto.title,
        description: dto.description,
        category: dto.category as any,
        estimatedCost: dto.estimatedCost,
        currency: dto.currency ?? 'USD',
        quantity: dto.quantity ?? 1,
        vendor: dto.vendor,
        urgency: dto.urgency ?? 'NORMAL',
        justification: dto.justification,
        neededBy: dto.neededBy ? new Date(dto.neededBy) : undefined,
      },
      include: { requestedBy: { include: { profile: true } }, school: { select: { name: true } } },
    })
  }

  async reviewPurchaseRequest(id: string, reviewerId: string, dto: {
    status: string; reviewNotes?: string; approvedCost?: number
  }) {
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: dto.status as any,
        reviewedById: reviewerId,
        reviewNotes: dto.reviewNotes,
        approvedCost: dto.approvedCost,
        reviewedAt: new Date(),
      },
      include: { requestedBy: { include: { profile: true } } },
    })
  }

  // ── Requisitions ───────────────────────────────────────────────────────────
  async getRequisitions(userId: string, query: {
    status?: string; schoolId?: string; category?: string; page?: number; limit?: number
  }, orgIdOverride?: string) {
    const orgId = orgIdOverride ?? await this.getOrgId(userId)
    const { status, schoolId, category, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit
    const where: any = { organizationId: orgId }
    if (status) where.status = status
    if (schoolId) where.schoolId = schoolId
    if (category) where.category = category

    const [data, total] = await Promise.all([
      this.prisma.requisition.findMany({
        where, skip, take: +limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requestedBy: { include: { profile: true } },
          reviewedBy: { include: { profile: true } },
          school: { select: { name: true, logo: true } },
        },
      }),
      this.prisma.requisition.count({ where }),
    ])
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) } }
  }

  async createRequisition(userId: string, schoolId: string | undefined, dto: {
    title: string; description: string; category: string
    items: { name: string; qty: number; unit: string; estimatedCost: number }[]
    urgency?: string; deliveryDate?: string
  }) {
    const orgId = await this.getOrgId(userId)
    const totalEstimated = dto.items.reduce((s, i) => s + i.estimatedCost * i.qty, 0)
    return this.prisma.requisition.create({
      data: {
        organizationId: orgId,
        schoolId: schoolId || null,
        requestedById: userId,
        title: dto.title,
        description: dto.description,
        category: dto.category as any,
        items: dto.items,
        totalEstimated,
        urgency: dto.urgency ?? 'NORMAL',
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
      },
      include: { requestedBy: { include: { profile: true } } },
    })
  }

  async reviewRequisition(id: string, reviewerId: string, dto: { status: string; reviewNotes?: string }) {
    return this.prisma.requisition.update({
      where: { id },
      data: { status: dto.status as any, reviewedById: reviewerId, reviewNotes: dto.reviewNotes, updatedAt: new Date() },
    })
  }

  // ── Job Applications ───────────────────────────────────────────────────────
  async getJobApplications(userId: string, query: {
    status?: string; position?: string; schoolId?: string; page?: number; limit?: number
  }) {
    const orgId = await this.getOrgId(userId)
    const { status, position, schoolId, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit
    const where: any = { organizationId: orgId }
    if (status) where.status = status
    if (schoolId) where.schoolId = schoolId
    if (position) where.position = { contains: position, mode: 'insensitive' }

    const [data, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where, skip, take: +limit,
        orderBy: { appliedAt: 'desc' },
        include: {
          school: { select: { name: true } },
          reviewedBy: { include: { profile: true } },
        },
      }),
      this.prisma.jobApplication.count({ where }),
    ])
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) } }
  }

  async createJobApplication(userId: string, orgId: string, dto: {
    fullName: string; email: string; phone?: string; nationality?: string
    position: string; department?: string; employmentType?: string
    expectedSalary?: number; currency?: string; experience?: number
    education?: string; university?: string; skills?: string[]; languages?: string[]
    coverLetter?: string; cvUrl?: string; linkedIn?: string; portfolio?: string
    availableFrom?: string; schoolId?: string
  }) {
    return this.prisma.jobApplication.create({
      data: {
        organizationId: orgId,
        schoolId: dto.schoolId || null,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        nationality: dto.nationality,
        position: dto.position,
        department: dto.department,
        employmentType: dto.employmentType as any ?? 'FULL_TIME',
        expectedSalary: dto.expectedSalary,
        currency: dto.currency ?? 'USD',
        experience: dto.experience ?? 0,
        education: dto.education,
        university: dto.university,
        skills: dto.skills ?? [],
        languages: dto.languages ?? [],
        coverLetter: dto.coverLetter,
        cvUrl: dto.cvUrl,
        linkedIn: dto.linkedIn,
        portfolio: dto.portfolio,
        availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : undefined,
      },
    })
  }

  async updateJobApplicationStatus(id: string, reviewerId: string, dto: {
    status: string; interviewDate?: string; interviewNotes?: string
    offerSalary?: number; rejectionReason?: string; internalNotes?: string
  }) {
    return this.prisma.jobApplication.update({
      where: { id },
      data: {
        status: dto.status as any,
        reviewedById: reviewerId,
        interviewDate: dto.interviewDate ? new Date(dto.interviewDate) : undefined,
        interviewNotes: dto.interviewNotes,
        offerSalary: dto.offerSalary,
        rejectionReason: dto.rejectionReason,
        internalNotes: dto.internalNotes,
        updatedAt: new Date(),
      },
    })
  }

  // ── Requisition Workflow ───────────────────────────────────────────────────

  async priceRequisition(id: string, userId: string, pricedItems: {
    name: string; qty: number; unit: string; pricePerUnit: number; total: number
  }[]) {
    const totalPriced = pricedItems.reduce((s, i) => s + i.total, 0)
    return this.prisma.requisition.update({
      where: { id },
      data: {
        status: 'PRICED' as any,
        pricedItems: pricedItems as any,
        totalPriced,
        pricedById: userId,
        pricedAt: new Date(),
      },
    })
  }

  // Finance: escalate to owner (PRICED → FINANCE_APPROVED)
  async financeApproveRequisition(id: string, userId: string) {
    return this.prisma.requisition.update({
      where: { id },
      data: {
        status: 'FINANCE_APPROVED' as any,
        financeApprovedById: userId,
        financeApprovedAt: new Date(),
        isEscalatedToOwner: true,
      },
    })
  }

  // Finance: direct approve without owner (PRICED → APPROVED)
  async financeDirectApprove(id: string, userId: string) {
    return this.prisma.requisition.update({
      where: { id },
      data: {
        status: 'APPROVED' as any,
        financeApprovedById: userId,
        financeApprovedAt: new Date(),
        isEscalatedToOwner: false,
      },
    })
  }

  // Owner/Super Admin final approval (FINANCE_APPROVED → APPROVED)
  async approveRequisition(id: string, reviewerId: string, notes?: string) {
    return this.prisma.requisition.update({
      where: { id },
      data: {
        status: 'APPROVED' as any,
        reviewedById: reviewerId,
        reviewNotes: notes,
        updatedAt: new Date(),
      },
    })
  }

  async rejectRequisition(id: string, reviewerId: string, reason: string) {
    return this.prisma.requisition.update({
      where: { id },
      data: {
        status: 'REJECTED' as any,
        reviewedById: reviewerId,
        rejectionReason: reason,
        updatedAt: new Date(),
      },
    })
  }

  // Finance: release money to RM (APPROVED → MONEY_RELEASED)
  async releaseMoneyRequisition(id: string, userId: string) {
    return this.prisma.requisition.update({
      where: { id },
      data: {
        status: 'MONEY_RELEASED' as any,
        moneyReleasedById: userId,
        moneyReleasedAt: new Date(),
      },
    })
  }

  // RM: confirm money received (MONEY_RELEASED → MONEY_RECEIVED)
  async confirmMoneyReceived(id: string, userId: string) {
    return this.prisma.requisition.update({
      where: { id },
      data: {
        status: 'MONEY_RECEIVED' as any,
        moneyReceivedById: userId,
        moneyReceivedAt: new Date(),
      },
    })
  }

  // RM: mark items purchased + upload invoice (MONEY_RECEIVED → PURCHASED)
  async markPurchased(id: string, userId: string, invoiceUrls: string[]) {
    return this.prisma.requisition.update({
      where: { id },
      data: {
        status: 'PURCHASED' as any,
        purchasedById: userId,
        purchasedAt: new Date(),
        purchaseInvoiceUrls: invoiceUrls,
      },
    })
  }

  // Store: confirm receipt with actual quantities (PURCHASED → STORE_CONFIRMED or STORE_ISSUE)
  async storeConfirmReceipt(id: string, userId: string, dto: {
    receivedItems: { name: string; orderedQty: number; receivedQty: number; unit: string; note?: string }[]
    notes?: string
  }) {
    const hasIssue = dto.receivedItems.some((i) => i.receivedQty < i.orderedQty)
    return this.prisma.requisition.update({
      where: { id },
      data: {
        status: hasIssue ? 'STORE_ISSUE' as any : 'STORE_CONFIRMED' as any,
        storeReceivedItems: dto.receivedItems as any,
        storeNotes: dto.notes,
        storeConfirmedById: userId,
        storeConfirmedAt: new Date(),
        storeHasIssue: hasIssue,
        // If full receipt, also set itemsArrivedAt for legacy compatibility
        itemsArrivedAt: hasIssue ? undefined : new Date(),
        itemsArrivedById: hasIssue ? undefined : userId,
      },
    })
  }

  // Finance: close requisition after store confirmed (→ COMPLETED)
  async completeRequisition(id: string, userId: string) {
    return this.prisma.requisition.update({
      where: { id },
      data: {
        status: 'COMPLETED' as any,
        updatedAt: new Date(),
      },
    })
  }

  // Store: mark requester collected items
  async markCollected(id: string, userId: string) {
    return this.prisma.requisition.update({
      where: { id },
      data: { collectedAt: new Date(), updatedAt: new Date() },
    })
  }

  // Legacy
  async financeReleaseRequisition(id: string, userId: string) {
    return this.prisma.requisition.update({
      where: { id },
      data: { status: 'FINANCE_RELEASED' as any, financeReleasedById: userId, financeReleasedAt: new Date() },
    })
  }

  async itemsArrivedRequisition(id: string, userId: string, invoiceUrls: string[]) {
    return this.prisma.requisition.update({
      where: { id },
      data: { status: 'ITEMS_ARRIVED' as any, itemsArrivedById: userId, itemsArrivedAt: new Date(), invoiceUrls },
    })
  }

  async approveJobApplication(applicationId: string) {
    return this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        ownerApprovalStatus: 'APPROVED',
        ownerApprovedAt: new Date(),
      },
    })
  }

  async rejectJobApplication(applicationId: string, reason: string) {
    return this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        ownerApprovalStatus: 'REJECTED',
        ownerApprovalNote: reason,
      },
    })
  }

  // ── Org settings ───────────────────────────────────────────────────────────
  async getOrgInfo(userId: string) {
    const orgId = await this.getOrgId(userId)
    return this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        schools: {
          select: {
            id: true, name: true, nameAr: true, logo: true, curriculumType: true,
            isActive: true, city: true, countryCode: true, email: true,
            _count: { select: { users: true } },
          },
        },
        subscription: true,
        owners: true,
      },
    })
  }

  async updateOrgInfo(userId: string, dto: { name?: string; phone?: string; logo?: string; email?: string }) {
    const orgId = await this.getOrgId(userId)
    return this.prisma.organization.update({ where: { id: orgId }, data: dto })
  }

  // ── Employee Management ────────────────────────────────────────────────────

  async getEmployees(userId: string, query: { schoolId?: string; companyOnly?: string; role?: string; search?: string; page?: number; limit?: number }) {
    const orgId = await this.getOrgId(userId)
    const { schoolId, companyOnly, role, search, page = 1, limit = 30 } = query
    const skip = (page - 1) * limit

    // Get all schools in this org
    const orgSchools = await this.prisma.school.findMany({ where: { organizationId: orgId }, select: { id: true } })
    const schoolIds = orgSchools.map((s) => s.id)

    // Match school-assigned employees OR org-level employees (schoolId null, organizationId set)
    const where: any = {
      role: { not: 'STUDENT' as any },
      OR: [
        { schoolId: { in: schoolIds } },
        { organizationId: orgId },
      ],
    }
    if (companyOnly === 'true') {
      // Only company-level employees (no school, linked directly to org)
      where.OR = undefined
      where.schoolId = null
      where.organizationId = orgId
    } else if (schoolId) {
      // When filtering by a specific school, only show that school's employees
      where.OR = undefined
      where.schoolId = schoolId
    }
    if (role) where.role = role
    if (search) {
      where.AND = [
        {
          OR: [
            { profile: { firstName: { contains: search, mode: 'insensitive' } } },
            { profile: { lastName: { contains: search, mode: 'insensitive' } } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      ]
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: +limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: true,
          school: { select: { id: true, name: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ])

    return { data: data.map(({ password, ...u }) => u), meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) } }
  }

  async createEmployee(userId: string, dto: {
    firstName: string
    lastName: string
    firstNameAr?: string
    lastNameAr?: string
    email: string
    password: string
    role: string
    schoolId: string
    phone?: string
    nationality?: string
    dateOfBirth?: string
    gender?: string
    address?: string
    cvUrl?: string
    department?: string
    jobTitle?: string
    nationalId?: string
  }) {
    const orgId = await this.getOrgId(userId)

    // Verify school belongs to this org (skip check for org-level roles with no schoolId)
    if (dto.schoolId) {
      const school = await this.prisma.school.findFirst({ where: { id: dto.schoolId, organizationId: orgId } })
      if (!school) throw new ForbiddenException('School does not belong to your organization')
    }

    // Check email not already used
    const exists = await this.prisma.user.findFirst({ where: { email: dto.email } })
    if (exists) throw new ConflictException(`Email "${dto.email}" is already registered`)

    const hashed = await bcrypt.hash(dto.password, 12)
    const resolvedSchoolId = dto.schoolId || null
    // Org-level roles (no schoolId) are linked directly to the org
    const resolvedOrgId = resolvedSchoolId ? null : orgId

    // Generate unique Employee ID: EMP-YYYY-NNNN
    const year = new Date().getFullYear()
    const countThisYear = await this.prisma.staffProfile.count({
      where: { school: { organizationId: orgId } },
    })
    const employeeId = `EMP-${year}-${String(countThisYear + 1).padStart(4, '0')}`

    if (!ALL_VALID_ROLES.has(dto.role)) {
      throw new BadRequestException(`"${dto.role}" is not a recognised role`)
    }

    // Roles that the currently-generated Prisma client might not know about yet
    // (added to schema but Prisma client not regenerated). We use a safe placeholder
    // role for the create, then fix it with raw SQL so the DB migration is the only
    // requirement.
    // Only roles the *current* Prisma client binary knows about.
    // New roles added to schema must be excluded here until `prisma generate` is re-run.
    // They are still accepted (ALL_VALID_ROLES above) and written via raw SQL below.
    const PRISMA_KNOWN_ROLES = new Set([
      'SUPER_ADMIN','DEVELOPER','SCHOOL_ADMIN','VICE_PRINCIPAL','ACADEMIC_DIRECTOR',
      'DEPARTMENT_HEAD','TEACHER','SUB_TEACHER','COUNSELOR','STUDENT','PARENT',
      'LIBRARIAN','NURSE','FINANCE_OFFICER','HR_MANAGER','STORE_MANAGER',
      'CANTEEN_MANAGER','IT_ADMIN','IT_MANAGER','IT_STAFF','TRANSPORT_MANAGER','RECEPTIONIST',
      'ADMISSION_OFFICER','MATRON','EVENT_COORDINATOR','SUPPORT_AGENT',
      'ACTIVITIES_COORDINATOR','REQUISITIONS_MANAGER',
      // CFO, FINANCE_MANAGER, SCHOOL_ACCOUNTANT, CASHIER, PAYROLL_OFFICER,
      // PROCUREMENT_OFFICER, AUDITOR, BRANCH_FINANCE_ADMIN — omitted until prisma generate
    ])
    const needsRawRoleUpdate = !PRISMA_KNOWN_ROLES.has(dto.role)
    const placeholderRole = needsRawRoleUpdate ? 'TEACHER' : dto.role

    // Run in a transaction so partial failures don't leave orphan users
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          password: hashed,
          role: placeholderRole as any,
          schoolId: resolvedSchoolId,
          organizationId: resolvedOrgId,
          mustChangePassword: true,
          profile: {
            create: {
              firstName: dto.firstName,
              lastName: dto.lastName,
              firstNameAr: dto.firstNameAr,
              lastNameAr: dto.lastNameAr,
              phone: dto.phone,
              nationality: dto.nationality,
              dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
              gender: dto.gender,
              address: dto.address,
              nationalId: dto.nationalId,
            },
          },
        },
        include: { profile: true, school: { select: { name: true } } },
      })

      // Fix the role via raw SQL when the Prisma client doesn't know the value yet.
      // Safe: dto.role is validated against ALL_VALID_ROLES above.
      if (needsRawRoleUpdate) {
        await tx.$executeRawUnsafe(
          `UPDATE "User" SET role = '${dto.role}'::"Role" WHERE id = '${created.id}'`
        )
        created.role = dto.role as any
      }

      // Always create StaffProfile when there's a real schoolId, to store Employee ID
      if (resolvedSchoolId) {
        await tx.staffProfile.upsert({
          where: { userId: created.id },
          create: {
            userId: created.id,
            schoolId: resolvedSchoolId,
            employeeId,
            department: dto.department,
            jobTitle: dto.jobTitle ?? dto.role,
            nationalId: dto.nationalId,
          },
          update: {
            employeeId,
            department: dto.department,
            jobTitle: dto.jobTitle ?? dto.role,
          },
        })
      }

      return created
    })

    const { password, ...safe } = user as any
    return safe
  }

  async updateEmployee(userId: string, employeeId: string, dto: {
    firstName?: string; lastName?: string; phone?: string
    isActive?: boolean; role?: string; jobTitle?: string; department?: string
  }) {
    const orgId = await this.getOrgId(userId)
    const employee = await this.prisma.user.findFirst({
      where: { id: employeeId, school: { organizationId: orgId } },
    })
    if (!employee) throw new NotFoundException('Employee not found')

    const PRISMA_KNOWN_ROLES_UPDATE = new Set([
      'SUPER_ADMIN','DEVELOPER','SCHOOL_ADMIN','VICE_PRINCIPAL','ACADEMIC_DIRECTOR',
      'DEPARTMENT_HEAD','TEACHER','SUB_TEACHER','COUNSELOR','STUDENT','PARENT',
      'LIBRARIAN','NURSE','FINANCE_OFFICER','HR_MANAGER','STORE_MANAGER',
      'CANTEEN_MANAGER','IT_ADMIN','IT_MANAGER','IT_STAFF','TRANSPORT_MANAGER','RECEPTIONIST',
      'ADMISSION_OFFICER','MATRON','EVENT_COORDINATOR','SUPPORT_AGENT',
      'ACTIVITIES_COORDINATOR','REQUISITIONS_MANAGER',
    ])
    const roleNeedsRaw = dto.role && !PRISMA_KNOWN_ROLES_UPDATE.has(dto.role)

    await this.prisma.user.update({
      where: { id: employeeId },
      data: {
        isActive: dto.isActive,
        role: roleNeedsRaw ? undefined : (dto.role as any),
        profile: dto.firstName || dto.lastName || dto.phone
          ? { update: { firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone } }
          : undefined,
      },
    })

    if (roleNeedsRaw && dto.role) {
      if (!ALL_VALID_ROLES.has(dto.role)) throw new Error(`Invalid role: ${dto.role}`)
      await this.prisma.$executeRawUnsafe(
        `UPDATE "User" SET role = '${dto.role}'::"Role" WHERE id = '${employeeId}'`
      )
    }

    if (dto.department || dto.jobTitle) {
      await this.prisma.staffProfile.upsert({
        where: { userId: employeeId },
        create: { userId: employeeId, schoolId: employee.schoolId!, department: dto.department, jobTitle: dto.jobTitle },
        update: { department: dto.department, jobTitle: dto.jobTitle },
      })
    }

    return { ok: true }
  }

  async resetEmployeePassword(userId: string, employeeId: string, newPassword: string) {
    const orgId = await this.getOrgId(userId)
    const employee = await this.prisma.user.findFirst({
      where: { id: employeeId, school: { organizationId: orgId } },
    })
    if (!employee) throw new NotFoundException('Employee not found')

    const hashed = await bcrypt.hash(newPassword, 12)
    await this.prisma.user.update({
      where: { id: employeeId },
      data: { password: hashed, mustChangePassword: true },
    })
    return { ok: true }
  }
}
