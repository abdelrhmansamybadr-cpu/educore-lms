import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { OwnerService } from './owner.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Owner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'DEVELOPER')
@Controller('owner')
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  // ── Overview ───────────────────────────────────────────────────────────────

  @Get('overview')
  getOverview(@CurrentUser('id') userId: string) {
    return this.ownerService.getOverview(userId)
  }

  @Get('org')
  getOrgInfo(@CurrentUser('id') userId: string) {
    return this.ownerService.getOrgInfo(userId)
  }

  @Patch('org')
  updateOrgInfo(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.ownerService.updateOrgInfo(userId, body)
  }

  // ── Purchase Requests ──────────────────────────────────────────────────────

  @Get('purchase-requests')
  getPurchaseRequests(
    @CurrentUser('id') userId: string,
    @Query() query: { status?: string; schoolId?: string; category?: string; page?: number; limit?: number },
  ) {
    return this.ownerService.getPurchaseRequests(userId, query)
  }

  @Post('purchase-requests')
  createPurchaseRequest(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    const { schoolId, ...dto } = body
    return this.ownerService.createPurchaseRequest(userId, schoolId, dto)
  }

  @Patch('purchase-requests/:id/review')
  reviewPurchaseRequest(
    @Param('id') id: string,
    @CurrentUser('id') reviewerId: string,
    @Body() body: { status: string; reviewNotes?: string; approvedCost?: number },
  ) {
    return this.ownerService.reviewPurchaseRequest(id, reviewerId, body)
  }

  // ── Requisitions ───────────────────────────────────────────────────────────

  @Get('requisitions')
  @Roles('SUPER_ADMIN', 'DEVELOPER', 'CFO' as any, 'FINANCE_MANAGER' as any, 'AUDITOR' as any, 'FINANCE_OFFICER' as any)
  getRequisitions(
    @CurrentUser() user: any,
    @Query() query: { status?: string; schoolId?: string; category?: string; page?: number; limit?: number },
  ) {
    return this.ownerService.getRequisitions(user.id, query, user.orgId)
  }

  @Post('requisitions')
  createRequisition(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    const { schoolId, ...dto } = body
    return this.ownerService.createRequisition(userId, schoolId, dto)
  }

  @Patch('requisitions/:id/review')
  reviewRequisition(
    @Param('id') id: string,
    @CurrentUser('id') reviewerId: string,
    @Body() body: { status: string; reviewNotes?: string },
  ) {
    return this.ownerService.reviewRequisition(id, reviewerId, body)
  }

  @Patch('requisitions/:id/price')
  @Roles('SUPER_ADMIN', 'DEVELOPER', 'REQUISITIONS_MANAGER' as any)
  priceRequisition(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { items: { name: string; qty: number; unit: string; pricePerUnit: number; total: number }[] },
  ) {
    return this.ownerService.priceRequisition(id, userId, body.items)
  }

  // Finance: escalate to owner
  @Patch('requisitions/:id/finance-approve')
  @Roles('SUPER_ADMIN', 'DEVELOPER', 'FINANCE_OFFICER' as any, 'CFO' as any, 'FINANCE_MANAGER' as any)
  financeApproveRequisition(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ownerService.financeApproveRequisition(id, userId)
  }

  // Finance: approve directly without owner
  @Patch('requisitions/:id/finance-direct-approve')
  @Roles('SUPER_ADMIN', 'DEVELOPER', 'FINANCE_OFFICER' as any, 'CFO' as any, 'FINANCE_MANAGER' as any)
  financeDirectApprove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ownerService.financeDirectApprove(id, userId)
  }

  // Finance: release money to RM
  @Patch('requisitions/:id/release-money')
  @Roles('SUPER_ADMIN', 'DEVELOPER', 'FINANCE_OFFICER' as any, 'CFO' as any, 'FINANCE_MANAGER' as any)
  releaseMoney(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ownerService.releaseMoneyRequisition(id, userId)
  }

  // RM: confirm money received
  @Patch('requisitions/:id/confirm-money')
  @Roles('SUPER_ADMIN', 'DEVELOPER', 'REQUISITIONS_MANAGER' as any)
  confirmMoney(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ownerService.confirmMoneyReceived(id, userId)
  }

  // RM: mark purchased + upload invoice
  @Patch('requisitions/:id/purchased')
  @Roles('SUPER_ADMIN', 'DEVELOPER', 'REQUISITIONS_MANAGER' as any)
  markPurchased(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { invoiceUrls: string[] },
  ) {
    return this.ownerService.markPurchased(id, userId, body.invoiceUrls ?? [])
  }

  // Store: confirm receipt with actual quantities
  @Patch('requisitions/:id/store-confirm')
  @Roles('SUPER_ADMIN', 'DEVELOPER', 'STORE_MANAGER' as any, 'REQUISITIONS_MANAGER' as any)
  storeConfirm(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: {
      receivedItems: { name: string; orderedQty: number; receivedQty: number; unit: string; note?: string }[]
      notes?: string
    },
  ) {
    return this.ownerService.storeConfirmReceipt(id, userId, body)
  }

  // Store: mark requester collected
  @Patch('requisitions/:id/collected')
  @Roles('SUPER_ADMIN', 'DEVELOPER', 'STORE_MANAGER' as any)
  markCollected(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ownerService.markCollected(id, userId)
  }

  @Patch('requisitions/:id/approve')
  approveRequisition(
    @Param('id') id: string,
    @CurrentUser('id') reviewerId: string,
    @Body() body: { notes?: string },
  ) {
    return this.ownerService.approveRequisition(id, reviewerId, body.notes)
  }

  @Patch('requisitions/:id/reject')
  rejectRequisition(
    @Param('id') id: string,
    @CurrentUser('id') reviewerId: string,
    @Body() body: { reason: string },
  ) {
    return this.ownerService.rejectRequisition(id, reviewerId, body.reason)
  }

  @Patch('requisitions/:id/finance-release')
  @Roles('SUPER_ADMIN', 'DEVELOPER', 'FINANCE_OFFICER' as any, 'CFO' as any, 'FINANCE_MANAGER' as any)
  financeReleaseRequisition(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ownerService.financeReleaseRequisition(id, userId)
  }

  @Patch('requisitions/:id/items-arrived')
  @Roles('SUPER_ADMIN', 'DEVELOPER', 'REQUISITIONS_MANAGER' as any, 'STORE_MANAGER' as any)
  itemsArrivedRequisition(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { invoiceUrls: string[] },
  ) {
    return this.ownerService.itemsArrivedRequisition(id, userId, body.invoiceUrls ?? [])
  }

  @Patch('requisitions/:id/complete')
  @Roles('SUPER_ADMIN', 'DEVELOPER', 'FINANCE_OFFICER' as any)
  completeRequisition(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ownerService.completeRequisition(id, userId)
  }

  // ── Job Applications ───────────────────────────────────────────────────────

  @Get('job-applications')
  getJobApplications(
    @CurrentUser('id') userId: string,
    @Query() query: { status?: string; position?: string; schoolId?: string; page?: number; limit?: number },
  ) {
    return this.ownerService.getJobApplications(userId, query)
  }

  @Post('job-applications')
  createJobApplication(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.ownerService.createJobApplication(userId, body.organizationId, body)
  }

  @Patch('job-applications/:id/approve')
  approveJobApplication(@Param('id') id: string) {
    return this.ownerService.approveJobApplication(id)
  }

  @Patch('job-applications/:id/reject')
  rejectJobApplication(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.ownerService.rejectJobApplication(id, body.reason)
  }

  @Patch('job-applications/:id/status')
  updateJobApplicationStatus(
    @Param('id') id: string,
    @CurrentUser('id') reviewerId: string,
    @Body() body: any,
  ) {
    return this.ownerService.updateJobApplicationStatus(id, reviewerId, body)
  }

  // ── Employees ──────────────────────────────────────────────────────────────

  @Get('employees')
  getEmployees(
    @CurrentUser('id') userId: string,
    @Query() query: { schoolId?: string; companyOnly?: string; role?: string; search?: string; page?: number; limit?: number },
  ) {
    return this.ownerService.getEmployees(userId, query)
  }

  @Post('employees')
  createEmployee(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.ownerService.createEmployee(userId, body)
  }

  @Patch('employees/:id')
  updateEmployee(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() body: any) {
    return this.ownerService.updateEmployee(userId, id, body)
  }

  @Patch('employees/:id/reset-password')
  resetEmployeePassword(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { newPassword: string },
  ) {
    return this.ownerService.resetEmployeePassword(userId, id, body.newPassword)
  }
}
