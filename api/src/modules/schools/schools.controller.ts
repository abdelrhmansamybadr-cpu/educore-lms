import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseInterceptors, UploadedFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { SchoolsService } from './schools.service'
import {
  CreateSchoolDto, UpdateSchoolDto, SchoolSettingsDto, ModuleToggleDto,
} from './dto/create-school.dto'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { SchoolId } from '../../common/decorators/school.decorator'
import { StorageService } from '../storage/storage.service'

@ApiTags('Schools')
@ApiBearerAuth()
@Controller('schools')
export class SchoolsController {
  constructor(
    private schools: SchoolsService,
    private storage: StorageService,
  ) {}

  // ── Super admin: create school ─────────────────────────────────────────────

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.DEVELOPER)
  @ApiOperation({ summary: 'Create a new school (super admin)' })
  create(@Body() dto: CreateSchoolDto) {
    return this.schools.create(dto)
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.DEVELOPER)
  @ApiOperation({ summary: 'List all schools (super admin)' })
  findAll(@Query() query: { search?: string; page?: number; limit?: number }) {
    return this.schools.findAll(query)
  }

  @Get('my-list')
  @ApiOperation({ summary: 'Get all schools this user has access to (org owners get all schools in their org)' })
  getMySchools(@CurrentUser() user: any) {
    return this.schools.getMySchools(user.id, user.schoolId ?? null, user.orgId ?? null)
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.DEVELOPER, Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Get school by ID' })
  findOne(@Param('id') id: string) {
    return this.schools.findOne(id)
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.DEVELOPER, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update school info' })
  update(@Param('id') id: string, @Body() dto: UpdateSchoolDto) {
    return this.schools.update(id, dto)
  }

  // ── Logo upload ─────────────────────────────────────────────────────────────

  @Post(':id/logo')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload school logo' })
  async uploadLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const url = await this.storage.uploadFile(file, `schools/${id}/logo`)
    return this.schools.updateLogo(id, url)
  }

  // ── School settings (payment gateways, currency, etc.) ─────────────────────

  @Get('my/settings')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get current school settings' })
  getSettings(@SchoolId() schoolId: string) {
    return this.schools.getSettings(schoolId)
  }

  @Patch('my/settings')
  @Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update school settings (currency, gateways, grading, etc.)' })
  updateSettings(@SchoolId() schoolId: string, @Body() dto: SchoolSettingsDto) {
    return this.schools.updateSettings(schoolId, dto)
  }

  // ── Module toggle (developer / super admin) ─────────────────────────────────

  @Get('my/modules')
  @ApiOperation({ summary: 'Get enabled modules for current school' })
  getModules(@SchoolId() schoolId: string) {
    return this.schools.getModules(schoolId)
  }

  @Patch('my/modules/toggle')
  @Roles(Role.SUPER_ADMIN, Role.DEVELOPER)
  @ApiOperation({ summary: 'Enable or disable a module for a school' })
  toggleModule(@SchoolId() schoolId: string, @Body() dto: ModuleToggleDto) {
    return this.schools.toggleModule(schoolId, dto)
  }

  // ── Dashboard stats ─────────────────────────────────────────────────────────

  @Get('my/stats')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR)
  @ApiOperation({ summary: 'Get school dashboard statistics' })
  getStats(@SchoolId() schoolId: string) {
    return this.schools.getStats(schoolId)
  }

  // ── Academic structure ──────────────────────────────────────────────────────

  @Post('my/academic-years')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Create a new academic year' })
  createAcademicYear(
    @SchoolId() schoolId: string,
    @Body() body: { name: string; nameAr?: string; startDate: string; endDate: string },
  ) {
    return this.schools.createAcademicYear(schoolId, {
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    })
  }

  @Post('my/grade-levels')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Create a grade level' })
  createGradeLevel(
    @SchoolId() schoolId: string,
    @Body() body: { name: string; nameAr?: string; order: number },
  ) {
    return this.schools.createGradeLevel(schoolId, body)
  }

  @Post('my/grade-levels/:gradeLevelId/sections')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Create a section within a grade level' })
  createSection(
    @Param('gradeLevelId') gradeLevelId: string,
    @Body() body: { name: string; teacherId?: string; capacity?: number },
  ) {
    return this.schools.createSection(gradeLevelId, body)
  }

  @Post('my/departments')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR)
  @ApiOperation({ summary: 'Create a department' })
  createDepartment(
    @SchoolId() schoolId: string,
    @Body() body: { name: string; nameAr?: string; headId?: string },
  ) {
    return this.schools.createDepartment(schoolId, body)
  }

  @Post('my/subjects')
  @Roles(Role.SCHOOL_ADMIN, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR)
  @ApiOperation({ summary: 'Create a subject' })
  createSubject(
    @SchoolId() schoolId: string,
    @Body() body: { name: string; nameAr?: string; code?: string; departmentId?: string },
  ) {
    return this.schools.createSubject(schoolId, body)
  }
}
