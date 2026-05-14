import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { HrService } from './hr.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { SchoolId } from '../../common/decorators/school.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'

@ApiTags('HR')
@ApiBearerAuth()
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('stats')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'HR dashboard stats' })
  getStats(@CurrentUser('schoolId') schoolId: string) {
    return this.hrService.getHrStats(schoolId)
  }

  @Get('all-users')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List ALL school users merged with staff profile data' })
  getAllSchoolUsers(
    @SchoolId() schoolId: string,
    @CurrentUser('orgId') orgId: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.hrService.getAllSchoolUsers(schoolId, { search, role }, orgId)
  }

  @Get('staff')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR)
  @ApiOperation({ summary: 'List all staff profiles' })
  getStaff(
    @SchoolId() schoolId: string,
    @CurrentUser('orgId') orgId: string,
    @Query('department') department?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.hrService.getStaff(schoolId, { department, role, search }, orgId)
  }

  @Get('staff/me')
  @ApiOperation({ summary: 'Get my staff profile' })
  getMyStaffProfile(@CurrentUser('id') userId: string) {
    return this.hrService.getStaffByUserId(userId)
  }

  @Get('staff/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Get staff profile by ID' })
  getStaffById(@CurrentUser('schoolId') schoolId: string, @Param('id') id: string) {
    return this.hrService.getStaffById(schoolId, id)
  }

  @Post('staff')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Create staff profile for a user' })
  createStaff(@CurrentUser('schoolId') schoolId: string, @Body() body: any) {
    return this.hrService.createStaffProfile(schoolId, body)
  }

  @Patch('staff/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Update staff profile' })
  updateStaff(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.hrService.updateStaffProfile(schoolId, id, body)
  }

  @Get('leaves')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'List leave requests' })
  getLeaves(
    @CurrentUser('schoolId') schoolId: string,
    @Query('status') status?: string,
    @Query('staffId') staffId?: string,
  ) {
    return this.hrService.getLeaveRequests(schoolId, { status, staffId })
  }

  @Post('leaves')
  @ApiOperation({ summary: 'Submit a leave request (staff member)' })
  async requestLeave(@CurrentUser('id') userId: string, @CurrentUser('schoolId') schoolId: string, @Body() body: any) {
    const staffProfile = await this.hrService.getStaffByUserId(userId)
    if (!staffProfile) return { message: 'No staff profile found' }
    return this.hrService.requestLeave(staffProfile.id, schoolId, body)
  }

  @Patch('leaves/:id/approve')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Approve a leave request' })
  approveLeave(
    @CurrentUser('schoolId') schoolId: string,
    @CurrentUser('id') approverId: string,
    @Param('id') id: string,
    @Body('note') note?: string,
  ) {
    return this.hrService.updateLeaveStatus(schoolId, id, approverId, 'APPROVED', note)
  }

  @Patch('leaves/:id/reject')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Reject a leave request' })
  rejectLeave(
    @CurrentUser('schoolId') schoolId: string,
    @CurrentUser('id') approverId: string,
    @Param('id') id: string,
    @Body('note') note?: string,
  ) {
    return this.hrService.updateLeaveStatus(schoolId, id, approverId, 'REJECTED', note)
  }

  @Patch('leaves/:id/cancel')
  @ApiOperation({ summary: 'Cancel my leave request' })
  async cancelLeave(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const staffProfile = await this.hrService.getStaffByUserId(userId)
    if (!staffProfile) return { message: 'No staff profile found' }
    return this.hrService.cancelLeave(staffProfile.id, id)
  }

  @Get('job-applications')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'List job applications for this school' })
  getJobApplications(@CurrentUser('schoolId') schoolId: string) {
    return this.hrService.getJobApplications(schoolId)
  }

  @Post('job-applications/:id/request-owner-approval')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Request owner approval for a candidate hire' })
  requestOwnerApproval(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.hrService.requestOwnerApproval(id, schoolId)
  }

  @Get('contracts')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'List contracts' })
  getContracts(
    @SchoolId() schoolId: string,
    @CurrentUser('orgId') orgId: string,
    @Query('status') status?: string,
    @Query('staffId') staffId?: string,
  ) {
    return this.hrService.getContracts(schoolId, { status, staffId }, orgId)
  }

  @Post('contracts')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Create a contract' })
  createContract(@SchoolId() schoolId: string, @Body() body: any) {
    return this.hrService.createContract(schoolId, body)
  }

  @Patch('contracts/:id/status')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Update contract status' })
  updateContractStatus(
    @SchoolId() schoolId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.hrService.updateContractStatus(schoolId, id, status)
  }

  @Get('reviews')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR)
  @ApiOperation({ summary: 'List performance reviews' })
  getReviews(
    @CurrentUser('schoolId') schoolId: string,
    @Query('staffId') staffId?: string,
    @Query('period') period?: string,
  ) {
    return this.hrService.getReviews(schoolId, { staffId, period })
  }

  @Post('reviews')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL, Role.ACADEMIC_DIRECTOR)
  @ApiOperation({ summary: 'Create a performance review' })
  createReview(
    @CurrentUser('schoolId') schoolId: string,
    @CurrentUser('id') reviewerId: string,
    @Body() body: any,
  ) {
    return this.hrService.createReview(schoolId, reviewerId, body)
  }

  @Patch('reviews/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  updateReview(@CurrentUser('schoolId') s: string, @Param('id') id: string, @Body() body: any) {
    return this.hrService.updateReview(s, id, body)
  }

  @Delete('reviews/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  deleteReview(@CurrentUser('schoolId') s: string, @Param('id') id: string) {
    return this.hrService.deleteReview(s, id)
  }

  // ── Enhanced Stats ─────────────────────────────────────────────────────────

  @Get('full-stats')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL, Role.SUPER_ADMIN)
  getFullStats(@CurrentUser('schoolId') s: string) {
    return this.hrService.getFullHrStats(s)
  }

  // ── HR Departments ─────────────────────────────────────────────────────────

  @Get('departments')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  getHrDepartments(@CurrentUser('schoolId') s: string) {
    return this.hrService.getHrDepartments(s)
  }

  @Post('departments')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  createHrDepartment(@CurrentUser('schoolId') s: string, @Body() body: any) {
    return this.hrService.createHrDepartment(s, body)
  }

  @Patch('departments/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  updateHrDepartment(@CurrentUser('schoolId') s: string, @Param('id') id: string, @Body() body: any) {
    return this.hrService.updateHrDepartment(s, id, body)
  }

  @Delete('departments/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  deleteHrDepartment(@CurrentUser('schoolId') s: string, @Param('id') id: string) {
    return this.hrService.deleteHrDepartment(s, id)
  }

  // ── Payroll ────────────────────────────────────────────────────────────────

  @Get('payroll')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  getPayrolls(
    @SchoolId() s: string,
    @CurrentUser('orgId') orgId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('staffId') staffId?: string,
  ) {
    return this.hrService.getPayrolls(s, { month: month ? +month : undefined, year: year ? +year : undefined, staffId }, orgId)
  }

  @Post('payroll')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  createPayroll(@CurrentUser('schoolId') s: string, @Body() body: any) {
    return this.hrService.createPayroll(s, body)
  }

  @Patch('payroll/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  updatePayroll(@CurrentUser('schoolId') s: string, @Param('id') id: string, @Body() body: any) {
    return this.hrService.updatePayroll(s, id, body)
  }

  @Patch('payroll/:id/pay')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  markPaid(@CurrentUser('schoolId') s: string, @Param('id') id: string) {
    return this.hrService.markPayrollPaid(s, id)
  }

  @Delete('payroll/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  deletePayroll(@CurrentUser('schoolId') s: string, @Param('id') id: string) {
    return this.hrService.deletePayroll(s, id)
  }

  @Post('payroll/bulk-generate')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  bulkGeneratePayroll(@CurrentUser('schoolId') s: string, @Body() body: { month: number; year: number }) {
    return this.hrService.bulkGeneratePayroll(s, body.month, body.year)
  }

  // ── Shifts ─────────────────────────────────────────────────────────────────

  @Get('shifts')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  getShifts(@CurrentUser('schoolId') s: string) { return this.hrService.getShifts(s) }

  @Post('shifts')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  createShift(@CurrentUser('schoolId') s: string, @Body() body: any) { return this.hrService.createShift(s, body) }

  @Patch('shifts/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  updateShift(@CurrentUser('schoolId') s: string, @Param('id') id: string, @Body() body: any) { return this.hrService.updateShift(s, id, body) }

  @Delete('shifts/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  deleteShift(@CurrentUser('schoolId') s: string, @Param('id') id: string) { return this.hrService.deleteShift(s, id) }

  @Post('shifts/:id/assign')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  assignShift(@Param('id') shiftId: string, @Body('staffId') staffId: string) { return this.hrService.assignShift(shiftId, staffId) }

  @Delete('shifts/assignment/:staffId')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  removeShiftAssignment(@Param('staffId') staffId: string) { return this.hrService.removeShiftAssignment(staffId) }

  // ── Job Postings ───────────────────────────────────────────────────────────

  @Get('job-postings')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  getJobPostings(@CurrentUser('schoolId') s: string) { return this.hrService.getJobPostings(s) }

  @Post('job-postings')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  createJobPosting(@CurrentUser('schoolId') s: string, @Body() body: any) { return this.hrService.createJobPosting(s, body) }

  @Patch('job-postings/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  updateJobPosting(@CurrentUser('schoolId') s: string, @Param('id') id: string, @Body() body: any) { return this.hrService.updateJobPosting(s, id, body) }

  @Delete('job-postings/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  deleteJobPosting(@CurrentUser('schoolId') s: string, @Param('id') id: string) { return this.hrService.deleteJobPosting(s, id) }

  // ── HR Job Applications ────────────────────────────────────────────────────

  @Get('hr-applications')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  getHrApplications(
    @CurrentUser('schoolId') s: string,
    @Query('postingId') postingId?: string,
    @Query('status') status?: string,
  ) {
    return this.hrService.getHrJobApplications(s, { postingId, status })
  }

  @Post('hr-applications')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  createHrApplication(@CurrentUser('schoolId') s: string, @Body() body: any) { return this.hrService.createHrJobApplication(s, body) }

  @Patch('hr-applications/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  updateHrApplication(@CurrentUser('schoolId') s: string, @Param('id') id: string, @Body() body: any) { return this.hrService.updateHrJobApplication(s, id, body) }

  // ── Talent Pool ────────────────────────────────────────────────────────────

  @Get('talent')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  getTalent(@CurrentUser('schoolId') s: string, @Query('department') department?: string, @Query('status') status?: string) {
    return this.hrService.getTalentCandidates(s, { department, status })
  }

  @Post('talent')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  createTalent(@CurrentUser('schoolId') s: string, @Body() body: any) { return this.hrService.createTalentCandidate(s, body) }

  @Patch('talent/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  updateTalent(@CurrentUser('schoolId') s: string, @Param('id') id: string, @Body() body: any) { return this.hrService.updateTalentCandidate(s, id, body) }

  @Delete('talent/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  deleteTalent(@CurrentUser('schoolId') s: string, @Param('id') id: string) { return this.hrService.deleteTalentCandidate(s, id) }

  // ── Staff Attendance ───────────────────────────────────────────────────────

  @Get('attendance')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  getAttendance(
    @CurrentUser('schoolId') s: string,
    @Query('staffId') staffId?: string,
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.hrService.getHrAttendances(s, { staffId, date, month: month ? +month : undefined, year: year ? +year : undefined })
  }

  @Get('attendance/me')
  async getMyAttendance(@CurrentUser('id') userId: string, @CurrentUser('schoolId') s: string, @Query('month') month?: string, @Query('year') year?: string) {
    const sp = await this.hrService.getStaffByUserId(userId)
    if (!sp?.id) return []
    return this.hrService.getHrAttendances(s, { staffId: sp.id, month: month ? +month : undefined, year: year ? +year : undefined })
  }

  @Post('attendance')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  logAttendance(@CurrentUser('schoolId') s: string, @Body() body: any) { return this.hrService.logHrAttendance(s, body) }

  @Patch('attendance/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  updateAttendance(@CurrentUser('schoolId') s: string, @Param('id') id: string, @Body() body: any) {
    return this.hrService.updateHrAttendance(s, id, body)
  }

  // ── HR Announcements ───────────────────────────────────────────────────────

  @Get('announcements')
  getHrAnnouncements(@CurrentUser('schoolId') s: string, @Query('dept') dept?: string) {
    return this.hrService.getHrAnnouncements(s, dept)
  }

  @Post('announcements')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  createHrAnnouncement(@CurrentUser('schoolId') s: string, @CurrentUser('id') authorId: string, @Body() body: any) {
    return this.hrService.createHrAnnouncement(s, authorId, body)
  }

  @Patch('announcements/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  updateHrAnnouncement(@CurrentUser('schoolId') s: string, @Param('id') id: string, @Body() body: any) {
    return this.hrService.updateHrAnnouncement(s, id, body)
  }

  @Delete('announcements/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  deleteHrAnnouncement(@CurrentUser('schoolId') s: string, @Param('id') id: string) {
    return this.hrService.deleteHrAnnouncement(s, id)
  }

  // ── Employee Documents ─────────────────────────────────────────────────────

  @Get('document-types')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  getDocumentTypes(@CurrentUser('schoolId') s: string) { return this.hrService.getDocumentTypes(s) }

  @Post('document-types')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  createDocumentType(@CurrentUser('schoolId') s: string, @Body() body: any) { return this.hrService.createDocumentType(s, body) }

  @Delete('document-types/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  deleteDocumentType(@CurrentUser('schoolId') s: string, @Param('id') id: string) { return this.hrService.deleteDocumentType(s, id) }

  @Get('documents')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  getDocuments(@CurrentUser('schoolId') s: string, @Query('staffId') staffId?: string) {
    return this.hrService.getStaffDocuments(s, staffId)
  }

  @Get('documents/me')
  async getMyDocuments(@CurrentUser('id') userId: string, @CurrentUser('schoolId') s: string) {
    const sp = await this.hrService.getStaffByUserId(userId)
    if (!sp?.id) return []
    return this.hrService.getStaffDocuments(s, sp.id)
  }

  @Post('documents')
  async upsertDocument(@CurrentUser('id') userId: string, @Body() body: any) {
    const sp = await this.hrService.getStaffByUserId(userId)
    const staffId = body.staffId ?? sp?.id
    if (!staffId) return { message: 'No staff profile found' }
    return this.hrService.upsertDocument(staffId, body)
  }

  @Patch('documents/:id/review')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  reviewDocument(
    @CurrentUser('schoolId') s: string,
    @CurrentUser('id') reviewerId: string,
    @Param('id') id: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
  ) {
    return this.hrService.reviewDocument(s, id, reviewerId, status)
  }

  // ── Leave Policy ───────────────────────────────────────────────────────────

  @Get('leave-policy')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  getLeavePolicy(@CurrentUser('schoolId') s: string) {
    return this.hrService.getLeavePolicy(s)
  }

  @Patch('leave-policy')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER)
  upsertLeavePolicy(@CurrentUser('schoolId') s: string, @CurrentUser('id') userId: string, @Body() body: any) {
    return this.hrService.upsertLeavePolicy(s, userId, body)
  }

  @Get('leave-analysis')
  @Roles(Role.SCHOOL_ADMIN, Role.HR_MANAGER, Role.VICE_PRINCIPAL)
  getEmployeeLeaveAnalysis(@CurrentUser('schoolId') s: string, @Query('year') year?: string) {
    return this.hrService.getEmployeeLeaveAnalysis(s, year ? +year : new Date().getFullYear())
  }

  // ── IT Complaints (HR view) ─────────────────────────────────────────────────

  @Get('it-complaints')
  @Roles(Role.HR_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'View IT complaints escalated to HR' })
  getItComplaints(@CurrentUser('schoolId') schoolId: string, @Query('status') status?: string) {
    return this.hrService.getItComplaints(schoolId, status)
  }

  @Patch('it-complaints/:id')
  @Roles(Role.HR_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update IT complaint (HR notes / resolution)' })
  updateItComplaint(@Param('id') id: string, @Body() body: any) {
    return this.hrService.updateItComplaint(id, body)
  }
}
