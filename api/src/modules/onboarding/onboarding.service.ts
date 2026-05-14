import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import * as bcrypt from 'bcryptjs'

// Curriculum-specific module defaults
const CURRICULUM_MODULES: Record<string, string[]> = {
  BRITISH:  ['FINANCE','LIBRARY','HEALTH','TRANSPORT','CANTEEN','EVENTS','TICKETS','DEVICES','HR','ADMISSION','STORE','GAMIFICATION','LIVE_CLASSES','MENTAL_HEALTH','GCSE_TRACKER'],
  AMERICAN: ['FINANCE','LIBRARY','HEALTH','TRANSPORT','CANTEEN','EVENTS','TICKETS','DEVICES','HR','ADMISSION','STORE','GAMIFICATION','AI_TUTOR','LIVE_CLASSES','MENTAL_HEALTH','GPA_TRACKER','SAT_PREP'],
  IB:       ['FINANCE','LIBRARY','HEALTH','TRANSPORT','CANTEEN','EVENTS','TICKETS','DEVICES','HR','ADMISSION','STORE','GAMIFICATION','AI_TUTOR','LIVE_CLASSES','MENTAL_HEALTH','CAS_TRACKER','TOK_MODULE'],
  EGYPTIAN: ['FINANCE','LIBRARY','HEALTH','TRANSPORT','CANTEEN','EVENTS','TICKETS','DEVICES','HR','ADMISSION','STORE','GAMIFICATION','LIVE_CLASSES','MENTAL_HEALTH'],
  SAUDI:    ['FINANCE','LIBRARY','HEALTH','TRANSPORT','CANTEEN','EVENTS','TICKETS','DEVICES','HR','ADMISSION','STORE','GAMIFICATION','LIVE_CLASSES','MENTAL_HEALTH'],
  CUSTOM:   ['FINANCE','LIBRARY','HEALTH','TRANSPORT','CANTEEN','EVENTS','TICKETS','DEVICES','HR','ADMISSION','STORE','GAMIFICATION','AI_TUTOR','LIVE_CLASSES','MENTAL_HEALTH'],
  MIXED:    ['FINANCE','LIBRARY','HEALTH','TRANSPORT','CANTEEN','EVENTS','TICKETS','DEVICES','HR','ADMISSION','STORE','GAMIFICATION','AI_TUTOR','LIVE_CLASSES','MENTAL_HEALTH'],
  NATIONAL: ['FINANCE','LIBRARY','HEALTH','TRANSPORT','CANTEEN','EVENTS','TICKETS','DEVICES','HR','ADMISSION','STORE','GAMIFICATION','LIVE_CLASSES','MENTAL_HEALTH'],
}

// Curriculum-specific grading defaults
const CURRICULUM_SETTINGS: Record<string, any> = {
  BRITISH:  { gradingSystem: 'GCSE', passMark: 40, gpaScale: 4.0, reportCardTemplate: 'GCSE',   termStructure: { count: 3, names: ['Autumn','Spring','Summer'] } },
  AMERICAN: { gradingSystem: 'GPA_4', passMark: 60, gpaScale: 4.0, reportCardTemplate: 'GPA',   termStructure: { count: 2, names: ['Fall Semester','Spring Semester'] } },
  IB:       { gradingSystem: 'IB',    passMark: 24, gpaScale: 7.0, reportCardTemplate: 'IB',    termStructure: { count: 2, names: ['Term 1','Term 2'] } },
  EGYPTIAN: { gradingSystem: 'PERCENTAGE', passMark: 50, gpaScale: 4.0, reportCardTemplate: 'STANDARD', termStructure: { count: 2, names: ['الفصل الأول','الفصل الثاني'] } },
  SAUDI:    { gradingSystem: 'PERCENTAGE', passMark: 50, gpaScale: 4.0, reportCardTemplate: 'STANDARD', termStructure: { count: 2, names: ['الفصل الأول','الفصل الثاني'] } },
  CUSTOM:   { gradingSystem: 'PERCENTAGE', passMark: 50, gpaScale: 4.0, reportCardTemplate: 'STANDARD', termStructure: { count: 3, names: ['Term 1','Term 2','Term 3'] } },
  MIXED:    { gradingSystem: 'PERCENTAGE', passMark: 50, gpaScale: 4.0, reportCardTemplate: 'STANDARD', termStructure: { count: 3, names: ['Term 1','Term 2','Term 3'] } },
  NATIONAL: { gradingSystem: 'PERCENTAGE', passMark: 50, gpaScale: 4.0, reportCardTemplate: 'STANDARD', termStructure: { count: 2, names: ['الفصل الأول','الفصل الثاني'] } },
}

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  // ── Step 1: Register organization + school owner ──────────────────────────
  async registerOrganization(dto: {
    orgName: string
    ownerEmail: string
    ownerPassword: string
    ownerFirstName: string
    ownerLastName: string
    countryCode: string
  }) {
    const existingUser = await this.prisma.user.findFirst({ where: { email: dto.ownerEmail, schoolId: null } })
    if (existingUser) throw new ConflictException('Email already registered')

    const slug = dto.orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const existingOrg = await this.prisma.organization.findUnique({ where: { slug } })
    if (existingOrg) throw new ConflictException('Organization name already taken')

    const hashed = await bcrypt.hash(dto.ownerPassword, 12)
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial

    const org = await this.prisma.organization.create({
      data: {
        name: dto.orgName,
        slug,
        email: dto.ownerEmail,
        countryCode: dto.countryCode,
        plan: 'STARTER',
        trialEndsAt,
        subscription: {
          create: {
            plan: 'STARTER',
            status: 'TRIALING',
            maxSchools: 1,
            maxStudents: 500,
            currentPeriodEnd: trialEndsAt,
          },
        },
      },
    })

    const owner = await this.prisma.user.create({
      data: {
        email: dto.ownerEmail,
        password: hashed,
        role: 'SUPER_ADMIN',
        schoolId: null,
        profile: {
          create: {
            firstName: dto.ownerFirstName,
            lastName: dto.ownerLastName,
          },
        },
      },
      include: { profile: true },
    })

    await this.prisma.orgMember.create({
      data: { organizationId: org.id, userId: owner.id, role: 'OWNER' },
    })

    return { organization: org, owner: { id: owner.id, email: owner.email, role: owner.role } }
  }

  // ── Step 2: Create school under org ────────────────────────────────────────
  async createSchool(orgId: string, dto: {
    name: string
    nameAr?: string
    email: string
    phone?: string
    address?: string
    city?: string
    countryCode: string
    website?: string
    timezone: string
    curriculumType: string
    language: string
    currency: string
    numberOfStudents?: number
  }) {
    // Generate a unique slug — append a short random suffix if base slug is taken
    let slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const existing = await this.prisma.school.findUnique({ where: { slug } })
    if (existing) {
      // Append 4-char random suffix to make it unique (supports multi-curriculum onboarding)
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`
    }

    const school = await this.prisma.school.create({
      data: {
        ...dto,
        curriculumType: dto.curriculumType as any,
        language: dto.language as any,
        currency: dto.currency as any,
        slug,
        organizationId: orgId,
        onboardingState: { create: { step: 2, completed: false } },
        settings: { create: {} },
        modules: { create: [] },
      },
    })

    return school
  }

  // ── Step 3: Configure grade levels & departments ───────────────────────────
  async configureStructure(schoolId: string, dto: {
    gradeLevels: { name: string; nameAr?: string; order: number }[]
    departments: { name: string; nameAr?: string }[]
  }) {
    await this.prisma.gradeLevel.createMany({
      data: dto.gradeLevels.map((g) => ({ ...g, schoolId })),
      skipDuplicates: true,
    })
    await this.prisma.department.createMany({
      data: dto.departments.map((d) => ({ ...d, schoolId })),
      skipDuplicates: true,
    })
    await this.prisma.onboardingState.update({
      where: { schoolId },
      data: { step: 3 },
    })
    return { ok: true }
  }

  // ── Step 4: Configure academic year & terms ────────────────────────────────
  async configureAcademicYear(schoolId: string, dto: {
    yearName: string
    startDate: string
    endDate: string
    terms: { name: string; nameAr?: string; startDate: string; endDate: string; order: number }[]
  }) {
    const year = await this.prisma.academicYear.create({
      data: {
        schoolId,
        name: dto.yearName,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isCurrent: true,
        terms: {
          create: dto.terms.map((t) => ({
            ...t,
            startDate: new Date(t.startDate),
            endDate: new Date(t.endDate),
          })),
        },
      },
      include: { terms: true },
    })
    await this.prisma.onboardingState.update({
      where: { schoolId },
      data: { step: 4 },
    })
    return year
  }

  // ── Step 5: Apply curriculum config & enable modules ───────────────────────
  async applyCurriculumConfig(schoolId: string, dto: {
    curriculumType: string
    enabledModules?: string[]
    customGradingConfig?: any
  }) {
    const defaults = CURRICULUM_SETTINGS[dto.curriculumType] ?? CURRICULUM_SETTINGS.CUSTOM
    const modules = dto.enabledModules ?? CURRICULUM_MODULES[dto.curriculumType] ?? CURRICULUM_MODULES.CUSTOM

    await this.prisma.schoolSettings.update({
      where: { schoolId },
      data: {
        gradingSystem: defaults.gradingSystem,
        passMark: defaults.passMark,
        gpaScale: defaults.gpaScale,
        reportCardTemplate: defaults.reportCardTemplate,
        termStructure: defaults.termStructure,
        gradingConfig: dto.customGradingConfig ?? defaults.gradingConfig ?? {},
      },
    })

    // Upsert module configs
    await Promise.all(
      modules.map((module) =>
        this.prisma.schoolModuleConfig.upsert({
          where: { schoolId_module: { schoolId, module } },
          create: { schoolId, module, enabled: true },
          update: { enabled: true },
        }),
      ),
    )

    await this.prisma.onboardingState.update({
      where: { schoolId },
      data: { step: 5 },
    })
    return { ok: true, modulesEnabled: modules.length }
  }

  // ── Step 6: Complete onboarding ────────────────────────────────────────────
  async complete(schoolId: string, dto: {
    adminEmail: string
    adminPassword: string
    adminFirstName: string
    adminLastName: string
  }) {
    const exists = await this.prisma.user.findFirst({ where: { email: dto.adminEmail, schoolId } })
    if (exists) throw new ConflictException('Admin email already used in this school')

    const hashed = await bcrypt.hash(dto.adminPassword, 12)
    const admin = await this.prisma.user.create({
      data: {
        email: dto.adminEmail,
        password: hashed,
        role: 'SCHOOL_ADMIN',
        schoolId,
        profile: {
          create: {
            firstName: dto.adminFirstName,
            lastName: dto.adminLastName,
          },
        },
      },
      include: { profile: true },
    })

    await this.prisma.onboardingState.update({
      where: { schoolId },
      data: { step: 6, completed: true },
    })

    return { admin: { id: admin.id, email: admin.email }, schoolId }
  }

  // ── Get onboarding state ───────────────────────────────────────────────────
  async getState(schoolId: string) {
    return this.prisma.onboardingState.findUnique({ where: { schoolId } })
  }

  // ── Get curriculum config for frontend ────────────────────────────────────
  getCurriculumDefaults(curriculumType: string) {
    return {
      settings: CURRICULUM_SETTINGS[curriculumType] ?? CURRICULUM_SETTINGS.CUSTOM,
      modules: CURRICULUM_MODULES[curriculumType] ?? CURRICULUM_MODULES.CUSTOM,
    }
  }
}
