'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api, getApiError } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody } from '@/components/ui'
import {
  Building2, Bell, Shield, User, CreditCard, Save, Eye, EyeOff,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'

export default function OwnerSettingsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  // Organization profile
  const [orgForm, setOrgForm] = useState({ name: '', nameAr: '', email: '', phone: '', website: '', address: '' })
  const [orgLoaded, setOrgLoaded] = useState(false)

  useQuery({
    queryKey: ['owner-org'],
    queryFn: () => api.get('/owner/org').then((r) => r.data?.data),
    onSuccess: (data: any) => {
      if (data && !orgLoaded) {
        setOrgForm({
          name: data.name || '',
          nameAr: data.nameAr || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          address: data.address || '',
        })
        setOrgLoaded(true)
      }
    },
  } as any)

  const saveOrg = useMutation({
    mutationFn: (data: any) => api.patch('/owner/org', data),
    onSuccess: () => toast.success(isRtl ? 'تم حفظ بيانات المنظمة' : 'Organization profile saved'),
    onError: (err: any) => toast.error(getApiError(err, isRtl ? 'حدث خطأ' : 'Failed to save')),
  })

  // Personal account
  const [accountForm, setAccountForm] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    email: user?.email || '',
  })

  const saveAccount = useMutation({
    mutationFn: (data: any) => api.patch('/auth/profile', data),
    onSuccess: (res: any) => {
      if (res.data?.data) setUser(res.data.data)
      toast.success(isRtl ? 'تم تحديث الحساب' : 'Account updated')
    },
    onError: (err: any) => toast.error(getApiError(err, isRtl ? 'حدث خطأ' : 'Failed to update')),
  })

  // Change password
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)

  const changePw = useMutation({
    mutationFn: (data: any) => api.patch('/auth/change-password', data),
    onSuccess: () => {
      setPwForm({ current: '', next: '', confirm: '' })
      toast.success(isRtl ? 'تم تغيير كلمة المرور' : 'Password changed')
    },
    onError: (err: any) => toast.error(getApiError(err, isRtl ? 'كلمة المرور الحالية غير صحيحة' : 'Current password incorrect')),
  })

  // Notification preferences (local toggles — extend with API later)
  const [notifs, setNotifs] = useState({
    newSchoolAdmin: true,
    employeeCreated: true,
    leaveRequests: false,
    purchaseRequests: true,
    subscriptionExpiry: true,
    weeklyReport: true,
  })

  const NOTIF_ITEMS = [
    { key: 'newSchoolAdmin', label: isRtl ? 'إضافة مدير مدرسة جديد' : 'New school admin added' },
    { key: 'employeeCreated', label: isRtl ? 'إنشاء حساب موظف جديد' : 'New employee account created' },
    { key: 'leaveRequests', label: isRtl ? 'طلبات الإجازة' : 'Leave requests' },
    { key: 'purchaseRequests', label: isRtl ? 'طلبات الشراء' : 'Purchase requests' },
    { key: 'subscriptionExpiry', label: isRtl ? 'انتهاء الاشتراك' : 'Subscription expiry alerts' },
    { key: 'weeklyReport', label: isRtl ? 'التقرير الأسبوعي' : 'Weekly summary report' },
  ]

  function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${checked ? 'bg-primary-600' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الإعدادات' : 'Settings'}</h1>
        <p className="text-gray-500 text-sm mt-1">{isRtl ? 'إدارة حسابك ومنظمتك' : 'Manage your account and organization'}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ── Organization Profile ─────────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-primary-600" />
              <h3 className="font-semibold text-gray-900">{isRtl ? 'بيانات المنظمة' : 'Organization Profile'}</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{isRtl ? 'اسم المنظمة (إنجليزي) *' : 'Organization Name (English) *'}</label>
                <input value={orgForm.name} onChange={(e) => setOrgForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">اسم المنظمة (عربي)</label>
                <input dir="rtl" value={orgForm.nameAr} onChange={(e) => setOrgForm((f) => ({ ...f, nameAr: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{isRtl ? 'البريد الإلكتروني للتواصل' : 'Contact Email'}</label>
                <input type="email" value={orgForm.email} onChange={(e) => setOrgForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{isRtl ? 'رقم الهاتف' : 'Phone Number'}</label>
                <input type="tel" value={orgForm.phone} onChange={(e) => setOrgForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{isRtl ? 'الموقع الإلكتروني' : 'Website'}</label>
                <input type="url" value={orgForm.website} onChange={(e) => setOrgForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{isRtl ? 'العنوان' : 'Address'}</label>
                <input value={orgForm.address} onChange={(e) => setOrgForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => saveOrg.mutate(orgForm)}
                disabled={saveOrg.isPending}
                className="flex items-center gap-2 bg-primary-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-60"
              >
                <Save size={15} />
                {saveOrg.isPending ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التغييرات' : 'Save Changes')}
              </button>
            </div>
          </CardBody>
        </Card>

        {/* ── Personal Account ──────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User size={18} className="text-primary-600" />
              <h3 className="font-semibold text-gray-900">{isRtl ? 'معلومات حسابي' : 'My Account'}</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{isRtl ? 'الاسم الأول' : 'First Name'}</label>
                  <input value={accountForm.firstName} onChange={(e) => setAccountForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{isRtl ? 'اسم العائلة' : 'Last Name'}</label>
                  <input value={accountForm.lastName} onChange={(e) => setAccountForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{isRtl ? 'البريد الإلكتروني' : 'Email'}</label>
                <input type="email" value={accountForm.email} onChange={(e) => setAccountForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
              </div>
              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => saveAccount.mutate(accountForm)}
                  disabled={saveAccount.isPending}
                  className="flex items-center gap-2 bg-primary-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-60"
                >
                  <Save size={15} />
                  {isRtl ? 'تحديث' : 'Update'}
                </button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* ── Change Password ───────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-primary-600" />
              <h3 className="font-semibold text-gray-900">{isRtl ? 'تغيير كلمة المرور' : 'Change Password'}</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {[
                { key: 'current', label: isRtl ? 'كلمة المرور الحالية' : 'Current Password' },
                { key: 'next', label: isRtl ? 'كلمة المرور الجديدة' : 'New Password' },
                { key: 'confirm', label: isRtl ? 'تأكيد كلمة المرور' : 'Confirm New Password' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={(pwForm as any)[key]}
                      onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 pr-10"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              ))}
              {pwForm.next && pwForm.confirm && pwForm.next !== pwForm.confirm && (
                <p className="text-xs text-red-500">{isRtl ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}</p>
              )}
              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => changePw.mutate({ currentPassword: pwForm.current, newPassword: pwForm.next })}
                  disabled={!pwForm.current || !pwForm.next || pwForm.next !== pwForm.confirm || changePw.isPending}
                  className="flex items-center gap-2 bg-primary-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-60"
                >
                  <Shield size={15} />
                  {isRtl ? 'تغيير' : 'Change Password'}
                </button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* ── Subscription Info ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-primary-600" />
              <h3 className="font-semibold text-gray-900">{isRtl ? 'الاشتراك والخطة' : 'Subscription & Plan'}</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {[
                { label: isRtl ? 'الخطة الحالية' : 'Current Plan', value: 'Enterprise', badge: true },
                { label: isRtl ? 'تاريخ التجديد' : 'Renewal Date', value: '2027-01-01' },
                { label: isRtl ? 'عدد المدارس المسموح بها' : 'Schools Allowed', value: 'Unlimited' },
                { label: isRtl ? 'عدد المستخدمين المسموح بهم' : 'Users Allowed', value: 'Unlimited' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  {item.badge ? (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium">{item.value}</span>
                  ) : (
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  )}
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-1">{isRtl ? 'للترقية أو تغيير الخطة، تواصل مع الدعم الفني.' : 'To upgrade or change your plan, contact support.'}</p>
            </div>
          </CardBody>
        </Card>

        {/* ── Notification Preferences ──────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-primary-600" />
              <h3 className="font-semibold text-gray-900">{isRtl ? 'تفضيلات الإشعارات' : 'Notification Preferences'}</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {NOTIF_ITEMS.map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <Toggle
                    checked={(notifs as any)[item.key]}
                    onChange={() => setNotifs((n) => ({ ...n, [item.key]: !(n as any)[item.key] }))}
                  />
                </div>
              ))}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => toast.success(isRtl ? 'تم حفظ تفضيلات الإشعارات' : 'Notification preferences saved')}
                  className="flex items-center gap-2 bg-primary-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-800"
                >
                  <Save size={15} />
                  {isRtl ? 'حفظ' : 'Save'}
                </button>
              </div>
            </div>
          </CardBody>
        </Card>

      </div>
    </div>
  )
}
