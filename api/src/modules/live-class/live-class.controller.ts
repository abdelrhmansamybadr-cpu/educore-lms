import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { LiveClassService } from './live-class.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Role } from '@prisma/client'

const HOST_ROLES: Role[] = [Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL]

@ApiTags('Live Classes')
@ApiBearerAuth()
@Controller('live-classes')
export class LiveClassController {
  constructor(private liveClass: LiveClassService) {}

  @Post()
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Schedule a live class' })
  create(@CurrentUser('id') teacherId: string, @Body() dto: any) {
    return this.liveClass.create(teacherId, dto)
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get live classes for a course' })
  findByCourse(@Param('courseId') courseId: string) {
    return this.liveClass.findByCourse(courseId)
  }

  @Get('course/:courseId/upcoming')
  @ApiOperation({ summary: 'Get upcoming live classes for a course' })
  getUpcoming(@Param('courseId') courseId: string) {
    return this.liveClass.getUpcoming(courseId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get live class details' })
  findOne(@Param('id') id: string) {
    return this.liveClass.findOne(id)
  }

  @Post(':id/end')
  @Roles(Role.TEACHER, Role.SUB_TEACHER)
  @ApiOperation({ summary: 'End live class' })
  end(@Param('id') id: string) {
    return this.liveClass.endClass(id)
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Get LiveKit token to join a live class' })
  join(
    @Param('id') classId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('firstName') firstName: string,
    @CurrentUser('role') role: Role,
  ) {
    const isHost = HOST_ROLES.includes(role)
    return this.liveClass.joinClass(classId, userId, firstName || userId, isHost)
  }
}
