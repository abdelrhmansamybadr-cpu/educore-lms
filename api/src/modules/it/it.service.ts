import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ItService {
  constructor(private prisma: PrismaService) {}

  // ─── Assets ───────────────────────────────────────────────────────────────

  async getAssets(schoolId: string | null, filters: { type?: string; status?: string; condition?: string; search?: string }) {
    const where: any = schoolId ? { schoolId } : {}
    if (filters.type) where.type = filters.type
    if (filters.status) where.status = filters.status
    if (filters.condition) where.condition = filters.condition
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { serialNumber: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    return (this.prisma as any).itAsset.findMany({
      where,
      include: { school: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getAssetById(id: string) {
    return (this.prisma as any).itAsset.findUnique({
      where: { id },
      include: {
        school: { select: { name: true } },
        maintenanceLogs: { orderBy: { date: 'desc' } },
      },
    })
  }

  async createAsset(schoolId: string, data: any) {
    return (this.prisma as any).itAsset.create({
      data: {
        schoolId,
        name: data.name,
        type: data.type ?? 'other',
        serialNumber: data.serialNumber,
        room: data.room,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
        status: data.status ?? 'active',
        condition: data.condition ?? 'good',
        assignedToId: data.assignedToId ?? null,
        notes: data.notes ?? null,
      },
    })
  }

  async updateAsset(id: string, data: any) {
    return (this.prisma as any).itAsset.update({
      where: { id },
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : undefined,
      },
    })
  }

  async deleteAsset(id: string) {
    return (this.prisma as any).itAsset.update({ where: { id }, data: { status: 'retired' } })
  }

  async addMaintenance(assetId: string, performedById: string, data: { description: string; cost?: number; date?: string }) {
    return (this.prisma as any).itMaintenance.create({
      data: {
        assetId,
        description: data.description,
        cost: data.cost ?? null,
        date: data.date ? new Date(data.date) : new Date(),
        performedById,
      },
    })
  }

  // ─── Asset Stats ──────────────────────────────────────────────────────────

  async getAssetStats(schoolId: string | null) {
    const where: any = schoolId ? { schoolId } : {}
    const [total, active, maintenance, retired, lost] = await Promise.all([
      (this.prisma as any).itAsset.count({ where }),
      (this.prisma as any).itAsset.count({ where: { ...where, status: 'active' } }),
      (this.prisma as any).itAsset.count({ where: { ...where, status: 'maintenance' } }),
      (this.prisma as any).itAsset.count({ where: { ...where, status: 'retired' } }),
      (this.prisma as any).itAsset.count({ where: { ...where, status: 'lost' } }),
    ])

    const soon = new Date(); soon.setDate(soon.getDate() + 30)
    const warrantyExpiringSoon = await (this.prisma as any).itAsset.count({
      where: { ...where, warrantyExpiry: { gte: new Date(), lte: soon } },
    })
    const warrantyExpired = await (this.prisma as any).itAsset.count({
      where: { ...where, warrantyExpiry: { lt: new Date() } },
    })

    return { total, active, maintenance, retired, lost, warrantyExpiringSoon, warrantyExpired }
  }

  // ─── IT Settings ──────────────────────────────────────────────────────────

  async getSettings(schoolId: string) {
    const s = await (this.prisma as any).itSettings.findUnique({ where: { schoolId } })
    if (s) return s
    return {
      schoolId, slaLow: 1440, slaMedium: 480, slaHigh: 120, slaUrgent: 60, slaCritical: 30,
      escalationAfterHours: 4,
      notifyNewTicket: true, notifyAssignment: true, notifySlaBreach: true,
      notifyEscalation: true, notifyResolution: true,
    }
  }

  async upsertSettings(schoolId: string, data: any) {
    return (this.prisma as any).itSettings.upsert({
      where: { schoolId },
      create: { schoolId, ...data },
      update: data,
    })
  }

  // ─── IT Dashboard Stats ───────────────────────────────────────────────────

  async getDashboardStats(schoolId: string | null) {
    const ticketWhere: any = schoolId ? { schoolId } : {}
    const assetWhere: any = schoolId ? { schoolId } : {}

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [openTickets, slaBreaches, totalAssets, resolvedThisWeek] = await Promise.all([
      this.prisma.ticket.count({ where: { ...ticketWhere, status: { notIn: ['RESOLVED', 'CLOSED'] as any } } }),
      this.prisma.ticket.count({ where: { ...ticketWhere, slaBreached: true, status: { notIn: ['RESOLVED', 'CLOSED'] as any } } }),
      (this.prisma as any).itAsset.count({ where: { ...assetWhere, status: 'active' } }),
      this.prisma.ticket.count({ where: { ...ticketWhere, status: 'RESOLVED' as any, resolvedAt: { gte: weekAgo } } }),
    ])

    // Ticket volume by category
    const byCategory = await this.prisma.ticket.groupBy({
      by: ['category'],
      where: ticketWhere,
      _count: true,
    })

    // Ticket volume by month (last 6 months)
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const recentTickets = await this.prisma.ticket.findMany({
      where: { ...ticketWhere, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, status: true, resolvedAt: true, priority: true },
    })

    const monthlyMap: Record<string, number> = {}
    recentTickets.forEach(t => {
      const key = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, '0')}`
      monthlyMap[key] = (monthlyMap[key] ?? 0) + 1
    })
    const byMonth = Object.entries(monthlyMap).sort().map(([month, count]) => ({ month, count }))

    // Recent open tickets
    const recentOpen = await this.prisma.ticket.findMany({
      where: { ...ticketWhere, status: { notIn: ['RESOLVED', 'CLOSED'] as any } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, ticketNumber: true, title: true, priority: true, status: true,
        category: true, slaBreached: true, slaDeadline: true, createdAt: true,
        assigneeId: true, schoolId: true,
      },
    })

    return { openTickets, slaBreaches, totalAssets, resolvedThisWeek, byCategory, byMonth, recentOpen }
  }

  // ─── IT Tickets (extend existing) ─────────────────────────────────────────

  async escalateTicket(id: string, escalatedToId: string, reason: string) {
    return this.prisma.ticket.update({
      where: { id },
      data: { status: 'ESCALATED' as any, escalatedToId, escalationReason: reason },
    })
  }

  // ─── Staff Workload ───────────────────────────────────────────────────────

  async getStaffWorkload(schoolId: string | null) {
    const itRoles = ['IT_ADMIN', 'IT_MANAGER', 'IT_STAFF', 'SUPPORT_AGENT']
    const where: any = { role: { in: itRoles } }
    if (schoolId) where.schoolId = schoolId

    const staff = await this.prisma.user.findMany({
      where,
      select: {
        id: true, email: true, role: true,
        profile: { select: { firstName: true, lastName: true, avatar: true } },
      },
    })

    const monday = new Date()
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)

    return Promise.all(staff.map(async (u) => {
      const [openTickets, resolvedThisWeek, ratingAgg] = await Promise.all([
        this.prisma.ticket.count({
          where: { assigneeId: u.id, status: { notIn: ['RESOLVED', 'CLOSED'] as any } },
        }),
        this.prisma.ticket.count({
          where: { assigneeId: u.id, status: 'RESOLVED' as any, resolvedAt: { gte: monday } },
        }),
        this.prisma.ticket.aggregate({
          where: { assigneeId: u.id, rating: { not: null } },
          _avg: { rating: true },
        }),
      ])
      return {
        userId: u.id,
        email: u.email,
        role: u.role,
        name: u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.email,
        avatar: (u.profile as any)?.avatar ?? null,
        openTickets,
        resolvedThisWeek,
        avgRating: ratingAgg._avg.rating,
      }
    }))
  }

  async rateTicket(id: string, rating: number, feedback?: string) {
    return this.prisma.ticket.update({
      where: { id },
      data: { rating, ratingFeedback: feedback ?? null },
    })
  }

  async getItTickets(schoolId: string | null, filters: {
    status?: string; priority?: string; category?: string; assigneeId?: string
    search?: string; slaBreached?: boolean
  }) {
    const where: any = schoolId ? { schoolId } : {}
    if (filters.status) where.status = filters.status
    if (filters.priority) where.priority = filters.priority
    if (filters.category) where.category = filters.category
    if (filters.assigneeId) where.assigneeId = filters.assigneeId
    if (filters.slaBreached !== undefined) where.slaBreached = filters.slaBreached
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { ticketNumber: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    return this.prisma.ticket.findMany({
      where,
      orderBy: [{ slaBreached: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true, ticketNumber: true, title: true, description: true, location: true,
        category: true, priority: true, status: true, slaDeadline: true, slaBreached: true,
        assigneeId: true, escalatedToId: true, escalationReason: true,
        rating: true, schoolId: true, createdAt: true, resolvedAt: true, updatedAt: true,
      },
    })
  }

  async getItTicketDetail(id: string) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        replies: { orderBy: { createdAt: 'asc' } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, email: true, role: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
          },
        },
        school: { select: { id: true, name: true } },
      },
    })
  }

  // ─── Staff Analytics ──────────────────────────────────────────────────────

  async getStaffAnalytics(schoolId: string | null) {
    const itRoles = ['IT_ADMIN', 'IT_MANAGER', 'IT_STAFF', 'SUPPORT_AGENT']
    const where: any = { role: { in: itRoles } }
    if (schoolId) where.schoolId = schoolId

    const staff = await this.prisma.user.findMany({
      where,
      select: {
        id: true, email: true, role: true,
        profile: { select: { firstName: true, lastName: true, avatar: true } },
      },
    })

    return Promise.all(staff.map(async (u) => {
      const [ratedTickets, complaintsTotal, complaintsOpen] = await Promise.all([
        this.prisma.ticket.findMany({
          where: { assigneeId: u.id, rating: { not: null } },
          select: { rating: true, ratingFeedback: true, createdAt: true, title: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
        (this.prisma as any).itComplaint.count({ where: { againstId: u.id } }),
        (this.prisma as any).itComplaint.count({
          where: { againstId: u.id, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
        }),
      ])

      const totalRatings = ratedTickets.length
      const avgRating = totalRatings > 0
        ? ratedTickets.reduce((s: number, t: any) => s + (t.rating ?? 0), 0) / totalRatings
        : null

      const breakdown = [1, 2, 3, 4, 5].map(star => ({
        star,
        count: ratedTickets.filter((t: any) => t.rating === star).length,
      }))

      return {
        userId: u.id,
        email: u.email,
        role: u.role,
        name: u.profile ? `${(u.profile as any).firstName} ${(u.profile as any).lastName}` : u.email,
        avatar: (u.profile as any)?.avatar ?? null,
        totalRatings,
        avgRating,
        breakdown,
        recentFeedback: ratedTickets.slice(0, 10),
        complaintsTotal,
        complaintsOpen,
      }
    }))
  }

  // ─── Complaints ───────────────────────────────────────────────────────────

  async getComplaints(schoolId: string | null, filters: { status?: string; againstId?: string }) {
    const where: any = schoolId ? { schoolId } : {}
    if (filters.status) where.status = filters.status
    if (filters.againstId) where.againstId = filters.againstId

    const complaints = await (this.prisma as any).itComplaint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        submitter: { select: { id: true, email: true, role: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        against:   { select: { id: true, email: true, role: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        ticket:    { select: { id: true, title: true, ticketNumber: true } },
        _count:    { select: { messages: true } },
      },
    })
    return complaints
  }

  async getComplaintById(id: string) {
    return (this.prisma as any).itComplaint.findUnique({
      where: { id },
      include: {
        submitter: { select: { id: true, email: true, role: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        against:   { select: { id: true, email: true, role: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        ticket:    { select: { id: true, title: true, ticketNumber: true } },
        messages:  {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, email: true, role: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
          },
        },
      },
    })
  }

  async createComplaint(schoolId: string, submitterId: string, dto: {
    againstId: string; description: string; ticketId?: string
  }) {
    return (this.prisma as any).itComplaint.create({
      data: {
        schoolId,
        submitterId,
        againstId: dto.againstId,
        description: dto.description,
        ticketId: dto.ticketId ?? null,
      },
    })
  }

  async updateComplaint(id: string, dto: { status?: string; itManagerNotes?: string }) {
    const data: any = {}
    if (dto.status) {
      data.status = dto.status
      if (dto.status === 'RESOLVED' || dto.status === 'DISMISSED') data.resolvedAt = new Date()
      if (dto.status === 'ESCALATED_TO_HR') data.escalatedToHrAt = new Date()
    }
    if (dto.itManagerNotes !== undefined) data.itManagerNotes = dto.itManagerNotes
    return (this.prisma as any).itComplaint.update({ where: { id }, data })
  }

  async addComplaintMessage(complaintId: string, authorId: string, content: string) {
    return (this.prisma as any).itComplaintMessage.create({
      data: { complaintId, authorId, content },
      include: {
        author: { select: { id: true, email: true, role: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
      },
    })
  }

  async escalateComplaintToHr(id: string, itManagerNotes?: string) {
    return (this.prisma as any).itComplaint.update({
      where: { id },
      data: {
        status: 'ESCALATED_TO_HR',
        escalatedToHrAt: new Date(),
        ...(itManagerNotes ? { itManagerNotes } : {}),
      },
    })
  }
}
