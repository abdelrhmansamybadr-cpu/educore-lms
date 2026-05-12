export enum CurriculumType {
  EGYPTIAN = 'EGYPTIAN',
  SAUDI = 'SAUDI',
  AMERICAN = 'AMERICAN',
  BRITISH = 'BRITISH',
  IB = 'IB',
  CUSTOM = 'CUSTOM',
  MIXED = 'MIXED',
}

export enum SchoolLanguage {
  ARABIC = 'ARABIC',
  ENGLISH = 'ENGLISH',
  BILINGUAL = 'BILINGUAL',
}

export enum Currency {
  EGP = 'EGP', // Egyptian Pound
  SAR = 'SAR', // Saudi Riyal
  AED = 'AED', // UAE Dirham
  USD = 'USD', // US Dollar
  GBP = 'GBP', // British Pound
  EUR = 'EUR', // Euro
  KWD = 'KWD', // Kuwaiti Dinar
  BHD = 'BHD', // Bahraini Dinar
  QAR = 'QAR', // Qatari Riyal
  JOD = 'JOD', // Jordanian Dinar
  OMR = 'OMR', // Omani Rial
}

export interface School {
  id: string
  name: string
  nameAr?: string
  slug: string // unique URL identifier
  logo?: string
  coverImage?: string
  email: string
  phone?: string
  address?: string
  city?: string
  countryCode: string
  website?: string
  curriculumType: CurriculumType
  language: SchoolLanguage
  currency: Currency
  timezone: string
  isActive: boolean
  settings?: SchoolSettings
  createdAt: Date
}

export interface SchoolSettings {
  id: string
  schoolId: string
  // Payment Gateways
  stripeEnabled: boolean
  paymobEnabled: boolean
  fawryEnabled: boolean
  hyperpayEnabled: boolean
  tapEnabled: boolean
  paytabsEnabled: boolean
  moyasarEnabled: boolean
  // Academic
  gradingSystem: GradingSystem
  attendanceMethod: 'MANUAL' | 'QR' | 'BIOMETRIC'
  allowParentMessages: boolean
  allowStudentMessages: boolean
  // Features (dynamic modules)
  modules: SchoolModule[]
}

export type GradingSystem =
  | 'PERCENTAGE'   // 0-100 (Egyptian, Saudi)
  | 'GPA_4'        // 0-4.0 (American)
  | 'GCSE'         // 9-1 (British)
  | 'ALEVEL'       // A*-E (British A-Level)
  | 'IB'           // 1-7
  | 'CUSTOM'

export type SchoolModule =
  | 'FINANCE'
  | 'LIBRARY'
  | 'HEALTH'
  | 'TRANSPORT'
  | 'CANTEEN'
  | 'EVENTS'
  | 'TICKETS'
  | 'DEVICES'
  | 'HR'
  | 'ADMISSION'
  | 'STORE'
  | 'GAMIFICATION'
  | 'AI_TUTOR'
  | 'LIVE_CLASSES'
  | 'MENTAL_HEALTH'

export interface AcademicYear {
  id: string
  schoolId: string
  name: string
  nameAr?: string
  startDate: Date
  endDate: Date
  isCurrent: boolean
  terms: Term[]
}

export interface Term {
  id: string
  academicYearId: string
  name: string
  nameAr?: string
  startDate: Date
  endDate: Date
  order: number
}

export interface GradeLevel {
  id: string
  schoolId: string
  name: string         // e.g. "Grade 5" / "Year 7" / "الصف الخامس"
  nameAr?: string
  order: number
  sections: Section[]
}

export interface Section {
  id: string
  gradeLevelId: string
  name: string         // e.g. "A", "B", "C"
  teacherId?: string   // homeroom teacher
  capacity?: number
}
