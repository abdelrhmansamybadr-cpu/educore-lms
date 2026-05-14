import {
  Controller, Get, Post, Patch, Body, Param, Query,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { StudentAffairsService } from './student-affairs.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { SchoolId } from '../../common/decorators/school.decorator'

@ApiTags('Student Affairs')
@ApiBearerAuth()
@Controller('student-affairs')
export class StudentAffairsController {
  constructor(private service: StudentAffairsService) {}

  // ── Overview ──────────────────────────────────────────────────────────────────

  @Get('stats')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.COUNSELOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Student affairs dashboard statistics' })
  getStats(@SchoolId() schoolId: string) {
    return this.service.getStats(schoolId)
  }

  // ── Students ──────────────────────────────────────────────────────────────────

  @Get('students')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.COUNSELOR, Role.SUPER_ADMIN, Role.ACADEMIC_DIRECTOR)
  @ApiOperation({ summary: 'List students for student affairs' })
  getStudents(
    @SchoolId() schoolId: string,
    @Query('search') search?: string,
    @Query('sectionId') sectionId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getStudents(schoolId, { search, sectionId, page, limit })
  }

  @Get('students/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.COUNSELOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get full student affairs profile' })
  getStudentDetail(@Param('id') id: string) {
    return this.service.getStudentDetail(id)
  }

  // ── Disciplinary ──────────────────────────────────────────────────────────────

  @Get('discipline')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.COUNSELOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List disciplinary records' })
  getDiscipline(
    @SchoolId() schoolId: string,
    @Query('studentId') studentId?: string,
    @Query('resolved') resolved?: string,
    @Query('severity') severity?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getDisciplinaryRecords(schoolId, { studentId, resolved, severity, page, limit })
  }

  @Post('discipline')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.COUNSELOR, Role.TEACHER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Log a disciplinary incident' })
  createDiscipline(
    @SchoolId() schoolId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return this.service.createDisciplinaryRecord(schoolId, userId, dto)
  }

  @Patch('discipline/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.COUNSELOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update / resolve a disciplinary record' })
  updateDiscipline(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateDisciplinaryRecord(id, dto)
  }

  // ── Counseling ────────────────────────────────────────────────────────────────

  @Get('counseling')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.COUNSELOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List counseling sessions' })
  getCounseling(
    @SchoolId() schoolId: string,
    @Query('studentId') studentId?: string,
    @Query('counselorId') counselorId?: string,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getCounselingSessions(schoolId, { studentId, counselorId, type, page, limit })
  }

  @Post('counseling')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.COUNSELOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Log a counseling session' })
  createCounseling(
    @SchoolId() schoolId: string,
    @CurrentUser('id') counselorId: string,
    @Body() dto: any,
  ) {
    return this.service.createCounselingSession(schoolId, counselorId, dto)
  }

  // ── Documents ─────────────────────────────────────────────────────────────────

  @Get('documents')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.COUNSELOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List issued student documents' })
  getDocuments(
    @SchoolId() schoolId: string,
    @Query('studentId') studentId?: string,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getDocuments(schoolId, { studentId, type, page, limit })
  }

  @Post('documents')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Issue a document / certificate for a student' })
  issueDocument(
    @SchoolId() schoolId: string,
    @CurrentUser('id') issuedById: string,
    @Body() dto: any,
  ) {
    return this.service.issueDocument(schoolId, issuedById, dto)
  }

  // ── Behavior notes ────────────────────────────────────────────────────────────

  @Get('behavior')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.COUNSELOR, Role.TEACHER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List behavior notes' })
  getBehavior(
    @SchoolId() schoolId: string,
    @Query('studentId') studentId?: string,
    @Query('isPositive') isPositive?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getBehaviorNotes(schoolId, { studentId, isPositive, page, limit })
  }

  @Post('behavior')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.COUNSELOR, Role.TEACHER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a behavior note for a student' })
  addBehavior(
    @SchoolId() schoolId: string,
    @CurrentUser('id') addedById: string,
    @Body() dto: any,
  ) {
    return this.service.addBehaviorNote(schoolId, addedById, dto)
  }
}
