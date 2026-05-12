import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { AnalyticsService } from './analytics.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { SchoolId } from '../../common/decorators/school.decorator'
import { Role } from '@prisma/client'

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get('overview')
  @Roles(Role.SCHOOL_ADMIN, Role.ACADEMIC_DIRECTOR, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'School-level KPIs overview' })
  getOverview(@SchoolId() schoolId: string) {
    return this.analytics.getSchoolOverview(schoolId)
  }

  @Get('attendance')
  @Roles(Role.SCHOOL_ADMIN, Role.ACADEMIC_DIRECTOR, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Attendance trends over time' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getAttendanceTrends(@SchoolId() schoolId: string, @Query('days') days?: string) {
    return this.analytics.getAttendanceTrends(schoolId, days ? +days : 30)
  }

  @Get('grades')
  @Roles(Role.SCHOOL_ADMIN, Role.ACADEMIC_DIRECTOR, Role.VICE_PRINCIPAL, Role.TEACHER, Role.SUB_TEACHER)
  @ApiOperation({ summary: 'Grade distribution' })
  @ApiQuery({ name: 'courseId', required: false })
  getGradeDistribution(@SchoolId() schoolId: string, @Query('courseId') courseId?: string) {
    return this.analytics.getGradeDistribution(schoolId, courseId)
  }

  @Get('engagement')
  @Roles(Role.SCHOOL_ADMIN, Role.ACADEMIC_DIRECTOR, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Course engagement metrics' })
  getCourseEngagement(@SchoolId() schoolId: string) {
    return this.analytics.getCourseEngagement(schoolId)
  }

  @Get('at-risk')
  @Roles(Role.SCHOOL_ADMIN, Role.ACADEMIC_DIRECTOR, Role.VICE_PRINCIPAL, Role.COUNSELOR)
  @ApiOperation({ summary: 'At-risk students list' })
  getAtRisk(@SchoolId() schoolId: string) {
    return this.analytics.getAtRiskStudents(schoolId)
  }
}
