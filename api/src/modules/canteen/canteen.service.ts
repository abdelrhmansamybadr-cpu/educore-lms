import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class CanteenService {
  constructor(private prisma: PrismaService) {}

  // ─── Menu Items ───────────────────────────────────────────────────────────

  async getMenu(schoolId: string, category?: string) {
    const where: any = { schoolId, isAvailable: true }
    if (category) where.category = category
    return this.prisma.canteenItem.findMany({ where, orderBy: [{ category: 'asc' }, { name: 'asc' }] })
  }

  async getAllItems(schoolId: string) {
    return this.prisma.canteenItem.findMany({ where: { schoolId }, orderBy: [{ category: 'asc' }, { name: 'asc' }] })
  }

  async createItem(schoolId: string, data: {
    name: string
    nameAr?: string
    description?: string
    price: number
    category?: string
    imageUrl?: string
  }) {
    return this.prisma.canteenItem.create({ data: { schoolId, ...data } })
  }

  async updateItem(schoolId: string, itemId: string, data: any) {
    const item = await this.prisma.canteenItem.findFirst({ where: { id: itemId, schoolId } })
    if (!item) throw new NotFoundException('Item not found')
    return this.prisma.canteenItem.update({ where: { id: itemId }, data })
  }

  async toggleAvailability(schoolId: string, itemId: string) {
    const item = await this.prisma.canteenItem.findFirst({ where: { id: itemId, schoolId } })
    if (!item) throw new NotFoundException('Item not found')
    return this.prisma.canteenItem.update({ where: { id: itemId }, data: { isAvailable: !item.isAvailable } })
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

  async placeOrder(userId: string, schoolId: string, items: { itemId: string; quantity: number }[], note?: string) {
    if (!items || items.length === 0) throw new BadRequestException('Order must have at least one item')

    const menuItems = await this.prisma.canteenItem.findMany({
      where: { schoolId, id: { in: items.map((i) => i.itemId) }, isAvailable: true },
    })

    if (menuItems.length !== items.length) throw new BadRequestException('Some items are unavailable or not found')

    const total = items.reduce((sum, i) => {
      const menu = menuItems.find((m) => m.id === i.itemId)!
      return sum + menu.price * i.quantity
    }, 0)

    return this.prisma.canteenOrder.create({
      data: {
        userId,
        schoolId,
        total,
        note,
        items: {
          create: items.map((i) => {
            const menu = menuItems.find((m) => m.id === i.itemId)!
            return { itemId: i.itemId, quantity: i.quantity, unitPrice: menu.price }
          }),
        },
      },
      include: { items: { include: { item: true } } },
    })
  }

  async getOrders(schoolId: string, filters: { status?: string; userId?: string; date?: string }) {
    const where: any = { schoolId }
    if (filters.status) where.status = filters.status
    if (filters.userId) where.userId = filters.userId
    if (filters.date) {
      const start = new Date(filters.date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(filters.date)
      end.setHours(23, 59, 59, 999)
      where.createdAt = { gte: start, lte: end }
    }

    return this.prisma.canteenOrder.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
        items: { include: { item: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getMyOrders(userId: string) {
    return this.prisma.canteenOrder.findMany({
      where: { userId },
      include: { items: { include: { item: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  }

  async updateOrderStatus(schoolId: string, orderId: string, status: string) {
    const order = await this.prisma.canteenOrder.findFirst({ where: { id: orderId, schoolId } })
    if (!order) throw new NotFoundException('Order not found')
    return this.prisma.canteenOrder.update({ where: { id: orderId }, data: { status: status as any } })
  }

  async getStats(schoolId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const [totalItems, availableItems, todayOrders, pendingOrders, totalRevenue] = await Promise.all([
      this.prisma.canteenItem.count({ where: { schoolId } }),
      this.prisma.canteenItem.count({ where: { schoolId, isAvailable: true } }),
      this.prisma.canteenOrder.count({ where: { schoolId, createdAt: { gte: today, lte: todayEnd } } }),
      this.prisma.canteenOrder.count({ where: { schoolId, status: 'PENDING' } }),
      this.prisma.canteenOrder.aggregate({
        where: { schoolId, createdAt: { gte: today, lte: todayEnd }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
    ])

    return {
      totalItems,
      availableItems,
      todayOrders,
      pendingOrders,
      todayRevenue: totalRevenue._sum.total ?? 0,
    }
  }
}
