import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { GamificationService } from './gamification.service'
import { SchoolId } from '../../common/decorators/school.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'

@ApiTags('Gamification')
@ApiBearerAuth()
@Controller('gamification')
export class GamificationController {
  constructor(private gamification: GamificationService) {}

  @Get('badges')
  @ApiOperation({ summary: 'Get all school badges' })
  getBadges(@SchoolId() schoolId: string) {
    return this.gamification.getBadges(schoolId)
  }

  @Post('badges')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new badge' })
  createBadge(@SchoolId() schoolId: string, @Body() dto: any) {
    return this.gamification.createBadge(schoolId, dto)
  }

  @Post('badges/:id/award/:userId')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Award a badge to a student' })
  awardBadge(@Param('id') badgeId: string, @Param('userId') userId: string) {
    return this.gamification.awardBadge(userId, badgeId)
  }

  @Get('users/:userId/badges')
  @ApiOperation({ summary: 'Get badges for a user' })
  getUserBadges(@Param('userId') userId: string) {
    return this.gamification.getUserBadges(userId)
  }

  @Get('my-badges')
  @ApiOperation({ summary: 'Get my badges' })
  getMyBadges(@CurrentUser('id') userId: string) {
    return this.gamification.getUserBadges(userId)
  }

  @Post('points/add')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Award points to a student' })
  addPoints(@Body() body: { userId: string; amount: number; reason: string }) {
    return this.gamification.addPoints(body.userId, body.amount, body.reason)
  }

  @Get('users/:userId/points')
  @ApiOperation({ summary: 'Get points for a user' })
  getUserPoints(@Param('userId') userId: string) {
    return this.gamification.getUserPoints(userId)
  }

  @Get('my-points')
  @ApiOperation({ summary: 'Get my points and history' })
  getMyPoints(@CurrentUser('id') userId: string) {
    return this.gamification.getUserPoints(userId)
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get school leaderboard' })
  getLeaderboard(@SchoolId() schoolId: string, @Query('limit') limit?: string) {
    return this.gamification.getLeaderboard(schoolId, limit ? Number(limit) : 20)
  }
}
