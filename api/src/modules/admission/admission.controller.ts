import {
  Controller, Get, Post, Patch, Body, Param, Query,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AdmissionService } from './admission.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'

@ApiTags('Admission')
@ApiBearerAuth()
@Controller('admission')
export class AdmissionController {
  constructor(private readonly admissionService: AdmissionService) {}

  @Get('stats')
  @Roles(Role.SCHOOL_ADMIN, Role.ADMISSION_OFFICER, Role.VICE_PRINCIPAL, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Admission pipeline stats' })
  getStats(@CurrentUser('schoolId') schoolId: string) {
    return this.admissionService.getStats(schoolId)
  }

  @Get('applications')
  @Roles(Role.SCHOOL_ADMIN, Role.ADMISSION_OFFICER, Role.VICE_PRINCIPAL, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'List applications' })
  getApplications(
    @CurrentUser('schoolId') schoolId: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('grade') grade?: string,
  ) {
    return this.admissionService.getApplications(schoolId, { status, search, grade })
  }

  @Get('applications/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.ADMISSION_OFFICER, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Get application details' })
  getApplication(@CurrentUser('schoolId') schoolId: string, @Param('id') id: string) {
    return this.admissionService.getApplicationById(schoolId, id)
  }

  @Post('applications')
  @Roles(Role.SCHOOL_ADMIN, Role.ADMISSION_OFFICER, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Create new admission application' })
  createApplication(@CurrentUser('schoolId') schoolId: string, @Body() body: any) {
    return this.admissionService.createApplication(schoolId, body)
  }

  @Patch('applications/:id/status')
  @Roles(Role.SCHOOL_ADMIN, Role.ADMISSION_OFFICER, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Update application status' })
  updateStatus(
    @CurrentUser('schoolId') schoolId: string,
    @CurrentUser('id') reviewerId: string,
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ) {
    return this.admissionService.updateStatus(schoolId, id, reviewerId, status, notes)
  }
}
