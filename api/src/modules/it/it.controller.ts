import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { ItService } from './it.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { SchoolId } from '../../common/decorators/school.decorator'
import { Role } from '@prisma/client'

@ApiTags('IT')
@ApiBearerAuth()
@Controller('it')
export class ItController {
  constructor(private readonly itService: ItService) {}

  // ── Dashboard ─────────────────────────────────────────────────────────────

  @Get('dashboard')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.IT_STAFF, Role.SUPPORT_AGENT, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'IT dashboard stats and recent tickets' })
  getDashboard(@CurrentUser('role') role: string, @SchoolId() schoolId: string) {
    const scope = ['IT_ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'].includes(role) ? null : schoolId
    return this.itService.getDashboardStats(scope)
  }

  // ── Staff Workload ─────────────────────────────────────────────────────────

  @Get('staff-workload')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'IT staff workload stats' })
  getStaffWorkload(@CurrentUser('role') role: string, @SchoolId() schoolId: string) {
    const scope = ['IT_ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'].includes(role) ? null : schoolId
    return this.itService.getStaffWorkload(scope)
  }

  // ── IT Tickets ────────────────────────────────────────────────────────────

  @Get('tickets')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.IT_STAFF, Role.SUPPORT_AGENT, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List IT tickets with IT-specific filters' })
  getTickets(
    @CurrentUser('role') role: string,
    @SchoolId() schoolId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string,
    @Query('slaBreached') slaBreached?: string,
  ) {
    const scope = ['IT_ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'].includes(role) ? null : schoolId
    return this.itService.getItTickets(scope, {
      status, priority, category, assigneeId, search,
      slaBreached: slaBreached === 'true' ? true : slaBreached === 'false' ? false : undefined,
    })
  }

  @Get('tickets/:id')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.IT_STAFF, Role.SUPPORT_AGENT, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get IT ticket full detail' })
  getTicketDetail(@Param('id') id: string) {
    return this.itService.getItTicketDetail(id)
  }

  @Post('tickets/:id/escalate')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.IT_STAFF, Role.SUPPORT_AGENT)
  @ApiOperation({ summary: 'Escalate ticket to IT Admin' })
  escalate(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
    @Body('escalatedToId') escalatedToId: string,
    @Body('reason') reason: string,
  ) {
    return this.itService.escalateTicket(id, escalatedToId ?? currentUserId, reason)
  }

  @Post('tickets/:id/rate')
  @ApiOperation({ summary: 'Rate a resolved ticket' })
  rateTicket(
    @Param('id') id: string,
    @Body('rating') rating: number,
    @Body('feedback') feedback?: string,
  ) {
    return this.itService.rateTicket(id, rating, feedback)
  }

  // ── Assets ────────────────────────────────────────────────────────────────

  @Get('assets')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.IT_STAFF, Role.SUPPORT_AGENT, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List IT assets' })
  getAssets(
    @CurrentUser('role') role: string,
    @SchoolId() schoolId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('condition') condition?: string,
    @Query('search') search?: string,
  ) {
    const scope = ['IT_ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'].includes(role) ? null : schoolId
    return this.itService.getAssets(scope, { type, status, condition, search })
  }

  @Get('assets/stats')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.IT_STAFF, Role.SUPPORT_AGENT, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Asset statistics' })
  getAssetStats(@CurrentUser('role') role: string, @SchoolId() schoolId: string) {
    const scope = ['IT_ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'].includes(role) ? null : schoolId
    return this.itService.getAssetStats(scope)
  }

  @Get('assets/:id')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.IT_STAFF, Role.SUPPORT_AGENT, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get asset detail with maintenance log' })
  getAsset(@Param('id') id: string) {
    return this.itService.getAssetById(id)
  }

  @Post('assets')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.IT_STAFF, Role.SUPPORT_AGENT)
  @ApiOperation({ summary: 'Create asset' })
  createAsset(@SchoolId() schoolId: string, @Body() body: any) {
    return this.itService.createAsset(schoolId, body)
  }

  @Patch('assets/:id')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.IT_STAFF, Role.SUPPORT_AGENT)
  @ApiOperation({ summary: 'Update asset' })
  updateAsset(@Param('id') id: string, @Body() body: any) {
    return this.itService.updateAsset(id, body)
  }

  @Delete('assets/:id')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Retire asset (soft delete)' })
  deleteAsset(@Param('id') id: string) {
    return this.itService.deleteAsset(id)
  }

  @Post('assets/:id/maintenance')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.IT_STAFF, Role.SUPPORT_AGENT)
  @ApiOperation({ summary: 'Add maintenance record' })
  addMaintenance(
    @Param('id') assetId: string,
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.itService.addMaintenance(assetId, userId, body)
  }

  // ── Staff Analytics ───────────────────────────────────────────────────────

  @Get('staff-analytics')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'IT staff rating analytics and complaint summary' })
  getStaffAnalytics(@CurrentUser('role') role: string, @SchoolId() schoolId: string) {
    const scope = ['IT_ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'].includes(role) ? null : schoolId
    return this.itService.getStaffAnalytics(scope)
  }

  // ── Complaints ────────────────────────────────────────────────────────────

  @Get('complaints')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List IT staff complaints' })
  getComplaints(
    @CurrentUser('role') role: string,
    @SchoolId() schoolId: string,
    @Query('status') status?: string,
    @Query('againstId') againstId?: string,
  ) {
    const scope = ['IT_ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'].includes(role) ? null : schoolId
    return this.itService.getComplaints(scope, { status, againstId })
  }

  @Get('complaints/:id')
  @ApiOperation({ summary: 'Get complaint detail with conversation' })
  getComplaint(@Param('id') id: string) {
    return this.itService.getComplaintById(id)
  }

  @Post('complaints')
  @ApiOperation({ summary: 'File a complaint about an IT staff member' })
  createComplaint(
    @CurrentUser('id') userId: string,
    @SchoolId() schoolId: string,
    @Body() body: any,
  ) {
    return this.itService.createComplaint(schoolId, userId, body)
  }

  @Patch('complaints/:id')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update complaint status / IT manager notes' })
  updateComplaint(@Param('id') id: string, @Body() body: any) {
    return this.itService.updateComplaint(id, body)
  }

  @Post('complaints/:id/messages')
  @ApiOperation({ summary: 'Add message to complaint thread' })
  addComplaintMessage(
    @Param('id') complaintId: string,
    @CurrentUser('id') userId: string,
    @Body('content') content: string,
  ) {
    return this.itService.addComplaintMessage(complaintId, userId, content)
  }

  @Post('complaints/:id/escalate')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Escalate complaint to HR Manager' })
  escalateComplaint(@Param('id') id: string, @Body('itManagerNotes') notes?: string) {
    return this.itService.escalateComplaintToHr(id, notes)
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  @Get('settings')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get IT settings' })
  getSettings(@SchoolId() schoolId: string) {
    return this.itService.getSettings(schoolId)
  }

  @Patch('settings')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update IT settings' })
  updateSettings(@SchoolId() schoolId: string, @Body() body: any) {
    return this.itService.upsertSettings(schoolId, body)
  }
}
