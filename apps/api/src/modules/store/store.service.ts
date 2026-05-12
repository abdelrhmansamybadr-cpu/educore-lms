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
