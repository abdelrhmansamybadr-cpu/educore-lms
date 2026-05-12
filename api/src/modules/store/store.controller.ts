import {
  Controller, Get, Post, Patch, Body, Param, Query, ForbiddenException,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { StoreService } from './store.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'

function requireSchool(schoolId: string | null): string {
  if (!schoolId) throw new ForbiddenException('Your account is not associated with a school. Contact your admin.')
  return schoolId
}

const STORE_ADMIN_ROLES = [
  Role.SCHOOL_ADMIN, Role.STORE_MANAGER, Role.IT_ADMIN, Role.VICE_PRINCIPAL,
  Role.FINANCE_OFFICER, Role.SUPER_ADMIN,
] as const

// All roles that can browse and request items from store (everyone in the school)
const ALL_SCHOOL_ROLES = [
  Role.SUPER_ADMIN, Role.DEVELOPER,
  Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR, Role.DEPARTMENT_HEAD,
  Role.TEACHER, Role.SUB_TEACHER, Role.COUNSELOR, Role.LIBRARIAN, Role.NURSE,
  Role.FINANCE_OFFICER, Role.HR_MANAGER, Role.STORE_MANAGER, Role.CANTEEN_MANAGER,
  Role.IT_ADMIN, Role.TRANSPORT_MANAGER, Role.RECEPTIONIST, Role.ADMISSION_OFFICER,
  Role.MATRON, Role.EVENT_COORDINATOR, Role.SUPPORT_AGENT, Role.ACTIVITIES_COORDINATOR,
  Role.STUDENT, Role.PARENT,
  'REQUISITIONS_MANAGER' as any,
] as const

@ApiTags('Store')
@ApiBearerAuth()
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('stats')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER, Role.IT_ADMIN)
  @ApiOperation({ summary: 'Store inventory stats' })
  getStats(@CurrentUser('schoolId') schoolId: string) {
    return this.storeService.getStats(requireSchool(schoolId))
  }

  // ── Item Requests ────────────────────────────────────────────────────────────

  @Get('requests')
  @Roles(...ALL_SCHOOL_ROLES)
  @ApiOperation({ summary: 'List store item requests (admin: all, employee: own). Pass ?mine=true to always return only own requests.' })
  getItemRequests(
    @CurrentUser('id') userId: string,
    @CurrentUser('schoolId') schoolId: string,
    @CurrentUser('role') role: string,
    @Query('mine') mine?: string,
  ) {
    const adminRoles = new Set(['SCHOOL_ADMIN', 'STORE_MANAGER', 'IT_ADMIN', 'VICE_PRINCIPAL', 'FINANCE_OFFICER', 'SUPER_ADMIN', 'DEVELOPER'])
    // mine=true forces own-only even for admins (used for personal "My Requests" tab)
    const isAdmin = mine !== 'true' && adminRoles.has(role)
    return this.storeService.getItemRequests(requireSchool(schoolId), userId, isAdmin)
  }

  @Post('requests')
  @Roles(...ALL_SCHOOL_ROLES)
  @ApiOperation({ summary: 'Create a store item request' })
  createItemRequest(
    @CurrentUser('id') userId: string,
    @CurrentUser('schoolId') schoolId: string,
    @Body() body: { itemId: string; quantity: number; reason?: string },
  ) {
    return this.storeService.createItemRequest(userId, requireSchool(schoolId), body)
  }

  @Patch('requests/:id/approve')
  @Roles(...STORE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Approve a store item request' })
  approveItemRequest(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { notes?: string },
  ) {
    return this.storeService.approveItemRequest(id, adminId, body.notes)
  }

  @Patch('requests/:id/reject')
  @Roles(...STORE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Reject a store item request' })
  rejectItemRequest(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { notes: string },
  ) {
    return this.storeService.rejectItemRequest(id, adminId, body.notes)
  }

  @Patch('requests/:id/collect')
  @Roles(...STORE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Mark item as collected by employee (deducts stock)' })
  collectItemRequest(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.storeService.collectItemRequest(id, adminId)
  }

  @Get('requests/employees')
  @Roles(...STORE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Store admin: see all employees and what they requested' })
  getEmployeeRequestSummary(@CurrentUser('schoolId') schoolId: string) {
    return this.storeService.getEmployeeRequestSummary(requireSchool(schoolId))
  }

  @Get('items')
  @Roles(...ALL_SCHOOL_ROLES)
  @ApiOperation({ summary: 'List all inventory items' })
  getItems(
    @CurrentUser('schoolId') schoolId: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.storeService.getItems(requireSchool(schoolId), { category, search, lowStock: lowStock === 'true' })
  }

  @Get('items/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER, Role.IT_ADMIN)
  @ApiOperation({ summary: 'Get item details with movement history' })
  getItem(@CurrentUser('schoolId') schoolId: string, @Param('id') id: string) {
    return this.storeService.getItemById(requireSchool(schoolId), id)
  }

  @Post('items')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER)
  @ApiOperation({ summary: 'Create inventory item' })
  createItem(@CurrentUser('schoolId') schoolId: string, @Body() body: any) {
    return this.storeService.createItem(requireSchool(schoolId), body)
  }

  @Patch('items/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER)
  @ApiOperation({ summary: 'Update inventory item' })
  updateItem(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.storeService.updateItem(requireSchool(schoolId), id, body)
  }

  @Post('items/:id/adjust')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER)
  @ApiOperation({ summary: 'Adjust stock (IN / OUT / ADJUSTMENT)' })
  adjustStock(
    @CurrentUser('schoolId') schoolId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { type: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number; reason?: string },
  ) {
    return this.storeService.adjustStock(requireSchool(schoolId), id, userId, body.type, body.quantity, body.reason)
  }

  @Get('movements')
  @Roles(Role.SCHOOL_ADMIN, Role.STORE_MANAGER)
  @ApiOperation({ summary: 'Stock movement history' })
  getMovements(
    @CurrentUser('schoolId') schoolId: string,
    @Query('itemId') itemId?: string,
  ) {
    return this.storeService.getMovements(requireSchool(schoolId), itemId)
  }
}
