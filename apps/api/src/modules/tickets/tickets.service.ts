import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { TicketStatus, TicketPriority, TicketCategory } from '@prisma/client'

interface CreateTicketDto {
  title: string
  description: string
  category: TicketCategory
  priority?: TicketPriority
}

interface UpdateTicketDto {
  status?: TicketStatus
  priority?: TicketPriority
  assigneeId?: string
}

interface AddReplyDto {
  content: string
  isInternal?: boolean
}

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, schoolId: string, dto: CreateTicketDto) {
    const slaDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h SLA
    return this.prisma.ticket.create({
      data: {
        ...dto,
        submitterId: userId,
        schoolId,
        status: TicketStatus.OPEN,
        priority: dto.priority || TicketPriority.MEDIUM,
        slaDeadline,
      },
    })
  }

  async findAll(schoolId: string, query: {
    status?: TicketStatus; category?: TicketCategory; priority?: TicketPriority
    assigneeId?: string; page?: number; limit?: number
  }) {
    const { status, category, priority, assigneeId, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit
    const where: any = { schoolId }
    if (status) where.status = status
    if (category) where.category = category
    if (priority) where.priority = priority
    if (assigneeId) where.assigneeId = assigneeId

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where, skip, take: +limit,
        include: {
          _count: { select: { replies: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.ticket.count({ where }),
    ])
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) } }
  }

  async findUserTickets(userId: string) {
    return this.prisma.ticket.findMany({
      where: { submitterId: userId },
      include: { _count: { select: { replies: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!ticket) throw new NotFoundException('Ticket not found')
    return ticket
  }

  async update(id: string, dto: UpdateTicketDto) {
    const data: any = { ...dto }
    if (dto.status === TicketStatus.RESOLVED) data.resolvedAt = new Date()
    return this.prisma.ticket.update({ where: { id }, data })
  }

  async addReply(ticketId: string, authorId: string, dto: AddReplyDto) {
    return this.prisma.ticketReply.create({
      data: {
        ticketId,
        authorId,
        content: dto.content,
        isInternal: dto.isInternal || false,
      },
    })
  }

  async getMessages(ticketId: string) {
    return this.prisma.ticketMessage.findMany({
      where: { ticketId },
      include: {
        user: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  async addMessage(ticketId: string, userId: string, dto: { content: string; attachmentUrl?: string }) {
    return this.prisma.ticketMessage.create({
      data: { ticketId, userId, content: dto.content, attachmentUrl: dto.attachmentUrl },
      include: {
        user: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } },
      },
    })
  }

  async checkSlaBreaches(schoolId: string) {
    const now = new Date()
    return this.prisma.ticket.updateMany({
      where: {
        schoolId,
        slaDeadline: { lt: now },
        slaBreached: false,
        status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
      },
      data: { slaBreached: true },
    })
  }

  async getStats(schoolId: string) {
    const [open, inProgress, resolved, urgent] = await Promise.all([
      this.prisma.ticket.count({ where: { schoolId, status: TicketStatus.OPEN } }),
      this.prisma.ticket.count({ where: { schoolId, status: TicketStatus.IN_PROGRESS } }),
      this.prisma.ticket.count({ where: { schoolId, status: TicketStatus.RESOLVED } }),
      this.prisma.ticket.count({
        where: { schoolId, priority: TicketPriority.URGENT, status: { not: TicketStatus.CLOSED } },
      }),
    ])
    return { open, inProgress, resolved, urgent }
  }
}
