import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { AttendanceService } from './attendance.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Role, AttendanceStatus } from '@prisma/client'
import { IsString, IsEnum, IsOptional, IsArray, IsNumber, ValidateNested } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

class MarkAttendanceDto {
  @ApiProperty() @IsString() studentId: string
  @ApiProperty() @IsString() date: string
  @ApiProperty({ enum: AttendanceStatus }) @IsEnum(AttendanceStatus) status: AttendanceStatus
  @ApiPropertyOptional() @IsOptional() @IsString() courseId?: string
  @ApiPropertyOptional() @IsOptional() @IsNumber() period?: number
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string
}

class BulkAttendanceDto {
  @ApiProperty({ type: [MarkAttendanceDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => MarkAttendanceDto) records: MarkAttendanceDto[]
  @ApiProperty() @IsString() date: string
  @ApiPropertyOptional() @IsOptional() @IsString() courseId?: string
}

class QrSessionDto {
  @ApiProperty() @IsString() courseId: string
  @ApiPropertyOptional() @IsOptional() @IsNumber() expiryMinutes?: number
}

class QrScanDto {
  @ApiProperty() @IsString() token: string
}

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private attendance: AttendanceService) {}

  @Post('mark')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Mark single student attendance' })
  mark(@Body() dto: MarkAttendanceDto) {
    return this.attendance.markAttendance(dto)
  }

  @Post('bulk')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Bulk mark attendance for a class' })
  bulkMark(@Body() dto: BulkAttendanceDto) {
    return this.attendance.bulkMarkAttendance(dto)
  }

  @Post('qr/generate')
  @Roles(Role.TEACHER, Role.SUB_TEACHER)
  @ApiOperation({ summary: 'Generate QR code for attendance session' })
  generateQr(@CurrentUser('id') teacherId: string, @Body() dto: QrSessionDto) {
    return this.attendance.generateQrSession(teacherId, dto.courseId, dto.expiryMinutes)
  }

  @Post('qr/scan')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Mark attendance by scanning QR code' })
  scanQr(@CurrentUser('id') studentId: string, @Body() dto: QrScanDto) {
    return this.attendance.markAttendanceViaQr(studentId, dto.token)
  }

  @Get('course/:courseId/students')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get enrolled students for a course (for attendance taking)' })
  getCourseStudents(@Param('courseId') courseId: string) {
    return this.attendance.getCourseStudents(courseId)
  }

  @Get('course/:courseId')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get attendance records for a course, optionally filtered by date' })
  @ApiQuery({ name: 'date', required: false })
  getCourseAttendance(@Param('courseId') courseId: string, @Query('date') date?: string) {
    return this.attendance.getCourseAttendanceByDate(courseId, date)
  }

  @Get('date/:date')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get attendance records for a specific date' })
  @ApiQuery({ name: 'courseId', required: false })
  getByDate(@Param('date') date: string, @Query('courseId') courseId?: string) {
    return this.attendance.getAttendanceByDate(date, courseId)
  }

  @Get('student/:studentId')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN, Role.PARENT)
  @ApiOperation({ summary: 'Get attendance history for a student' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  getStudentAttendance(
    @Param('studentId') studentId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.attendance.getStudentAttendance(studentId, from, to, courseId)
  }

  @Get('my')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get current student attendance' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  myAttendance(
    @CurrentUser('id') studentId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendance.getStudentAttendance(studentId, from, to)
  }

  @Get('summary')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN, Role.ACADEMIC_DIRECTOR)
  @ApiOperation({ summary: 'Get attendance summary for a course' })
  @ApiQuery({ name: 'courseId', required: true })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  getSummary(
    @Query('courseId') courseId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.attendance.getAttendanceSummary(courseId, from, to)
  }
}
