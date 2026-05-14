import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class RequisitionsService {
  constructor(private prisma: PrismaService) {}

  // Resolve organizationId from a school
  private async getOrgIdFromSchool(schoolId: string): Promise<string> {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId }, select: { organizationId: true } })
    if (!school) throw new NotFoundException('School not found')
    return school.organizationId
  }

  // ── List ───────────────────────────────────────────────────────────────────

  // REQUISITIONS_MANAGER: see only SM-approved requisitions for their school
  async getSchoolRequisitions(schoolId: string, query: {
    status?: string; page?: number; limit?: number
  }) {
    const { status, page = 1, limit = 50 } = query
    const skip = (page - 1) * limit
    // Only show requisitions the Store Manager has approved — hide pending/declined
    const where: any = { schoolId, smStatus: 'SM_APPROVED' }
    if (status) where.status = status

    const [data, total] = await Promise.all([
      this.prisma.requisition.findMany({
        where, skip, take: +limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requestedBy: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } },
          school: { select: { name: true } },
        },
      }),
      this.prisma.requisition.count({ where }),
    ])
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) } }
  }

  // Regular employee: see only their own submissions
  async getMyRequisitions(userId: string, schoolId: string) {
    const data = await this.prisma.requisition.findMany({
      where: { requestedById: userId, schoolId },
      orderBy: { createdAt: 'desc' },
      include: { school: { select: { name: true } } },
    })
    return { data }
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  async createRequisition(userId: string, schoolId: string, dto: {
    title: string
    description?: string
    category: string
    items: { name: string; qty: number; unit: string }[]
    urgency?: string
    deliveryDate?: string
  }) {
    const orgId = await this.getOrgIdFromSchool(schoolId)
    return this.prisma.requisition.create({
      data: {
        organizationId: orgId,
        schoolId,
        requestedById: userId,
        title: dto.title,
        description: dto.description ?? '',
        category: (dto.category as any) ?? 'OTHER',
        items: dto.items,
        urgency: dto.urgency ?? 'NORMAL',
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
        status: 'PENDING',
      },
      include: { school: { select: { name: true } } },
    })
  }
}
