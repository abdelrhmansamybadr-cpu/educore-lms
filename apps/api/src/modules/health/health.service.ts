import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  // ── Health Records ───────────────────────────────────────────────────────────

  async getHealthRecord(studentId: string) {
    return this.prisma.healthRecord.findUnique({
      where: { studentId },
      include: { student: { include: { profile: true } } },
    })
  }

  async upsertHealthRecord(studentId: string, data: any) {
    return this.prisma.healthRecord.upsert({
      where: { studentId },
      create: { studentId, ...data },
      update: data,
    })
  }

  // ── Visits ───────────────────────────────────────────────────────────────────

  async logVisit(studentId: string, nurseId: string, data: any) {
    return this.prisma.healthVisit.create({
      data: {
        studentId,
        nurseId,
        complaint: data.complaint ?? data.symptoms ?? 'General visit',
        treatment: data.treatment,
        temperature: data.temperature,
        notes: data.notes,
        parentNotified: data.parentNotified ?? false,
        sentHome: data.sentHome ?? false,
      },
      include: { student: { include: { profile: true } } },
    })
  }

  async getVisits(
    schoolId: string,
    studentId?: string,
    from?: string,
    to?: string,
    sentHome?: string,
  ) {
    return this.prisma.healthVisit.findMany({
      where: {
        student: { schoolId },
        ...(studentId && { studentId }),
        ...(from && { visitedAt: { gte: new Date(from) } }),
        ...(to && { visitedAt: { lte: new Date(to) } }),
        ...(sentHome !== undefined && { sentHome: sentHome === 'true' }),
      },
      include: { student: { include: { profile: true } } },
      orderBy: { visitedAt: 'desc' },
    })
  }

  async getVisit(id: string) {
    const visit = await this.prisma.healthVisit.findUnique({
      where: { id },
      include: { student: { include: { profile: true } } },
    })
    if (!visit) throw new NotFoundException('Visit not found')
    return visit
  }

  async getMyVisits(studentId: string) {
    return this.prisma.healthVisit.findMany({
      where: { studentId },
      orderBy: { visitedAt: 'desc' },
    })
  }

  async updateVisit(id: string, data: any) {
    const visit = await this.prisma.healthVisit.findUnique({ where: { id } })
    if (!visit) throw new NotFoundException('Visit not found')
    return this.prisma.healthVisit.update({ where: { id }, data })
  }

  async notifyParent(visitId: string) {
    const visit = await this.getVisit(visitId)
    const parentLinks = await this.prisma.parentStudentLink.findMany({
      where: { studentId: visit.studentId },
      include: { parent: true },
    })
    await this.prisma.healthVisit.update({ where: { id: visitId }, data: { parentNotified: true } })
    return { notified: parentLinks.length, parents: parentLinks.map((l) => l.parent.email) }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────

  async getDashboardStats(schoolId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [todayVisits, sentHomeToday] = await Promise.all([
      this.prisma.healthVisit.count({
        where: { student: { schoolId }, visitedAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.healthVisit.count({
        where: { student: { schoolId }, visitedAt: { gte: today, lt: tomorrow }, sentHome: true },
      }),
    ])

    return { todayVisits, sentHomeToday }
  }

  // ── Mental Health Check-ins ───────────────────────────────────────────────────

  async submitCheckIn(studentId: string, data: { moodScore: number; notes?: string }) {
    return this.prisma.mentalHealthCheckIn.create({
      data: {
        studentId,
        moodScore: data.moodScore,
        notes: data.notes,
        flagged: data.moodScore <= 2,
      },
    })
  }

  async getCheckIns(schoolId: string, flaggedOnly = false) {
    return this.prisma.mentalHealthCheckIn.findMany({
      where: {
        student: { schoolId },
        ...(flaggedOnly && { flagged: true }),
      },
      include: { student: { include: { profile: true } } },
      orderBy: { checkedAt: 'desc' },
    })
  }

  async getMyCheckIns(studentId: string) {
    return this.prisma.mentalHealthCheckIn.findMany({
      where: { studentId },
      orderBy: { checkedAt: 'desc' },
      take: 30,
    })
  }
}
