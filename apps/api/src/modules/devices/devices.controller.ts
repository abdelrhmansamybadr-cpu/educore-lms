import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { DevicesService } from './devices.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { SchoolId } from '../../common/decorators/school.decorator'
import { Role } from '@prisma/client'

@ApiTags('Devices')
@ApiBearerAuth()
@Controller('devices')
export class DevicesController {
  constructor(private devices: DevicesService) {}

  @Post()
  @Roles(Role.IT_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Register a new device' })
  register(@SchoolId() schoolId: string, @Body() dto: any) {
    return this.devices.register(schoolId, dto)
  }

  @Get()
  @Roles(Role.IT_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get all devices' })
  findAll(@SchoolId() schoolId: string, @Query() query: any) {
    return this.devices.findAll(schoolId, query)
  }

  @Get('stats')
  @Roles(Role.IT_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Device inventory statistics' })
  getStats(@SchoolId() schoolId: string) {
    return this.devices.getStats(schoolId)
  }

  @Get(':id')
  @Roles(Role.IT_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get device details' })
  findOne(@Param('id') id: string) {
    return this.devices.findOne(id)
  }

  @Patch(':id')
  @Roles(Role.IT_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update device' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.devices.update(id, dto)
  }

  @Patch(':id/block')
  @Roles(Role.IT_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Block device (restrict access)' })
  block(@Param('id') id: string) {
    return this.devices.blockDevice(id, true)
  }

  @Patch(':id/unblock')
  @Roles(Role.IT_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Unblock device' })
  unblock(@Param('id') id: string) {
    return this.devices.blockDevice(id, false)
  }

  @Patch(':id/assign/:studentId')
  @Roles(Role.IT_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Assign device to student' })
  assign(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.devices.assignToStudent(id, studentId)
  }

  @Patch(':id/unassign')
  @Roles(Role.IT_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Unassign device from user' })
  unassign(@Param('id') id: string) {
    return this.devices.unassign(id)
  }

  @Delete(':id')
  @Roles(Role.IT_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Remove device from inventory' })
  remove(@Param('id') id: string) {
    return this.devices.remove(id)
  }

  @Get(':id/maintenance')
  @Roles(Role.IT_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get maintenance logs for a device' })
  getMaintenanceLogs(@Param('id') id: string) {
    return this.devices.getMaintenanceLogs(id)
  }

  @Post(':id/maintenance')
  @Roles(Role.IT_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Add maintenance log' })
  addMaintenanceLog(@Param('id') id: string, @Body() dto: any) {
    return this.devices.addMaintenanceLog(id, dto)
  }

  @Post(':id/checkout')
  @Roles(Role.IT_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Check out device to a user' })
  checkout(@Param('id') id: string, @Body() dto: any) {
    return this.devices.checkout(id, dto.userId, dto.notes)
  }

  @Post(':id/checkin')
  @Roles(Role.IT_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Check in a device (mark returned)' })
  checkin(@Param('id') id: string) {
    return this.devices.checkin(id)
  }

  @Get(':id/checkouts')
  @Roles(Role.IT_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get checkout history for a device' })
  getCheckoutHistory(@Param('id') id: string) {
    return this.devices.getCheckoutHistory(id)
  }

  @Get(':id/current-checkout')
  @Roles(Role.IT_ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get current holder of a device' })
  getCurrentCheckout(@Param('id') id: string) {
    return this.devices.getCurrentCheckout(id)
  }
}
