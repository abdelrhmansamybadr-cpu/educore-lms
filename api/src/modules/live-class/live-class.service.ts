import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'

@Injectable()
export class LiveClassService {
  private livekitApiKey: string
  private livekitSecret: string
  private livekitUrl: string

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.livekitApiKey = config.get('LIVEKIT_API_KEY') || ''
    this.livekitSecret = config.get('LIVEKIT_API_SECRET') || ''
    this.livekitUrl = config.get('LIVEKIT_URL') || 'wss://livekit.example.com'
  }

  async create(teacherId: string, dto: {
    courseId: string; title: string; titleAr?: string; scheduledAt: string
  }) {
    const roomId = `class-${crypto.randomUUID()}`
    return this.prisma.liveClass.create({
      data: {
        ...dto,
        teacherId,
        roomId,
        scheduledAt: new Date(dto.scheduledAt),
        isCompleted: false,
      } as any,
    })
  }

  async findByCourse(courseId: string) {
    return this.prisma.liveClass.findMany({
      where: { courseId },
      orderBy: { scheduledAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const liveClass = await this.prisma.liveClass.findUnique({ where: { id } })
    if (!liveClass) throw new NotFoundException('Live class not found')
    return liveClass
  }

  async endClass(id: string) {
    return this.prisma.liveClass.update({
      where: { id },
      data: { endedAt: new Date(), isCompleted: true } as any,
    })
  }

  async generateJoinToken(userId: string, userName: string, roomName: string, isHost: boolean) {
    const now = Math.floor(Date.now() / 1000)
    const exp = now + 3600

    const header = { alg: 'HS256', typ: 'JWT' }
    const payload = {
      iss: this.livekitApiKey,
      sub: userId,
      exp,
      nbf: now,
      name: userName,
      video: {
        room: roomName,
        roomJoin: true,
        canPublish: isHost,
        canSubscribe: true,
        canPublishData: true,
      },
    }

    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url')
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signature = crypto
      .createHmac('sha256', this.livekitSecret)
      .update(`${base64Header}.${base64Payload}`)
      .digest('base64url')

    return { token: `${base64Header}.${base64Payload}.${signature}`, livekitUrl: this.livekitUrl }
  }

  async joinClass(classId: string, userId: string, userName: string, isHost: boolean) {
    const liveClass = await this.findOne(classId)
    const roomId = (liveClass as any).roomId || classId
    const { token, livekitUrl } = await this.generateJoinToken(userId, userName, roomId, isHost)
    return { token, livekitUrl, roomId, liveClass }
  }

  async getUpcoming(courseId: string) {
    return this.prisma.liveClass.findMany({
      where: {
        courseId,
        scheduledAt: { gte: new Date() },
        isCompleted: false,
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    })
  }
}
