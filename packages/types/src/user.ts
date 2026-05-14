export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  DEVELOPER = 'DEVELOPER',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  VICE_PRINCIPAL = 'VICE_PRINCIPAL',
  ACADEMIC_DIRECTOR = 'ACADEMIC_DIRECTOR',
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  TEACHER = 'TEACHER',
  SUB_TEACHER = 'SUB_TEACHER',
  COUNSELOR = 'COUNSELOR',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  LIBRARIAN = 'LIBRARIAN',
  NURSE = 'NURSE',
  FINANCE_OFFICER = 'FINANCE_OFFICER',
  HR_MANAGER = 'HR_MANAGER',
  STORE_MANAGER = 'STORE_MANAGER',
  CANTEEN_MANAGER = 'CANTEEN_MANAGER',
  IT_ADMIN = 'IT_ADMIN',
  TRANSPORT_MANAGER = 'TRANSPORT_MANAGER',
  RECEPTIONIST = 'RECEPTIONIST',
  ADMISSION_OFFICER = 'ADMISSION_OFFICER',
  MATRON = 'MATRON',
  EVENT_COORDINATOR = 'EVENT_COORDINATOR',
  SUPPORT_AGENT = 'SUPPORT_AGENT',
  ACTIVITIES_COORDINATOR = 'ACTIVITIES_COORDINATOR',
  REQUISITIONS_MANAGER = 'REQUISITIONS_MANAGER',
  IT_MANAGER = 'IT_MANAGER',
  IT_STAFF = 'IT_STAFF',
  CFO = 'CFO',
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  SCHOOL_ACCOUNTANT = 'SCHOOL_ACCOUNTANT',
  CASHIER = 'CASHIER',
  PAYROLL_OFFICER = 'PAYROLL_OFFICER',
  PROCUREMENT_OFFICER = 'PROCUREMENT_OFFICER',
  AUDITOR = 'AUDITOR',
  BRANCH_FINANCE_ADMIN = 'BRANCH_FINANCE_ADMIN',
}

export interface UserProfile {
  id: string
  userId: string
  firstName: string
  firstNameAr?: string
  lastName: string
  lastNameAr?: string
  avatar?: string
  phone?: string
  dateOfBirth?: Date
  gender?: 'MALE' | 'FEMALE'
  nationality?: string
  address?: string
  language: 'ar' | 'en'
}

/** Flat user shape stored in the auth store (profile fields merged in) */
export interface User {
  id: string
  email: string
  role: Role
  schoolId?: string
  isActive?: boolean
  // Flattened profile fields for convenience
  firstName?: string
  firstNameAr?: string
  lastName?: string
  lastNameAr?: string
  avatar?: string
  phone?: string
  // Nested profile (from API responses)
  profile?: UserProfile
  createdAt?: Date
  updatedAt?: Date
  mustChangePassword?: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginDto {
  email: string
  password: string
}
