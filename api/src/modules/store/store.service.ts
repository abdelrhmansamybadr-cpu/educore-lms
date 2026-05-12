import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  async getItems(schoolId: string, filters: { category?: string; lowStock?: boolean; search?: string }) {
    const where: any = { schoolId }
    if (filters.category) where.category = filters.category
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const items = await this.prisma.storeItem.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    if (filters.lowStock) {
      return items.filter((i) => i.quantity <= i.minQuantity)
    }
    return items
  }

  async getItemById(schoolId: string, id: string) {
    const item = await this.prisma.storeItem.findFirst({
      where: { id, schoolId },
      include: { movements: { orderBy: { createdAt: 'desc' }, take: 20 } },
    })
    if (!item) throw new NotFoundException('Item not found')
    return item
  }

  async createItem(schoolId: string, data: {
    name: string
    nameAr?: string
    sku?: string
    category?: string
    description?: string
    unit?: string
    quantity?: number
    minQuantity?: number
    unitCost?: number
    location?: string
  }) {
    return this.prisma.storeItem.create({ data: { schoolId, ...data } })
  }

  async updateItem(schoolId: string, id: string, data: any) {
    await this.getItemById(schoolId, id)
    return this.prisma.storeItem.update({ where: { id }, data })
  }

  async adjustStock(schoolId: string, itemId: string, userId: string, type: 'IN' | 'OUT' | 'ADJUSTMENT', quantity: number, reason?: string) {
    const item = await this.prisma.storeItem.findFirst({ where: { id: itemId, schoolId } })
    if (!item) throw new NotFoundException('Item not found')

    let newQty = item.quantity
    if (type === 'IN') newQty += quantity
    else if (type === 'OUT') {
      if (item.quantity < quantity) throw new BadRequestException('Insufficient stock')
      newQty -= quantity
    } else {
      newQty = quantity // ADJUSTMENT sets absolute value
    }

    return this.prisma.$transaction([
      this.prisma.storeItem.update({ where: { id: itemId }, data: { quantity: newQty } }),
      this.prisma.stockMovement.create({
        data: { itemId, schoolId, type, quantity, reason, userId },
      }),
    ])
  }

  async getMovements(schoolId: string, itemId?: string, limit = 50) {
    return this.prisma.stockMovement.findMany({
      where: { schoolId, ...(itemId ? { itemId } : {}) },
      include: { item: { select: { name: true, unit: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  // ── Store Item Requests ────────────────────────────────────────────────────

  async getItemRequests(schoolId: string, userId: string, isAdmin: boolean) {
    const where: any = { schoolId }
    if (!isAdmin) where.requestedById = userId
    return this.prisma.storeItemRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        item: { select: { id: true, name: true, unit: true, quantity: true } },
        requestedBy: { include: { profile: { select: { firstName: true, lastName: true } } } },
        approvedBy: { include: { profile: { select: { firstName: true, lastName: true } } } },
      },
    })
  }

  async createItemRequest(userId: string, schoolId: string, dto: { itemId: string; quantity: number; reason?: string }) {
    const item = await this.prisma.storeItem.findFirst({ where: { id: dto.itemId, schoolId } })
    if (!item) throw new NotFoundException('Item not found')
    return this.prisma.storeItemRequest.create({
      data: { schoolId, requestedById: userId, itemId: dto.itemId, quantity: dto.quantity, reason: dto.reason },
      include: { item: { select: { name: true, unit: true } } },
    })
  }

  async approveItemRequest(id: string, adminId: string, notes?: string) {
    return this.prisma.storeItemRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: adminId, approvedAt: new Date(), notes },
    })
  }

  async rejectItemRequest(id: string, adminId: string, notes: string) {
    return this.prisma.storeItemRequest.update({
      where: { id },
      data: { status: 'REJECTED', approvedById: adminId, approvedAt: new Date(), notes },
    })
  }

  async collectItemRequest(id: string, adminId: string) {
    const req = await this.prisma.storeItemRequest.findUnique({
      where: { id },
      include: { item: true },
    })
    if (!req) throw new NotFoundException('Request not found')

    return this.prisma.$transaction(async (tx) => {
      // Deduct stock
      await tx.storeItem.update({
        where: { id: req.itemId },
        data: { quantity: { decrement: req.quantity } },
      })
      // Log movement
      await tx.stockMovement.create({
        data: {
          itemId: req.itemId,
          schoolId: req.schoolId,
          type: 'OUT',
          quantity: req.quantity,
          reason: `Collected by employee (request #${req.id.slice(-6)})`,
          userId: adminId,
        },
      })
      // Mark collected
      return tx.storeItemRequest.update({
        where: { id },
        data: { status: 'COLLECTED', collectedAt: new Date() },
      })
    })
  }

  async getEmployeeRequestSummary(schoolId: string) {
    const requests = await this.prisma.storeItemRequest.findMany({
      where: { schoolId },
      include: {
        item: { select: { name: true, unit: true } },
        requestedBy: { include: { profile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group by employee
    const byEmployee: Record<string, any> = {}
    for (const req of requests) {
      const uid = req.requestedById
      if (!byEmployee[uid]) {
        byEmployee[uid] = {
          userId: uid,
          name: `${req.requestedBy?.profile?.firstName ?? ''} ${req.requestedBy?.profile?.lastName ?? ''}`.trim(),
          requests: [],
        }
      }
      byEmployee[uid].requests.push(req)
    }
    return Object.values(byEmployee)
  }

  async getStats(schoolId: string) {
    const items = await this.prisma.storeItem.findMany({ where: { schoolId } })
    const totalItems = items.length
    const lowStockItems = items.filter((i) => i.quantity <= i.minQuantity).length
    const outOfStock = items.filter((i) => i.quantity === 0).length
    const totalValue = items.reduce((sum, i) => sum + (i.unitCost ?? 0) * i.quantity, 0)

    const byCategory = items.reduce((acc: Record<string, number>, i) => {
      acc[i.category] = (acc[i.category] ?? 0) + 1
      return acc
    }, {})

    return { totalItems, lowStockItems, outOfStock, totalValue, byCategory }
  }
}
