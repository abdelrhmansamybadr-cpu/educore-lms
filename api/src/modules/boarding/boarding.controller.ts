import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { BoardingService } from './boarding.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { SchoolId } from '../../common/decorators/school.decorator'
import { Role } from '@prisma/client'

@ApiTags('Boarding')
@ApiBearerAuth()
@Controller('boarding')
export class BoardingController {
  constructor(private boarding: BoardingService) {}

  @Get('stats')
  @Roles(Role.SCHOOL_ADMIN, Role.MATRON)
  @ApiOperation({ summary: 'Boarding statistics' })
  getStats(@SchoolId() schoolId: string) {
    return this.boarding.getStats(schoolId)
  }

  @Get('rooms')
  @Roles(Role.SCHOOL_ADMIN, Role.MATRON)
  @ApiOperation({ summary: 'List all boarding rooms' })
  getRooms(@SchoolId() schoolId: string) {
    return this.boarding.getRooms(schoolId)
  }

  @Post('rooms')
  @Roles(Role.SCHOOL_ADMIN, Role.MATRON)
  @ApiOperation({ summary: 'Create a boarding room' })
  createRoom(@SchoolId() schoolId: string, @Body() dto: any) {
    return this.boarding.createRoom(schoolId, dto)
  }

  @Get('rooms/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.MATRON)
  @ApiOperation({ summary: 'Get room details' })
  getRoom(@SchoolId() schoolId: string, @Param('id') id: string) {
    return this.boarding.getRoom(schoolId, id)
  }

  @Patch('rooms/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.MATRON)
  @ApiOperation({ summary: 'Update room' })
  updateRoom(@SchoolId() schoolId: string, @Param('id') id: string, @Body() dto: any) {
    return this.boarding.updateRoom(schoolId, id, dto)
  }

  @Delete('rooms/:id')
  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete a room' })
  deleteRoom(@SchoolId() schoolId: string, @Param('id') id: string) {
    return this.boarding.deleteRoom(schoolId, id)
  }

  @Post('rooms/:id/assign')
  @Roles(Role.SCHOOL_ADMIN, Role.MATRON)
  @ApiOperation({ summary: 'Assign student to room' })
  assignOccupant(@SchoolId() schoolId: string, @Param('id') roomId: string, @Body('userId') userId: string) {
    return this.boarding.assignOccupant(schoolId, roomId, userId)
  }

  @Post('rooms/:id/vacate')
  @Roles(Role.SCHOOL_ADMIN, Role.MATRON)
  @ApiOperation({ summary: 'Vacate student from room' })
  vacateOccupant(@SchoolId() schoolId: string, @Param('id') roomId: string, @Body('userId') userId: string) {
    return this.boarding.vacateOccupant(schoolId, roomId, userId)
  }

  @Get('my-room')
  @ApiOperation({ summary: 'Get my assigned room (student)' })
  getMyRoom(@CurrentUser('id') userId: string) {
    return this.boarding.getMyRoom(userId)
  }
}
