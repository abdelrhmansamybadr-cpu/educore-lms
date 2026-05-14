import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  // ── Locations ─────────────────────────────────────────────────────────────

  async getLocations(orgId: string) {
    return this.prisma.storeLocation.findMany({
      where: { orgId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { items: true } } },
    })
  }

  async createLocation(orgId: string, name: string) {
    return this.prisma.storeLocation.create({ data: { orgId, name } })
  }

  async updateLocation(orgId: string, id: string, name: string) {
    await this.prisma.storeLocation.findFirstOrThrow({ where: { id, orgId } })
    return this.prisma.storeLocation.update({ where: { id }, data: { name } })
  }

  async deleteLocation(orgId: string, id: string) {
    await this.prisma.storeLocation.findFirstOrThrow({ where: { id, orgId } })
    // Move items to no-location before deleting
    await this.prisma.storeItem.updateMany({ where: { locationId: id }, data: { locationId: null } })
    return this.prisma.storeLocation.delete({ where: { id } })
  }

  // ── Inventory (store manager — org-scoped) ────────────────────────────────

  async getItems(orgId: string, filters: { category?: string; lowStock?: boolean; search?: string; locationId?: string }) {
    const where: any = { orgId }
    if (filters.category) where.category = filters.category
    if (filters.locationId) where.locationId = filters.locationId
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
      include: { storeLocation: { select: { id: true, name: true } } },
    })
    if (filters.lowStock) return items.filter((i) => i.quantity <= i.minQuantity)
    return items
  }

  async getItemById(orgId: string, id: string) {
    const item = await this.prisma.storeItem.findFirst({
      where: { id, orgId },
      include: {
        movements: { orderBy: { createdAt: 'desc' }, take: 20 },
        storeLocation: { select: { id: true, name: true } },
      },
    })
    if (!item) throw new NotFoundException('Item not found')
    return item
  }

  async createItem(orgId: string, data: {
    name: string; nameAr?: string; sku?: string; category?: string
    description?: string; unit?: string; quantity?: number; minQuantity?: number
    location?: string; locationId?: string
  }) {
    return this.prisma.storeItem.create({ data: { orgId, ...data } })
  }

  async updateItem(orgId: string, id: string, data: any) {
    await this.getItemById(orgId, id)
    return this.prisma.storeItem.update({ where: { id }, data })
  }

  async adjustStock(orgId: string, itemId: string, userId: string, type: 'IN' | 'OUT' | 'ADJUSTMENT', quantity: number, reason?: string) {
    const item = await this.prisma.storeItem.findFirst({ where: { id: itemId, orgId } })
    if (!item) throw new NotFoundException('Item not found')

    let newQty = item.quantity
    if (type === 'IN') newQty += quantity
    else if (type === 'OUT') {
      if (item.quantity < quantity) throw new BadRequestException('Insufficient stock')
      newQty -= quantity
    } else {
      newQty = quantity
    }

    return this.prisma.$transaction([
      this.prisma.storeItem.update({ where: { id: itemId }, data: { quantity: newQty } }),
      this.prisma.stockMovement.create({ data: { itemId, orgId, type, quantity, reason, userId } }),
    ])
  }

  async getMovements(orgId: string, itemId?: string, limit = 50) {
    return this.prisma.stockMovement.findMany({
      where: { orgId, ...(itemId ? { itemId } : {}) },
      include: {
        item: { select: { name: true, unit: true } },
        user: { include: { profile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /** Movements enriched with full approval chain where traceable */
  async getMovementsWithChain(orgId: string, filters: { itemId?: string; type?: string; search?: string; limit?: number }) {
    const movements = await this.prisma.stockMovement.findMany({
      where: { orgId, ...(filters.itemId ? { itemId: filters.itemId } : {}), ...(filters.type ? { type: filters.type as any } : {}) },
      include: {
        item: { select: { name: true, unit: true, sku: true } },
        user: { include: { profile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 200,
    })

    // Collect IDs to resolve
    const sreqIds: string[] = []
    const reqIds: string[] = []
    for (const m of movements) {
      const sreqMatch = m.reason?.match(/sreq:([a-z0-9]+)/i)
      const reqMatch  = m.reason?.match(/req:([a-z0-9]+)/i)
      if (sreqMatch) sreqIds.push(sreqMatch[1])
      if (reqMatch)  reqIds.push(reqMatch[1])
    }

    // Batch-fetch store requests
    const storeRequests = sreqIds.length
      ? await this.prisma.storeItemRequest.findMany({
          where: { id: { in: sreqIds } },
          include: {
            requestedBy: { include: { profile: { select: { firstName: true, lastName: true } } } },
            approvedBy:  { include: { profile: { select: { firstName: true, lastName: true } } } },
          },
        })
      : []

    // Batch-fetch requisitions (only relations that actually exist on the model)
    const requisitions = reqIds.length
      ? await this.prisma.requisition.findMany({
          where: { id: { in: reqIds } },
          include: {
            requestedBy: { include: { profile: { select: { firstName: true, lastName: true } } } },
            reviewedBy:  { include: { profile: { select: { firstName: true, lastName: true } } } },
          },
        })
      : []

    // Batch-fetch pricedBy users separately (not a Prisma relation — just a String field)
    const pricedByIds = requisitions.map((r) => (r as any).pricedById).filter(Boolean) as string[]
    const pricedUsers = pricedByIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: pricedByIds } },
          include: { profile: { select: { firstName: true, lastName: true } } },
        })
      : []
    const pricedMap = Object.fromEntries(pricedUsers.map((u) => [u.id, u]))

    const sreqMap = Object.fromEntries(storeRequests.map((r) => [r.id, r]))
    const reqMap  = Object.fromEntries(requisitions.map((r) => [r.id, r]))

    return movements.map((m) => {
      const sreqId = m.reason?.match(/sreq:([a-z0-9]+)/i)?.[1]
      const reqId  = m.reason?.match(/req:([a-z0-9]+)/i)?.[1]
      const sreq   = sreqId ? sreqMap[sreqId] : null
      const req    = reqId  ? reqMap[reqId]   : null
      const pricedUser = req ? pricedMap[(req as any).pricedById] ?? null : null

      return {
        ...m,
        chain: {
          takenBy:       sreq?.requestedBy ?? req?.requestedBy ?? null,
          approvedBySM:  sreq?.approvedBy  ?? null,
          reqManager:    pricedUser,
          ownerApproval: req?.reviewedBy   ?? null,
        },
      }
    })
  }

  /** All collected store requests — "who took what" report */
  async getCollectionsReport(orgId: string) {
    return this.prisma.storeItemRequest.findMany({
      where: { orgId, status: 'COLLECTED' },
      orderBy: { collectedAt: 'desc' },
      include: {
        requestedBy: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        approvedBy:  { include: { profile: { select: { firstName: true, lastName: true } } } },
        item:        { select: { id: true, name: true, unit: true } },
      },
    })
  }

  async getStats(orgId: string) {
    const items = await this.prisma.storeItem.findMany({ where: { orgId } })
    const totalItems = items.length
    const lowStockItems = items.filter((i) => i.quantity <= i.minQuantity).length
    const outOfStock = items.filter((i) => i.quantity === 0).length
    const byCategory = items.reduce((acc: Record<string, number>, i) => {
      acc[i.category] = (acc[i.category] ?? 0) + 1
      return acc
    }, {})
    return { totalItems, lowStockItems, outOfStock, byCategory }
  }

  // ── Employee Requests (org-scoped) ────────────────────────────────────────

  async getItemRequests(orgId: string, userId: string, isAdmin: boolean) {
    const where: any = { orgId }
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

  async createItemRequest(userId: string, orgId: string, dto: { itemName: string; quantity: number; reason?: string }) {
    if (!dto.itemName?.trim()) throw new BadRequestException('Item name is required')
    return this.prisma.storeItemRequest.create({
      data: { orgId, requestedById: userId, itemName: dto.itemName.trim(), quantity: dto.quantity, reason: dto.reason },
    })
  }

  async approveItemRequest(id: string, adminId: string, opts: {
    notes?: string
    isLoan?: boolean
    loanDueDate?: string
    fulfillmentItems?: { itemId: string; itemName: string; quantity: number; unit: string }[]
  }) {
    return this.prisma.storeItemRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: adminId,
        approvedAt: new Date(),
        notes: opts.notes,
        isLoan: opts.isLoan ?? false,
        loanDueDate: opts.isLoan && opts.loanDueDate ? new Date(opts.loanDueDate) : null,
        fulfillmentItems: opts.fulfillmentItems ?? undefined,
        // keep itemId as first item's id for backward compat
        itemId: opts.fulfillmentItems?.[0]?.itemId ?? undefined,
      },
    })
  }

  async rejectItemRequest(id: string, adminId: string, notes: string) {
    return this.prisma.storeItemRequest.update({
      where: { id },
      data: { status: 'REJECTED', approvedById: adminId, approvedAt: new Date(), notes },
    })
  }

  async markReadyItemRequest(id: string, adminId: string) {
    const req = await this.prisma.storeItemRequest.findUnique({ where: { id } })
    if (!req) throw new NotFoundException('Request not found')
    if (req.status !== 'APPROVED') throw new BadRequestException('Request must be APPROVED before marking READY')
    return this.prisma.storeItemRequest.update({ where: { id }, data: { status: 'READY', approvedById: adminId } })
  }

  async collectItemRequest(id: string, adminId: string) {
    const req = await this.prisma.storeItemRequest.findUnique({ where: { id }, include: { item: true } })
    if (!req) throw new NotFoundException('Request not found')

    const fulfillment = (req.fulfillmentItems as any[]) ?? []

    return this.prisma.$transaction(async (tx) => {
      // Deduct stock for each fulfillment item
      for (const fi of fulfillment) {
        const inv = await tx.storeItem.findFirst({ where: { id: fi.itemId, orgId: req.orgId } })
        if (inv) {
          await tx.storeItem.update({ where: { id: fi.itemId }, data: { quantity: { decrement: fi.quantity } } })
          await tx.stockMovement.create({
            data: { itemId: fi.itemId, orgId: req.orgId, type: 'OUT', quantity: fi.quantity, reason: `Collected by employee | sreq:${req.id}`, userId: adminId },
          })
        }
      }
      // Legacy single itemId path
      if (fulfillment.length === 0 && req.itemId && req.item) {
        await tx.storeItem.update({ where: { id: req.itemId }, data: { quantity: { decrement: req.quantity } } })
        await tx.stockMovement.create({
          data: { itemId: req.itemId, orgId: req.orgId, type: 'OUT', quantity: req.quantity, reason: `Collected by employee | sreq:${req.id}`, userId: adminId },
        })
      }
      return tx.storeItemRequest.update({ where: { id }, data: { status: 'COLLECTED', collectedAt: new Date() } })
    })
  }

  async returnLoanItem(id: string, adminId: string) {
    const req = await this.prisma.storeItemRequest.findUnique({ where: { id }, include: { item: true } })
    if (!req) throw new NotFoundException('Request not found')
    if (!req.isLoan) throw new BadRequestException('This item is not a loan')

    const fulfillment = (req.fulfillmentItems as any[]) ?? []

    return this.prisma.$transaction(async (tx) => {
      for (const fi of fulfillment) {
        const inv = await tx.storeItem.findFirst({ where: { id: fi.itemId, orgId: req.orgId } })
        if (inv) {
          await tx.storeItem.update({ where: { id: fi.itemId }, data: { quantity: { increment: fi.quantity } } })
          await tx.stockMovement.create({
            data: { itemId: fi.itemId, orgId: req.orgId, type: 'IN', quantity: fi.quantity, reason: `Loan returned (request #${req.id.slice(-6)})`, userId: adminId },
          })
        }
      }
      if (fulfillment.length === 0 && req.itemId && req.item) {
        await tx.storeItem.update({ where: { id: req.itemId }, data: { quantity: { increment: req.quantity } } })
        await tx.stockMovement.create({
          data: { itemId: req.itemId, orgId: req.orgId, type: 'IN', quantity: req.quantity, reason: `Loan returned (request #${req.id.slice(-6)})`, userId: adminId },
        })
      }
      return tx.storeItemRequest.update({ where: { id }, data: { returnedAt: new Date() } })
    })
  }

  async getMyCollections(orgId: string, userId: string) {
    return this.prisma.storeItemRequest.findMany({
      where: { orgId, requestedById: userId, status: 'COLLECTED' },
      orderBy: { collectedAt: 'desc' },
      include: { item: { select: { id: true, name: true, unit: true } } },
    })
  }

  // ── Dashboard Stats (enhanced) ────────────────────────────────────────────

  async getDashboardStats(orgId: string) {
    const [items, pendingCount, movementsThisMonth] = await Promise.all([
      this.prisma.storeItem.findMany({ where: { orgId } }),
      this.prisma.storeItemRequest.count({ where: { orgId, status: 'PENDING' } }),
      this.prisma.stockMovement.count({
        where: {
          orgId,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ])
    const totalItems = items.length
    const lowStockItems = items.filter((i) => i.quantity <= i.minQuantity && i.quantity > 0).length
    const outOfStock = items.filter((i) => i.quantity === 0).length
    const totalInventoryValue = items.reduce((sum, i) => sum + (i.quantity * ((i as any).unitCost ?? 0)), 0)
    const byCategory = items.reduce((acc: Record<string, number>, i) => {
      acc[i.category] = (acc[i.category] ?? 0) + 1
      return acc
    }, {})
    const recentAlerts = items
      .filter((i) => i.quantity <= i.minQuantity)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5)
      .map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, minQuantity: i.minQuantity, unit: i.unit }))

    return { totalItems, lowStockItems, outOfStock, pendingRequests: pendingCount, totalMovementsThisMonth: movementsThisMonth, totalInventoryValue, byCategory, recentAlerts }
  }

  // ── Suppliers ─────────────────────────────────────────────────────────────

  async getSuppliers(orgId: string) {
    return this.prisma.supplier.findMany({
      where: { orgId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { purchaseOrders: true, items: true } },
        purchaseOrders: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true, status: true, totalCost: true } },
      },
    })
  }

  async createSupplier(orgId: string, dto: { name: string; email?: string; phone?: string; address?: string; contactPerson?: string; notes?: string; rating?: number }) {
    return this.prisma.supplier.create({ data: { orgId, ...dto } })
  }

  async updateSupplier(orgId: string, id: string, dto: any) {
    await this.prisma.supplier.findFirstOrThrow({ where: { id, orgId } })
    return this.prisma.supplier.update({ where: { id }, data: dto })
  }

  async deleteSupplier(orgId: string, id: string) {
    await this.prisma.supplier.findFirstOrThrow({ where: { id, orgId } })
    return this.prisma.supplier.delete({ where: { id } })
  }

  // ── Purchase Orders ───────────────────────────────────────────────────────

  async getPurchaseOrders(orgId: string, status?: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { orgId, ...(status ? { status: status as any } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { id: true, name: true } },
        createdBy: { include: { profile: { select: { firstName: true, lastName: true } } } },
        items: { include: { item: { select: { id: true, name: true, unit: true } } } },
      },
    })
  }

  async createPurchaseOrder(orgId: string, userId: string, dto: {
    supplierId?: string
    notes?: string
    expectedDelivery?: string
    items: { itemId?: string; itemName: string; unit: string; quantity: number; unitCost: number }[]
  }) {
    const totalCost = dto.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0)
    return this.prisma.purchaseOrder.create({
      data: {
        orgId,
        createdById: userId,
        supplierId: dto.supplierId ?? null,
        notes: dto.notes,
        expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : null,
        totalCost,
        items: {
          create: dto.items.map((i) => ({
            itemId: i.itemId ?? null,
            itemName: i.itemName,
            unit: i.unit,
            quantity: i.quantity,
            unitCost: i.unitCost,
          })),
        },
      },
      include: { items: true, supplier: true },
    })
  }

  async receivePurchaseOrder(orgId: string, id: string, userId: string, receivedItems: { itemId: string; poItemId: string; receivedQty: number }[]) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, orgId }, include: { items: true } })
    if (!po) throw new NotFoundException('Purchase order not found')

    return this.prisma.$transaction(async (tx) => {
      for (const ri of receivedItems) {
        const poItem = po.items.find((i) => i.id === ri.poItemId)
        if (!poItem) continue
        await tx.purchaseOrderItem.update({ where: { id: ri.poItemId }, data: { receivedQty: { increment: ri.receivedQty } } })
        if (ri.itemId) {
          const inv = await tx.storeItem.findFirst({ where: { id: ri.itemId, orgId } })
          if (inv) {
            await tx.storeItem.update({ where: { id: ri.itemId }, data: { quantity: { increment: ri.receivedQty } } })
            await tx.stockMovement.create({
              data: { itemId: ri.itemId, orgId, type: 'IN', quantity: ri.receivedQty, reason: `PO received #${id.slice(-6)}`, userId },
            })
          }
        }
      }
      // Check if fully received
      const updatedItems = await tx.purchaseOrderItem.findMany({ where: { orderId: id } })
      const allReceived = updatedItems.every((i) => i.receivedQty >= i.quantity)
      const anyReceived = updatedItems.some((i) => i.receivedQty > 0)
      const newStatus = allReceived ? 'RECEIVED' : anyReceived ? 'PARTIALLY_RECEIVED' : po.status
      return tx.purchaseOrder.update({ where: { id }, data: { status: newStatus as any, receivedAt: allReceived ? new Date() : undefined } })
    })
  }

  async cancelPurchaseOrder(orgId: string, id: string) {
    await this.prisma.purchaseOrder.findFirstOrThrow({ where: { id, orgId } })
    return this.prisma.purchaseOrder.update({ where: { id }, data: { status: 'CANCELLED' } })
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  async getUsageReport(orgId: string, days = 30) {
    const since = new Date(Date.now() - days * 86400000)
    const movements = await this.prisma.stockMovement.findMany({
      where: { orgId, createdAt: { gte: since } },
      include: { item: { select: { id: true, name: true, unit: true } } },
    })
    // Group by item
    const map: Record<string, { name: string; unit: string; in: number; out: number; total: number }> = {}
    for (const m of movements) {
      if (!map[m.itemId]) map[m.itemId] = { name: m.item.name, unit: m.item.unit, in: 0, out: 0, total: 0 }
      if (m.type === 'IN') map[m.itemId].in += m.quantity
      else if (m.type === 'OUT') map[m.itemId].out += m.quantity
      map[m.itemId].total += m.quantity
    }
    const topItems = Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // Daily trend (last 14 days)
    const dailyMap: Record<string, { in: number; out: number }> = {}
    for (const m of movements) {
      const day = m.createdAt.toISOString().slice(0, 10)
      if (!dailyMap[day]) dailyMap[day] = { in: 0, out: 0 }
      if (m.type === 'IN') dailyMap[day].in += m.quantity
      else if (m.type === 'OUT') dailyMap[day].out += m.quantity
    }
    const trend = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date))

    return { topItems, trend, totalIn: movements.filter((m) => m.type === 'IN').reduce((s, m) => s + m.quantity, 0), totalOut: movements.filter((m) => m.type === 'OUT').reduce((s, m) => s + m.quantity, 0) }
  }

  async getSpendingReport(orgId: string, days = 30) {
    const since = new Date(Date.now() - days * 86400000)
    const orders = await this.prisma.purchaseOrder.findMany({
      where: { orgId, createdAt: { gte: since } },
      include: { supplier: { select: { name: true } } },
    })
    const bySupplier: Record<string, { name: string; total: number; count: number }> = {}
    for (const o of orders) {
      const key = o.supplierId ?? '__none__'
      const name = o.supplier?.name ?? 'No Supplier'
      if (!bySupplier[key]) bySupplier[key] = { name, total: 0, count: 0 }
      bySupplier[key].total += o.totalCost
      bySupplier[key].count += 1
    }
    return {
      bySupplier: Object.values(bySupplier).sort((a, b) => b.total - a.total),
      totalSpend: orders.reduce((s, o) => s + o.totalCost, 0),
      orderCount: orders.length,
    }
  }

  async getRequestsReport(orgId: string, days = 30) {
    const since = new Date(Date.now() - days * 86400000)
    const requests = await this.prisma.storeItemRequest.findMany({
      where: { orgId, createdAt: { gte: since } },
    })
    const byStatus: Record<string, number> = {}
    for (const r of requests) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
    }
    const dailyMap: Record<string, number> = {}
    for (const r of requests) {
      const day = r.createdAt.toISOString().slice(0, 10)
      dailyMap[day] = (dailyMap[day] ?? 0) + 1
    }
    const trend = Object.entries(dailyMap).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date))
    return { byStatus, trend, total: requests.length }
  }

  // ── SM Purchase Review (Store Manager gates requisitions) ─────────────────

  /** Requisitions pending SM review (smStatus is null) — scoped to SM's org */
  async getSmPendingRequisitions(orgId: string) {
    return this.prisma.requisition.findMany({
      where: { organizationId: orgId, smStatus: null },
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        school: { select: { name: true } },
        storageLocation: { select: { id: true, name: true } },
      },
    })
  }

  /** All SM-reviewed requisitions (approved + declined) */
  async getSmReviewedRequisitions(orgId: string) {
    return this.prisma.requisition.findMany({
      where: { organizationId: orgId, smStatus: { not: null } },
      orderBy: { smReviewedAt: 'desc' },
      include: {
        requestedBy: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        smReviewedBy: { include: { profile: { select: { firstName: true, lastName: true } } } },
        school: { select: { name: true } },
        storageLocation: { select: { id: true, name: true } },
      },
    })
  }

  /** SM approves → forwards to Requisitions Manager */
  async smApproveRequisition(orgId: string, id: string, smId: string, opts: {
    smNote?: string
    storageLocationId?: string
    storageCategory?: string
    storageShelfBin?: string
  }) {
    const req = await this.prisma.requisition.findFirst({ where: { id, organizationId: orgId } })
    if (!req) throw new NotFoundException('Requisition not found')
    if (req.smStatus !== null) throw new BadRequestException('Already reviewed by Store Manager')
    return this.prisma.requisition.update({
      where: { id },
      data: {
        smStatus: 'SM_APPROVED',
        smReviewedById: smId,
        smReviewedAt: new Date(),
        smNote: opts.smNote,
        storageLocationId: opts.storageLocationId ?? null,
        storageCategory: opts.storageCategory ?? null,
        storageShelfBin: opts.storageShelfBin ?? null,
      },
    })
  }

  /** SM declines → tells employee item is in stock, use store request instead */
  async smDeclineRequisition(orgId: string, id: string, smId: string, smNote: string) {
    const req = await this.prisma.requisition.findFirst({ where: { id, organizationId: orgId } })
    if (!req) throw new NotFoundException('Requisition not found')
    if (req.smStatus !== null) throw new BadRequestException('Already reviewed by Store Manager')
    return this.prisma.requisition.update({
      where: { id },
      data: {
        smStatus: 'SM_DECLINED',
        status: 'REJECTED',
        smReviewedById: smId,
        smReviewedAt: new Date(),
        smNote,
      },
    })
  }

  /** SM updates storage planning fields on an approved requisition */
  async smUpdateStoragePlan(orgId: string, id: string, opts: {
    storageLocationId?: string; storageCategory?: string; storageShelfBin?: string
  }) {
    await this.prisma.requisition.findFirstOrThrow({ where: { id, organizationId: orgId, smStatus: 'SM_APPROVED' } })
    return this.prisma.requisition.update({ where: { id }, data: opts })
  }

  /** SM reviews and accepts arrived items → creates one StoreItem per line into inventory */
  async smAcceptItems(orgId: string, id: string, smId: string, opts: {
    items: { name: string; unit: string; quantity: number; category?: string }[]
    locationId?: string; shelfBin?: string; storeNotes?: string
  }) {
    const req = await this.prisma.requisition.findFirst({ where: { id, organizationId: orgId } })
    if (!req) throw new NotFoundException('Requisition not found')
    if (req.storageItemCreated) throw new BadRequestException('Items already accepted into inventory')
    if (!opts.items?.length) throw new BadRequestException('No items provided')

    const sharedLocationId = opts.locationId ?? req.storageLocationId ?? null
    const sharedShelfBin   = opts.shelfBin   ?? req.storageShelfBin   ?? null
    const sharedCategory   = req.storageCategory ?? 'General'

    return this.prisma.$transaction(async (tx) => {
      const createdIds: string[] = []

      for (const line of opts.items) {
        const item = await tx.storeItem.create({
          data: {
            orgId,
            name: line.name,
            unit: line.unit,
            quantity: line.quantity,
            category: line.category ?? sharedCategory,
            locationId: sharedLocationId,
            location: sharedShelfBin,
            minQuantity: 0,
          },
        })
        await tx.stockMovement.create({
          data: { itemId: item.id, orgId, type: 'IN', quantity: line.quantity, reason: `Accepted from requisition | req:${id}`, userId: smId },
        })
        createdIds.push(item.id)
      }

      return tx.requisition.update({
        where: { id },
        data: {
          storageItemCreated: true,
          storageItemId: createdIds[0],           // first item id for back-compat
          storageAcceptedAt: new Date(),
          storageAcceptedById: smId,
          storeConfirmedAt: new Date(),
          storeConfirmedById: smId,
          storeNotes: opts.storeNotes,
          status: 'STORE_CONFIRMED',
        },
      })
    })
  }
}
