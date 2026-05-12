import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async create(data: {
    userId: string
    title: string
    titleAr?: string
    body: string
    bodyAr?: string
    type: string
    link?: string
  }) {
    return this.prisma.notification.create({ data: data as any })
  }

  async createBulk(userIds: string[], data: {
    title: string
    titleAr?: string
    body: string
    bodyAr?: string
    type: string
    link?: string
  }) {
    return this.prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, ...data } as any)),
    })
  }

  async sendPush(data: {
    tokens: string[]
    title: string
    body: string
    data?: Record<string, any>
  }) {
    const serverKey = this.config.get('FIREBASE_SERVER_KEY')
    if (!serverKey || data.tokens.length === 0) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const axios = require('axios')
      await axios.post(
        'https://fcm.googleapis.com/fcm/send',
        {
          registration_ids: data.tokens,
          notification: { title: data.title, body: data.body },
          data: data.data || {},
        },
        { headers: { Authorization: `key=${serverKey}`, 'Content-Type': 'application/json' } },
      )
    } catch (err) {
      this.logger.error('FCM push notification failed', err)
    }
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const [data, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ])
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) }, unread }
  }

  async markRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    })
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  }
}
