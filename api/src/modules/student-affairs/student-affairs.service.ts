import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class StudentAffairsService {
  constructor(private prisma: PrismaService) {}

  // ── Overview stats ────────────────────────────────────────────────────────────

  async getStats(schoolId: string) {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const [
      totalStudents,
      activeStudents,
      incidentsThisMonth,
      openIncidents,
      sessionsThisMonth,
      docsIssuedThisMonth,
      positiveNotes,
      negativeNotes,
    ] = await Promise.all([
      this.prisma.user.count({ where: { schoolId, role: 'STUDENT' } }),
      this.prisma.user.count({ where: { schoolId, role: 'STUDENT', isActive: true } }),
      this.prisma.disciplinaryRecord.count({
        where: { schoolId, createdAt: { gte: monthStart } },
      }),
      this.prisma.disciplinaryRecord.count({
        where: { schoolId, resolved: false },
      }),
      this.prisma.counselingSession.count({
        where: { schoolId, sessionDate: { gte: monthStart } },
      }),
      this.prisma.studentDocument.count({
        where: { schoolId, issuedAt: { gte: monthStart } },
      }),
      this.prisma.behaviorNote.count({
        where: { schoolId, isPositive: true, createdAt: { gte: monthStart } },
      }),
      this.prisma.behaviorNote.count({
        where: { schoolId, isPositive: false, createdAt: { gte: monthStart } },
      }),
    ])

    return {
      totalStudents,
      activeStudents,
      incidentsThisMonth,
      openIncidents,
      sessionsThisMonth,
      docsIssuedThisMonth,
      positiveNotes,
      negativeNotes,
    }
  }

  // ── Student directory ─────────────────────────────────────────────────────────

  async getStudents(
    schoolId: string,
    query: { search?: string; sectionId?: string; page?: number; limit?: number },
  ) {
    const { search, sectionId, page = 1, limit = 30 } = query
    const skip = (page - 1) * limit

    const where: any = { schoolId, role: 'STUDENT' }
    if (search) {
      where.OR = [
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
        { profile: { studentId: { contains: search, mode: 'insensitive' } } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (sectionId) {
      where.enrollments = { some: { courseSection: { sectionId } } }
    }

    const [students, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          profile: true,
          _count: {
            select: {
              disciplinaryRecords: true,
              counselingAsStudent: true,
              behaviorNotes: true,
            },
          },
        },
        orderBy: { profile: { firstName: 'asc' } },
        skip,
        take: +limit,
      }),
      this.prisma.user.count({ where }),
    ])

    return {
      data: students,
      meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async getStudentDetail(studentId: string) {
    const [student, disciplinaryRecords, counselingAsStudent, studentDocuments, behaviorNotes, parentLinks] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: studentId },
        include: {
          profile: true,
          childLinks: { include: { parent: { include: { profile: true } } } },
        },
      }),
      this.prisma.disciplinaryRecord.findMany({
        where: { studentId },
        include: { reportedBy: { include: { profile: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.counselingSession.findMany({
        where: { studentId, isPrivate: false },
        include: { counselor: { include: { profile: true } } },
        orderBy: { sessionDate: 'desc' },
        take: 5,
      }),
      this.prisma.studentDocument.findMany({
        where: { studentId },
        include: { issuedBy: { include: { profile: true } } },
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.behaviorNote.findMany({
        where: { studentId },
        include: { addedBy: { include: { profile: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.parentStudentLink.findMany({
        where: { studentId },
        include: { parent: { include: { profile: true } } },
      }),
    ])

    if (!student) throw new NotFoundException('Student not found')

    const positivePoints = behaviorNotes.filter((n) => n.isPositive).reduce((s, n) => s + n.points, 0)
    const negativePoints = behaviorNotes.filter((n) => !n.isPositive).reduce((s, n) => s + n.points, 0)

    return {
      ...student,
      disciplinaryRecords,
      counselingAsStudent,
      studentDocuments,
      behaviorNotes,
      parentLinks,
      behaviorScore: positivePoints - negativePoints,
    }
  }

  // ── Disciplinary records ──────────────────────────────────────────────────────

  async getDisciplinaryRecords(
    schoolId: string,
    query: { studentId?: string; resolved?: string; severity?: string; page?: number; limit?: number },
  ) {
    const { studentId, resolved, severity, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit
    const where: any = { schoolId }
    if (studentId) where.studentId = studentId
    if (resolved !== undefined) where.resolved = resolved === 'true'
    if (severity) where.severity = severity

    const [records, total] = await Promise.all([
      this.prisma.disciplinaryRecord.findMany({
        where,
        include: {
          student: { include: { profile: true } },
          reportedBy: { include: { profile: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: +limit,
      }),
      this.prisma.disciplinaryRecord.count({ where }),
    ])

    return {
      data: records,
      meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async createDisciplinaryRecord(schoolId: string, reportedById: string, dto: {
    studentId: string
    type: string
    severity: string
    description: string
    actionTaken?: string
    parentNotified?: boolean
    notes?: string
  }) {
    return this.prisma.disciplinaryRecord.create({
      data: {
        schoolId,
        reportedById,
        studentId: dto.studentId,
        type: dto.type as any,
        severity: dto.severity as any,
        description: dto.description,
        actionTaken: dto.actionTaken,
        parentNotified: dto.parentNotified ?? false,
        notes: dto.notes,
      },
      include: {
        student: { include: { profile: true } },
        reportedBy: { include: { profile: true } },
      },
    })
  }

  async updateDisciplinaryRecord(id: string, dto: {
    actionTaken?: string
    resolved?: boolean
    notes?: string
    parentNotified?: boolean
  }) {
    return this.prisma.disciplinaryRecord.update({
      where: { id },
      data: {
        ...dto,
        resolvedAt: dto.resolved ? new Date() : undefined,
      },
      include: { student: { include: { profile: true } } },
    })
  }

  // ── Counseling sessions ───────────────────────────────────────────────────────

  async getCounselingSessions(
    schoolId: string,
    query: { studentId?: string; counselorId?: string; type?: string; page?: number; limit?: number },
  ) {
    const { studentId, counselorId, type, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit
    const where: any = { schoolId }
    if (studentId) where.studentId = studentId
    if (counselorId) where.counselorId = counselorId
    if (type) where.type = type

    const [sessions, total] = await Promise.all([
      this.prisma.counselingSession.findMany({
        where,
        include: {
          student: { include: { profile: true } },
          counselor: { include: { profile: true } },
        },
        orderBy: { sessionDate: 'desc' },
        skip,
        take: +limit,
      }),
      this.prisma.counselingSession.count({ where }),
    ])

    return {
      data: sessions,
      meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async createCounselingSession(schoolId: string, counselorId: string, dto: {
    studentId: string
    type: string
    summary: string
    notes?: string
    isPrivate?: boolean
    followUpDate?: string
    sessionDate?: string
  }) {
    return this.prisma.counselingSession.create({
      data: {
        schoolId,
        counselorId,
        studentId: dto.studentId,
        type: dto.type as any,
        summary: dto.summary,
        notes: dto.notes,
        isPrivate: dto.isPrivate ?? true,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
        sessionDate: dto.sessionDate ? new Date(dto.sessionDate) : new Date(),
      },
      include: {
        student: { include: { profile: true } },
        counselor: { include: { profile: true } },
      },
    })
  }

  // ── Student documents ─────────────────────────────────────────────────────────

  async getDocuments(
    schoolId: string,
    query: { studentId?: string; type?: string; page?: number; limit?: number },
  ) {
    const { studentId, type, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit
    const where: any = { schoolId }
    if (studentId) where.studentId = studentId
    if (type) where.type = type

    const [docs, total] = await Promise.all([
      this.prisma.studentDocument.findMany({
        where,
        include: {
          student: { include: { profile: true } },
          issuedBy: { include: { profile: true } },
        },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: +limit,
      }),
      this.prisma.studentDocument.count({ where }),
    ])

    return {
      data: docs,
      meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async issueDocument(schoolId: string, issuedById: string, dto: {
    studentId: string
    type: string
    title: string
    notes?: string
    fileUrl?: string
  }) {
    return this.prisma.studentDocument.create({
      data: {
        schoolId,
        issuedById,
        studentId: dto.studentId,
        type: dto.type as any,
        title: dto.title,
        notes: dto.notes,
        fileUrl: dto.fileUrl,
      },
      include: {
        student: { include: { profile: true } },
        issuedBy: { include: { profile: true } },
      },
    })
  }

  // ── Behavior notes ────────────────────────────────────────────────────────────

  async getBehaviorNotes(
    schoolId: string,
    query: { studentId?: string; isPositive?: string; page?: number; limit?: number },
  ) {
    const { studentId, isPositive, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit
    const where: any = { schoolId }
    if (studentId) where.studentId = studentId
    if (isPositive !== undefined) where.isPositive = isPositive === 'true'

    const [notes, total] = await Promise.all([
      this.prisma.behaviorNote.findMany({
        where,
        include: {
          student: { include: { profile: true } },
          addedBy: { include: { profile: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: +limit,
      }),
      this.prisma.behaviorNote.count({ where }),
    ])

    return {
      data: notes,
      meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async addBehaviorNote(schoolId: string, addedById: string, dto: {
    studentId: string
    isPositive: boolean
    points: number
    description: string
  }) {
    return this.prisma.behaviorNote.create({
      data: {
        schoolId,
        addedById,
        studentId: dto.studentId,
        isPositive: dto.isPositive,
        points: dto.points,
        description: dto.description,
      },
      include: {
        student: { include: { profile: true } },
        addedBy: { include: { profile: true } },
      },
    })
  }
}
