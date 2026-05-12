import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  // ── Platform Stats ──────────────────────────────────────────────────────────

  async getStats() {
    const [totalSchools, totalUsers, totalStudents] = await Promise.all([
      this.prisma.school.count(),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
    ])

    // Monthly schools (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    return {
      totalSchools,
      totalUsers,
      totalStudents,
      mrr: totalSchools * 299, // placeholder MRR calculation
      monthlySchools: [],
      planDistribution: [
        { name: 'Starter', value: Math.max(0, totalSchools - 5) },
        { name: 'Professional', value: Math.min(5, totalSchools) },
        { name: 'Enterprise', value: Math.max(0, totalSchools - 10) },
      ],
    }
  }

  // ── Schools ─────────────────────────────────────────────────────────────────

  async findAllSchools(query: {
    search?: string
    curriculumType?: string
    isActive?: string
    page?: number
    limit?: number
  }) {
    const { search, curriculumType, isActive, page = 1, limit = 20 } = query
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (curriculumType) where.curriculumType = curriculumType
    if (isActive !== undefined && isActive !== '') where.isActive = isActive === 'true'

    const [data, total] = await Promise.all([
      this.prisma.school.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, nameAr: true, slug: true, logo: true,
          countryCode: true, currency: true, curriculumType: true, isActive: true,
          email: true, phone: true, createdAt: true,
          _count: { select: { users: true } },
        },
      }),
      this.prisma.school.count({ where }),
    ])

    return {
      data,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    }
  }

  async findSchoolById(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
        settings: true,
      },
    })
    if (!school) throw new NotFoundException('School not found')
    return school
  }

  async createSchool(dto: {
    name: string
    nameAr?: string
    countryCode: string
    currency: string
    curriculumType: string
    email?: string
    phone?: string
  }) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50) + '-' + Date.now().toString(36)

    return this.prisma.school.create({
      data: {
        ...dto,
        slug,
        isActive: true,
        curriculumType: dto.curriculumType as any,
        currency: dto.currency as any,
      } as any,
    })
  }

  async updateSchool(id: string, dto: Partial<{ name: string; nameAr: string; isActive: boolean; countryCode: string; currency: string; curriculumType: string }>) {
    return this.prisma.school.update({
      where: { id },
      data: dto as any,
    })
  }

  async deleteSchool(id: string) {
    // Soft delete by deactivating, not hard delete — protect data
    return this.prisma.school.update({
      where: { id },
      data: { isActive: false },
    })
  }

  // ── All Users (cross-school) ─────────────────────────────────────────────────

  async updateUser(id: string, dto: Partial<{ isActive: boolean; role: string }>) {
    return this.prisma.user.update({ where: { id }, data: dto as any })
  }



  async findAllUsers(query: { search?: string; role?: string; page?: number; limit?: number }) {
    const { search, role, page = 1, limit = 20 } = query
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
      ]
    }
    if (role) where.role = role

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          profile: { select: { firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, avatar: true } },
          school: { select: { name: true, nameAr: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ])

    return {
      data: data.map((u) => ({
        ...u,
        password: undefined,
        firstName: u.profile?.firstName,
        lastName: u.profile?.lastName,
        avatar: u.profile?.avatar,
      })),
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    }
  }
}
