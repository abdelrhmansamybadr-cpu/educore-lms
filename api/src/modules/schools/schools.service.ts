import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type {
  CreateSchoolDto, UpdateSchoolDto, SchoolSettingsDto, ModuleToggleDto,
} from './dto/create-school.dto'

// Default modules enabled for all new schools
const DEFAULT_MODULES = [
  'FINANCE', 'LIBRARY', 'HEALTH', 'TRANSPORT', 'CANTEEN',
  'EVENTS', 'TICKETS', 'DEVICES', 'HR', 'ADMISSION',
  'STORE', 'GAMIFICATION', 'AI_TUTOR', 'LIVE_CLASSES', 'MENTAL_HEALTH',
]

@Injectable()
export class SchoolsService {
  constructor(private prisma: PrismaService) {}

  // ── Create school ─────────────────────────────────────────────────────────────

  async create(dto: CreateSchoolDto) {
    const slug = this.toSlug(dto.name)
    const exists = await this.prisma.school.findUnique({ where: { slug } })
    if (exists) throw new ConflictException('School with this name already exists')

    return this.prisma.school.create({
      data: {
        ...dto,
        slug,
        settings: { create: {} },
        modules: {
          create: DEFAULT_MODULES.map((module) => ({ module, enabled: true })),
        },
      },
      include: { settings: true, modules: true },
    })
  }

  // ── Find all schools (super admin) ────────────────────────────────────────────

  async findAll(query: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ]
    }
    const [data, total] = await Promise.all([
      this.prisma.school.findMany({
        where,
        include: { settings: true, _count: { select: { users: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: +limit,
      }),
      this.prisma.school.count({ where }),
    ])
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) } }
  }

  // ── Find one ──────────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        settings: true,
        modules: true,
        academicYears: { where: { isCurrent: true } },
        gradeLevels: { include: { sections: true } },
        departments: true,
      },
    })
    if (!school) throw new NotFoundException('School not found')
    return school
  }

  // ── Update ────────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateSchoolDto) {
    await this.findOne(id)
    return this.prisma.school.update({ where: { id }, data: dto })
  }

  // ── Update logo ───────────────────────────────────────────────────────────────

  async updateLogo(id: string, logoUrl: string) {
    return this.prisma.school.update({ where: { id }, data: { logo: logoUrl } })
  }

  // ── Settings ──────────────────────────────────────────────────────────────────

  async getSettings(schoolId: string) {
    return this.prisma.schoolSettings.findUnique({ where: { schoolId } })
  }

  async updateSettings(schoolId: string, dto: SchoolSettingsDto) {
    return this.prisma.schoolSettings.upsert({
      where: { schoolId },
      create: { schoolId, ...(dto as any) },
      update: dto as any,
    })
  }

  // ── Dynamic module toggle (developer / super admin) ───────────────────────────

  async toggleModule(schoolId: string, dto: ModuleToggleDto) {
    return this.prisma.schoolModuleConfig.upsert({
      where: { schoolId_module: { schoolId, module: dto.module } },
      create: { schoolId, module: dto.module, enabled: dto.enabled },
      update: { enabled: dto.enabled },
    })
  }

  async getModules(schoolId: string) {
    return this.prisma.schoolModuleConfig.findMany({ where: { schoolId } })
  }

  // ── Academic structure ────────────────────────────────────────────────────────

  async createAcademicYear(schoolId: string, data: {
    name: string; nameAr?: string; startDate: Date; endDate: Date
  }) {
    // Unset current year if setting new one
    await this.prisma.academicYear.updateMany({
      where: { schoolId, isCurrent: true },
      data: { isCurrent: false },
    })
    return this.prisma.academicYear.create({
      data: { schoolId, isCurrent: true, ...data },
    })
  }

  async createGradeLevel(schoolId: string, data: {
    name: string; nameAr?: string; order: number
  }) {
    return this.prisma.gradeLevel.create({ data: { schoolId, ...data } })
  }

  async createSection(gradeLevelId: string, data: {
    name: string; teacherId?: string; capacity?: number
  }) {
    return this.prisma.section.create({ data: { gradeLevelId, ...data } })
  }

  async createDepartment(schoolId: string, data: {
    name: string; nameAr?: string; headId?: string
  }) {
    return this.prisma.department.create({ data: { schoolId, ...data } })
  }

  async createSubject(schoolId: string, data: {
    name: string; nameAr?: string; code?: string; departmentId?: string
  }) {
    return this.prisma.subject.create({ data: { schoolId, ...data } })
  }

  // ── Stats for dashboard ───────────────────────────────────────────────────────

  async getStats(schoolId: string) {
    const [students, teachers, courses, activeYear] = await Promise.all([
      this.prisma.user.count({ where: { schoolId, role: 'STUDENT' } }),
      this.prisma.user.count({ where: { schoolId, role: 'TEACHER' } }),
      this.prisma.course.count({ where: { schoolId } }),
      this.prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } }),
    ])
    return { students, teachers, courses, activeYear }
  }

  private toSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
}
