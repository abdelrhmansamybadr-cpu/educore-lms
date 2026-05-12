import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { GradebookService } from './gradebook.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { SchoolId } from '../../common/decorators/school.decorator'
import { Role } from '@prisma/client'
import { IsString, IsNumber, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

class SetGradeDto {
  @ApiProperty() @IsString() studentId: string
  @ApiProperty() @IsString() courseId: string
  @ApiPropertyOptional() @IsOptional() @IsString() assignmentId?: string
  @ApiPropertyOptional() @IsOptional() @IsString() quizId?: string
  @ApiProperty() @IsNumber() points: number
  @ApiProperty() @IsNumber() maxPoints: number
  @ApiPropertyOptional() @IsOptional() @IsString() feedback?: string
}

class BulkGradeDto {
  @ApiProperty({ type: [SetGradeDto] }) grades: SetGradeDto[]
}

@ApiTags('Gradebook')
@ApiBearerAuth()
@Controller('gradebook')
export class GradebookController {
  constructor(private gradebook: GradebookService) {}

  @Post('grade')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Set/add a grade for a student' })
  setGrade(@CurrentUser('id') gradedById: string, @Body() dto: SetGradeDto) {
    return this.gradebook.setGrade({ ...dto, gradedById })
  }

  @Get('course/:courseId')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN, Role.ACADEMIC_DIRECTOR)
  @ApiOperation({ summary: 'Get full gradebook for a course' })
  getCourseGradebook(@Param('courseId') courseId: string) {
    return this.gradebook.getCourseGradebook(courseId)
  }

  @Get('student/:studentId')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN, Role.COUNSELOR)
  @ApiOperation({ summary: 'Get all grades for a student' })
  @ApiQuery({ name: 'courseId', required: false })
  getStudentGrades(@Param('studentId') studentId: string, @Query('courseId') courseId?: string) {
    return this.gradebook.getStudentGrades(studentId, courseId)
  }

  @Get('my-grades')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get current student grades' })
  @ApiQuery({ name: 'courseId', required: false })
  myGrades(@CurrentUser('id') studentId: string, @Query('courseId') courseId?: string) {
    return this.gradebook.getStudentGrades(studentId, courseId)
  }

  @Get('parent/children')
  @Roles(Role.PARENT)
  @ApiOperation({ summary: 'Get grades for all children of current parent' })
  getChildrenGrades(@CurrentUser('id') parentId: string) {
    return this.gradebook.getParentChildGrades(parentId)
  }

  @Post('grades/bulk')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Bulk set grades for multiple students' })
  bulkSetGrades(@CurrentUser('id') gradedById: string, @Body() dto: BulkGradeDto) {
    return this.gradebook.bulkSetGrades(dto.grades, gradedById)
  }

  @Get('my-gpa')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get current student GPA' })
  myGpa(@CurrentUser('id') studentId: string) {
    return this.gradebook.getStudentGPA(studentId)
  }

  @Get('gpa/:studentId')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN, Role.ACADEMIC_DIRECTOR, Role.COUNSELOR)
  @ApiOperation({ summary: 'Get GPA for a specific student' })
  getGpa(@Param('studentId') studentId: string) {
    return this.gradebook.getStudentGPA(studentId)
  }

  @Get('analytics/:courseId')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN, Role.ACADEMIC_DIRECTOR)
  @ApiOperation({ summary: 'Get grade distribution analytics for a course' })
  getCourseAnalytics(@Param('courseId') courseId: string) {
    return this.gradebook.getCourseGradeAnalytics(courseId)
  }

  @Get('report-card/:studentId')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN, Role.ACADEMIC_DIRECTOR, Role.COUNSELOR)
  @ApiOperation({ summary: 'Get report card for a student' })
  getReportCard(@Param('studentId') studentId: string) {
    return this.gradebook.getReportCard(studentId)
  }

  @Get('my-report-card')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get own report card' })
  myReportCard(@CurrentUser('id') studentId: string) {
    return this.gradebook.getReportCard(studentId)
  }

  @Get('school/summary')
  @Roles(Role.SCHOOL_ADMIN, Role.ACADEMIC_DIRECTOR, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Get school-wide grade summary' })
  getSchoolSummary(@SchoolId() schoolId: string) {
    return this.gradebook.getSchoolGradeSummary(schoolId)
  }
}
