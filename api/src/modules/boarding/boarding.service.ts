import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class BoardingService {
  constructor(private prisma: PrismaService) {}

  async getRooms(schoolId: string) {
    const rooms = await this.prisma.boardingRoom.findMany({
      where: { schoolId },
      include: {
        occupants: {
          where: { vacatedAt: null },
          include: {
            user: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } },
          },
        },
      },
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    })
    return rooms.map((room) => ({
      ...room,
      occupied: room.occupants.length,
    }))
  }

  async getRoom(schoolId: string, id: string) {
    const room = await this.prisma.boardingRoom.findFirst({
      where: { id, schoolId },
      include: {
        occupants: {
          where: { vacatedAt: null },
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    })
    if (!room) throw new NotFoundException('Room not found')
    return { ...room, occupied: room.occupants.length }
  }

  async createRoom(schoolId: string, dto: {
    roomNumber: string; floor?: string; capacity: number; type?: string
  }) {
    return this.prisma.boardingRoom.create({
      data: { ...dto, schoolId },
    })
  }

  async updateRoom(schoolId: string, id: string, dto: {
    roomNumber?: string; floor?: string; capacity?: number; type?: string
  }) {
    await this.getRoom(schoolId, id)
    return this.prisma.boardingRoom.update({ where: { id }, data: dto })
  }

  async deleteRoom(schoolId: string, id: string) {
    await this.getRoom(schoolId, id)
    return this.prisma.boardingRoom.delete({ where: { id } })
  }

  async assignOccupant(schoolId: string, roomId: string, userId: string) {
    await this.getRoom(schoolId, roomId)
    // Vacate any existing assignment for this user
    await this.prisma.boardingOccupant.updateMany({
      where: { userId, vacatedAt: null },
      data: { vacatedAt: new Date() },
    })
    return this.prisma.boardingOccupant.create({
      data: { roomId, userId },
    })
  }

  async vacateOccupant(schoolId: string, roomId: string, userId: string) {
    await this.getRoom(schoolId, roomId)
    return this.prisma.boardingOccupant.updateMany({
      where: { roomId, userId, vacatedAt: null },
      data: { vacatedAt: new Date() },
    })
  }

  async getMyRoom(userId: string) {
    const occupant = await this.prisma.boardingOccupant.findFirst({
      where: { userId, vacatedAt: null },
      include: {
        room: {
          include: {
            occupants: {
              where: { vacatedAt: null },
              include: { user: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } } },
            },
          },
        },
      },
    })
    return occupant?.room ?? null
  }

  async getStats(schoolId: string) {
    const rooms = await this.prisma.boardingRoom.findMany({
      where: { schoolId },
      include: { occupants: { where: { vacatedAt: null } } },
    })
    const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0)
    const totalOccupied = rooms.reduce((s, r) => s + r.occupants.length, 0)
    const fullRooms = rooms.filter((r) => r.occupants.length >= r.capacity).length
    const vacantRooms = rooms.filter((r) => r.occupants.length === 0).length
    return {
      totalRooms: rooms.length,
      totalCapacity,
      totalOccupied,
      fullRooms,
      vacantRooms,
      occupancyRate: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
    }
  }
}
