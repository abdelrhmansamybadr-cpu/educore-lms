import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { EventsService } from './events.service'
import { SchoolId } from '../../common/decorators/school.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private events: EventsService) {}

  @Get()
  getEvents(
    @SchoolId() schoolId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: string,
  ) {
    return this.events.getEvents(schoolId, from, to, type)
  }

  @Get('upcoming')
  getUpcoming(@SchoolId() schoolId: string) {
    return this.events.getUpcoming(schoolId)
  }

  @Get('stats')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.VICE_PRINCIPAL)
  getEventStats(@SchoolId() schoolId: string) {
    return this.events.getEventStats(schoolId)
  }

  @Get('my-registrations')
  getMyRegistrations(@Req() req: any) {
    return this.events.getMyRegistrations(req.user.id)
  }

  @Get(':id')
  getEvent(@SchoolId() schoolId: string, @Param('id') id: string) {
    return this.events.getEvent(schoolId, id)
  }

  @Get(':id/registrations')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR)
  getRegistrations(@SchoolId() schoolId: string, @Param('id') id: string) {
    return this.events.getRegistrations(schoolId, id)
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR, Role.EVENT_COORDINATOR)
  createEvent(@SchoolId() schoolId: string, @Body() dto: any) {
    return this.events.createEvent(schoolId, dto)
  }

  @Post(':id/register')
  registerForEvent(@SchoolId() schoolId: string, @Param('id') id: string, @Req() req: any) {
    return this.events.registerForEvent(id, req.user.id, schoolId)
  }

  @Post(':id/attendance')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.EVENT_COORDINATOR)
  markAttendance(@Param('id') eventId: string, @Body() body: { userId: string; attended: boolean }) {
    return this.events.markAttendance(eventId, body.userId, body.attended)
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR, Role.EVENT_COORDINATOR)
  updateEvent(@SchoolId() schoolId: string, @Param('id') id: string, @Body() dto: any) {
    return this.events.updateEvent(schoolId, id, dto)
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  deleteEvent(@SchoolId() schoolId: string, @Param('id') id: string) {
    return this.events.deleteEvent(schoolId, id)
  }

  @Delete(':id/register')
  cancelRegistration(@Param('id') eventId: string, @Req() req: any) {
    return this.events.cancelRegistration(eventId, req.user.id)
  }
}
