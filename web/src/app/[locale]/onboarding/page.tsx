'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { api } from '@/lib/api'
import {
  Building2, User, Calendar, Puzzle, CheckCircle2,
  ChevronRight, ChevronLeft, GraduationCap, Layers,
} from 'lucide-react'

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
  curriculumType: string
  language: string
  currency: string
  numberOfStudents: string
  // Step 3 — Structure
  gradeLevels: { name: string; nameAr: string; order: number }[]
  departments: { name: string; nameAr: string }[]
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

const DEFAULT_GRADE_LEVELS_BY_CURRICULUM: Record<string, { name: string; nameAr: string }[]> = {
  BRITISH:  [{ name:'Year 1',nameAr:'السنة الأولى' },{ name:'Year 2',nameAr:'السنة الثانية' },{ name:'Year 3',nameAr:'السنة الثالثة' },{ name:'Year 4',nameAr:'السنة الرابعة' },{ name:'Year 5',nameAr:'السنة الخامسة' },{ name:'Year 6',nameAr:'السنة السادسة' },{ name:'Year 7',nameAr:'السنة السابعة' },{ name:'Year 8',nameAr:'السنة الثامنة' },{ name:'Year 9',nameAr:'السنة التاسعة' },{ name:'Year 10',nameAr:'السنة العاشرة' },{ name:'Year 11',nameAr:'السنة الحادية عشرة' },{ name:'Year 12',nameAr:'السنة الثانية عشرة' },{ name:'Year 13',nameAr:'السنة الثالثة عشرة' }],
  AMERICAN: [{ name:'Grade 1',nameAr:'الصف الأول' },{ name:'Grade 2',nameAr:'الصف الثاني' },{ name:'Grade 3',nameAr:'الصف الثالث' },{ name:'Grade 4',nameAr:'الصف الرابع' },{ name:'Grade 5',nameAr:'الصف الخامس' },{ name:'Grade 6',nameAr:'الصف السادس' },{ name:'Grade 7',nameAr:'الصف السابع' },{ name:'Grade 8',nameAr:'الصف الثامن' },{ name:'Grade 9',nameAr:'الصف التاسع' },{ name:'Grade 10',nameAr:'الصف العاشر' },{ name:'Grade 11',nameAr:'الصف الحادي عشر' },{ name:'Grade 12',nameAr:'الصف الثاني عشر' }],
  EGYPTIAN: [{ name:'الصف الأول الابتدائي',nameAr:'الصف الأول الابتدائي' },{ name:'الصف الثاني الابتدائي',nameAr:'الصف الثاني الابتدائي' },{ name:'الصف الثالث الابتدائي',nameAr:'الصف الثالث الابتدائي' },{ name:'الصف الرابع الابتدائي',nameAr:'الصف الرابع الابتدائي' },{ name:'الصف الخامس الابتدائي',nameAr:'الصف الخامس الابتدائي' },{ name:'الصف السادس الابتدائي',nameAr:'الصف السادس الابتدائي' },{ name:'الصف الأول الإعدادي',nameAr:'الصف الأول الإعدادي' },{ name:'الصف الثاني الإعدادي',nameAr:'الصف الثاني الإعدادي' },{ name:'الصف الثالث الإعدادي',nameAr:'الصف الثالث الإعدادي' },{ name:'الصف الأول الثانوي',nameAr:'الصف الأول الثانوي' },{ name:'الصف الثاني الثانوي',nameAr:'الصف الثاني الثانوي' },{ name:'الصف الثالث الثانوي',nameAr:'الصف الثالث الثانوي' }],
  IB:       [{ name:'PYP Year 1',nameAr:'PYP سنة 1' },{ name:'PYP Year 2',nameAr:'PYP سنة 2' },{ name:'PYP Year 3',nameAr:'PYP سنة 3' },{ name:'PYP Year 4',nameAr:'PYP سنة 4' },{ name:'PYP Year 5',nameAr:'PYP سنة 5' },{ name:'PYP Year 6',nameAr:'PYP سنة 6' },{ name:'MYP Year 1',nameAr:'MYP سنة 1' },{ name:'MYP Year 2',nameAr:'MYP سنة 2' },{ name:'MYP Year 3',nameAr:'MYP سنة 3' },{ name:'MYP Year 4',nameAr:'MYP سنة 4' },{ name:'MYP Year 5',nameAr:'MYP سنة 5' },{ name:'DP Year 1',nameAr:'DP سنة 1' },{ name:'DP Year 2',nameAr:'DP سنة 2' }],
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
  const [schoolId, setSchoolId] = useState('')

  const [data, setData] = useState<WizardData>({
    orgName: '', ownerEmail: '', ownerPassword: '', ownerFirstName: '', ownerLastName: '', countryCode: 'SA',
    schoolName: '', schoolNameAr: '', schoolEmail: '', schoolPhone: '', schoolCity: '', schoolAddress: '', schoolWebsite: '', timezone: 'Asia/Riyadh', curriculumType: 'CUSTOM', language: 'BILINGUAL', currency: 'USD', numberOfStudents: '500',
    gradeLevels: [], departments: [{ name: 'General', nameAr: 'عام' }],
    yearName: '2025-2026', yearStart: '2025-09-01', yearEnd: '2026-06-30', termCount: '3',
    enabledModules: CURRICULUM_DEFAULT_MODULES.CUSTOM,
    adminEmail: '', adminPassword: '', adminFirstName: '', adminLastName: '',
  })

  const set = (field: keyof WizardData, value: any) => setData((d) => ({ ...d, [field]: value }))

  const onCurriculumChange = (curriculum: string) => {
    set('curriculumType', curriculum)
    const defaults = DEFAULT_GRADE_LEVELS_BY_CURRICULUM[curriculum]
    if (defaults) set('gradeLevels', defaults.map((g, i) => ({ ...g, order: i + 1 })))
    set('enabledModules', CURRICULUM_DEFAULT_MODULES[curriculum] ?? CURRICULUM_DEFAULT_MODULES.CUSTOM)
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
        setOrgId(res.data.organization.id)
      } else if (step === 2) {
        const res = await api.post('/onboarding/school', {
          organizationId: orgId,
          name: data.schoolName, nameAr: data.schoolNameAr, email: data.schoolEmail,
          phone: data.schoolPhone, city: data.schoolCity, address: data.schoolAddress,
          website: data.schoolWebsite, timezone: data.timezone, countryCode: data.countryCode,
          curriculumType: data.curriculumType, language: data.language, currency: data.currency,
          numberOfStudents: parseInt(data.numberOfStudents) || 0,
        })
        setSchoolId(res.data.id)
      } else if (step === 3) {
        await api.post(`/onboarding/school/${schoolId}/structure`, {
          gradeLevels: data.gradeLevels,
          departments: data.departments,
        })
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
          curriculumType: data.curriculumType, enabledModules: data.enabledModules,
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
          {step === 2 && <Step2 data={data} set={set} isRtl={isRtl} onCurriculumChange={onCurriculumChange} />}
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

function Step2({ data, set, isRtl, onCurriculumChange }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'بيانات المدرسة' : 'School Information'}</h1>
        <p className="text-gray-500 text-sm mt-1">{isRtl ? 'أدخل معلومات المدرسة الأساسية' : 'Enter your school\'s basic information'}</p>
      </div>

      {/* Curriculum selector — most important choice */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-3">{isRtl ? 'نوع المناهج الدراسية *' : 'Curriculum Type *'}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CURRICULUM_TYPES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onCurriculumChange(c.value)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${data.curriculumType === c.value ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <p className={`text-sm font-semibold ${data.curriculumType === c.value ? 'text-primary-700' : 'text-gray-900'}`}>{isRtl ? c.labelAr : c.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'اسم المدرسة (إنجليزي) *' : 'School Name (English) *'}</label>
          <input value={data.schoolName} onChange={(e) => set('schoolName', e.target.value)} placeholder="e.g. Al-Nour International School" className={inputCls()} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'اسم المدرسة (عربي)' : 'School Name (Arabic)'}</label>
          <input dir="rtl" value={data.schoolNameAr} onChange={(e) => set('schoolNameAr', e.target.value)} placeholder="مدرسة النور الدولية" className={inputCls()} />
        </div>
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
  const addLevel = () => set('gradeLevels', [...data.gradeLevels, { name: '', nameAr: '', order: data.gradeLevels.length + 1 }])
  const removeLevel = (i: number) => set('gradeLevels', data.gradeLevels.filter((_: any, idx: number) => idx !== i))
  const addDept = () => set('departments', [...data.departments, { name: '', nameAr: '' }])
  const removeDept = (i: number) => set('departments', data.departments.filter((_: any, idx: number) => idx !== i))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الهيكل الأكاديمي' : 'Academic Structure'}</h1>
        <p className="text-gray-500 text-sm mt-1">{isRtl ? 'تم ملء المراحل الدراسية تلقائياً بناءً على المناهج' : 'Grade levels pre-filled based on your curriculum — customize as needed'}</p>
      </div>

      {/* Grade Levels */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-800">{isRtl ? 'المراحل الدراسية' : 'Grade Levels'}</label>
          <button type="button" onClick={addLevel} className="text-xs text-primary-600 font-medium hover:underline">+ Add</button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {data.gradeLevels.map((g: any, i: number) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={g.name} onChange={(e) => { const l = [...data.gradeLevels]; l[i] = { ...l[i], name: e.target.value }; set('gradeLevels', l) }} placeholder="Grade name (EN)" className={inputCls()} />
              <input dir="rtl" value={g.nameAr} onChange={(e) => { const l = [...data.gradeLevels]; l[i] = { ...l[i], nameAr: e.target.value }; set('gradeLevels', l) }} placeholder="الاسم" className={`${inputCls()} w-32`} />
              <button type="button" onClick={() => removeLevel(i)} className="text-red-400 hover:text-red-600 shrink-0 text-xs">✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Departments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-800">{isRtl ? 'الأقسام الأكاديمية' : 'Departments'}</label>
          <button type="button" onClick={addDept} className="text-xs text-primary-600 font-medium hover:underline">+ Add</button>
        </div>
        <div className="space-y-2">
          {data.departments.map((d: any, i: number) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={d.name} onChange={(e) => { const arr = [...data.departments]; arr[i] = { ...arr[i], name: e.target.value }; set('departments', arr) }} placeholder="Department name (EN)" className={inputCls()} />
              <input dir="rtl" value={d.nameAr} onChange={(e) => { const arr = [...data.departments]; arr[i] = { ...arr[i], nameAr: e.target.value }; set('departments', arr) }} placeholder="اسم القسم" className={`${inputCls()} w-32`} />
              <button type="button" onClick={() => removeDept(i)} className="text-red-400 hover:text-red-600 shrink-0 text-xs">✕</button>
            </div>
          ))}
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
          <li>🏫 {isRtl ? 'المدرسة:' : 'School:'} {data.schoolName || '—'}</li>
          <li>📚 {isRtl ? 'المناهج:' : 'Curriculum:'} {data.curriculumType}</li>
          <li>🎓 {isRtl ? 'المراحل الدراسية:' : 'Grade levels:'} {data.gradeLevels.length}</li>
          <li>🧩 {isRtl ? 'الوحدات المفعلة:' : 'Modules enabled:'} {data.enabledModules.length}</li>
        </ul>
      </div>
    </div>
  )
}
