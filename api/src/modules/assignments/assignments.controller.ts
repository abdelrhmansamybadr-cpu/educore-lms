import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AssignmentsService } from './assignments.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Role } from '@prisma/client'
import {
  CreateAssignmentDto, UpdateAssignmentDto, SubmitAssignmentDto, GradeSubmissionDto,
} from './dto/assignment.dto'

@ApiTags('Assignments')
@ApiBearerAuth()
@Controller('assignments')
export class AssignmentsController {
  constructor(private assignments: AssignmentsService) {}

  @Post()
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create assignment' })
  create(@Body() dto: CreateAssignmentDto) {
    return this.assignments.create(dto)
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all assignments in a course' })
  findByCourse(@Param('courseId') courseId: string) {
    return this.assignments.findByCourse(courseId)
  }

  @Get('pending-grading')
  @Roles(Role.TEACHER, Role.SUB_TEACHER)
  @ApiOperation({ summary: 'Get submissions pending grading' })
  pendingGrading(
    @CurrentUser('id') teacherId: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.assignments.getPendingGrading(teacherId, courseId)
  }

  @Get('my-submissions')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get current student submissions' })
  mySubmissions(
    @CurrentUser('id') studentId: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.assignments.getStudentSubmissions(studentId, courseId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment with all submissions' })
  findOne(@Param('id') id: string) {
    return this.assignments.findOne(id)
  }

  @Patch(':id')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update assignment' })
  update(@Param('id') id: string, @Body() dto: UpdateAssignmentDto) {
    return this.assignments.update(id, dto)
  }

  @Patch(':id/publish')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Toggle assignment publish status' })
  togglePublish(@Param('id') id: string) {
    return this.assignments.togglePublish(id)
  }

  @Delete(':id')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete assignment' })
  remove(@Param('id') id: string) {
    return this.assignments.remove(id)
  }

  @Post(':id/submit')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Submit assignment' })
  submit(
    @Param('id') assignmentId: string,
    @CurrentUser('id') studentId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.assignments.submit(assignmentId, studentId, dto)
  }

  @Patch('submissions/:submissionId/grade')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Grade a submission' })
  grade(
    @Param('submissionId') submissionId: string,
    @CurrentUser('id') graderId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.assignments.gradeSubmission(submissionId, graderId, dto)
  }
}
