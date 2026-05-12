import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { ReceptionistService } from './receptionist.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { SchoolId } from '../../common/decorators/school.decorator'
import { Role } from '@prisma/client'

@ApiTags('Receptionist')
@ApiBearerAuth()
@Controller('receptionist')
export class ReceptionistController {
  constructor(private receptionist: ReceptionistService) {}

  @Get('stats')
  @Roles(Role.RECEPTIONIST, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Today visitor stats' })
  getStats(@SchoolId() schoolId: string) {
    return this.receptionist.getStats(schoolId)
  }

  @Get('visitors')
  @Roles(Role.RECEPTIONIST, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'List visitors (optionally filter by date)' })
  getVisitors(@SchoolId() schoolId: string, @Query('date') date?: string) {
    return this.receptionist.getVisitors(schoolId, date)
  }

  @Post('visitors')
  @Roles(Role.RECEPTIONIST, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Check in a visitor' })
  checkIn(@SchoolId() schoolId: string, @Body() dto: any) {
    return this.receptionist.checkIn(schoolId, dto)
  }

  @Patch('visitors/:id/checkout')
  @Roles(Role.RECEPTIONIST, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Check out a visitor' })
  checkOut(@SchoolId() schoolId: string, @Param('id') id: string) {
    return this.receptionist.checkOut(schoolId, id)
  }
}
