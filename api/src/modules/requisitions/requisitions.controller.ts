import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { RequisitionsService } from './requisitions.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Role } from '@prisma/client'

// All school staff roles that can submit or view requisitions
const ALL_STAFF_ROLES = [
  Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR,
  Role.DEPARTMENT_HEAD, Role.TEACHER, Role.SUB_TEACHER, Role.COUNSELOR,
  Role.LIBRARIAN, Role.NURSE, Role.FINANCE_OFFICER, Role.HR_MANAGER,
  Role.STORE_MANAGER, Role.CANTEEN_MANAGER, Role.IT_ADMIN,
  Role.TRANSPORT_MANAGER, Role.RECEPTIONIST, Role.ADMISSION_OFFICER,
  Role.MATRON, Role.EVENT_COORDINATOR, Role.SUPPORT_AGENT,
  Role.ACTIVITIES_COORDINATOR,
  'REQUISITIONS_MANAGER' as any,
]

@ApiTags('Requisitions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('requisitions')
export class RequisitionsController {
  constructor(private readonly service: RequisitionsService) {}

  /**
   * REQUISITIONS_MANAGER → all school requisitions
   * All other staff     → only their own submissions
   */
  @Get()
  @Roles(...ALL_STAFF_ROLES)
  getRequisitions(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @CurrentUser('schoolId') schoolId: string,
    @Query() query: { status?: string; page?: number; limit?: number },
  ) {
    // These roles see all school requisitions (to take action)
    const SCHOOL_WIDE_ROLES = new Set(['REQUISITIONS_MANAGER', 'FINANCE_OFFICER', 'SCHOOL_ADMIN', 'VICE_PRINCIPAL', 'ACADEMIC_DIRECTOR'])
    if (SCHOOL_WIDE_ROLES.has(role)) {
      return this.service.getSchoolRequisitions(schoolId, query)
    }
    return this.service.getMyRequisitions(userId, schoolId)
  }

  /**
   * Any school employee can submit a purchase requisition (no prices — just items needed)
   */
  @Post()
  @Roles(...ALL_STAFF_ROLES)
  createRequisition(
    @CurrentUser('id') userId: string,
    @CurrentUser('schoolId') schoolId: string,
    @Body() body: {
      title: string
      description?: string
      category: string
      items: { name: string; qty: number; unit: string }[]
      urgency?: string
      deliveryDate?: string
    },
  ) {
    return this.service.createRequisition(userId, schoolId, body)
  }
}
