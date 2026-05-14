'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getApiError } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Skeleton } from '@/components/ui'
import { Settings, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()

  const { data: school, isLoading } = useQuery({
    queryKey: ['school-settings'],
    queryFn: () => api.get('/schools/my/settings').then(r => r.data?.data),
  })

  const [form, setForm] = useState({
    name: '', nameAr: '', email: '', phone: '', address: '', currency: 'SAR', timezone: 'Asia/Riyadh',
    primaryColor: '#1e3a5f', gradingSystem: 'PERCENTAGE',
  })

  useEffect(() => {
    if (school) {
      setForm({
        name: school.name || '',
        nameAr: school.nameAr || '',
        email: school.email || '',
        phone: school.phone || '',
        address: school.address || '',
        currency: school.settings?.currency || 'SAR',
        timezone: school.settings?.timezone || 'Asia/Riyadh',
        primaryColor: school.settings?.primaryColor || '#1e3a5f',
        gradingSystem: school.settings?.gradingSystem || 'PERCENTAGE',
      })
    }
  }, [school])

  const save = useMutation({
    mutationFn: (data: any) => api.patch('/schools/my/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-settings'] })
      toast.success(isRtl ? 'تم حفظ الإعدادات' : 'Settings saved')
    },
    onError: (err: any) => toast.error(getApiError(err, isRtl ? 'حدث خطأ' : 'Failed to save')),
  })

  const fields = [
    { key: 'name', label: isRtl ? 'اسم المدرسة (إنجليزي)' : 'School Name (English)', type: 'text' },
    { key: 'nameAr', label: isRtl ? 'اسم المدرسة (عربي)' : 'School Name (Arabic)', type: 'text', dir: 'rtl' },
    { key: 'email', label: isRtl ? 'البريد الإلكتروني' : 'Email', type: 'email' },
    { key: 'phone', label: isRtl ? 'الهاتف' : 'Phone', type: 'text' },
    { key: 'address', label: isRtl ? 'العنوان' : 'Address', type: 'text' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'إعدادات المدرسة' : 'School Settings'}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'إدارة إعدادات وبيانات المدرسة' : 'Manage school information and preferences'}</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* School Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-primary-700" />
                <h3 className="font-semibold text-gray-900">{isRtl ? 'معلومات المدرسة' : 'School Information'}</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {fields.map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                    <input
                      type={f.type}
                      value={(form as any)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      dir={(f as any).dir}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                    />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">{isRtl ? 'التفضيلات' : 'Preferences'}</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'العملة' : 'Currency'}</label>
                  <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500">
                    <option value="SAR">SAR - ريال سعودي</option>
                    <option value="AED">AED - درهم إماراتي</option>
                    <option value="EGP">EGP - جنيه مصري</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'نظام التقييم' : 'Grading System'}</label>
                  <select value={form.gradingSystem} onChange={e => setForm(p => ({ ...p, gradingSystem: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500">
                    <option value="PERCENTAGE">{isRtl ? 'نسبة مئوية' : 'Percentage'}</option>
                    <option value="LETTER">{isRtl ? 'حروف (A, B, C)' : 'Letter Grades (A, B, C)'}</option>
                    <option value="GPA">GPA (4.0)</option>
                    <option value="POINTS">{isRtl ? 'نقاط' : 'Points'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'المنطقة الزمنية' : 'Timezone'}</label>
                  <select value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500">
                    <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                    <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                    <option value="Europe/London">Europe/London (GMT+0)</option>
                    <option value="America/New_York">America/New_York (GMT-5)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'اللون الرئيسي' : 'Primary Color'}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={form.primaryColor} onChange={e => setForm(p => ({ ...p, primaryColor: e.target.value }))} className="h-10 w-20 border border-gray-200 rounded-xl cursor-pointer" />
                    <span className="text-sm text-gray-500 font-mono">{form.primaryColor}</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={() => save.mutate(form)}
          disabled={save.isPending}
          className="flex items-center gap-2 bg-primary-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-50"
        >
          <Save size={16} />
          {save.isPending ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...') : (isRtl ? 'حفظ الإعدادات' : 'Save Settings')}
        </button>
      </div>
    </div>
  )
}
