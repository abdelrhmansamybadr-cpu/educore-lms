import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  // ── Conversations ─────────────────────────────────────────────────────────────

  async getOrCreateConversation(userId1: string, userId2: string, schoolId: string) {
    // Find existing 1-on-1 conversation between both users
    const existing = await this.prisma.conversation.findFirst({
      where: {
        schoolId,
        isGroup: false,
        participants: {
          every: { userId: { in: [userId1, userId2] } },
        },
      },
      include: { participants: true },
    })
    if (existing && existing.participants.length === 2) return existing

    return this.prisma.conversation.create({
      data: {
        schoolId,
        isGroup: false,
        participants: {
          create: [{ userId: userId1 }, { userId: userId2 }],
        },
      },
      include: { participants: true },
    })
  }

  async sendMessage(senderId: string, conversationId: string, content: string, contentType = 'TEXT', fileUrl?: string) {
    // Update participant lastReadAt
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId: senderId },
      data: { lastReadAt: new Date() },
    })

    return this.prisma.message.create({
      data: { conversationId, senderId, content, contentType, fileUrl } as any,
      include: {
        sender: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } },
      },
    })
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    // Mark as read
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    })

    return messages.reverse()
  }

  async getInbox(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return conversations.map((conv: any) => {
      const myParticipant = conv.participants.find((p: any) => p.userId === userId)
      const lastMsg = conv.messages[0]
      const unread = myParticipant?.lastReadAt && lastMsg
        ? lastMsg.createdAt > myParticipant.lastReadAt
        : false
      const otherParticipants = conv.participants.filter((p: any) => p.userId !== userId)
      return { ...conv, unread, otherParticipants }
    })
  }

  // ── Announcements ─────────────────────────────────────────────────────────────

  async createAnnouncement(data: {
    schoolId: string
    authorId: string
    title: string
    titleAr?: string
    content: string
    contentAr?: string
    audience?: string
    audienceId?: string
    imageUrl?: string
  }) {
    return this.prisma.announcement.create({
      data: {
        schoolId: data.schoolId,
        authorId: data.authorId,
        title: data.title,
        titleAr: data.titleAr,
        content: data.content,
        contentAr: data.contentAr,
        audience: data.audience || 'ALL',
        audienceId: data.audienceId,
        imageUrl: data.imageUrl,
      },
    })
  }

  async getAnnouncements(schoolId: string, page = 1, limit = 20) {
    const p = Math.max(1, +page || 1)
    const skip = (p - 1) * limit
    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.announcement.count({ where: { schoolId } }),
    ])
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }

  async deleteAnnouncement(id: string) {
    return this.prisma.announcement.delete({ where: { id } })
  }
}
