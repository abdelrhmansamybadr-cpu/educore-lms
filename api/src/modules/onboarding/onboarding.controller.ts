import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { OnboardingService } from './onboarding.service'

@ApiTags('Onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private service: OnboardingService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new organization + owner account' })
  register(@Body() body: any) {
    return this.service.registerOrganization(body)
  }

  @Public()
  @Post('school')
  @ApiOperation({ summary: 'Create school under organization' })
  createSchool(@Body() body: any) {
    return this.service.createSchool(body.organizationId, body)
  }

  @Public()
  @Post('school/:schoolId/structure')
  @ApiOperation({ summary: 'Configure grade levels and departments' })
  structure(@Param('schoolId') schoolId: string, @Body() body: any) {
    return this.service.configureStructure(schoolId, body)
  }

  @Public()
  @Post('school/:schoolId/academic-year')
  @ApiOperation({ summary: 'Configure academic year and terms' })
  academicYear(@Param('schoolId') schoolId: string, @Body() body: any) {
    return this.service.configureAcademicYear(schoolId, body)
  }

  @Public()
  @Post('school/:schoolId/curriculum')
  @ApiOperation({ summary: 'Apply curriculum config and enable modules' })
  curriculum(@Param('schoolId') schoolId: string, @Body() body: any) {
    return this.service.applyCurriculumConfig(schoolId, body)
  }

  @Public()
  @Post('school/:schoolId/complete')
  @ApiOperation({ summary: 'Complete onboarding — create school admin' })
  complete(@Param('schoolId') schoolId: string, @Body() body: any) {
    return this.service.complete(schoolId, body)
  }

  @Public()
  @Get('school/:schoolId/state')
  @ApiOperation({ summary: 'Get current onboarding state' })
  getState(@Param('schoolId') schoolId: string) {
    return this.service.getState(schoolId)
  }

  @Public()
  @Get('curriculum/:type/defaults')
  @ApiOperation({ summary: 'Get curriculum-specific defaults (modules, grading)' })
  getCurriculumDefaults(@Param('type') type: string) {
    return this.service.getCurriculumDefaults(type.toUpperCase())
  }
}
