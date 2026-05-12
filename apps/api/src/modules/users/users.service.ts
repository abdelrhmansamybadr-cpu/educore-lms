import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import * as bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'
import type { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/create-user.dto'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ── Create single user ───────────────────────────────────────────────────────

  async create(schoolId: string, dto: CreateUserDto) {
    const exists = await this.prisma.user.findFirst({
      where: { email: dto.email, schoolId },
    })
    if (exists) throw new ConflictException('Email already in use in this school')

    const hashed = await bcrypt.hash(dto.password, 12)

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        role: dto.role,
        schoolId,
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            firstNameAr: dto.firstNameAr,
            lastNameAr: dto.lastNameAr,
            phone: dto.phone,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
            gender: dto.gender,
            nationality: dto.nationality,
            studentId: dto.studentId,
          },
        },
      },
      include: { profile: true },
    })
  }

  // ── Bulk import from CSV data ─────────────────────────────────────────────────

  async bulkCreate(schoolId: string, users: CreateUserDto[]) {
    const results = { created: 0, failed: 0, errors: [] as string[] }

    for (const dto of users) {
      try {
        await this.create(schoolId, dto)
        results.created++
      } catch (err: any) {
        results.failed++
        results.errors.push(`${dto.email}: ${err.message}`)
      }
    }
    return results
  }

  // ── Find all (with pagination + filters) ─────────────────────────────────────

  async findAll(schoolId: string, query: UserQueryDto) {
    const { role, gradeLevelId, sectionId, search, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit

    const where: any = { schoolId }
    if (role) where.role = role
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
        { profile: { studentId: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: +limit,
      }),
      this.prisma.user.count({ where }),
    ])

    return {
      data: data.map(this.sanitize),
      meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) },
    }
  }

  // ── Find one ─────────────────────────────────────────────────────────────────

  async findOne(schoolId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, schoolId },
      include: {
        profile: true,
        enrollments: { include: { course: { select: { id: true, title: true } } } },
      },
    })
    if (!user) throw new NotFoundException('User not found')
    return this.sanitize(user)
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  async update(schoolId: string, id: string, dto: UpdateUserDto) {
    await this.findOne(schoolId, id)
    const { isActive, language, ...profileData } = dto

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        isActive,
        profile: { update: { ...profileData, language } },
      },
      include: { profile: true },
    })
    return this.sanitize(user)
  }

  // ── Delete user ───────────────────────────────────────────────────────────────

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id)
    return this.prisma.user.delete({ where: { id } })
  }

  // ── Deactivate / Reactivate ───────────────────────────────────────────────────

  async setActive(schoolId: string, id: string, isActive: boolean) {
    await this.findOne(schoolId, id)
    return this.prisma.user.update({ where: { id }, data: { isActive } })
  }

  // ── Link parent to child ──────────────────────────────────────────────────────

  async linkParentToChild(schoolId: string, parentId: string, studentId: string) {
    const [parent, student] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: parentId, schoolId, role: Role.PARENT } }),
      this.prisma.user.findFirst({ where: { id: studentId, schoolId, role: Role.STUDENT } }),
    ])
    if (!parent) throw new NotFoundException('Parent not found')
    if (!student) throw new NotFoundException('Student not found')

    return this.prisma.parentStudentLink.upsert({
      where: { parentId_studentId: { parentId, studentId } },
      create: { parentId, studentId },
      update: {},
    })
  }

  // ── Get children of parent ────────────────────────────────────────────────────

  async getChildren(parentId: string) {
    const links = await this.prisma.parentStudentLink.findMany({
      where: { parentId },
      include: {
        student: { include: { profile: true } },
      },
    })
    return links.map((l) => this.sanitize(l.student))
  }

  private sanitize(user: any) {
    const { password, ...safe } = user
    return safe
  }
}
