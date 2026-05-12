import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { SuperAdminService } from './super-admin.service'
import { Roles } from '../../common/decorators/roles.decorator'

@ApiTags('super-admin')
@ApiBearerAuth()
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('stats')
  @Roles('SUPER_ADMIN', 'DEVELOPER')
  getStats() {
    return this.superAdminService.getStats()
  }

  @Get('schools')
  @Roles('SUPER_ADMIN', 'DEVELOPER')
  findAllSchools(@Query() query: any) {
    return this.superAdminService.findAllSchools(query)
  }

  @Get('schools/:id')
  @Roles('SUPER_ADMIN', 'DEVELOPER')
  findSchoolById(@Param('id') id: string) {
    return this.superAdminService.findSchoolById(id)
  }

  @Post('schools')
  @Roles('SUPER_ADMIN', 'DEVELOPER')
  createSchool(@Body() body: any) {
    return this.superAdminService.createSchool(body)
  }

  @Patch('schools/:id')
  @Roles('SUPER_ADMIN', 'DEVELOPER')
  updateSchool(@Param('id') id: string, @Body() body: any) {
    return this.superAdminService.updateSchool(id, body)
  }

  @Delete('schools/:id')
  @Roles('SUPER_ADMIN', 'DEVELOPER')
  deleteSchool(@Param('id') id: string) {
    return this.superAdminService.deleteSchool(id)
  }

  @Get('users')
  @Roles('SUPER_ADMIN', 'DEVELOPER')
  findAllUsers(@Query() query: any) {
    return this.superAdminService.findAllUsers(query)
  }

  @Patch('users/:id')
  @Roles('SUPER_ADMIN', 'DEVELOPER')
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.superAdminService.updateUser(id, body)
  }
}
