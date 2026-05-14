'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { api } from '@/lib/api'
import {
  Building2, User, Calendar, Puzzle, CheckCircle2,
  ChevronRight, ChevronLeft, GraduationCap, Layers,
} from 'lucide-react'

// ─── Step-3 types ─────────────────────────────────────────────────────────────
interface GradeEntry {
  name: string; nameAr: string; order: number
  sections: number   // 0 = no lettered sections; 1–6 = A,B,C…
  selected: boolean
}
interface DeptEntry { name: string; nameAr: string; selected: boolean }
interface SchoolStructure { grades: GradeEntry[]; depts: DeptEntry[] }

// ─── Grade presets by curriculum ──────────────────────────────────────────────
const GRADE_PRESETS: Record<string, Omit<GradeEntry, 'selected'>[]> = {
  AMERICAN: [
    { name: 'Kindergarten', nameAr: 'روضة', order: 0, sections: 2 },
    ...Array.from({ length: 12 }, (_, i) => ({ name: `Grade ${i + 1}`, nameAr: `الصف ${['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع','العاشر','الحادي عشر','الثاني عشر'][i]}`, order: i + 1, sections: 2 })),
  ],
  BRITISH: Array.from({ length: 13 }, (_, i) => ({ name: `Year ${i + 1}`, nameAr: `السنة ${['الأولى','الثانية','الثالثة','الرابعة','الخامسة','السادسة','السابعة','الثامنة','التاسعة','العاشرة','الحادية عشرة','الثانية عشرة','الثالثة عشرة'][i]}`, order: i + 1, sections: 2 })),
  IB: [
    ...Array.from({ length: 6 }, (_, i) => ({ name: `PYP Year ${i + 1}`, nameAr: `PYP سنة ${i + 1}`, order: i + 1, sections: 2 })),
    ...Array.from({ length: 5 }, (_, i) => ({ name: `MYP Year ${i + 1}`, nameAr: `MYP سنة ${i + 1}`, order: i + 7, sections: 2 })),
    { name: 'DP Year 1', nameAr: 'DP سنة 1', order: 12, sections: 1 },
    { name: 'DP Year 2', nameAr: 'DP سنة 2', order: 13, sections: 1 },
  ],
  EGYPTIAN: [
    { name: 'Grade 1 Primary', nameAr: 'الصف الأول الابتدائي', order: 1, sections: 3 },
    { name: 'Grade 2 Primary', nameAr: 'الصف الثاني الابتدائي', order: 2, sections: 3 },
    { name: 'Grade 3 Primary', nameAr: 'الصف الثالث الابتدائي', order: 3, sections: 3 },
    { name: 'Grade 4 Primary', nameAr: 'الصف الرابع الابتدائي', order: 4, sections: 3 },
    { name: 'Grade 5 Primary', nameAr: 'الصف الخامس الابتدائي', order: 5, sections: 3 },
    { name: 'Grade 6 Primary', nameAr: 'الصف السادس الابتدائي', order: 6, sections: 3 },
    { name: 'Grade 1 Preparatory', nameAr: 'الصف الأول الإعدادي', order: 7, sections: 3 },
    { name: 'Grade 2 Preparatory', nameAr: 'الصف الثاني الإعدادي', order: 8, sections: 3 },
    { name: 'Grade 3 Preparatory', nameAr: 'الصف الثالث الإعدادي', order: 9, sections: 3 },
    { name: 'Grade 1 Secondary', nameAr: 'الصف الأول الثانوي', order: 10, sections: 3 },
    { name: 'Grade 2 Secondary', nameAr: 'الصف الثاني الثانوي', order: 11, sections: 3 },
    { name: 'Grade 3 Secondary', nameAr: 'الصف الثالث الثانوي', order: 12, sections: 3 },
  ],
}
GRADE_PRESETS.SAUDI = GRADE_PRESETS.EGYPTIAN
GRADE_PRESETS.NATIONAL = Array.from({ length: 12 }, (_, i) => ({ name: `Grade ${i + 1}`, nameAr: `الصف ${i + 1}`, order: i + 1, sections: 2 }))
GRADE_PRESETS.CUSTOM = GRADE_PRESETS.NATIONAL
GRADE_PRESETS.MIXED = GRADE_PRESETS.NATIONAL

// ─── Department presets ────────────────────────────────────────────────────────
const DEPT_COMMON: DeptEntry[] = [
  { name: 'Mathematics', nameAr: 'الرياضيات', selected: true },
  { name: 'Science', nameAr: 'العلوم', selected: true },
  { name: 'Arabic Language', nameAr: 'اللغة العربية', selected: true },
  { name: 'English Language', nameAr: 'اللغة الإنجليزية', selected: true },
  { name: 'Social Studies', nameAr: 'الدراسات الاجتماعية', selected: true },
  { name: 'Islamic Studies', nameAr: 'التربية الإسلامية', selected: true },
  { name: 'Physical Education', nameAr: 'التربية الرياضية', selected: true },
  { name: 'Art & Design', nameAr: 'الفنون والتصميم', selected: false },
  { name: 'Computer Science', nameAr: 'علوم الحاسوب', selected: false },
  { name: 'Music', nameAr: 'الموسيقى', selected: false },
]
const DEPT_EXTRAS: Record<string, DeptEntry[]> = {
  BRITISH: [
    { name: 'History', nameAr: 'التاريخ', selected: true },
    { name: 'Geography', nameAr: 'الجغرافيا', selected: true },
    { name: 'Chemistry', nameAr: 'الكيمياء', selected: true },
    { name: 'Physics', nameAr: 'الفيزياء', selected: true },
    { name: 'Biology', nameAr: 'الأحياء', selected: true },
    { name: 'Business Studies', nameAr: 'إدارة الأعمال', selected: false },
    { name: 'Economics', nameAr: 'الاقتصاد', selected: false },
  ],
  AMERICAN: [
    { name: 'History', nameAr: 'التاريخ', selected: true },
    { name: 'Government & Politics', nameAr: 'الحكومة والسياسة', selected: false },
    { name: 'Economics', nameAr: 'الاقتصاد', selected: false },
    { name: 'AP Programs', nameAr: 'البرامج المتقدمة', selected: false },
  ],
  IB: [
    { name: 'Individuals & Societies', nameAr: 'الأفراد والمجتمعات', selected: true },
    { name: 'Language Acquisition', nameAr: 'اكتساب اللغة', selected: true },
    { name: 'Philosophy', nameAr: 'الفلسفة', selected: false },
    { name: 'Theory of Knowledge', nameAr: 'نظرية المعرفة', selected: true },
  ],
}

function buildDefaultStructure(curriculum: string): SchoolStructure {
  const gradePreset = GRADE_PRESETS[curriculum] ?? GRADE_PRESETS.CUSTOM
  const grades: GradeEntry[] = gradePreset.map((g) => ({ ...g, selected: true }))
  const depts: DeptEntry[] = [
    ...DEPT_COMMON,
    ...(DEPT_EXTRAS[curriculum] ?? []),
  ]
  return { grades, depts }
}

// Section letters helper
function expandGrades(grades: GradeEntry[]): { name: string; nameAr: string; order: number }[] {
  const LETTERS = 'ABCDEF'
  const result: { name: string; nameAr: string; order: number }[] = []
  let order = 0
  for (const g of grades) {
    if (!g.selected) continue
    if (g.sections <= 1) {
      result.push({ name: g.name, nameAr: g.nameAr, order: order++ })
    } else {
      for (let s = 0; s < g.sections; s++) {
        result.push({ name: `${g.name}${LETTERS[s]}`, nameAr: `${g.nameAr}${LETTERS[s]}`, order: order++ })
      }
    }
  }
  return result
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface WizardData {
  // Step 1 — Organization
  orgName: string
  ownerEmail: string
  ownerPassword: string
  ownerFirstName: string
  ownerLastName: string
  countryCode: string
  // Step 2 — School info
  schoolName: string
  schoolNameAr: string
  schoolEmail: string
  schoolPhone: string
  schoolCity: string
  schoolAddress: string
  schoolWebsite: string
  timezone: string
  curriculumTypes: string[]   // multi-select; API receives effectiveCurriculumType()
  language: string
  currency: string
  numberOfStudents: string
  // Per-curriculum school names (one entry per selected curriculum)
  schoolEntries: { curriculum: string; name: string; nameAr: string }[]
  // Step 3 — Per-school academic structure (keyed by curriculum type)
  structureBySchool: Record<string, SchoolStructure>
  // Step 4 — Academic year
  yearName: string
  yearStart: string
  yearEnd: string
  termCount: string
  // Step 5 — Modules (curriculum auto-selects, user can override)
  enabledModules: string[]
  // Step 6 — Admin account
  adminEmail: string
  adminPassword: string
  adminFirstName: string
  adminLastName: string
}

const STEPS = [
  { id: 1, label: 'Organization',   labelAr: 'المنظمة',      icon: User },
  { id: 2, label: 'School Info',    labelAr: 'بيانات المدرسة', icon: Building2 },
  { id: 3, label: 'Structure',      labelAr: 'الهيكل الأكاديمي', icon: Layers },
  { id: 4, label: 'Academic Year',  labelAr: 'العام الدراسي',  icon: Calendar },
  { id: 5, label: 'Modules',        labelAr: 'الوحدات',        icon: Puzzle },
  { id: 6, label: 'Admin Account',  labelAr: 'حساب المدير',    icon: GraduationCap },
]

const CURRICULUM_TYPES = [
  { value: 'NATIONAL',  label: 'National', labelAr: 'وطني', description: 'Local national curriculum' },
  { value: 'EGYPTIAN',  label: 'Egyptian', labelAr: 'مصري', description: 'Egyptian Ministry curriculum' },
  { value: 'SAUDI',     label: 'Saudi',    labelAr: 'سعودي', description: 'Saudi Ministry curriculum' },
  { value: 'AMERICAN',  label: 'American', labelAr: 'أمريكي', description: 'US curriculum with GPA grading' },
  { value: 'BRITISH',   label: 'British',  labelAr: 'بريطاني', description: 'UK curriculum with GCSE/A-Level' },
  { value: 'IB',        label: 'IB',       labelAr: 'IB', description: 'International Baccalaureate' },
  { value: 'MIXED',     label: 'Mixed',    labelAr: 'مختلط', description: 'Multiple curricula' },
  { value: 'CUSTOM',    label: 'Custom',   labelAr: 'مخصص', description: 'Fully customized system' },
]

const ALL_MODULES = [
  { key: 'FINANCE',       label: 'Finance & Fees',    labelAr: 'المالية والرسوم' },
  { key: 'LIBRARY',       label: 'Library',            labelAr: 'المكتبة' },
  { key: 'HEALTH',        label: 'Health & Clinic',    labelAr: 'الصحة والعيادة' },
  { key: 'TRANSPORT',     label: 'Transport',          labelAr: 'النقل' },
  { key: 'CANTEEN',       label: 'Canteen',            labelAr: 'المقصف' },
  { key: 'EVENTS',        label: 'Events',             labelAr: 'الفعاليات' },
  { key: 'TICKETS',       label: 'Support Tickets',    labelAr: 'تذاكر الدعم' },
  { key: 'DEVICES',       label: 'Device Management',  labelAr: 'إدارة الأجهزة' },
  { key: 'HR',            label: 'Human Resources',    labelAr: 'الموارد البشرية' },
  { key: 'ADMISSION',     label: 'Admissions',         labelAr: 'القبول' },
  { key: 'STORE',         label: 'Store / Inventory',  labelAr: 'المخزن' },
  { key: 'GAMIFICATION',  label: 'Gamification',       labelAr: 'التحفيز' },
  { key: 'AI_TUTOR',      label: 'AI Tutor',           labelAr: 'المدرس الذكي' },
  { key: 'LIVE_CLASSES',  label: 'Live Classes',       labelAr: 'الحصص المباشرة' },
  { key: 'MENTAL_HEALTH', label: 'Mental Health',      labelAr: 'الصحة النفسية' },
  { key: 'GCSE_TRACKER',  label: 'GCSE Tracker',       labelAr: 'متابعة GCSE' },
  { key: 'GPA_TRACKER',   label: 'GPA Tracker',        labelAr: 'متابعة GPA' },
  { key: 'CAS_TRACKER',   label: 'CAS Tracker (IB)',   labelAr: 'متابعة CAS' },
  { key: 'TOK_MODULE',    label: 'TOK (IB)',            labelAr: 'نظرية المعرفة IB' },
  { key: 'SAT_PREP',      label: 'SAT Prep',           labelAr: 'تحضير SAT' },
]

const CURRICULUM_DEFAULT_MODULES: Record<string, string[]> = {
  BRITISH:  ['FINANCE','LIBRARY','HEALTH','TRANSPORT','CANTEEN','EVENTS','TICKETS','DEVICES','HR','ADMISSION','GAMIFICATION','LIVE_CLASSES','MENTAL_HEALTH','GCSE_TRACKER'],
  AMERICAN: ['FINANCE','LIBRARY','HEALTH','TRANSPORT','CANTEEN','EVENTS','TICKETS','DEVICES','HR','ADMISSION','GAMIFICATION','AI_TUTOR','LIVE_CLASSES','MENTAL_HEALTH','GPA_TRACKER','SAT_PREP'],
  IB:       ['FINANCE','LIBRARY','HEALTH','TRANSPORT','CANTEEN','EVENTS','TICKETS','DEVICES','HR','ADMISSION','GAMIFICATION','AI_TUTOR','LIVE_CLASSES','MENTAL_HEALTH','CAS_TRACKER','TOK_MODULE'],
  EGYPTIAN: ['FINANCE','LIBRARY','HEALTH','TRANSPORT','CANTEEN','EVENTS','TICKETS','DEVICES','HR','ADMISSION','GAMIFICATION','LIVE_CLASSES','MENTAL_HEALTH'],
  SAUDI:    ['FINANCE','LIBRARY','HEALTH','TRANSPORT','CANTEEN','EVENTS','TICKETS','DEVICES','HR','ADMISSION','GAMIFICATION','LIVE_CLASSES','MENTAL_HEALTH'],
  CUSTOM:   ['FINANCE','LIBRARY','HEALTH','TRANSPORT','CANTEEN','EVENTS','TICKETS','DEVICES','HR','ADMISSION','GAMIFICATION','AI_TUTOR','LIVE_CLASSES','MENTAL_HEALTH'],
  MIXED:    ['FINANCE','LIBRARY','HEALTH','TRANSPORT','CANTEEN','EVENTS','TICKETS','DEVICES','HR','ADMISSION','GAMIFICATION','AI_TUTOR','LIVE_CLASSES','MENTAL_HEALTH'],
  NATIONAL: ['FINANCE','LIBRARY','HEALTH','TRANSPORT','CANTEEN','EVENTS','TICKETS','DEVICES','HR','ADMISSION','GAMIFICATION','LIVE_CLASSES','MENTAL_HEALTH'],
}


function inputCls(error?: boolean) {
  return `w-full border ${error ? 'border-red-400' : 'border-gray-200'} rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white`
}

export default function OnboardingPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orgId, setOrgId] = useState('')
  const [schoolId, setSchoolId] = useState('')      // primary school (first created)
  const [schoolMapping, setSchoolMapping] = useState<Record<string, string>>({}) // curriculum → schoolId

  const [data, setData] = useState<WizardData>({
    orgName: '', ownerEmail: '', ownerPassword: '', ownerFirstName: '', ownerLastName: '', countryCode: 'SA',
    schoolName: '', schoolNameAr: '', schoolEmail: '', schoolPhone: '', schoolCity: '', schoolAddress: '', schoolWebsite: '', timezone: 'Asia/Riyadh', curriculumTypes: ['CUSTOM'], language: 'BILINGUAL', currency: 'USD', numberOfStudents: '500',
    schoolEntries: [{ curriculum: 'CUSTOM', name: '', nameAr: '' }],
    structureBySchool: { CUSTOM: buildDefaultStructure('CUSTOM') },
    yearName: '2025-2026', yearStart: '2025-09-01', yearEnd: '2026-06-30', termCount: '3',
    enabledModules: CURRICULUM_DEFAULT_MODULES.CUSTOM,
    adminEmail: '', adminPassword: '', adminFirstName: '', adminLastName: '',
  })

  const set = (field: keyof WizardData, value: any) => setData((d) => ({ ...d, [field]: value }))

  // Derive single curriculumType for the API: 1 selected → that type, multiple → MIXED
  const effectiveCurriculumType = (types: string[]) => types.length === 1 ? types[0] : 'MIXED'

  // Union of all selected curricula's default modules
  const effectiveModules = (types: string[]) => {
    const all = new Set<string>()
    types.forEach((t) => (CURRICULUM_DEFAULT_MODULES[t] ?? CURRICULUM_DEFAULT_MODULES.CUSTOM).forEach((m) => all.add(m)))
    return Array.from(all)
  }

  const onCurriculumToggle = (curriculum: string) => {
    setData((d) => {
      const already = d.curriculumTypes.includes(curriculum)
      const next = already
        ? d.curriculumTypes.filter((t) => t !== curriculum)
        : [...d.curriculumTypes, curriculum]
      const safeTypes = next.length === 0 ? ['CUSTOM'] : next
      // Keep existing names for retained curricula, add blank entry for new ones
      const schoolEntries = safeTypes.map((t) => {
        const existing = d.schoolEntries.find((e) => e.curriculum === t)
        return existing ?? { curriculum: t, name: '', nameAr: '' }
      })
      // Build structureBySchool — keep existing for retained curricula, build default for new ones
      const structureBySchool: Record<string, SchoolStructure> = {}
      for (const t of safeTypes) {
        structureBySchool[t] = d.structureBySchool[t] ?? buildDefaultStructure(t)
      }
      return {
        ...d,
        curriculumTypes: safeTypes,
        schoolEntries,
        structureBySchool,
        enabledModules: effectiveModules(safeTypes),
      }
    })
  }

  const next = async () => {
    setError('')
    setLoading(true)
    try {
      if (step === 1) {
        const res = await api.post('/onboarding/register', {
          orgName: data.orgName, ownerEmail: data.ownerEmail, ownerPassword: data.ownerPassword,
          ownerFirstName: data.ownerFirstName, ownerLastName: data.ownerLastName, countryCode: data.countryCode,
        })
        const resData = res.data?.data ?? res.data
        setOrgId(resData.organization.id)
      } else if (step === 2) {
        // Create one school per selected curriculum
        const commonFields = {
          organizationId: orgId,
          email: data.schoolEmail, phone: data.schoolPhone, city: data.schoolCity,
          address: data.schoolAddress, website: data.schoolWebsite,
          timezone: data.timezone, countryCode: data.countryCode,
          language: data.language, currency: data.currency,
          numberOfStudents: parseInt(data.numberOfStudents) || 0,
        }
        const createdIds: string[] = []
        const mapping: Record<string, string> = {}
        for (const entry of data.schoolEntries) {
          const res = await api.post('/onboarding/school', {
            ...commonFields,
            name: entry.name || data.schoolName || entry.curriculum,
            nameAr: entry.nameAr || data.schoolNameAr || entry.curriculum,
            curriculumType: entry.curriculum,
          })
          const schoolData = res.data?.data ?? res.data
          createdIds.push(schoolData.id)
          mapping[entry.curriculum] = schoolData.id
        }
        setSchoolMapping(mapping)
        setSchoolId(createdIds[0])   // primary school for subsequent steps
      } else if (step === 3) {
        // Post structure for each school
        for (const [curriculum, structure] of Object.entries(data.structureBySchool)) {
          const sid = schoolMapping[curriculum] ?? schoolId
          if (!sid) continue
          await api.post(`/onboarding/school/${sid}/structure`, {
            gradeLevels: expandGrades(structure.grades),
            departments: structure.depts
              .filter((d) => d.selected)
              .map((d) => ({ name: d.name, nameAr: d.nameAr })),
          })
        }
      } else if (step === 4) {
        const termCount = parseInt(data.termCount) || 3
        const terms = Array.from({ length: termCount }, (_, i) => ({
          name: `Term ${i + 1}`, order: i + 1,
          startDate: data.yearStart, endDate: data.yearEnd,
        }))
        await api.post(`/onboarding/school/${schoolId}/academic-year`, {
          yearName: data.yearName, startDate: data.yearStart, endDate: data.yearEnd, terms,
        })
      } else if (step === 5) {
        await api.post(`/onboarding/school/${schoolId}/curriculum`, {
          curriculumType: effectiveCurriculumType(data.curriculumTypes), enabledModules: data.enabledModules,
        })
      } else if (step === 6) {
        await api.post(`/onboarding/school/${schoolId}/complete`, {
          adminEmail: data.adminEmail, adminPassword: data.adminPassword,
          adminFirstName: data.adminFirstName, adminLastName: data.adminLastName,
        })
        router.push(`/${locale}/auth/login?registered=1`)
        return
      }
      setStep((s) => s + 1)
    } catch (e: any) {
      setError(e.response?.data?.message || 'An error occurred, please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-72 bg-primary-900 flex-col p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
            <span className="text-primary-900 font-bold text-lg">E</span>
          </div>
          <span className="text-white font-bold text-xl">EduCore</span>
        </div>
        <div className="space-y-2">
          {STEPS.map((s) => {
            const isActive = step === s.id
            const isDone = step > s.id
            return (
              <div key={s.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-white/10' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isDone ? 'bg-green-400 text-white' : isActive ? 'bg-white text-primary-900' : 'bg-white/20 text-white/60'}`}>
                  {isDone ? <CheckCircle2 size={16} /> : s.id}
                </div>
                <div>
                  <p className={`text-sm font-medium ${isActive ? 'text-white' : isDone ? 'text-green-300' : 'text-white/60'}`}>
                    {isRtl ? s.labelAr : s.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-auto">
          <p className="text-white/40 text-xs">{isRtl ? 'جميع الحقول المميزة بـ * مطلوبة' : 'Fields marked * are required'}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Mobile steps indicator */}
          <div className="flex lg:hidden items-center justify-center gap-1 mb-8">
            {STEPS.map((s) => (
              <div key={s.id} className={`h-1.5 rounded-full transition-all ${step === s.id ? 'w-8 bg-primary-900' : step > s.id ? 'w-4 bg-green-400' : 'w-4 bg-gray-200'}`} />
            ))}
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          {step === 1 && <Step1 data={data} set={set} isRtl={isRtl} />}
          {step === 2 && <Step2 data={data} set={set} isRtl={isRtl} onCurriculumToggle={onCurriculumToggle} />}
          {step === 3 && <Step3 data={data} set={set} isRtl={isRtl} />}
          {step === 4 && <Step4 data={data} set={set} isRtl={isRtl} />}
          {step === 5 && <Step5 data={data} set={set} isRtl={isRtl} />}
          {step === 6 && <Step6 data={data} set={set} isRtl={isRtl} />}

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button onClick={() => setStep((s) => s - 1)} className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <ChevronLeft size={16} /> {isRtl ? 'السابق' : 'Back'}
              </button>
            )}
            <button
              onClick={next}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-primary-800 transition-colors disabled:opacity-60"
            >
              {loading ? (isRtl ? 'جارٍ المعالجة...' : 'Processing...') : step === 6 ? (isRtl ? 'إطلاق المنصة 🚀' : 'Launch Platform 🚀') : (isRtl ? 'التالي' : 'Continue')}
              {!loading && step < 6 && <ChevronRight size={16} />}
            </button>
          </div>

          {step === 1 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              {isRtl ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
              <a href={`/${locale}/auth/login`} className="text-primary-600 font-medium hover:underline">
                {isRtl ? 'تسجيل الدخول' : 'Sign in'}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Step components ──────────────────────────────────────────────────────────

function Step1({ data, set, isRtl }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'إنشاء حساب المنظمة' : 'Create your organization'}</h1>
        <p className="text-gray-500 text-sm mt-1">{isRtl ? 'ابدأ تجربتك المجانية لمدة 14 يوماً' : 'Start your 14-day free trial — no credit card required'}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'اسم المنظمة / الشركة *' : 'Organization / Company Name *'}</label>
          <input value={data.orgName} onChange={(e) => set('orgName', e.target.value)} placeholder="e.g. Al-Nour Educational Group" className={inputCls()} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الاسم الأول *' : 'First Name *'}</label>
          <input value={data.ownerFirstName} onChange={(e) => set('ownerFirstName', e.target.value)} className={inputCls()} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الاسم الأخير *' : 'Last Name *'}</label>
          <input value={data.ownerLastName} onChange={(e) => set('ownerLastName', e.target.value)} className={inputCls()} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'البريد الإلكتروني *' : 'Email Address *'}</label>
          <input type="email" value={data.ownerEmail} onChange={(e) => set('ownerEmail', e.target.value)} className={inputCls()} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'كلمة المرور *' : 'Password *'}</label>
          <input type="password" value={data.ownerPassword} onChange={(e) => set('ownerPassword', e.target.value)} placeholder="Min. 8 characters" className={inputCls()} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الدولة *' : 'Country *'}</label>
          <select value={data.countryCode} onChange={(e) => set('countryCode', e.target.value)} className={inputCls()}>
            <option value="SA">Saudi Arabia</option><option value="EG">Egypt</option>
            <option value="AE">UAE</option><option value="KW">Kuwait</option>
            <option value="QA">Qatar</option><option value="BH">Bahrain</option>
            <option value="OM">Oman</option><option value="JO">Jordan</option>
            <option value="US">United States</option><option value="GB">United Kingdom</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function Step2({ data, set, isRtl, onCurriculumToggle }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'بيانات المدرسة' : 'School Information'}</h1>
        <p className="text-gray-500 text-sm mt-1">{isRtl ? 'أدخل معلومات المدرسة الأساسية' : 'Enter your school\'s basic information'}</p>
      </div>

      {/* Curriculum selector — multi-select */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">{isRtl ? 'نوع المناهج الدراسية *' : 'Curriculum Type *'}</label>
        <p className="text-xs text-gray-500 mb-3">{isRtl ? 'يمكنك اختيار أكثر من نوع' : 'You can select multiple curricula'}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CURRICULUM_TYPES.map((c) => {
            const selected = data.curriculumTypes.includes(c.value)
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => onCurriculumToggle(c.value)}
                className={`relative p-3 rounded-xl border-2 text-left transition-all ${selected ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                {selected && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
                <p className={`text-sm font-semibold pr-5 ${selected ? 'text-primary-700' : 'text-gray-900'}`}>{isRtl ? c.labelAr : c.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
              </button>
            )
          })}
        </div>
        {data.curriculumTypes.length > 1 && (
          <p className="mt-2 text-xs text-primary-600 font-medium">
            {isRtl ? `تم اختيار ${data.curriculumTypes.length} مناهج — سيتم إنشاء مدرسة لكل منهج` : `${data.curriculumTypes.length} curricula selected — one school will be created per curriculum`}
          </p>
        )}
      </div>

      {/* Per-curriculum school names (shown when multiple curricula selected) */}
      {data.curriculumTypes.length > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-800">
            {isRtl ? 'اسم كل مدرسة *' : 'Name each school *'}
          </p>
          {data.schoolEntries.map((entry: { curriculum: string; name: string; nameAr: string }, i: number) => (
            <div key={entry.curriculum} className="flex items-center gap-3">
              <span className="text-xs font-bold text-blue-700 w-20 shrink-0">{entry.curriculum}</span>
              <input
                placeholder={isRtl ? 'الاسم بالإنجليزية' : 'School name (EN)'}
                value={entry.name}
                onChange={(e) => {
                  const next = [...data.schoolEntries]
                  next[i] = { ...entry, name: e.target.value }
                  set('schoolEntries', next)
                }}
                className="flex-1 border border-blue-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 bg-white"
              />
              <input
                dir="rtl"
                placeholder="الاسم بالعربية"
                value={entry.nameAr}
                onChange={(e) => {
                  const next = [...data.schoolEntries]
                  next[i] = { ...entry, nameAr: e.target.value }
                  set('schoolEntries', next)
                }}
                className="flex-1 border border-blue-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 bg-white"
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Single-curriculum name fields — hidden when multiple curricula have per-entry names */}
        {data.curriculumTypes.length === 1 && (
          <>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'اسم المدرسة (إنجليزي) *' : 'School Name (English) *'}</label>
              <input value={data.schoolName} onChange={(e) => set('schoolName', e.target.value)} placeholder="e.g. Al-Nour International School" className={inputCls()} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'اسم المدرسة (عربي)' : 'School Name (Arabic)'}</label>
              <input dir="rtl" value={data.schoolNameAr} onChange={(e) => set('schoolNameAr', e.target.value)} placeholder="مدرسة النور الدولية" className={inputCls()} />
            </div>
          </>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'البريد الإلكتروني *' : 'School Email *'}</label>
          <input type="email" value={data.schoolEmail} onChange={(e) => set('schoolEmail', e.target.value)} className={inputCls()} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'رقم الهاتف' : 'Phone'}</label>
          <input type="tel" value={data.schoolPhone} onChange={(e) => set('schoolPhone', e.target.value)} className={inputCls()} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'المدينة' : 'City'}</label>
          <input value={data.schoolCity} onChange={(e) => set('schoolCity', e.target.value)} className={inputCls()} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'عدد الطلاب المتوقع' : 'Expected Students'}</label>
          <input type="number" value={data.numberOfStudents} onChange={(e) => set('numberOfStudents', e.target.value)} className={inputCls()} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'لغة التدريس' : 'Language'}</label>
          <select value={data.language} onChange={(e) => set('language', e.target.value)} className={inputCls()}>
            <option value="ARABIC">Arabic</option>
            <option value="ENGLISH">English</option>
            <option value="BILINGUAL">Bilingual</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'العملة' : 'Currency'}</label>
          <select value={data.currency} onChange={(e) => set('currency', e.target.value)} className={inputCls()}>
            <option value="SAR">SAR — Saudi Riyal</option>
            <option value="EGP">EGP — Egyptian Pound</option>
            <option value="AED">AED — UAE Dirham</option>
            <option value="USD">USD — US Dollar</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="KWD">KWD — Kuwaiti Dinar</option>
            <option value="QAR">QAR — Qatari Riyal</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'المنطقة الزمنية' : 'Timezone'}</label>
          <select value={data.timezone} onChange={(e) => set('timezone', e.target.value)} className={inputCls()}>
            <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
            <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
            <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
            <option value="Asia/Kuwait">Asia/Kuwait (GMT+3)</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/London">Europe/London</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function Step3({ data, set, isRtl }: any) {
  const [activeTab, setActiveTab] = useState<string>(data.curriculumTypes[0] ?? 'CUSTOM')
  const [customDeptEn, setCustomDeptEn] = useState('')
  const [customDeptAr, setCustomDeptAr] = useState('')

  // Ensure activeTab is valid when curricula change
  const validTab = data.curriculumTypes.includes(activeTab) ? activeTab : (data.curriculumTypes[0] ?? 'CUSTOM')

  const updateStructure = (curriculum: string, updater: (s: SchoolStructure) => SchoolStructure) => {
    set('structureBySchool', {
      ...data.structureBySchool,
      [curriculum]: updater(data.structureBySchool[curriculum] ?? buildDefaultStructure(curriculum)),
    })
  }

  const toggleGrade = (curriculum: string, idx: number) => {
    updateStructure(curriculum, (s) => ({
      ...s,
      grades: s.grades.map((g, i) => i === idx ? { ...g, selected: !g.selected } : g),
    }))
  }

  const setSections = (curriculum: string, idx: number, sections: number) => {
    updateStructure(curriculum, (s) => ({
      ...s,
      grades: s.grades.map((g, i) => i === idx ? { ...g, sections } : g),
    }))
  }

  const toggleDept = (curriculum: string, idx: number) => {
    updateStructure(curriculum, (s) => ({
      ...s,
      depts: s.depts.map((d, i) => i === idx ? { ...d, selected: !d.selected } : d),
    }))
  }

  const addCustomDept = (curriculum: string) => {
    const name = customDeptEn.trim()
    const nameAr = customDeptAr.trim()
    if (!name) return
    updateStructure(curriculum, (s) => ({
      ...s,
      depts: [...s.depts, { name, nameAr: nameAr || name, selected: true }],
    }))
    setCustomDeptEn('')
    setCustomDeptAr('')
  }

  const structure: SchoolStructure = data.structureBySchool[validTab] ?? buildDefaultStructure(validTab)
  const preview = expandGrades(structure.grades)
  const selectedDepts = structure.depts.filter((d) => d.selected)

  // Curriculum display labels
  const currLabel = (c: string) => CURRICULUM_TYPES.find((t) => t.value === c)?.[isRtl ? 'labelAr' : 'label'] ?? c

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الهيكل الأكاديمي' : 'Academic Structure'}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isRtl
            ? 'تم ملء المراحل الدراسية تلقائياً بناءً على المنهج — خصّص حسب الحاجة'
            : 'Grade levels pre-filled based on your curriculum — toggle to include/exclude, set sections per grade'}
        </p>
      </div>

      {/* School tabs — only when multiple curricula */}
      {data.curriculumTypes.length > 1 && (
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {data.curriculumTypes.map((c: string) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveTab(c)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                validTab === c
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {currLabel(c)}
            </button>
          ))}
        </div>
      )}

      {/* Grade Levels — chip grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-800">
            {isRtl ? 'المراحل الدراسية' : 'Grade Levels'}
          </label>
          <span className="text-xs text-gray-400">
            {isRtl
              ? `${structure.grades.filter((g) => g.selected).length} مرحلة — ${preview.length} فصل`
              : `${structure.grades.filter((g) => g.selected).length} grades → ${preview.length} classes`}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {structure.grades.map((g, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 rounded-full border-2 pl-3 pr-1 py-1 transition-all ${
                g.selected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-gray-50 opacity-50'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleGrade(validTab, i)}
                className={`text-xs font-medium leading-none ${g.selected ? 'text-primary-700' : 'text-gray-500'}`}
              >
                {isRtl ? g.nameAr : g.name}
              </button>
              {g.selected && (
                <select
                  value={g.sections}
                  onChange={(e) => setSections(validTab, i, +e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] border border-primary-300 rounded-full px-1 py-0.5 bg-white text-primary-700 outline-none cursor-pointer"
                >
                  <option value={1}>{isRtl ? 'بدون' : 'No sec.'}</option>
                  <option value={2}>A, B</option>
                  <option value={3}>A, B, C</option>
                  <option value={4}>A – D</option>
                  <option value={5}>A – E</option>
                  <option value={6}>A – F</option>
                </select>
              )}
            </div>
          ))}
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5">
              {isRtl ? 'معاينة الفصول الدراسية' : 'Class preview'}
            </p>
            <div className="flex flex-wrap gap-1">
              {preview.map((p, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-600">
                  {isRtl ? p.nameAr : p.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Departments — chip grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-800">
            {isRtl ? 'الأقسام الأكاديمية' : 'Departments'}
          </label>
          <span className="text-xs text-gray-400">
            {selectedDepts.length} {isRtl ? 'قسم مختار' : 'selected'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {structure.depts.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDept(validTab, i)}
              className={`px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-all ${
                d.selected
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
              }`}
            >
              {isRtl ? d.nameAr : d.name}
            </button>
          ))}
        </div>

        {/* Custom department add */}
        <div className="mt-3 flex gap-2 items-center">
          <input
            value={customDeptEn}
            onChange={(e) => setCustomDeptEn(e.target.value)}
            placeholder={isRtl ? 'اسم القسم (EN)' : 'Custom dept name (EN)'}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary-400 bg-white"
          />
          <input
            dir="rtl"
            value={customDeptAr}
            onChange={(e) => setCustomDeptAr(e.target.value)}
            placeholder="اسم القسم (AR)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary-400 bg-white"
          />
          <button
            type="button"
            onClick={() => addCustomDept(validTab)}
            disabled={!customDeptEn.trim()}
            className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 whitespace-nowrap"
          >
            {isRtl ? '+ إضافة' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Step4({ data, set, isRtl }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'إعداد العام الدراسي' : 'Academic Year Setup'}</h1>
        <p className="text-gray-500 text-sm mt-1">{isRtl ? 'حدد بداية العام الدراسي وعدد الفصول' : 'Set your academic year dates and term structure'}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'اسم العام الدراسي *' : 'Academic Year Name *'}</label>
          <input value={data.yearName} onChange={(e) => set('yearName', e.target.value)} placeholder="2025-2026" className={inputCls()} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'تاريخ البداية *' : 'Start Date *'}</label>
          <input type="date" value={data.yearStart} onChange={(e) => set('yearStart', e.target.value)} className={inputCls()} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'تاريخ النهاية *' : 'End Date *'}</label>
          <input type="date" value={data.yearEnd} onChange={(e) => set('yearEnd', e.target.value)} className={inputCls()} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'عدد الفصول الدراسية *' : 'Number of Terms *'}</label>
          <select value={data.termCount} onChange={(e) => set('termCount', e.target.value)} className={inputCls()}>
            <option value="2">2 Semesters</option>
            <option value="3">3 Terms</option>
            <option value="4">4 Quarters</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function Step5({ data, set, isRtl }: any) {
  const toggle = (key: string) => {
    set('enabledModules', data.enabledModules.includes(key)
      ? data.enabledModules.filter((m: string) => m !== key)
      : [...data.enabledModules, key])
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الوحدات والميزات' : 'Modules & Features'}</h1>
        <p className="text-gray-500 text-sm mt-1">{isRtl ? 'تم تفعيل الوحدات الموصى بها لنوع مناهجك — يمكنك التخصيص' : 'Recommended modules selected for your curriculum — customize as needed'}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ALL_MODULES.map((m) => {
          const enabled = data.enabledModules.includes(m.key)
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => toggle(m.key)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${enabled ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className={`w-4 h-4 rounded border-2 mb-2 flex items-center justify-center ${enabled ? 'border-primary-600 bg-primary-600' : 'border-gray-300'}`}>
                {enabled && <CheckCircle2 size={10} className="text-white" />}
              </div>
              <p className={`text-xs font-semibold ${enabled ? 'text-primary-700' : 'text-gray-700'}`}>{isRtl ? m.labelAr : m.label}</p>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-gray-400">{data.enabledModules.length} {isRtl ? 'وحدة مفعلة' : 'modules enabled'}</p>
    </div>
  )
}

function Step6({ data, set, isRtl }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'حساب مدير المدرسة' : 'School Admin Account'}</h1>
        <p className="text-gray-500 text-sm mt-1">{isRtl ? 'أنشئ حساب المدير الذي سيدير هذه المدرسة' : 'Create the administrator account who will manage this school'}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الاسم الأول *' : 'First Name *'}</label>
          <input value={data.adminFirstName} onChange={(e) => set('adminFirstName', e.target.value)} className={inputCls()} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الاسم الأخير *' : 'Last Name *'}</label>
          <input value={data.adminLastName} onChange={(e) => set('adminLastName', e.target.value)} className={inputCls()} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'البريد الإلكتروني *' : 'Admin Email *'}</label>
          <input type="email" value={data.adminEmail} onChange={(e) => set('adminEmail', e.target.value)} className={inputCls()} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'كلمة المرور *' : 'Admin Password *'}</label>
          <input type="password" value={data.adminPassword} onChange={(e) => set('adminPassword', e.target.value)} className={inputCls()} />
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs text-blue-700 font-medium">{isRtl ? 'ملخص الإعداد' : 'Setup Summary'}</p>
        <ul className="mt-2 space-y-1 text-xs text-blue-600">
          <li>🏫 {isRtl ? 'المدارس:' : 'Schools:'} {data.schoolEntries.map((e: any) => e.name || e.curriculum).join(', ') || '—'}</li>
          <li>📚 {isRtl ? 'المناهج:' : 'Curricula:'} {data.curriculumTypes.join(', ')}</li>
          <li>🎓 {isRtl ? 'الفصول الدراسية:' : 'Classes:'} {Object.values(data.structureBySchool as Record<string, SchoolStructure>).reduce((sum, s) => sum + expandGrades(s.grades).length, 0)}</li>
          <li>🏢 {isRtl ? 'الأقسام:' : 'Departments:'} {Object.values(data.structureBySchool as Record<string, SchoolStructure>).reduce((sum, s) => sum + s.depts.filter((d) => d.selected).length, 0)}</li>
          <li>🧩 {isRtl ? 'الوحدات المفعلة:' : 'Modules enabled:'} {data.enabledModules.length}</li>
        </ul>
      </div>
    </div>
  )
}
