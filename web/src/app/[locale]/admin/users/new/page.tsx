'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { Card, CardHeader, CardBody, Button } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'

const ROLES = [
  'STUDENT', 'PARENT', 'TEACHER', 'SUB_TEACHER', 'SCHOOL_ADMIN',
  'VICE_PRINCIPAL', 'ACADEMIC_DIRECTOR', 'DEPARTMENT_HEAD',
  'COUNSELOR', 'ACTIVITIES_COORDINATOR', 'RECEPTIONIST',
  'ADMISSION_OFFICER', 'HR_MANAGER', 'FINANCE_OFFICER',
  'STORE_MANAGER', 'CANTEEN_MANAGER', 'IT_ADMIN', 'IT_MANAGER', 'IT_STAFF', 'MATRON',
  'TRANSPORT_MANAGER', 'LIBRARIAN', 'NURSE', 'EVENT_COORDINATOR', 'SUPPORT_AGENT',
  'CFO', 'FINANCE_MANAGER', 'SCHOOL_ACCOUNTANT', 'CASHIER',
  'PAYROLL_OFFICER', 'PROCUREMENT_OFFICER', 'AUDITOR', 'BRANCH_FINANCE_ADMIN',
]

export default function NewUserPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const router = useRouter()

  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
    firstNameAr: '', lastNameAr: '', role: 'STUDENT', phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/users', form)
      router.push(`/${locale}/admin/users`)
    } catch (err: any) {
      setError(err.response?.data?.message || (isRtl ? 'حدث خطأ' : 'An error occurred'))
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isRtl ? 'إضافة مستخدم جديد' : 'Create New User'}
          </h1>
          <p className="text-gray-500 text-sm">{isRtl ? 'أدخل بيانات المستخدم الجديد' : 'Fill in the details for the new user'}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">{isRtl ? 'معلومات المستخدم' : 'User Information'}</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {isRtl ? 'الاسم الأول (إنجليزي)' : 'First Name (EN)'} *
                </label>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {isRtl ? 'الاسم الأخير (إنجليزي)' : 'Last Name (EN)'} *
                </label>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {isRtl ? 'الاسم الأول (عربي)' : 'First Name (AR)'}
                </label>
                <input
                  dir="rtl"
                  value={form.firstNameAr}
                  onChange={(e) => set('firstNameAr', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {isRtl ? 'الاسم الأخير (عربي)' : 'Last Name (AR)'}
                </label>
                <input
                  dir="rtl"
                  value={form.lastNameAr}
                  onChange={(e) => set('lastNameAr', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {isRtl ? 'البريد الإلكتروني' : 'Email Address'} *
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {isRtl ? 'كلمة المرور' : 'Password'} *
              </label>
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {isRtl ? 'الدور' : 'Role'} *
                </label>
                <select
                  value={form.role}
                  onChange={(e) => set('role', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {isRtl ? 'رقم الهاتف' : 'Phone'}
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                {isRtl ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...') : (isRtl ? 'إنشاء المستخدم' : 'Create User')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
