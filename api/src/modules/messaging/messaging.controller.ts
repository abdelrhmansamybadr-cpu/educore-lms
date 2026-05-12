import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { MessagingService } from './messaging.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { SchoolId } from '../../common/decorators/school.decorator'
import { Role } from '@prisma/client'
import { IsString, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

class StartConversationDto {
  @ApiProperty() @IsString() otherUserId: string
}

class SendMessageDto {
  @ApiProperty() @IsString() conversationId: string
  @ApiProperty() @IsString() content: string
  @ApiPropertyOptional() @IsOptional() @IsString() contentType?: string
  @ApiPropertyOptional() @IsOptional() @IsString() fileUrl?: string
}

class CreateAnnouncementDto {
  @ApiProperty() @IsString() title: string
  @ApiPropertyOptional() @IsOptional() @IsString() titleAr?: string
  @ApiProperty() @IsString() content: string
  @ApiPropertyOptional() @IsOptional() @IsString() contentAr?: string
  @ApiPropertyOptional() @IsOptional() @IsString() audience?: string
  @ApiPropertyOptional() @IsOptional() @IsString() audienceId?: string
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string
}

@ApiTags('Messaging')
@ApiBearerAuth()
@Controller('messaging')
export class MessagingController {
  constructor(private messaging: MessagingService) {}

  @Post('conversations/start')
  @ApiOperation({ summary: 'Get or create direct conversation' })
  startConversation(
    @CurrentUser('id') userId: string,
    @SchoolId() schoolId: string,
    @Body() dto: StartConversationDto,
  ) {
    return this.messaging.getOrCreateConversation(userId, dto.otherUserId, schoolId)
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Get all conversations' })
  getInbox(@CurrentUser('id') userId: string) {
    return this.messaging.getInbox(userId)
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  getMessages(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
  ) {
    return this.messaging.getMessages(conversationId, userId, page)
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  sendMessage(@CurrentUser('id') senderId: string, @Body() dto: SendMessageDto) {
    return this.messaging.sendMessage(senderId, dto.conversationId, dto.content, dto.contentType, dto.fileUrl)
  }

  // ── Announcements ─────────────────────────────────────────────────────────────

  @Post('announcements')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR, Role.TEACHER)
  @ApiOperation({ summary: 'Post a school announcement' })
  createAnnouncement(
    @CurrentUser('id') authorId: string,
    @SchoolId() schoolId: string,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.messaging.createAnnouncement({ ...dto, authorId, schoolId })
  }

  @Get('announcements')
  @ApiOperation({ summary: 'Get school announcements' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  getAnnouncements(@SchoolId() schoolId: string, @Query('page') page?: number) {
    return this.messaging.getAnnouncements(schoolId, page)
  }

  @Delete('announcements/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Delete announcement' })
  deleteAnnouncement(@Param('id') id: string) {
    return this.messaging.deleteAnnouncement(id)
  }
}
