import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { CoursesService } from './courses.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { SchoolId } from '../../common/decorators/school.decorator'
import { Role } from '@prisma/client'
import {
  CreateCourseDto, UpdateCourseDto, CreateSectionDto,
  CreateLessonDto, UpdateLessonDto, EnrollStudentDto, BulkEnrollDto, UpdateProgressDto,
} from './dto/course.dto'

@ApiTags('Courses')
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
  constructor(private courses: CoursesService) {}

  // ── Course CRUD ───────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a new course' })
  create(
    @CurrentUser('id') teacherId: string,
    @SchoolId() schoolId: string,
    @Body() dto: CreateCourseDto,
  ) {
    return this.courses.create(teacherId, schoolId, dto)
  }

  @Get()
  @ApiOperation({ summary: 'List courses' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'teacherId', required: false })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@SchoolId() schoolId: string, @Query() query: any) {
    return this.courses.findAll(schoolId, query)
  }

  @Get('my-courses')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get enrolled courses for current student' })
  getMyCoures(@CurrentUser('id') studentId: string, @SchoolId() schoolId: string) {
    return this.courses.getStudentCourses(studentId, schoolId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course details with sections and lessons' })
  findOne(@Param('id') id: string, @SchoolId() schoolId: string) {
    return this.courses.findOne(id, schoolId)
  }

  @Patch(':id')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update course' })
  update(@Param('id') id: string, @SchoolId() schoolId: string, @Body() dto: UpdateCourseDto) {
    return this.courses.update(id, schoolId, dto)
  }

  @Patch(':id/publish')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Toggle course publish status' })
  togglePublish(@Param('id') id: string, @SchoolId() schoolId: string) {
    return this.courses.togglePublish(id, schoolId)
  }

  @Delete(':id')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete course' })
  remove(@Param('id') id: string, @SchoolId() schoolId: string) {
    return this.courses.remove(id, schoolId)
  }

  // ── Sections ──────────────────────────────────────────────────────────────────

  @Post(':courseId/sections')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Add section to course' })
  createSection(
    @Param('courseId') courseId: string,
    @SchoolId() schoolId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.courses.createSection(courseId, schoolId, dto)
  }

  @Patch(':courseId/sections/reorder')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Reorder course sections' })
  reorderSections(@Param('courseId') courseId: string, @Body() body: { sectionIds: string[] }) {
    return this.courses.reorderSections(courseId, body.sectionIds)
  }

  @Delete('sections/:sectionId')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete a section' })
  deleteSection(@Param('sectionId') sectionId: string) {
    return this.courses.deleteSection(sectionId)
  }

  // ── Lessons ───────────────────────────────────────────────────────────────────

  @Post('sections/:sectionId/lessons')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Add lesson to section' })
  createLesson(@Param('sectionId') sectionId: string, @Body() dto: CreateLessonDto) {
    return this.courses.createLesson(sectionId, dto)
  }

  @Patch('lessons/:lessonId')
  @Roles(Role.TEACHER, Role.SUB_TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update lesson' })
  updateLesson(@Param('lessonId') lessonId: string, @Body() dto: UpdateLessonDto) {
    return this.courses.updateLesson(lessonId, dto)
  }

  @Delete('lessons/:lessonId')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Delete lesson' })
  deleteLesson(@Param('lessonId') lessonId: string) {
    return this.courses.deleteLesson(lessonId)
  }

  // ── Enrollments ───────────────────────────────────────────────────────────────

  @Post(':courseId/enroll')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Enroll a student in course' })
  enroll(@Param('courseId') courseId: string, @Body() dto: EnrollStudentDto) {
    return this.courses.enroll(courseId, dto)
  }

  @Post(':courseId/bulk-enroll')
  @Roles(Role.SCHOOL_ADMIN, Role.ACADEMIC_DIRECTOR)
  @ApiOperation({ summary: 'Bulk enroll students in course' })
  bulkEnroll(@Param('courseId') courseId: string, @Body() dto: BulkEnrollDto) {
    return this.courses.bulkEnroll(courseId, dto)
  }

  @Delete(':courseId/students/:studentId')
  @Roles(Role.TEACHER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Unenroll student from course' })
  unenroll(@Param('courseId') courseId: string, @Param('studentId') studentId: string) {
    return this.courses.unenroll(courseId, studentId)
  }

  // ── Progress ──────────────────────────────────────────────────────────────────

  @Get(':id/my-progress')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get student lesson progress for a course' })
  getMyProgress(
    @Param('id') courseId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.courses.getCourseProgress(studentId, courseId)
  }

  @Patch('lessons/:lessonId/progress')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Update student lesson progress' })
  updateProgress(
    @Param('lessonId') lessonId: string,
    @CurrentUser('id') studentId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.courses.updateLessonProgress(studentId, lessonId, dto)
  }
}
