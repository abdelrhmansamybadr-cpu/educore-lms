import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, ForbiddenException,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { StoreService } from './store.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'

function requireOrg(orgId: string | null): string {
  if (!orgId) throw new ForbiddenException('Your account is not linked to an organization. Contact your admin.')
  return orgId
}

// Roles that manage the store (inventory, approvals)
const STORE_ADMIN_ROLES = [
  Role.SCHOOL_ADMIN, Role.STORE_MANAGER, Role.IT_ADMIN, Role.VICE_PRINCIPAL,
  Role.FINANCE_OFFICER, Role.SUPER_ADMIN,
] as const

// All roles that can submit requests (everyone except Student/Parent)
const ALL_STAFF_ROLES = [
  Role.SUPER_ADMIN, Role.DEVELOPER,
  Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR, Role.DEPARTMENT_HEAD,
  Role.TEACHER, Role.SUB_TEACHER, Role.COUNSELOR, Role.LIBRARIAN, Role.NURSE,
  Role.FINANCE_OFFICER, Role.HR_MANAGER, Role.STORE_MANAGER, Role.CANTEEN_MANAGER,
  Role.IT_ADMIN, Role.TRANSPORT_MANAGER, Role.RECEPTIONIST, Role.ADMISSION_OFFICER,
  Role.MATRON, Role.EVENT_COORDINATOR, Role.SUPPORT_AGENT, Role.ACTIVITIES_COORDINATOR,
  'REQUISITIONS_MANAGER' as any,
] as const

@ApiTags('Store')
@ApiBearerAuth()
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('stats')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER, Role.IT_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Store inventory stats (store manager)' })
  getStats(@CurrentUser('orgId') orgId: string) {
    return this.storeService.getStats(requireOrg(orgId))
  }

  // ── Locations ──────────────────────────────────────────────────────────────

  @Get('locations')
  @Roles(...STORE_ADMIN_ROLES)
  getLocations(@CurrentUser('orgId') orgId: string) {
    return this.storeService.getLocations(requireOrg(orgId))
  }

  @Post('locations')
  @Roles(Role.STORE_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  createLocation(@CurrentUser('orgId') orgId: string, @Body() body: { name: string }) {
    return this.storeService.createLocation(requireOrg(orgId), body.name)
  }

  @Patch('locations/:id')
  @Roles(Role.STORE_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  updateLocation(@CurrentUser('orgId') orgId: string, @Param('id') id: string, @Body() body: { name: string }) {
    return this.storeService.updateLocation(requireOrg(orgId), id, body.name)
  }

  @Delete('locations/:id')
  @Roles(Role.STORE_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  deleteLocation(@CurrentUser('orgId') orgId: string, @Param('id') id: string) {
    return this.storeService.deleteLocation(requireOrg(orgId), id)
  }

  // ── Inventory (store manager private) ─────────────────────────────────────

  @Get('items')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER, Role.IT_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List inventory items — store manager only, org-scoped' })
  getItems(
    @CurrentUser('orgId') orgId: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('lowStock') lowStock?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.storeService.getItems(requireOrg(orgId), { category, search, lowStock: lowStock === 'true', locationId })
  }

  @Get('items/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER, Role.IT_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get item details with movement history' })
  getItem(@CurrentUser('orgId') orgId: string, @Param('id') id: string) {
    return this.storeService.getItemById(requireOrg(orgId), id)
  }

  @Post('items')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create inventory item' })
  createItem(@CurrentUser('orgId') orgId: string, @Body() body: any) {
    return this.storeService.createItem(requireOrg(orgId), body)
  }

  @Patch('items/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update inventory item' })
  updateItem(@CurrentUser('orgId') orgId: string, @Param('id') id: string, @Body() body: any) {
    return this.storeService.updateItem(requireOrg(orgId), id, body)
  }

  @Post('items/:id/adjust')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Adjust stock' })
  adjustStock(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { type: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number; reason?: string },
  ) {
    return this.storeService.adjustStock(requireOrg(orgId), id, userId, body.type, body.quantity, body.reason)
  }

  @Get('movements')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Stock movement history' })
  getMovements(@CurrentUser('orgId') orgId: string, @Query('itemId') itemId?: string, @Query('limit') limit?: string) {
    return this.storeService.getMovements(requireOrg(orgId), itemId, limit ? parseInt(limit) : 50)
  }

  @Get('movements/chain')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Stock movements with full approval chain info' })
  getMovementsWithChain(
    @CurrentUser('orgId') orgId: string,
    @Query('itemId') itemId?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.storeService.getMovementsWithChain(requireOrg(orgId), {
      itemId, type, search, limit: limit ? parseInt(limit) : 200,
    })
  }

  @Get('collections')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Who took what — all collected store requests' })
  getCollectionsReport(@CurrentUser('orgId') orgId: string) {
    return this.storeService.getCollectionsReport(requireOrg(orgId))
  }

  // ── Employee Requests ──────────────────────────────────────────────────────

  @Get('requests')
  @Roles(...ALL_STAFF_ROLES)
  @ApiOperation({ summary: 'Requests: admin sees all, employee sees own. ?mine=true forces own-only.' })
  getItemRequests(
    @CurrentUser('id') userId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('role') role: string,
    @Query('mine') mine?: string,
  ) {
    const adminRoles = new Set(['SCHOOL_ADMIN', 'STORE_MANAGER', 'IT_ADMIN', 'VICE_PRINCIPAL', 'FINANCE_OFFICER', 'SUPER_ADMIN', 'DEVELOPER'])
    const isAdmin = mine !== 'true' && adminRoles.has(role)
    return this.storeService.getItemRequests(requireOrg(orgId), userId, isAdmin)
  }

  @Post('requests')
  @Roles(...ALL_STAFF_ROLES)
  @ApiOperation({ summary: 'Submit a store request (free-text, no inventory access)' })
  createItemRequest(
    @CurrentUser('id') userId: string,
    @CurrentUser('orgId') orgId: string,
    @Body() body: { itemName: string; quantity: number; reason?: string },
  ) {
    return this.storeService.createItemRequest(userId, requireOrg(orgId), body)
  }

  @Patch('requests/:id/approve')
  @Roles(...STORE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Approve request with fulfillment cart and optional loan terms.' })
  approveItemRequest(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() body: {
      notes?: string
      isLoan?: boolean
      loanDueDate?: string
      fulfillmentItems?: { itemId: string; itemName: string; quantity: number; unit: string }[]
    },
  ) {
    return this.storeService.approveItemRequest(id, adminId, body)
  }

  @Patch('requests/:id/reject')
  @Roles(...STORE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Reject request with mandatory reason' })
  rejectItemRequest(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { notes: string },
  ) {
    return this.storeService.rejectItemRequest(id, adminId, body.notes)
  }

  @Patch('requests/:id/ready')
  @Roles(...STORE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Mark items ready for pickup' })
  markReadyItemRequest(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.storeService.markReadyItemRequest(id, adminId)
  }

  @Patch('requests/:id/collect')
  @Roles(...STORE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Mark collected — deducts stock if linked to inventory' })
  collectItemRequest(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.storeService.collectItemRequest(id, adminId)
  }

  @Patch('requests/:id/return')
  @Roles(...STORE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Mark loaned item returned — restores stock if linked' })
  returnLoanItem(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.storeService.returnLoanItem(id, adminId)
  }

  @Get('my-collections')
  @Roles(...ALL_STAFF_ROLES)
  @ApiOperation({ summary: "Employee's full collection history including loans" })
  getMyCollections(@CurrentUser('id') userId: string, @CurrentUser('orgId') orgId: string) {
    return this.storeService.getMyCollections(requireOrg(orgId), userId)
  }

  // ── Dashboard Stats (enhanced) ────────────────────────────────────────────

  @Get('dashboard-stats')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER, Role.IT_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Enhanced dashboard stats with inventory value, alerts, pending count' })
  getDashboardStats(@CurrentUser('orgId') orgId: string) {
    return this.storeService.getDashboardStats(requireOrg(orgId))
  }

  // ── Suppliers ─────────────────────────────────────────────────────────────

  @Get('suppliers')
  @Roles(...STORE_ADMIN_ROLES)
  @ApiOperation({ summary: 'List suppliers with PO count' })
  getSuppliers(@CurrentUser('orgId') orgId: string) {
    return this.storeService.getSuppliers(requireOrg(orgId))
  }

  @Post('suppliers')
  @Roles(Role.STORE_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create supplier' })
  createSupplier(@CurrentUser('orgId') orgId: string, @Body() body: any) {
    return this.storeService.createSupplier(requireOrg(orgId), body)
  }

  @Patch('suppliers/:id')
  @Roles(Role.STORE_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update supplier' })
  updateSupplier(@CurrentUser('orgId') orgId: string, @Param('id') id: string, @Body() body: any) {
    return this.storeService.updateSupplier(requireOrg(orgId), id, body)
  }

  @Delete('suppliers/:id')
  @Roles(Role.STORE_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete supplier' })
  deleteSupplier(@CurrentUser('orgId') orgId: string, @Param('id') id: string) {
    return this.storeService.deleteSupplier(requireOrg(orgId), id)
  }

  // ── Purchase Orders ───────────────────────────────────────────────────────

  @Get('purchase-orders')
  @Roles(...STORE_ADMIN_ROLES)
  @ApiOperation({ summary: 'List purchase orders' })
  getPurchaseOrders(@CurrentUser('orgId') orgId: string, @Query('status') status?: string) {
    return this.storeService.getPurchaseOrders(requireOrg(orgId), status)
  }

  @Post('purchase-orders')
  @Roles(Role.STORE_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create purchase order' })
  createPurchaseOrder(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.storeService.createPurchaseOrder(requireOrg(orgId), userId, body)
  }

  @Patch('purchase-orders/:id/receive')
  @Roles(Role.STORE_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Receive PO items — auto-increments inventory stock' })
  receivePurchaseOrder(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { receivedItems: { itemId: string; poItemId: string; receivedQty: number }[] },
  ) {
    return this.storeService.receivePurchaseOrder(requireOrg(orgId), id, userId, body.receivedItems)
  }

  @Patch('purchase-orders/:id/cancel')
  @Roles(...STORE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Cancel purchase order' })
  cancelPurchaseOrder(@CurrentUser('orgId') orgId: string, @Param('id') id: string) {
    return this.storeService.cancelPurchaseOrder(requireOrg(orgId), id)
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  @Get('reports/usage')
  @Roles(...STORE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Usage report: top items, IN/OUT trend' })
  getUsageReport(@CurrentUser('orgId') orgId: string, @Query('days') days?: string) {
    return this.storeService.getUsageReport(requireOrg(orgId), days ? parseInt(days) : 30)
  }

  @Get('reports/spending')
  @Roles(...STORE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Spending report: PO totals by supplier' })
  getSpendingReport(@CurrentUser('orgId') orgId: string, @Query('days') days?: string) {
    return this.storeService.getSpendingReport(requireOrg(orgId), days ? parseInt(days) : 30)
  }

  @Get('reports/requests')
  @Roles(...STORE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Requests report: counts by status + trend' })
  getRequestsReport(@CurrentUser('orgId') orgId: string, @Query('days') days?: string) {
    return this.storeService.getRequestsReport(requireOrg(orgId), days ? parseInt(days) : 30)
  }

  // ── SM Purchase Reviews ────────────────────────────────────────────────────

  @Get('purchase-reviews/pending')
  @Roles(Role.STORE_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Requisitions waiting for Store Manager first-gate review' })
  getSmPendingRequisitions(@CurrentUser('orgId') orgId: string) {
    return this.storeService.getSmPendingRequisitions(requireOrg(orgId))
  }

  @Get('purchase-reviews/reviewed')
  @Roles(Role.STORE_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Requisitions already reviewed (approved or declined) by SM' })
  getSmReviewedRequisitions(@CurrentUser('orgId') orgId: string) {
    return this.storeService.getSmReviewedRequisitions(requireOrg(orgId))
  }

  @Patch('purchase-reviews/:id/approve')
  @Roles(Role.STORE_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'SM approves requisition — forwards to Requisitions Manager' })
  smApproveRequisition(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { smNote?: string; storageLocationId?: string; storageCategory?: string; storageShelfBin?: string },
  ) {
    return this.storeService.smApproveRequisition(requireOrg(orgId), id, userId, body)
  }

  @Patch('purchase-reviews/:id/decline')
  @Roles(Role.STORE_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'SM declines requisition — item is in stock, employee should use Store Request' })
  smDeclineRequisition(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { smNote: string },
  ) {
    return this.storeService.smDeclineRequisition(requireOrg(orgId), id, userId, body.smNote)
  }

  @Patch('purchase-reviews/:id/storage-plan')
  @Roles(Role.STORE_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'SM updates storage plan while Req Manager processes the PO' })
  smUpdateStoragePlan(
    @CurrentUser('orgId') orgId: string,
    @Param('id') id: string,
    @Body() body: { storageLocationId?: string; storageCategory?: string; storageShelfBin?: string },
  ) {
    return this.storeService.smUpdateStoragePlan(requireOrg(orgId), id, body)
  }

  @Post('purchase-reviews/:id/accept-items')
  @Roles(Role.STORE_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'SM accepts all arrived items into inventory (one StoreItem per line)' })
  smAcceptItems(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: {
      items: { name: string; unit: string; quantity: number; category?: string }[]
      locationId?: string; shelfBin?: string; storeNotes?: string
    },
  ) {
    return this.storeService.smAcceptItems(requireOrg(orgId), id, userId, body)
  }
}
