import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { HealthService } from './health.service'
import { SchoolId } from '../../common/decorators/school.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'

@ApiTags('Health')
@ApiBearerAuth()
@Controller('health')
export class HealthController {
  constructor(private health: HealthService) {}

  @Get('dashboard')
  @Roles(Role.NURSE, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  getDashboard(@SchoolId() schoolId: string) {
    return this.health.getDashboardStats(schoolId)
  }

  @Get('record/:studentId')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.NURSE, Role.PARENT)
  getRecord(@Param('studentId') studentId: string) {
    return this.health.getHealthRecord(studentId)
  }

  @Patch('record/:studentId')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.NURSE)
  updateRecord(@Param('studentId') studentId: string, @Body() dto: any) {
    return this.health.upsertHealthRecord(studentId, dto)
  }

  @Post('visits')
  @Roles(Role.NURSE, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  logVisit(@CurrentUser('id') nurseId: string, @Body() dto: any) {
    const { studentId, ...rest } = dto
    return this.health.logVisit(studentId, nurseId, rest)
  }

  @Get('visits')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.NURSE)
  getVisits(
    @SchoolId() schoolId: string,
    @Query('studentId') studentId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sentHome') sentHome?: string,
  ) {
    return this.health.getVisits(schoolId, studentId, from, to, sentHome)
  }

  @Get('visits/:id')
  @Roles(Role.NURSE, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  getVisit(@Param('id') id: string) {
    return this.health.getVisit(id)
  }

  @Patch('visits/:id')
  @Roles(Role.NURSE, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  updateVisit(@Param('id') id: string, @Body() dto: any) {
    return this.health.updateVisit(id, dto)
  }

  @Post('visits/:id/notify-parent')
  @Roles(Role.NURSE, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  notifyParent(@Param('id') id: string) {
    return this.health.notifyParent(id)
  }

  @Get('my-visits')
  @Roles(Role.STUDENT)
  getMyVisits(@CurrentUser('id') studentId: string) {
    return this.health.getMyVisits(studentId)
  }

  @Post('mental-health/check-in')
  @Roles(Role.STUDENT)
  submitCheckIn(@CurrentUser('id') studentId: string, @Body() dto: any) {
    return this.health.submitCheckIn(studentId, dto)
  }

  @Get('mental-health')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.NURSE, Role.COUNSELOR)
  getCheckIns(@SchoolId() schoolId: string, @Query('flagged') flagged?: string) {
    return this.health.getCheckIns(schoolId, flagged === 'true')
  }

  @Get('mental-health/my-check-ins')
  @Roles(Role.STUDENT)
  getMyCheckIns(@CurrentUser('id') studentId: string) {
    return this.health.getMyCheckIns(studentId)
  }
}
