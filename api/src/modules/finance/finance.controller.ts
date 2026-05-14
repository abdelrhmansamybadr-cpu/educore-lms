import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { FinanceService } from './finance.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { SchoolId } from '../../common/decorators/school.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { Role, PaymentGateway, FeeType, PaymentStatus } from '@prisma/client'

// New finance roles — cast as any since Prisma client isn't regenerated yet
const CFO = 'CFO' as any
const FINANCE_MANAGER = 'FINANCE_MANAGER' as any
const SCHOOL_ACCOUNTANT = 'SCHOOL_ACCOUNTANT' as any
const CASHIER = 'CASHIER' as any
const PAYROLL_OFFICER = 'PAYROLL_OFFICER' as any
const AUDITOR = 'AUDITOR' as any
const BRANCH_FINANCE_ADMIN = 'BRANCH_FINANCE_ADMIN' as any

const FINANCE_ADMIN = [
  CFO, FINANCE_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.DEVELOPER,
] as const

const FINANCE_STAFF = [
  CFO, FINANCE_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.DEVELOPER,
  SCHOOL_ACCOUNTANT, CASHIER, AUDITOR, BRANCH_FINANCE_ADMIN, Role.FINANCE_OFFICER,
] as const

const PAYROLL_ROLES = [
  CFO, FINANCE_MANAGER, PAYROLL_OFFICER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN, Role.DEVELOPER,
] as const

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  constructor(private finance: FinanceService, private prisma: PrismaService) {}

  /** Resolves schoolId for org-level roles that have no schoolId in their JWT.
   *  Falls back to the first school in the user's organization. */
  private async resolveSchoolId(user: any, schoolId: string | null): Promise<string | null> {
    if (schoolId) return schoolId
    if (!user?.orgId) return null
    const school = await this.prisma.school.findFirst({
      where: { organizationId: user.orgId },
      select: { id: true },
    })
    return school?.id ?? null
  }

  // ── Academic Years (dropdown helper) ──────────────────────────────────────────

  @Get('academic-years')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Get academic years for the school' })
  async getAcademicYears(@SchoolId() schoolId: string, @CurrentUser() user: any) {
    const sid = await this.resolveSchoolId(user, schoolId)
    if (!sid) return { data: [] }
    const years = await this.prisma.academicYear.findMany({
      where: { schoolId: sid },
      orderBy: { startDate: 'desc' },
      select: { id: true, name: true, isCurrent: true, startDate: true, endDate: true },
    })
    return { data: years }
  }

  @Post('academic-years')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Create an academic year (finance manager access)' })
  async createAcademicYear(@SchoolId() schoolId: string, @CurrentUser() user: any, @Body() body: any) {
    const sid = await this.resolveSchoolId(user, schoolId)
    if (!sid) return { data: null }
    // Unset current if setting new as current
    if (body.isCurrent) {
      await this.prisma.academicYear.updateMany({ where: { schoolId: sid }, data: { isCurrent: false } })
    }
    const year = await this.prisma.academicYear.create({
      data: {
        schoolId: sid,
        name: body.name,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        isCurrent: body.isCurrent ?? true,
      },
      select: { id: true, name: true, isCurrent: true, startDate: true, endDate: true },
    })
    return { data: year }
  }

  // ── Fee Structures ────────────────────────────────────────────────────────────

  @Post('fee-structures')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Create fee structure' })
  async createFee(@SchoolId() schoolId: string, @CurrentUser() user: any, @Body() dto: any) {
    const sid = await this.resolveSchoolId(user, schoolId)
    return this.finance.createFeeStructure({ ...dto, schoolId: sid })
  }

  @Get('fee-structures')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Get all fee structures' })
  async getFees(@SchoolId() schoolId: string, @CurrentUser() user: any) {
    const sid = await this.resolveSchoolId(user, schoolId)
    return this.finance.getFeeStructures(sid)
  }

  @Patch('fee-structures/:id')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Update fee structure' })
  updateFee(@Param('id') id: string, @Body() dto: any) {
    return this.finance.updateFeeStructure(id, dto)
  }

  @Delete('fee-structures/:id')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Delete fee structure' })
  deleteFee(@Param('id') id: string) {
    return this.finance.deleteFeeStructure(id)
  }

  // ── Fee Templates ─────────────────────────────────────────────────────────────

  @Get('fee-templates')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Get fee templates' })
  getFeeTemplates(@SchoolId() schoolId: string) {
    return this.finance.getFeeTemplates(schoolId)
  }

  @Post('fee-templates')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Create fee template' })
  createFeeTemplate(@SchoolId() schoolId: string, @Body() dto: any) {
    return this.finance.createFeeTemplate({ ...dto, schoolId })
  }

  @Patch('fee-templates/:id')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Update fee template' })
  updateFeeTemplate(@Param('id') id: string, @Body() dto: any) {
    return this.finance.updateFeeTemplate(id, dto)
  }

  @Delete('fee-templates/:id')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Delete fee template' })
  deleteFeeTemplate(@Param('id') id: string) {
    return this.finance.deleteFeeTemplate(id)
  }

  @Post('fee-templates/:id/apply')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Apply fee template to students (bulk invoice creation)' })
  applyFeeTemplate(@Param('id') id: string, @Body() dto: any) {
    return this.finance.applyFeeTemplate(id, dto.studentIds, dto.academicYearId, dto.dueDate)
  }

  // ── Discount Rules ────────────────────────────────────────────────────────────

  @Get('discount-rules')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Get discount rules' })
  getDiscountRules(@SchoolId() schoolId: string) {
    return this.finance.getDiscountRules(schoolId)
  }

  @Post('discount-rules')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Create discount rule' })
  createDiscountRule(@SchoolId() schoolId: string, @Body() dto: any) {
    return this.finance.createDiscountRule({ ...dto, schoolId })
  }

  @Patch('discount-rules/:id')
  @Roles(...FINANCE_ADMIN)
  updateDiscountRule(@Param('id') id: string, @Body() dto: any) {
    return this.finance.updateDiscountRule(id, dto)
  }

  @Delete('discount-rules/:id')
  @Roles(...FINANCE_ADMIN)
  deleteDiscountRule(@Param('id') id: string) {
    return this.finance.deleteDiscountRule(id)
  }

  // ── Fine Rules ────────────────────────────────────────────────────────────────

  @Get('fine-rules')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Get fine rules' })
  getFineRules(@SchoolId() schoolId: string) {
    return this.finance.getFineRules(schoolId)
  }

  @Post('fine-rules')
  @Roles(...FINANCE_ADMIN)
  createFineRule(@SchoolId() schoolId: string, @Body() dto: any) {
    return this.finance.createFineRule({ ...dto, schoolId })
  }

  @Patch('fine-rules/:id')
  @Roles(...FINANCE_ADMIN)
  updateFineRule(@Param('id') id: string, @Body() dto: any) {
    return this.finance.updateFineRule(id, dto)
  }

  @Post('apply-fines')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Calculate and apply late payment fines' })
  applyFines(@SchoolId() schoolId: string) {
    return this.finance.applyLatePaymentFines(schoolId)
  }

  // ── Invoices ──────────────────────────────────────────────────────────────────

  @Post('invoices')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Create invoice for student' })
  async createInvoice(@SchoolId() schoolId: string, @CurrentUser() user: any, @Body() dto: any) {
    const sid = await this.resolveSchoolId(user, schoolId)
    return this.finance.createInvoice({ ...dto, schoolId: sid })
  }

  @Post('invoices/bulk')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Bulk create invoices for multiple students' })
  async bulkCreateInvoices(@SchoolId() schoolId: string, @CurrentUser() user: any, @Body() dto: any) {
    const sid = await this.resolveSchoolId(user, schoolId)
    return this.finance.bulkCreateInvoices(sid, dto.feeStructureId, dto.academicYearId, dto.studentIds, dto.dueDate)
  }

  @Get('invoices')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  async getInvoices(@SchoolId() schoolId: string, @CurrentUser() user: any, @Query() query: any) {
    const sid = await this.resolveSchoolId(user, schoolId)
    return this.finance.getInvoices(sid, query)
  }

  @Get('invoices/my')
  @Roles(Role.PARENT, Role.STUDENT)
  @ApiOperation({ summary: 'Get invoices for current student/parent' })
  myInvoices(@CurrentUser('id') userId: string) {
    return this.finance.getStudentInvoices(userId)
  }

  @Get('invoices/:id/statement')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Get invoice statement with payments and installments' })
  getStatement(@Param('id') id: string) {
    return this.finance.getInvoiceStatement(id)
  }

  @Post('invoices/:id/payment-plan')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Create installment plan for invoice' })
  createPaymentPlan(@Param('id') invoiceId: string, @Body() dto: any) {
    return this.finance.createPaymentPlan(invoiceId, dto.installments)
  }

  // ── Credit Notes ──────────────────────────────────────────────────────────────

  @Get('credit-notes')
  @Roles(...FINANCE_STAFF)
  getCreditNotes(@CurrentUser('orgId') orgId: string, @SchoolId() schoolId: string) {
    return this.finance.getCreditNotes(orgId, schoolId)
  }

  @Post('credit-notes')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Issue a credit note' })
  createCreditNote(@CurrentUser('orgId') orgId: string, @SchoolId() schoolId: string, @CurrentUser('id') userId: string, @Body() dto: any) {
    return this.finance.createCreditNote({ ...dto, orgId, schoolId, issuedById: userId })
  }

  @Post('credit-notes/:id/approve')
  @Roles(...FINANCE_ADMIN)
  approveCreditNote(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.finance.approveCreditNote(id, userId)
  }

  @Post('credit-notes/:id/apply')
  @Roles(...FINANCE_ADMIN)
  applyCreditNote(@Param('id') id: string) {
    return this.finance.applyCreditNote(id)
  }

  // ── Payments ──────────────────────────────────────────────────────────────────

  @Post('payments')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Record a payment against an invoice' })
  processPayment(@Body() dto: any) {
    return this.finance.processPayment(dto)
  }

  @Post('stripe/payment-intent')
  @Roles(Role.PARENT, Role.STUDENT, ...FINANCE_STAFF)
  @ApiOperation({ summary: 'Create Stripe Payment Intent for frontend' })
  createPaymentIntent(@Body() dto: { amount: number; currency: string; invoiceId: string }) {
    return this.finance.createStripePaymentIntent(dto.amount, dto.currency, { invoiceId: dto.invoiceId })
  }

  // ── Chart of Accounts ─────────────────────────────────────────────────────────

  @Get('accounts')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Get chart of accounts (tree)' })
  getAccounts(@CurrentUser('orgId') orgId: string, @SchoolId() schoolId: string) {
    return this.finance.getChartOfAccounts(orgId, schoolId)
  }

  @Post('accounts')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Create account in chart of accounts' })
  createAccount(@CurrentUser('orgId') orgId: string, @Body() dto: any) {
    return this.finance.createAccount({ ...dto, orgId })
  }

  @Patch('accounts/:id')
  @Roles(...FINANCE_ADMIN)
  updateAccount(@Param('id') id: string, @Body() dto: any) {
    return this.finance.updateAccount(id, dto)
  }

  @Delete('accounts/:id')
  @Roles(...FINANCE_ADMIN)
  deleteAccount(@Param('id') id: string) {
    return this.finance.deleteAccount(id)
  }

  @Post('accounts/seed-defaults')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Seed default chart of accounts for this org' })
  seedAccounts(@CurrentUser('orgId') orgId: string) {
    return this.finance.seedDefaultChartOfAccounts(orgId)
  }

  // ── Journal Entries ───────────────────────────────────────────────────────────

  @Get('journal-entries')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Get journal entries' })
  getJournalEntries(@CurrentUser('orgId') orgId: string, @SchoolId() schoolId: string, @Query() query: any) {
    return this.finance.getJournalEntries(orgId, schoolId, query)
  }

  @Post('journal-entries')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Create journal entry (draft)' })
  createJournalEntry(@CurrentUser('orgId') orgId: string, @CurrentUser('id') userId: string, @Body() dto: any) {
    return this.finance.createJournalEntry({ ...dto, orgId, createdById: userId })
  }

  @Post('journal-entries/:id/post')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Post (finalize) a journal entry' })
  postJournalEntry(@Param('id') id: string) {
    return this.finance.postJournalEntry(id)
  }

  @Post('journal-entries/:id/reverse')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Reverse a posted journal entry' })
  reverseJournalEntry(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.finance.reverseJournalEntry(id, userId)
  }

  // ── Budgets ───────────────────────────────────────────────────────────────────

  @Get('budgets')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Get budgets' })
  getBudgets(@CurrentUser('orgId') orgId: string, @SchoolId() schoolId: string, @Query('fiscalYear') year?: string) {
    return this.finance.getBudgets(orgId, schoolId, year ? +year : undefined)
  }

  @Post('budgets')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Create budget' })
  createBudget(@CurrentUser('orgId') orgId: string, @SchoolId() schoolId: string, @Body() dto: any) {
    return this.finance.createBudget({ ...dto, orgId, schoolId })
  }

  @Patch('budgets/:id')
  @Roles(...FINANCE_ADMIN)
  updateBudget(@Param('id') id: string, @Body() dto: any) {
    return this.finance.updateBudget(id, dto)
  }

  @Post('budgets/:id/approve')
  @Roles(CFO, FINANCE_MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve budget (CFO/Finance Manager only)' })
  approveBudget(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.finance.approveBudget(id, userId)
  }

  @Get('budgets/:id/variance')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Get budget vs actual variance report' })
  getBudgetVariance(@Param('id') id: string) {
    return this.finance.getBudgetVariance(id)
  }

  // ── Payroll ───────────────────────────────────────────────────────────────────

  @Get('payroll-runs')
  @Roles(...PAYROLL_ROLES)
  @ApiOperation({ summary: 'Get payroll runs' })
  getPayrollRuns(@CurrentUser('orgId') orgId: string, @SchoolId() schoolId: string, @Query('year') year?: string) {
    return this.finance.getPayrollRuns(orgId, schoolId, year ? +year : undefined)
  }

  @Post('payroll-runs')
  @Roles(...PAYROLL_ROLES)
  @ApiOperation({ summary: 'Create new payroll run' })
  createPayrollRun(@CurrentUser('orgId') orgId: string, @SchoolId() schoolId: string, @Body() dto: any) {
    return this.finance.createPayrollRun({ orgId, schoolId, month: dto.month, year: dto.year })
  }

  @Get('payroll-runs/:id')
  @Roles(...PAYROLL_ROLES)
  getPayrollRun(@Param('id') id: string) {
    return this.finance.getPayrollRun(id)
  }

  @Post('payroll-runs/:id/process')
  @Roles(...PAYROLL_ROLES)
  @ApiOperation({ summary: 'Process payroll run (generate payslips from HR data)' })
  processPayrollRun(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.finance.processPayrollRun(id, userId)
  }

  @Post('payroll-runs/:id/approve')
  @Roles(CFO, FINANCE_MANAGER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve payroll run' })
  approvePayrollRun(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.finance.approvePayrollRun(id, userId)
  }

  @Post('payroll-runs/:id/pay')
  @Roles(CFO, FINANCE_MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mark payroll run as paid' })
  payPayrollRun(@Param('id') id: string) {
    return this.finance.payPayrollRun(id)
  }

  @Get('payroll-runs/:id/slips/:staffId')
  @Roles(...PAYROLL_ROLES)
  @ApiOperation({ summary: 'Get individual payslip' })
  getPayslip(@Param('id') runId: string, @Param('staffId') staffId: string) {
    return this.finance.getPayslip(runId, staffId)
  }

  // ── Staff Loans ───────────────────────────────────────────────────────────────

  @Get('loans')
  @Roles(...PAYROLL_ROLES)
  @ApiOperation({ summary: 'Get staff loans' })
  getLoans(@CurrentUser('orgId') orgId: string, @SchoolId() schoolId: string) {
    return this.finance.getLoans(orgId, schoolId)
  }

  @Post('loans')
  @Roles(...PAYROLL_ROLES)
  @ApiOperation({ summary: 'Create staff loan' })
  createLoan(@SchoolId() schoolId: string, @Body() dto: any) {
    return this.finance.createLoan({ ...dto, schoolId })
  }

  @Post('loans/:id/approve')
  @Roles(CFO, FINANCE_MANAGER, PAYROLL_OFFICER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  approveLoan(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.finance.approveLoan(id, userId)
  }

  @Post('loans/:id/reject')
  @Roles(CFO, FINANCE_MANAGER, PAYROLL_OFFICER, Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
  rejectLoan(@Param('id') id: string) {
    return this.finance.rejectLoan(id)
  }

  // ── Expense Claims ────────────────────────────────────────────────────────────

  @Get('expenses')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Get expense claims' })
  getExpenses(@CurrentUser('orgId') orgId: string, @SchoolId() schoolId: string, @Query('status') status?: string) {
    return this.finance.getExpenses(orgId, schoolId, status)
  }

  @Post('expenses')
  @ApiOperation({ summary: 'Submit expense claim (any authenticated user)' })
  createExpense(@CurrentUser('orgId') orgId: string, @SchoolId() schoolId: string, @CurrentUser('id') userId: string, @Body() dto: any) {
    return this.finance.createExpense({ ...dto, orgId, schoolId, submittedById: userId })
  }

  @Post('expenses/:id/approve')
  @Roles(...FINANCE_ADMIN)
  approveExpense(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.finance.approveExpense(id, userId)
  }

  @Post('expenses/:id/reject')
  @Roles(...FINANCE_ADMIN)
  rejectExpense(@Param('id') id: string, @Body() dto: any) {
    return this.finance.rejectExpense(id, dto.notes)
  }

  @Post('expenses/:id/reimburse')
  @Roles(...FINANCE_ADMIN)
  reimburseExpense(@Param('id') id: string) {
    return this.finance.reimburseExpense(id)
  }

  // ── Bank Accounts ─────────────────────────────────────────────────────────────

  @Get('bank-accounts')
  @Roles(...FINANCE_STAFF)
  getBankAccounts(@CurrentUser('orgId') orgId: string, @SchoolId() schoolId: string) {
    return this.finance.getBankAccounts(orgId, schoolId)
  }

  @Post('bank-accounts')
  @Roles(...FINANCE_ADMIN)
  createBankAccount(@CurrentUser('orgId') orgId: string, @Body() dto: any) {
    return this.finance.createBankAccount({ ...dto, orgId })
  }

  @Post('bank-accounts/:id/statements')
  @Roles(...FINANCE_STAFF)
  addBankStatements(@Param('id') id: string, @Body() dto: any) {
    return this.finance.addBankStatement(id, dto.statements)
  }

  @Get('bank-accounts/:id/reconciliation')
  @Roles(...FINANCE_STAFF)
  getReconciliation(@Param('id') id: string) {
    return this.finance.getBankReconciliation(id)
  }

  // ── Reports ───────────────────────────────────────────────────────────────────

  @Get('reports/trial-balance')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Trial balance report' })
  getTrialBalance(@CurrentUser('orgId') orgId: string, @SchoolId() schoolId: string, @Query('year') year?: string, @Query('month') month?: string) {
    return this.finance.getTrialBalance(orgId, schoolId, year ? +year : undefined, month ? +month : undefined)
  }

  @Get('reports/income-statement')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Income statement / P&L' })
  getIncomeStatement(@CurrentUser('orgId') orgId: string, @SchoolId() schoolId: string, @Query('year') year: string, @Query('month') month?: string) {
    return this.finance.getIncomeStatement(orgId, schoolId, +year || new Date().getFullYear(), month ? +month : undefined)
  }

  @Get('reports/outstanding')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Outstanding fees report with aging buckets' })
  async getOutstanding(@SchoolId() schoolId: string, @CurrentUser() user: any) {
    const sid = await this.resolveSchoolId(user, schoolId)
    return this.finance.getOutstandingReport(sid)
  }

  @Get('reports/aging')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Parent aging report' })
  async getAging(@SchoolId() schoolId: string, @CurrentUser() user: any) {
    const sid = await this.resolveSchoolId(user, schoolId)
    return this.finance.getAgingReport(sid)
  }

  @Get('reports/collection')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Collection report by period' })
  async getCollection(@SchoolId() schoolId: string, @CurrentUser() user: any, @Query('year') year: string, @Query('month') month?: string) {
    const sid = await this.resolveSchoolId(user, schoolId)
    return this.finance.getCollectionReport(sid, +year || new Date().getFullYear(), month ? +month : undefined)
  }

  @Get('reports/school-profitability')
  @Roles(CFO, FINANCE_MANAGER, Role.SUPER_ADMIN, Role.DEVELOPER)
  @ApiOperation({ summary: 'School profitability comparison (all schools in org)' })
  getSchoolProfitability(@CurrentUser('orgId') orgId: string, @Query('year') year: string) {
    return this.finance.getSchoolProfitability(orgId, +year || new Date().getFullYear())
  }

  // ── Summary / Stats ───────────────────────────────────────────────────────────

  @Get('summary')
  @Roles(...FINANCE_STAFF, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Get financial summary' })
  @ApiQuery({ name: 'academicYearId', required: false })
  async getSummary(@SchoolId() schoolId: string, @CurrentUser() user: any, @Query('academicYearId') academicYearId?: string) {
    const sid = await this.resolveSchoolId(user, schoolId)
    return this.finance.getFinancialSummary(sid, academicYearId)
  }

  @Get('stats')
  @Roles(...FINANCE_STAFF, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Get financial stats (alias for summary)' })
  async getStats(@SchoolId() schoolId: string, @CurrentUser() user: any) {
    const sid = await this.resolveSchoolId(user, schoolId)
    return this.finance.getFinancialSummary(sid)
  }

  // ── Cashier Endpoints ─────────────────────────────────────────────────────────

  @Post('invoices/:id/payments')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Record a payment against a specific invoice (cashier endpoint)' })
  recordInvoicePayment(@Param('id') invoiceId: string, @Body() dto: any) {
    const gatewayMap: Record<string, any> = {
      CASH:         PaymentGateway.CASH,
      CARD:         'CARD',
      BANK:         PaymentGateway.BANK_TRANSFER,
      BANK_TRANSFER: PaymentGateway.BANK_TRANSFER,
      CHEQUE:       'CHEQUE',
      APPLE_PAY:    'APPLE_PAY',
      GOOGLE_PAY:   'GOOGLE_PAY',
      POS_TERMINAL: 'POS_TERMINAL',
    }
    return this.finance.processPayment({
      invoiceId,
      amount: dto.amount,
      currency: dto.currency ?? 'SAR',
      gateway: gatewayMap[dto.method?.toUpperCase()] ?? PaymentGateway.CASH,
      gatewayTransactionId: dto.chequeNumber ? `CHQ-${dto.chequeNumber}` : dto.reference,
    })
  }

  @Get('cashier/today-summary')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Today\'s cashier collection summary by payment method' })
  getCashierTodaySummary(@SchoolId() schoolId: string) {
    return this.finance.getCashierTodaySummary(schoolId)
  }

  // ── Payment History ───────────────────────────────────────────────────────────

  @Get('payments/history')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Full payment history for the school' })
  getPaymentHistory(@SchoolId() schoolId: string, @CurrentUser() user: any, @Query() query: any) {
    return this.finance.getPaymentHistory(schoolId || user.orgId, query)
  }

  @Post('payments/:id/reverse')
  @Roles(...FINANCE_ADMIN)
  @ApiOperation({ summary: 'Reverse / cancel a payment' })
  reversePayment(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.finance.reversePayment(id, userId)
  }

  // ── Advance Payments ──────────────────────────────────────────────────────────

  @Get('advance-payments')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Get advance payments (student credit balance)' })
  async getAdvancePayments(@SchoolId() schoolId: string, @CurrentUser() user: any) {
    const sid = await this.resolveSchoolId(user, schoolId)
    return this.finance.getAdvancePayments(sid!)
  }

  @Post('advance-payments')
  @Roles(...FINANCE_STAFF)
  @ApiOperation({ summary: 'Record advance payment (no invoice)' })
  async createAdvancePayment(@SchoolId() schoolId: string, @CurrentUser() user: any, @Body() dto: any) {
    const sid = await this.resolveSchoolId(user, schoolId)
    return this.finance.createAdvancePayment({ ...dto, schoolId: sid, orgId: user.orgId, createdById: user.id })
  }

  // ── Fiscal Years ─────────────────────────────────────────────────────────
  @Get('fiscal-years')
  @Roles(...FINANCE_ADMIN)
  getFiscalYears(@CurrentUser() user: any) {
    return this.finance.getFiscalYears(user.orgId)
  }

  @Post('fiscal-years')
  @Roles(...FINANCE_ADMIN)
  createFiscalYear(@Body() dto: any, @CurrentUser() user: any) {
    return this.finance.createFiscalYear({ ...dto, orgId: user.orgId })
  }

  @Post('fiscal-years/:id/close')
  @Roles(...FINANCE_ADMIN)
  closeFiscalYear(@Param('id') id: string, @CurrentUser() user: any) {
    return this.finance.closeFiscalYear(id, user.id)
  }

  @Post('fiscal-years/:fyId/periods/:id/close')
  @Roles(...FINANCE_ADMIN)
  closeAccountingPeriod(@Param('id') id: string, @CurrentUser() user: any) {
    return this.finance.closeAccountingPeriod(id, user.id)
  }

  // ── Opening Balances ──────────────────────────────────────────────────────
  @Get('opening-balances')
  @Roles(...FINANCE_ADMIN)
  getOpeningBalances(@CurrentUser() user: any, @Query('fiscalYearId') fiscalYearId: string) {
    return this.finance.getOpeningBalances(user.orgId, fiscalYearId)
  }

  @Post('opening-balances/bulk')
  @Roles(...FINANCE_ADMIN)
  bulkSetOpeningBalances(@Body() dto: any, @CurrentUser() user: any) {
    return this.finance.bulkSetOpeningBalances(user.orgId, dto.fiscalYearId, dto.balances)
  }

  // ── Cost Centers ──────────────────────────────────────────────────────────
  @Get('cost-centers')
  @Roles(...FINANCE_STAFF)
  getCostCenters(@CurrentUser() user: any, @SchoolId() schoolId: string) {
    return this.finance.getCostCenters(user.orgId, schoolId)
  }

  @Post('cost-centers')
  @Roles(...FINANCE_ADMIN)
  createCostCenter(@Body() dto: any, @CurrentUser() user: any, @SchoolId() schoolId: string) {
    return this.finance.createCostCenter({ ...dto, orgId: user.orgId, schoolId: schoolId || undefined })
  }

  @Patch('cost-centers/:id')
  @Roles(...FINANCE_ADMIN)
  updateCostCenter(@Param('id') id: string, @Body() dto: any) {
    return this.finance.updateCostCenter(id, dto)
  }

  // ── Reports: General Ledger ───────────────────────────────────────────────
  @Get('reports/general-ledger/:accountId')
  @Roles(...FINANCE_STAFF)
  getGeneralLedger(
    @CurrentUser() user: any,
    @Param('accountId') accountId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.finance.getGeneralLedger(user.orgId, accountId, startDate, endDate)
  }

  // ── Reports: Balance Sheet ────────────────────────────────────────────────
  @Get('reports/balance-sheet')
  @Roles(...FINANCE_STAFF)
  getBalanceSheet(
    @CurrentUser() user: any,
    @SchoolId() schoolId: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.finance.getBalanceSheet(user.orgId, schoolId, asOfDate)
  }

  // ── Reports: Cash Flow ────────────────────────────────────────────────────
  @Get('reports/cash-flow')
  @Roles(...FINANCE_STAFF)
  getCashFlowStatement(
    @CurrentUser() user: any,
    @SchoolId() schoolId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.finance.getCashFlowStatement(user.orgId, schoolId, year ? +year : undefined, month ? +month : undefined)
  }

  // ── Reports: Financial Forecast ───────────────────────────────────────────
  @Get('reports/forecast')
  @Roles(...FINANCE_STAFF)
  getFinancialForecast(
    @CurrentUser() user: any,
    @SchoolId() schoolId: string,
    @Query('months') months?: string,
  ) {
    return this.finance.getFinancialForecast(user.orgId, schoolId, months ? +months : 6)
  }

  // ── Reports: Department-wise ──────────────────────────────────────────────
  @Get('reports/department-wise')
  @Roles(...FINANCE_STAFF)
  getDepartmentWiseReport(
    @CurrentUser() user: any,
    @SchoolId() schoolId: string,
    @Query('year') year?: string,
  ) {
    return this.finance.getDepartmentWiseReport(user.orgId, schoolId, year ? +year : undefined)
  }
}
