import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class TransportService {
  constructor(private prisma: PrismaService) {}

  // ── Routes ───────────────────────────────────────────────────────────────────

  async getRoutes(schoolId: string) {
    return this.prisma.busRoute.findMany({
      where: { schoolId },
      include: {
        stops: { orderBy: { order: 'asc' } },
        _count: { select: { assignments: true } },
        driver: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
        location: true,
      },
    })
  }

  async getRoute(schoolId: string, id: string) {
    const route = await this.prisma.busRoute.findFirst({
      where: { id, schoolId },
      include: {
        stops: { orderBy: { order: 'asc' } },
        driver: { select: { id: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        assignments: true,
        location: true,
      },
    })
    if (!route) throw new NotFoundException('Route not found')
    return route
  }

  async createRoute(schoolId: string, data: any) {
    const { stops, ...routeData } = data
    return this.prisma.busRoute.create({
      data: {
        ...routeData,
        schoolId,
        stops: stops?.length ? { create: stops } : undefined,
      },
      include: { stops: { orderBy: { order: 'asc' } } },
    })
  }

  async updateRoute(schoolId: string, id: string, data: any) {
    await this.findRoute(schoolId, id)
    const { stops, ...routeData } = data
    return this.prisma.busRoute.update({
      where: { id },
      data: routeData,
      include: { stops: { orderBy: { order: 'asc' } } },
    })
  }

  async deleteRoute(schoolId: string, id: string) {
    await this.findRoute(schoolId, id)
    return this.prisma.busRoute.delete({ where: { id } })
  }

  // ── Stops ────────────────────────────────────────────────────────────────────

  async addStop(routeId: string, schoolId: string, data: any) {
    await this.findRoute(schoolId, routeId)
    return this.prisma.busStop.create({ data: { ...data, routeId } })
  }

  async updateStop(id: string, data: any) {
    return this.prisma.busStop.update({ where: { id }, data })
  }

  async deleteStop(id: string) {
    return this.prisma.busStop.delete({ where: { id } })
  }

  // ── Student Assignments ───────────────────────────────────────────────────────

  async assignStudent(routeId: string, studentId: string, stopId?: string) {
    return this.prisma.busAssignment
      .upsert({
        where: { id: `${routeId}_${studentId}` },
        create: { routeId, studentId, stopId },
        update: { stopId },
      })
      .catch(() => this.prisma.busAssignment.create({ data: { routeId, studentId, stopId } }))
  }

  async getAssignments(schoolId: string, routeId?: string) {
    const assignments = await this.prisma.busAssignment.findMany({
      where: { route: { schoolId }, ...(routeId && { routeId }) },
      include: { route: true },
    })
    const studentIds = assignments.map((a) => a.studentId)
    const students = await this.prisma.user.findMany({
      where: { id: { in: studentIds } },
      include: { profile: true },
    })
    const studentMap = Object.fromEntries(students.map((s) => [s.id, s]))
    return assignments.map((a) => ({ ...a, student: studentMap[a.studentId] || null }))
  }

  async removeAssignment(id: string) {
    return this.prisma.busAssignment.delete({ where: { id } })
  }

  async getMyRoute(userId: string) {
    const assignment = await this.prisma.busAssignment.findFirst({
      where: { studentId: userId },
      include: { route: { include: { stops: { orderBy: { order: 'asc' } } } } },
    })
    if (!assignment) return null
    return { route: assignment.route, stopId: assignment.stopId }
  }

  // ── GPS / Live Location ───────────────────────────────────────────────────────

  async updateLocation(routeId: string, driverId: string, lat: number, lng: number, speed?: number) {
    // Upsert live location for this route
    return this.prisma.busLocation.upsert({
      where: { routeId },
      create: { routeId, driverId, latitude: lat, longitude: lng, speed: speed ?? 0 },
      update: { latitude: lat, longitude: lng, speed: speed ?? 0, updatedAt: new Date() },
    })
  }

  async getLiveLocation(routeId: string) {
    return this.prisma.busLocation.findUnique({ where: { routeId } })
  }

  async getAllLiveLocations(schoolId: string) {
    return this.prisma.busLocation.findMany({
      where: { route: { schoolId } },
      include: { route: { select: { id: true, name: true, busNumber: true } } },
    })
  }

  // ── Dashboard Stats ───────────────────────────────────────────────────────────

  async getStats(schoolId: string) {
    const [totalRoutes, totalStudents] = await Promise.all([
      this.prisma.busRoute.count({ where: { schoolId } }),
      this.prisma.busAssignment.count({ where: { route: { schoolId } } }),
    ])
    return { totalRoutes, totalStudents }
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  private async findRoute(schoolId: string, id: string) {
    const route = await this.prisma.busRoute.findFirst({ where: { id, schoolId } })
    if (!route) throw new NotFoundException('Route not found')
    return route
  }
}
