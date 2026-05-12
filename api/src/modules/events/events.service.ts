import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async getEvents(schoolId: string, from?: string, to?: string, type?: string) {
    return this.prisma.schoolEvent.findMany({
      where: {
        schoolId,
        ...(from && { startDate: { gte: new Date(from) } }),
        ...(to && { startDate: { lte: new Date(to) } }),
        ...(type && { type: type as any }),
      },
      include: {
        _count: { select: { registrations: true } },
        organizer: { select: { id: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
      },
      orderBy: { startDate: 'asc' },
    })
  }

  async getEvent(schoolId: string, id: string) {
    const event = await this.prisma.schoolEvent.findFirst({
      where: { id, schoolId },
      include: {
        _count: { select: { registrations: true } },
        organizer: { select: { id: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
      },
    })
    if (!event) throw new NotFoundException('Event not found')
    return event
  }

  async createEvent(schoolId: string, data: any) {
    return this.prisma.schoolEvent.create({
      data: { ...data, schoolId },
    })
  }

  async updateEvent(schoolId: string, id: string, data: any) {
    await this.getEvent(schoolId, id)
    return this.prisma.schoolEvent.update({ where: { id }, data })
  }

  async deleteEvent(schoolId: string, id: string) {
    await this.getEvent(schoolId, id)
    return this.prisma.schoolEvent.delete({ where: { id } })
  }

  async getUpcoming(schoolId: string) {
    return this.prisma.schoolEvent.findMany({
      where: { schoolId, startDate: { gte: new Date() } },
      include: { _count: { select: { registrations: true } } },
      orderBy: { startDate: 'asc' },
      take: 10,
    })
  }

  // ── Registrations ────────────────────────────────────────────────────────────

  async registerForEvent(eventId: string, userId: string, schoolId: string) {
    const event = await this.getEvent(schoolId, eventId)

    const existing = await this.prisma.eventRegistration.findFirst({
      where: { eventId, userId },
    })
    if (existing) throw new BadRequestException('Already registered for this event')

    const registrationCount = await this.prisma.eventRegistration.count({ where: { eventId } })
    if (event.maxAttendees && registrationCount >= event.maxAttendees) {
      throw new BadRequestException('Event is at full capacity')
    }

    return this.prisma.eventRegistration.create({
      data: { eventId, userId },
      include: { user: { include: { profile: true } } },
    })
  }

  async getRegistrations(schoolId: string, eventId: string) {
    await this.getEvent(schoolId, eventId)
    return this.prisma.eventRegistration.findMany({
      where: { eventId },
      include: { user: { include: { profile: true } } },
      orderBy: { registeredAt: 'asc' },
    })
  }

  async cancelRegistration(eventId: string, userId: string) {
    const reg = await this.prisma.eventRegistration.findFirst({ where: { eventId, userId } })
    if (!reg) throw new NotFoundException('Registration not found')
    return this.prisma.eventRegistration.delete({ where: { id: reg.id } })
  }

  async markAttendance(eventId: string, userId: string, attended: boolean) {
    const reg = await this.prisma.eventRegistration.findFirst({ where: { eventId, userId } })
    if (!reg) throw new NotFoundException('Registration not found')
    return this.prisma.eventRegistration.update({
      where: { id: reg.id },
      data: { attended },
    })
  }

  async getMyRegistrations(userId: string) {
    return this.prisma.eventRegistration.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { registeredAt: 'desc' },
    })
  }

  async getEventStats(schoolId: string) {
    const now = new Date()
    const [total, upcoming, thisMonth] = await Promise.all([
      this.prisma.schoolEvent.count({ where: { schoolId } }),
      this.prisma.schoolEvent.count({ where: { schoolId, startDate: { gte: now } } }),
      this.prisma.schoolEvent.count({
        where: {
          schoolId,
          startDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          },
        },
      }),
    ])
    return { total, upcoming, thisMonth }
  }
}
