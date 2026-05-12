import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { FinanceService } from './finance.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { SchoolId } from '../../common/decorators/school.decorator'
import { Role, PaymentGateway, FeeType, PaymentStatus } from '@prisma/client'

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  constructor(private finance: FinanceService) {}

  // ── Fee Structures ────────────────────────────────────────────────────────────

  @Post('fee-structures')
  @Roles(Role.SCHOOL_ADMIN, Role.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Create fee structure' })
  createFee(@SchoolId() schoolId: string, @Body() dto: any) {
    return this.finance.createFeeStructure({ ...dto, schoolId })
  }

  @Get('fee-structures')
  @Roles(Role.SCHOOL_ADMIN, Role.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get all fee structures' })
  getFees(@SchoolId() schoolId: string) {
    return this.finance.getFeeStructures(schoolId)
  }

  @Patch('fee-structures/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Update fee structure' })
  updateFee(@Param('id') id: string, @Body() dto: any) {
    return this.finance.updateFeeStructure(id, dto)
  }

  @Delete('fee-structures/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Delete fee structure' })
  deleteFee(@Param('id') id: string) {
    return this.finance.deleteFeeStructure(id)
  }

  // ── Invoices ──────────────────────────────────────────────────────────────────

  @Post('invoices')
  @Roles(Role.SCHOOL_ADMIN, Role.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Create invoice for student' })
  createInvoice(@SchoolId() schoolId: string, @Body() dto: any) {
    return this.finance.createInvoice({ ...dto, schoolId })
  }

  @Post('invoices/bulk')
  @Roles(Role.SCHOOL_ADMIN, Role.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Bulk create invoices for multiple students' })
  bulkCreateInvoices(@SchoolId() schoolId: string, @Body() dto: any) {
    return this.finance.bulkCreateInvoices(schoolId, dto.feeStructureId, dto.academicYearId, dto.studentIds, dto.dueDate)
  }

  @Get('invoices')
  @Roles(Role.SCHOOL_ADMIN, Role.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  getInvoices(@SchoolId() schoolId: string, @Query() query: any) {
    return this.finance.getInvoices(schoolId, query)
  }

  @Get('invoices/my')
  @Roles(Role.PARENT, Role.STUDENT)
  @ApiOperation({ summary: 'Get invoices for current student/parent' })
  myInvoices(@CurrentUser('id') userId: string) {
    return this.finance.getStudentInvoices(userId)
  }

  // ── Payments ──────────────────────────────────────────────────────────────────

  @Post('payments')
  @Roles(Role.SCHOOL_ADMIN, Role.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Record a payment against an invoice' })
  processPayment(@Body() dto: any) {
    return this.finance.processPayment(dto)
  }

  @Post('stripe/payment-intent')
  @Roles(Role.PARENT, Role.STUDENT, Role.SCHOOL_ADMIN, Role.FINANCE_OFFICER)
  @ApiOperation({ summary: 'Create Stripe Payment Intent for frontend' })
  createPaymentIntent(@Body() dto: { amount: number; currency: string; invoiceId: string }) {
    return this.finance.createStripePaymentIntent(dto.amount, dto.currency, { invoiceId: dto.invoiceId })
  }

  // ── Summary / Stats ───────────────────────────────────────────────────────────

  @Get('summary')
  @Roles(Role.SCHOOL_ADMIN, Role.FINANCE_OFFICER, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Get financial summary' })
  @ApiQuery({ name: 'academicYearId', required: false })
  getSummary(@SchoolId() schoolId: string, @Query('academicYearId') academicYearId?: string) {
    return this.finance.getFinancialSummary(schoolId, academicYearId)
  }

  @Get('stats')
  @Roles(Role.SCHOOL_ADMIN, Role.FINANCE_OFFICER, Role.VICE_PRINCIPAL)
  @ApiOperation({ summary: 'Get financial stats (alias for summary)' })
  getStats(@SchoolId() schoolId: string) {
    return this.finance.getFinancialSummary(schoolId)
  }
}
