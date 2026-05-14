import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { TicketsService } from './tickets.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { SchoolId } from '../../common/decorators/school.decorator'
import { TicketStatus, TicketPriority, TicketCategory, Role } from '@prisma/client'

@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(private tickets: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a support ticket' })
  create(
    @CurrentUser('id') userId: string,
    @SchoolId() schoolId: string,
    @Body() dto: any,
  ) {
    return this.tickets.create(userId, schoolId, dto)
  }

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.IT_ADMIN, Role.IT_MANAGER, Role.IT_STAFF, Role.SUPPORT_AGENT, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Get all tickets (staff view)' })
  findAll(@SchoolId() schoolId: string, @Query() query: any) {
    return this.tickets.findAll(schoolId, query)
  }

  @Get('my-tickets')
  @ApiOperation({ summary: 'Get current user tickets' })
  myTickets(@CurrentUser('id') userId: string) {
    return this.tickets.findUserTickets(userId)
  }

  @Get('stats')
  @Roles(Role.SCHOOL_ADMIN, Role.IT_ADMIN, Role.IT_MANAGER, Role.IT_STAFF, Role.SUPPORT_AGENT)
  @ApiOperation({ summary: 'Get ticket statistics' })
  getStats(@SchoolId() schoolId: string) {
    return this.tickets.getStats(schoolId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket details' })
  findOne(@Param('id') id: string) {
    return this.tickets.findOne(id)
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.IT_ADMIN, Role.IT_MANAGER, Role.IT_STAFF, Role.SUPPORT_AGENT)
  @ApiOperation({ summary: 'Update ticket status/assignment' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.tickets.update(id, dto)
  }

  @Post(':id/replies')
  @ApiOperation({ summary: 'Add reply to ticket' })
  addReply(
    @Param('id') ticketId: string,
    @CurrentUser('id') authorId: string,
    @Body() dto: any,
  ) {
    return this.tickets.addReply(ticketId, authorId, dto)
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get chat messages for a ticket' })
  getMessages(@Param('id') ticketId: string) {
    return this.tickets.getMessages(ticketId)
  }

  @Post(':id/take')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.IT_STAFF, Role.SUPPORT_AGENT)
  @ApiOperation({ summary: 'IT staff self-assigns a ticket' })
  take(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tickets.update(id, { assigneeId: userId })
  }

  @Post(':id/escalate')
  @Roles(Role.IT_ADMIN, Role.IT_MANAGER, Role.IT_STAFF, Role.SUPPORT_AGENT, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Escalate ticket' })
  escalate(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: any) {
    return this.tickets.update(id, { status: 'ESCALATED' as any, escalatedToId: dto.escalatedToId ?? userId, escalationReason: dto.reason })
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Rate a resolved ticket' })
  rate(@Param('id') id: string, @Body() dto: any) {
    return this.tickets.update(id, { rating: dto.rating, ratingFeedback: dto.feedback })
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a chat message in a ticket' })
  addMessage(
    @Param('id') ticketId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return this.tickets.addMessage(ticketId, userId, dto)
  }
}
