import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { DeviceOwnership, DeviceType } from '@prisma/client'

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  async register(schoolId: string, dto: {
    name?: string; deviceType: DeviceType; ownership?: DeviceOwnership
    studentId?: string; serialNumber?: string; model?: string; os?: string
  }) {
    return this.prisma.device.create({
      data: { ...dto, schoolId } as any,
    })
  }

  async findAll(schoolId: string, query: {
    deviceType?: DeviceType; ownership?: DeviceOwnership; studentId?: string
    isBlocked?: boolean; page?: number; limit?: number
  }) {
    const { deviceType, ownership, studentId, isBlocked, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit
    const where: any = { schoolId }
    if (deviceType) where.deviceType = deviceType
    if (ownership) where.ownership = ownership
    if (studentId) where.studentId = studentId
    if (isBlocked !== undefined) where.isBlocked = isBlocked

    const [data, total] = await Promise.all([
      this.prisma.device.findMany({
        where, skip, take: +limit,
        include: {
          student: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        },
        orderBy: { registeredAt: 'desc' },
      }),
      this.prisma.device.count({ where }),
    ])
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) } }
  }

  async findOne(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: {
        student: { include: { profile: true } },
      },
    })
    if (!device) throw new NotFoundException('Device not found')
    return device
  }

  async update(id: string, dto: any) {
    return this.prisma.device.update({ where: { id }, data: dto as any })
  }

  async blockDevice(id: string, isBlocked: boolean) {
    return this.prisma.device.update({ where: { id }, data: { isBlocked } as any })
  }

  async assignToStudent(id: string, studentId: string) {
    return this.prisma.device.update({ where: { id }, data: { studentId } as any })
  }

  async unassign(id: string) {
    return this.prisma.device.update({ where: { id }, data: { studentId: null } as any })
  }

  async remove(id: string) {
    return this.prisma.device.delete({ where: { id } })
  }

  async getMaintenanceLogs(deviceId: string) {
    return this.prisma.deviceMaintenance.findMany({
      where: { deviceId },
      orderBy: { date: 'desc' },
    })
  }

  async addMaintenanceLog(deviceId: string, dto: {
    description: string; cost?: number; performedBy?: string; nextService?: Date
  }) {
    return this.prisma.deviceMaintenance.create({
      data: { deviceId, ...dto },
    })
  }

  async checkout(deviceId: string, userId: string, notes?: string) {
    // Mark any open checkout as returned
    await this.prisma.deviceCheckout.updateMany({
      where: { deviceId, checkedIn: null },
      data: { checkedIn: new Date() },
    })
    return this.prisma.deviceCheckout.create({
      data: { deviceId, userId, notes },
      include: { user: { include: { profile: { select: { firstName: true, lastName: true } } } } },
    })
  }

  async checkin(deviceId: string) {
    return this.prisma.deviceCheckout.updateMany({
      where: { deviceId, checkedIn: null },
      data: { checkedIn: new Date() },
    })
  }

  async getCheckoutHistory(deviceId: string) {
    return this.prisma.deviceCheckout.findMany({
      where: { deviceId },
      include: { user: { include: { profile: { select: { firstName: true, lastName: true } } } } },
      orderBy: { checkedOut: 'desc' },
    })
  }

  async getCurrentCheckout(deviceId: string) {
    return this.prisma.deviceCheckout.findFirst({
      where: { deviceId, checkedIn: null },
      include: { user: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } } },
    })
  }

  async getStats(schoolId: string) {
    const [total, byod, schoolOwned, blocked, assigned, available] = await Promise.all([
      this.prisma.device.count({ where: { schoolId } }),
      this.prisma.device.count({ where: { schoolId, ownership: DeviceOwnership.BYOD } }),
      this.prisma.device.count({ where: { schoolId, ownership: DeviceOwnership.SCHOOL_DEVICE } }),
      this.prisma.device.count({ where: { schoolId, isBlocked: true } as any }),
      this.prisma.device.count({ where: { schoolId, studentId: { not: null } } as any }),
      this.prisma.device.count({ where: { schoolId, studentId: null, isBlocked: false } as any }),
    ])
    return { total, byod, schoolOwned, blocked, assigned, available }
  }
}
