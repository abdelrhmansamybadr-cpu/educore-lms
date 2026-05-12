export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentGateway {
  STRIPE = 'STRIPE',
  PAYMOB = 'PAYMOB',
  FAWRY = 'FAWRY',
  HYPERPAY = 'HYPERPAY',
  TAP = 'TAP',
  PAYTABS = 'PAYTABS',
  MOYASAR = 'MOYASAR',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export interface FeeStructure {
  id: string
  schoolId: string
  academicYearId: string
  name: string
  nameAr?: string
  amount: number
  currency: string
  feeType: FeeType
  gradeLevelId?: string  // if null = applies to all grades
  dueDate?: Date
  installmentsAllowed: boolean
}

export type FeeType =
  | 'TUITION'
  | 'BOOKS'
  | 'UNIFORM'
  | 'TRANSPORT'
  | 'CANTEEN'
  | 'ACTIVITIES'
  | 'EXAM'
  | 'REGISTRATION'
  | 'OTHER'

export interface Invoice {
  id: string
  invoiceNumber: string
  schoolId: string
  studentId: string
  academicYearId: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  currency: string
  status: PaymentStatus
  dueDate: Date
  paidAt?: Date
  payments: Payment[]
  createdAt: Date
}

export interface InvoiceItem {
  id: string
  invoiceId: string
  feeStructureId: string
  description: string
  descriptionAr?: string
  amount: number
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number
  currency: string
  gateway: PaymentGateway
  gatewayTransactionId?: string
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED'
  paidAt?: Date
  receiptUrl?: string
}

export interface Scholarship {
  id: string
  schoolId: string
  studentId: string
  name: string
  nameAr?: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  appliesTo: FeeType[]
  startDate: Date
  endDate?: Date
  reason?: string
}
