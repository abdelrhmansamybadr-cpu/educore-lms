import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AttendanceStatus } from '@prisma/client'
import * as QRCode from 'qrcode'
import * as crypto from 'crypto'

interface MarkAttendanceDto {
  studentId: string
  date: string
  status: AttendanceStatus
  courseId?: string
  period?: number
  notes?: string
}

interface BulkAttendanceDto {
  records: MarkAttendanceDto[]
  courseId?: string
  date: string
}

@Injectable()
export class AttendanceService {
  private qrSessions = new Map<string, { courseId: string; teacherId: string; expiresAt: Date }>()

  constructor(private prisma: PrismaService) {}

  // ── Manual Attendance ─────────────────────────────────────────────────────────

  async markAttendance(dto: MarkAttendanceDto) {
    const date = new Date(dto.date)
    date.setHours(0, 0, 0, 0)

    return this.prisma.attendanceRecord.upsert({
      where: {
        studentId_courseId_date_period: {
          studentId: dto.studentId,
          courseId: dto.courseId || null,
          date,
          period: dto.period || 0,
        },
      },
      create: {
        studentId: dto.studentId,
        date,
        status: dto.status,
        courseId: dto.courseId,
        period: dto.period || 0,
        notes: dto.notes,
      } as any,
      update: { status: dto.status, notes: dto.notes },
    })
  }

  async bulkMarkAttendance(dto: BulkAttendanceDto) {
    const results = await Promise.allSettled(
      dto.records.map((r) =>
        this.markAttendance({ ...r, courseId: r.courseId || dto.courseId, date: dto.date }),
      ),
    )
    const success = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length
    return { success, failed }
  }

  // ── QR Code Attendance ────────────────────────────────────────────────────────

  async generateQrSession(teacherId: string, courseId: string, expiryMinutes = 15) {
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000)

    this.qrSessions.set(sessionToken, { courseId, teacherId, expiresAt })

    const qrData = JSON.stringify({ token: sessionToken, courseId })
    const qrImage = await QRCode.toDataURL(qrData)

    return { sessionToken, qrImage, expiresAt, expiryMinutes }
  }

  async markAttendanceViaQr(studentId: string, token: string) {
    const session = this.qrSessions.get(token)
    if (!session) throw new BadRequestException('Invalid QR code')
    if (new Date() > session.expiresAt) {
      this.qrSessions.delete(token)
      throw new BadRequestException('QR code has expired')
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return this.prisma.attendanceRecord.upsert({
      where: {
        studentId_courseId_date_period: {
          studentId,
          courseId: session.courseId,
          date: today,
          period: 0,
        },
      },
      create: {
        studentId,
        date: today,
        status: AttendanceStatus.PRESENT,
        courseId: session.courseId,
        period: 0,
        notes: 'QR scan',
      } as any,
      update: { status: AttendanceStatus.PRESENT, notes: 'QR scan' },
    })
  }

  // ── Query Attendance ──────────────────────────────────────────────────────────

  async getAttendanceByDate(date: string, courseId?: string) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)

    return this.prisma.attendanceRecord.findMany({
      where: {
        date: d,
        courseId: courseId || undefined,
      },
      include: {
        student: {
          include: {
            profile: { select: { firstName: true, lastName: true, avatar: true, studentId: true } },
          },
        },
      },
    })
  }

  async getStudentAttendance(studentId: string, from?: string, to?: string, courseId?: string) {
    const where: any = { studentId }
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }
    if (courseId) where.courseId = courseId

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    const total = records.length
    const present = records.filter((r) => r.status === AttendanceStatus.PRESENT).length
    const absent = records.filter((r) => r.status === AttendanceStatus.ABSENT).length
    const late = records.filter((r) => r.status === AttendanceStatus.LATE).length
    const excused = records.filter((r) => r.status === AttendanceStatus.EXCUSED).length
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    return { records, stats: { total, present, absent, late, excused, percentage } }
  }

  async getCourseStudents(courseId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          include: {
            profile: { select: { firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, avatar: true, studentId: true } },
          },
        },
      },
    })
    return enrollments.map((e) => e.student)
  }

  async getCourseAttendanceByDate(courseId: string, date?: string) {
    const where: any = { courseId }
    if (date) {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      where.date = d
    }
    return this.prisma.attendanceRecord.findMany({
      where,
      include: {
        student: { include: { profile: { select: { firstName: true, lastName: true, firstNameAr: true, lastNameAr: true } } } },
      },
      orderBy: { date: 'desc' },
    })
  }

  async getAttendanceSummary(courseId: string, from: string, to: string) {
    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        courseId,
        date: { gte: new Date(from), lte: new Date(to) },
      },
      include: {
        student: { include: { profile: { select: { firstName: true, lastName: true } } } },
      },
    })

    const byStudent = new Map<string, { name: string; present: number; absent: number; late: number }>()
    for (const r of records) {
      const key = r.studentId
      if (!byStudent.has(key)) {
        byStudent.set(key, {
          name: `${r.student.profile?.firstName} ${r.student.profile?.lastName}`,
          present: 0, absent: 0, late: 0,
        })
      }
      const s = byStudent.get(key)!
      if (r.status === AttendanceStatus.PRESENT) s.present++
      else if (r.status === AttendanceStatus.ABSENT) s.absent++
      else if (r.status === AttendanceStatus.LATE) s.late++
    }

    return Array.from(byStudent.entries()).map(([studentId, data]) => ({
      studentId,
      ...data,
      percentage: Math.round((data.present / (data.present + data.absent + data.late || 1)) * 100),
    }))
  }
}
