import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { TransportService } from './transport.service'
import { SchoolId } from '../../common/decorators/school.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'

@ApiTags('Transport')
@ApiBearerAuth()
@Controller('transport')
export class TransportController {
  constructor(private transport: TransportService) {}

  @Get('stats')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.TRANSPORT_MANAGER)
  getStats(@SchoolId() schoolId: string) {
    return this.transport.getStats(schoolId)
  }

  @Get('my-route')
  getMyRoute(@CurrentUser('id') userId: string) {
    return this.transport.getMyRoute(userId)
  }

  @Get('routes')
  getRoutes(@SchoolId() schoolId: string) {
    return this.transport.getRoutes(schoolId)
  }

  @Get('routes/:id')
  getRoute(@SchoolId() schoolId: string, @Param('id') id: string) {
    return this.transport.getRoute(schoolId, id)
  }

  @Post('routes')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.TRANSPORT_MANAGER)
  createRoute(@SchoolId() schoolId: string, @Body() dto: any) {
    return this.transport.createRoute(schoolId, dto)
  }

  @Patch('routes/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.TRANSPORT_MANAGER)
  updateRoute(@SchoolId() schoolId: string, @Param('id') id: string, @Body() dto: any) {
    return this.transport.updateRoute(schoolId, id, dto)
  }

  @Delete('routes/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  deleteRoute(@SchoolId() schoolId: string, @Param('id') id: string) {
    return this.transport.deleteRoute(schoolId, id)
  }

  @Post('routes/:id/stops')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.TRANSPORT_MANAGER)
  addStop(@Param('id') routeId: string, @SchoolId() schoolId: string, @Body() dto: any) {
    return this.transport.addStop(routeId, schoolId, dto)
  }

  @Patch('stops/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.TRANSPORT_MANAGER)
  updateStop(@Param('id') id: string, @Body() dto: any) {
    return this.transport.updateStop(id, dto)
  }

  @Delete('stops/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.TRANSPORT_MANAGER)
  deleteStop(@Param('id') id: string) {
    return this.transport.deleteStop(id)
  }

  @Post('assignments')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.TRANSPORT_MANAGER)
  assignStudent(@Body() body: { routeId: string; studentId: string; stopId?: string }) {
    return this.transport.assignStudent(body.routeId, body.studentId, body.stopId)
  }

  @Get('assignments')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.TRANSPORT_MANAGER)
  getAssignments(@SchoolId() schoolId: string, @Query('routeId') routeId?: string) {
    return this.transport.getAssignments(schoolId, routeId)
  }

  @Delete('assignments/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.TRANSPORT_MANAGER)
  removeAssignment(@Param('id') id: string) {
    return this.transport.removeAssignment(id)
  }

  // ── Live GPS Tracking ─────────────────────────────────────────────────────────

  @Post('location')
  @Roles(Role.TRANSPORT_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  updateLocation(
    @CurrentUser('id') driverId: string,
    @Body() body: { routeId: string; latitude: number; longitude: number; speed?: number },
  ) {
    return this.transport.updateLocation(body.routeId, driverId, body.latitude, body.longitude, body.speed)
  }

  @Get('location/:routeId')
  getLiveLocation(@Param('routeId') routeId: string) {
    return this.transport.getLiveLocation(routeId)
  }

  @Get('live')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.TRANSPORT_MANAGER)
  getAllLiveLocations(@SchoolId() schoolId: string) {
    return this.transport.getAllLiveLocations(schoolId)
  }

  @ApiOperation({ summary: 'Get current API health status' })
  @Get('health')
  health() {
    return { status: 'ok' }
  }
}
