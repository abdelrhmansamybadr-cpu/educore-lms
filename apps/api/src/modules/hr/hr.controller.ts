import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { HrService } from './hr.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'

@ApiTags('HR')
@ApiBearerAuth()
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('stats')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'HR dashboard stats' })
  getStats(@CurrentUser('schoolId') schoolId: string) {
    return this.hrService.getHrStats(schoolId)
  }

  @Get('staff')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR)
  @ApiOperation({ summary: 'List all staff profiles' })
  getStaff(
    @CurrentUser('schoolId') schoolId: string,
    @Query('department') department?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.hrService.getStaff(schoolId, { department, role, search })
  }

  @Get('staff/me')
  @ApiOperation({ summary: 'Get my staff profile' })
  getMyStaffProfile(@CurrentUser('id') userId: string) {
    return this.hrService.getStaffByUserId(userId)
  }

  @Get('staff/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Get staff profile by ID' })
  getStaffById(@CurrentUser('schoolId') schoolId: string, @Param('id') id: string) {
    return this.hrService.getStaffById(schoolId, id)
  }

  @Post('staff')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Create staff profile for a user' })
  createStaff(@CurrentUser('schoolId') schoolId: string, @Body() body: any) {
    return this.hrService.createStaffProfile(schoolId, body)
  }

  @Patch('staff/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Update staff profile' })
  updateStaff(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.hrService.updateStaffProfile(schoolId, id, body)
  }

  @Get('leaves')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'List leave requests' })
  getLeaves(
    @CurrentUser('schoolId') schoolId: string,
    @Query('status') status?: string,
    @Query('staffId') staffId?: string,
  ) {
    return this.hrService.getLeaveRequests(schoolId, { status, staffId })
  }

  @Post('leaves')
  @ApiOperation({ summary: 'Submit a leave request (staff member)' })
  async requestLeave(@CurrentUser('id') userId: string, @CurrentUser('schoolId') schoolId: string, @Body() body: any) {
    const staffProfile = await this.hrService.getStaffByUserId(userId)
    if (!staffProfile) return { message: 'No staff profile found' }
    return this.hrService.requestLeave(staffProfile.id, schoolId, body)
  }

  @Patch('leaves/:id/approve')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Approve a leave request' })
  approveLeave(
    @CurrentUser('schoolId') schoolId: string,
    @CurrentUser('id') approverId: string,
    @Param('id') id: string,
    @Body('note') note?: string,
  ) {
    return this.hrService.updateLeaveStatus(schoolId, id, approverId, 'APPROVED', note)
  }

  @Patch('leaves/:id/reject')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Reject a leave request' })
  rejectLeave(
    @CurrentUser('schoolId') schoolId: string,
    @CurrentUser('id') approverId: string,
    @Param('id') id: string,
    @Body('note') note?: string,
  ) {
    return this.hrService.updateLeaveStatus(schoolId, id, approverId, 'REJECTED', note)
  }

  @Patch('leaves/:id/cancel')
  @ApiOperation({ summary: 'Cancel my leave request' })
  async cancelLeave(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const staffProfile = await this.hrService.getStaffByUserId(userId)
    if (!staffProfile) return { message: 'No staff profile found' }
    return this.hrService.cancelLeave(staffProfile.id, id)
  }

  @Get('contracts')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'List contracts' })
  getContracts(
    @CurrentUser('schoolId') schoolId: string,
    @Query('status') status?: string,
    @Query('staffId') staffId?: string,
  ) {
    return this.hrService.getContracts(schoolId, { status, staffId })
  }

  @Post('contracts')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Create a contract' })
  createContract(@CurrentUser('schoolId') schoolId: string, @Body() body: any) {
    return this.hrService.createContract(schoolId, body)
  }

  @Patch('contracts/:id/status')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Update contract status' })
  updateContractStatus(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.hrService.updateContractStatus(schoolId, id, status)
  }

  @Get('reviews')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR)
  @ApiOperation({ summary: 'List performance reviews' })
  getReviews(
    @CurrentUser('schoolId') schoolId: string,
    @Query('staffId') staffId?: string,
    @Query('period') period?: string,
  ) {
    return this.hrService.getReviews(schoolId, { staffId, period })
  }

  @Post('reviews')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR)
  @ApiOperation({ summary: 'Create a performance review' })
  createReview(
    @CurrentUser('schoolId') schoolId: string,
    @CurrentUser('id') reviewerId: string,
    @Body() body: any,
  ) {
    return this.hrService.createReview(schoolId, reviewerId, body)
  }
}
