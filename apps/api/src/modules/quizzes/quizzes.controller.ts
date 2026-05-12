import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { QuizzesService } from './quizzes.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Role } from '@prisma/client'
import {
  CreateQuizDto, UpdateQuizDto, CreateQuestionDto, SubmitAttemptDto,
} from './dto/quiz.dto'

@ApiTags('Quizzes')
@ApiBearerAuth()
@Controller('quizzes')
export class QuizzesController {
  constructor(private quizzes: QuizzesService) {}

  @Post()
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create quiz' })
  create(@Body() dto: CreateQuizDto) {
    return this.quizzes.create(dto)
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all quizzes in a course' })
  findByCourse(@Param('courseId') courseId: string) {
    return this.quizzes.findByCourse(courseId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz (student view - no answers)' })
  findOne(@Param('id') id: string) {
    return this.quizzes.findOne(id, false)
  }

  @Get(':id/teacher-view')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get quiz with correct answers (teacher view)' })
  findOneTeacher(@Param('id') id: string) {
    return this.quizzes.findOne(id, true)
  }

  @Patch(':id')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update quiz' })
  update(@Param('id') id: string, @Body() dto: UpdateQuizDto) {
    return this.quizzes.update(id, dto)
  }

  @Patch(':id/publish')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Toggle quiz publish status' })
  togglePublish(@Param('id') id: string) {
    return this.quizzes.togglePublish(id)
  }

  @Delete(':id')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete quiz' })
  remove(@Param('id') id: string) {
    return this.quizzes.remove(id)
  }

  // ── Questions ─────────────────────────────────────────────────────────────────

  @Post(':quizId/questions')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Add question to quiz' })
  addQuestion(@Param('quizId') quizId: string, @Body() dto: CreateQuestionDto) {
    return this.quizzes.addQuestion(quizId, dto)
  }

  @Delete('questions/:questionId')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Remove question from quiz' })
  removeQuestion(@Param('questionId') questionId: string) {
    return this.quizzes.removeQuestion(questionId)
  }

  @Patch(':quizId/questions/reorder')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Reorder quiz questions' })
  reorderQuestions(
    @Param('quizId') quizId: string,
    @Body() body: { questionIds: string[] },
  ) {
    return this.quizzes.reorderQuestions(quizId, body.questionIds)
  }

  // ── Attempts ──────────────────────────────────────────────────────────────────

  @Post(':quizId/start')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Start a quiz attempt' })
  startAttempt(@Param('quizId') quizId: string, @CurrentUser('id') studentId: string) {
    return this.quizzes.startAttempt(quizId, studentId)
  }

  @Post('attempts/:attemptId/submit')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Submit quiz attempt with answers' })
  submitAttempt(
    @Param('attemptId') attemptId: string,
    @CurrentUser('id') studentId: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.quizzes.submitAttempt(attemptId, studentId, dto)
  }

  @Get(':quizId/attempts')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get all attempts for a quiz' })
  getAttempts(@Param('quizId') quizId: string, @Query('studentId') studentId?: string) {
    return this.quizzes.getAttempts(quizId, studentId)
  }

  @Get(':quizId/my-attempts')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get current student attempts for this quiz' })
  myAttempts(@Param('quizId') quizId: string, @CurrentUser('id') studentId: string) {
    return this.quizzes.getAttempts(quizId, studentId)
  }
}
