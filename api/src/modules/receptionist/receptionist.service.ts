import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ReceptionistService {
  constructor(private prisma: PrismaService) {}

  async checkIn(schoolId: string, dto: {
    visitorName: string; visitorPhone?: string; purpose?: string; hostName?: string; hostDept?: string; badge?: string
  }) {
    return this.prisma.visitorLog.create({
      data: { ...dto, schoolId },
    })
  }

  async checkOut(schoolId: string, id: string) {
    const visitor = await this.prisma.visitorLog.findFirst({ where: { id, schoolId } })
    if (!visitor) throw new NotFoundException('Visitor log not found')
    return this.prisma.visitorLog.update({
      where: { id },
      data: { checkOut: new Date() },
    })
  }

  async getVisitors(schoolId: string, date?: string) {
    const where: any = { schoolId }
    if (date) {
      const d = new Date(date)
      const start = new Date(d.setHours(0, 0, 0, 0))
      const end = new Date(d.setHours(23, 59, 59, 999))
      where.checkIn = { gte: start, lte: end }
    }
    return this.prisma.visitorLog.findMany({
      where,
      orderBy: { checkIn: 'desc' },
      take: 100,
    })
  }

  async getStats(schoolId: string) {
    const today = new Date()
    const start = new Date(today.setHours(0, 0, 0, 0))
    const end = new Date(today.setHours(23, 59, 59, 999))

    const [todayTotal, currentlyIn] = await Promise.all([
      this.prisma.visitorLog.count({ where: { schoolId, checkIn: { gte: start, lte: end } } }),
      this.prisma.visitorLog.count({ where: { schoolId, checkIn: { gte: start }, checkOut: null } }),
    ])
    return { todayTotal, currentlyIn }
  }
}
