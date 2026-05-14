import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { SalaryService } from './salary.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { SchoolId } from '../../common/decorators/school.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'

const HR_ROLES  = [Role.HR_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN]
const FIN_ROLES = [Role.CFO, 'FINANCE_MANAGER' as any, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN]
const OWN_ROLES = [Role.SUPER_ADMIN, 'OWNER' as any]

@ApiTags('Salary')
@ApiBearerAuth()
@Controller('salary')
export class SalaryController {
  constructor(private readonly salary: SalaryService) {}

  // ── HR endpoints ──────────────────────────────────────────────────────────

  @Get('batches')
  @Roles(...HR_ROLES, ...FIN_ROLES)
  @ApiOperation({ summary: 'List salary batches for selected school/org' })
  listBatches(
    @SchoolId() rawSchoolId: string,
    @CurrentUser('orgId') orgId: string,
    @Query('month') month?: string,
    @Query('year')  year?: string,
  ) {
    const isCompany = rawSchoolId === '__company__'
    const schoolId  = isCompany ? null : rawSchoolId
    return this.salary.listBatches(schoolId, orgId, isCompany, {
      month: month ? +month : undefined,
      year:  year  ? +year  : undefined,
    })
  }

  @Get('batches/for-finance')
  @Roles(...FIN_ROLES)
  @ApiOperation({ summary: 'Finance view: all batches for org' })
  listForFinance(
    @CurrentUser('orgId') orgId: string,
    @Query('status') status?: string,
    @Query('month')  month?: string,
    @Query('year')   year?: string,
  ) {
    return this.salary.listForFinance(orgId, {
      status,
      month: month ? +month : undefined,
      year:  year  ? +year  : undefined,
    })
  }

  @Get('batches/for-owner')
  @Roles(...OWN_ROLES, ...FIN_ROLES)
  @ApiOperation({ summary: 'Owner view: all batches for org' })
  listForOwner(
    @CurrentUser('orgId') orgId: string,
    @Query('status') status?: string,
    @Query('year')   year?: string,
    @Query('month')  month?: string,
  ) {
    return this.salary.listForOwner(orgId, {
      status,
      year:  year  ? +year  : undefined,
      month: month ? +month : undefined,
    })
  }

  @Get('batches/:id')
  @Roles(...HR_ROLES, ...FIN_ROLES, ...OWN_ROLES)
  @ApiOperation({ summary: 'Get a single salary batch with all lines' })
  getBatch(@Param('id') id: string) {
    return this.salary.getBatch(id)
  }

  @Post('batches/prepare')
  @Roles(...HR_ROLES)
  @ApiOperation({ summary: 'Get or create salary batch for school/month/year' })
  prepare(
    @SchoolId() rawSchoolId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id')    userId: string,
    @Body('month') month: number,
    @Body('year')  year: number,
  ) {
    const schoolId = rawSchoolId === '__company__' ? null : rawSchoolId
    return this.salary.getOrCreateBatch(schoolId, orgId, +month, +year, userId)
  }

  @Patch('batches/:id/lines')
  @Roles(...HR_ROLES)
  @ApiOperation({ summary: 'Save (bulk-upsert) salary lines' })
  saveLines(
    @Param('id') id: string,
    @Body('lines') lines: any[],
  ) {
    return this.salary.saveLines(id, lines)
  }

  @Post('batches/:id/submit')
  @Roles(...HR_ROLES)
  @ApiOperation({ summary: 'HR: Submit batch to Finance' })
  submit(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('note') note?: string,
  ) {
    return this.salary.submitToFinance(id, userId, note)
  }

  // ── Finance endpoints ─────────────────────────────────────────────────────

  @Post('batches/:id/finance-approve')
  @Roles(...FIN_ROLES)
  @ApiOperation({ summary: 'Finance: Approve and send to Owner' })
  financeApprove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('note') note?: string,
  ) {
    return this.salary.financeApprove(id, userId, note)
  }

  @Post('batches/:id/finance-reject')
  @Roles(...FIN_ROLES)
  @ApiOperation({ summary: 'Finance: Reject back to HR with reason' })
  financeReject(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason: string,
  ) {
    return this.salary.financeReject(id, userId, reason)
  }

  @Post('batches/:id/mark-paid')
  @Roles(...FIN_ROLES)
  @ApiOperation({ summary: 'Finance: Mark salaries as transferred/paid' })
  markPaid(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('note') note?: string,
  ) {
    return this.salary.markPaid(id, userId, note)
  }

  @Post('batches/:id/close')
  @Roles(...FIN_ROLES)
  @ApiOperation({ summary: 'Finance: Close the salary month' })
  close(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salary.closeBatch(id, userId)
  }

  // ── Owner endpoints ───────────────────────────────────────────────────────

  @Post('batches/:id/owner-approve')
  @Roles(...OWN_ROLES, ...FIN_ROLES)
  @ApiOperation({ summary: 'Owner: Approve salary batch' })
  ownerApprove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.salary.ownerApprove(id, userId)
  }

  @Post('batches/:id/owner-reject')
  @Roles(...OWN_ROLES, ...FIN_ROLES)
  @ApiOperation({ summary: 'Owner: Reject salary batch with reason' })
  ownerReject(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason: string,
  ) {
    return this.salary.ownerReject(id, userId, reason)
  }
}
