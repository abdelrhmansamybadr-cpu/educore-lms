'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getApiError } from '@/lib/api'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Card, CardBody, Skeleton } from '@/components/ui'
import {
  Building2, Search, ToggleLeft, ToggleRight, Users, Briefcase,
  Plus, ChevronRight, Eye, EyeOff, X,
} from 'lucide-react'
import toast from 'react-hot-toast'

const CURRICULUM_LABELS: Record<string, string> = {
  EGYPTIAN: 'Egyptian', SAUDI: 'Saudi', AMERICAN: 'American',
  BRITISH: 'British', IB: 'IB', CUSTOM: 'Custom', MIXED: 'Mixed', NATIONAL: 'National',
}

// Org-level roles that belong to the company (not any specific school)
const ORG_LEVEL_ROLES = [
  { value: 'IT_ADMIN',               label: 'IT Admin',               labelAr: 'مدير تقنية' },
  { value: 'IT_MANAGER',             label: 'IT Manager',             labelAr: 'مدير تقنية معلومات' },
  { value: 'IT_STAFF',               label: 'IT Staff',               labelAr: 'موظف تقنية معلومات' },
  { value: 'HR_MANAGER',             label: 'HR Manager',             labelAr: 'مدير موارد بشرية' },
  { value: 'FINANCE_OFFICER',        label: 'Finance Officer',        labelAr: 'مسؤول مالي' },
  { value: 'TRANSPORT_MANAGER',      label: 'Transport Manager',      labelAr: 'مدير نقل' },
  { value: 'STORE_MANAGER',          label: 'Store Manager',          labelAr: 'مدير مخزن' },
  { value: 'SUPPORT_AGENT',          label: 'Support Agent',          labelAr: 'وكيل دعم' },
  { value: 'ACTIVITIES_COORDINATOR', label: 'Activities Coordinator', labelAr: 'منسق أنشطة' },
  { value: 'REQUISITIONS_MANAGER',   label: 'Requisitions Manager',   labelAr: 'مدير المستلزمات' },
]

// ─── Add Company Employee Modal ───────────────────────────────────────────────

function AddCompanyEmployeeModal({ onClose, onSuccess, isRtl }: { onClose: () => void; onSuccess: () => void; isRtl: boolean }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', firstNameAr: '', lastNameAr: '',
    email: '', password: '', role: 'HR_MANAGER', phone: '',
  })
  const [showPwd, setShowPwd] = useState(false)

  const set = (field: string, val: string) => setForm((f) => ({ ...f, [field]: val }))

  const create = useMutation({
    mutationFn: (data: any) => api.post('/owner/employees', data), // no schoolId → company-level
    onSuccess: () => { toast.success(isRtl ? 'تمت إضافة الموظف' : 'Company employee added'); onSuccess() },
    onError: (err: any) => toast.error(getApiError(err, 'Failed to create employee')),
  })

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.role) {
      toast.error(isRtl ? 'الرجاء تعبئة جميع الحقول المطلوبة' : 'Please fill all required fields'); return
    }
    create.mutate({ ...form }) // no schoolId → backend sets organizationId automatically
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Briefcase size={18} className="text-primary-600" />
            <h2 className="text-base font-semibold text-gray-900">
              {isRtl ? 'إضافة موظف شركة' : 'Add Company Employee'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الاسم الأول *' : 'First Name *'}</label>
              <input required value={form.firstName} onChange={(e) => set('firstName', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الاسم الأخير *' : 'Last Name *'}</label>
              <input required value={form.lastName} onChange={(e) => set('lastName', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الاسم الأول (عربي)' : 'First Name (AR)'}</label>
              <input dir="rtl" value={form.firstNameAr} onChange={(e) => set('firstNameAr', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الاسم الأخير (عربي)' : 'Last Name (AR)'}</label>
              <input dir="rtl" value={form.lastNameAr} onChange={(e) => set('lastNameAr', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'البريد الإلكتروني *' : 'Email *'}</label>
            <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'كلمة المرور *' : 'Password *'}</label>
            <div className="relative">
              <input required type={showPwd ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 pe-10" />
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute end-3 top-2.5 text-gray-400">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'الدور الوظيفي *' : 'Role *'}</label>
              <select value={form.role} onChange={(e) => set('role', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white">
                {ORG_LEVEL_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{isRtl ? r.labelAr : r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'رقم الهاتف' : 'Phone'}</label>
              <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={create.isPending}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {create.isPending ? (isRtl ? 'جارٍ الإضافة...' : 'Adding...') : (isRtl ? 'إضافة الموظف' : 'Add Employee')}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SchoolsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const router = useRouter()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'true' | 'false'>('')
  const [showAddEmployee, setShowAddEmployee] = useState(false)

  const { data: orgData, isLoading } = useQuery({
    queryKey: ['owner-org'],
    queryFn: () => api.get('/owner/org').then((r) => r.data?.data ?? r.data),
  })

  // Company-level employees (no schoolId, linked directly to org)
  const { data: companyEmpsData } = useQuery({
    queryKey: ['company-employees'],
    queryFn: () => api.get('/owner/employees?companyOnly=true&limit=100').then((r) => r.data?.data ?? r.data),
  })
  const companyEmployees: any[] = companyEmpsData?.data ?? []
  const companyEmpCount = companyEmpsData?.meta?.total ?? companyEmployees.length

  const schools: any[] = orgData?.schools ?? []
  const filtered = schools.filter((s: any) => {
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.nameAr?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || String(s.isActive) === statusFilter
    return matchSearch && matchStatus
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/super-admin/schools/${id}`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['owner-org'] }); toast.success(isRtl ? 'تم تحديث الحالة' : 'Status updated') },
    onError: (err: any) => toast.error(getApiError(err, 'Failed')),
  })

  const activeCount = schools.filter((s: any) => s.isActive).length
  const totalUsers = schools.reduce((sum: number, s: any) => sum + (s._count?.users ?? 0), 0)

  return (
    <div className="space-y-6">
      {showAddEmployee && (
        <AddCompanyEmployeeModal
          isRtl={isRtl}
          onClose={() => setShowAddEmployee(false)}
          onSuccess={() => { setShowAddEmployee(false); qc.invalidateQueries({ queryKey: ['company-employees'] }) }}
        />
      )}

      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold text-gray-900 ${isRtl ? 'font-arabic' : ''}`}>{isRtl ? 'مدارسي والشركة' : 'Schools & Company'}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isRtl ? 'إدارة المدارس وموظفي الشركة' : 'Manage your schools and company-level employees'}
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <Card><CardBody className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Building2 size={20} className="text-blue-600" /></div>
            <div><p className="text-xs text-gray-500">{isRtl ? 'إجمالي المدارس' : 'Total Schools'}</p><p className="text-2xl font-bold text-gray-900">{schools.length}</p></div>
          </CardBody></Card>
          <Card><CardBody className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center"><ToggleRight size={20} className="text-green-600" /></div>
            <div><p className="text-xs text-gray-500">{isRtl ? 'نشطة' : 'Active'}</p><p className="text-2xl font-bold text-gray-900">{activeCount}</p></div>
          </CardBody></Card>
          <Card><CardBody className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center"><Users size={20} className="text-teal-600" /></div>
            <div><p className="text-xs text-gray-500">{isRtl ? 'إجمالي المستخدمين' : 'Total Users'}</p><p className="text-2xl font-bold text-gray-900">{totalUsers + companyEmpCount}</p></div>
          </CardBody></Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRtl ? 'بحث بالاسم...' : 'Search schools by name...'} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 bg-white">
          <option value="">{isRtl ? 'جميع الحالات' : 'All Status'}</option>
          <option value="true">{isRtl ? 'نشطة' : 'Active'}</option>
          <option value="false">{isRtl ? 'غير نشطة' : 'Inactive'}</option>
        </select>
      </div>

      {/* ── Company Card (always first) ─────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {isRtl ? 'الشركة' : 'Company'}
        </h2>
        <Card className="border-2 border-primary-200 bg-primary-50/30">
          <CardBody className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center shrink-0">
                  <Briefcase size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{orgData?.name ?? (isRtl ? 'الشركة' : 'Company')}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {isRtl ? 'موظفو الشركة — غير مرتبطون بمدرسة محددة' : 'Company employees — not tied to any specific school'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ORG_LEVEL_ROLES.slice(0, 4).map((r) => (
                      <span key={r.value} className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                        {isRtl ? r.labelAr : r.label}
                      </span>
                    ))}
                    <span className="text-xs text-gray-400">+{ORG_LEVEL_ROLES.length - 4} {isRtl ? 'أكثر' : 'more'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAddEmployee(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shrink-0"
              >
                <Plus size={15} />
                {isRtl ? 'إضافة موظف' : 'Add Employee'}
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-primary-200 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-gray-500">{isRtl ? 'موظفو الشركة' : 'Company Employees'}</p>
                <p className="font-bold text-gray-900 text-lg">{companyEmpCount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{isRtl ? 'الحالة' : 'Status'}</p>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  {isRtl ? 'نشطة' : 'Active'}
                </span>
              </div>
              <div>
                <button
                  onClick={() => router.push(`/${locale}/super-admin/employees?companyOnly=true`)}
                  className="flex items-center justify-center gap-1 text-sm text-primary-600 hover:text-primary-800 font-medium mx-auto"
                >
                  {isRtl ? 'إدارة الموظفين' : 'Manage Employees'}
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Company employee preview list */}
            {companyEmployees.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {companyEmployees.slice(0, 6).map((emp: any) => (
                  <div key={emp.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs shrink-0">
                      {emp.profile?.firstName?.[0]?.toUpperCase() ?? emp.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {emp.profile?.firstName} {emp.profile?.lastName}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">{emp.role?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                ))}
                {companyEmpCount > 6 && (
                  <div className="flex items-center justify-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 text-xs text-gray-500">
                    +{companyEmpCount - 6} {isRtl ? 'أكثر' : 'more'}
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Schools Grid ───────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {isRtl ? 'المدارس' : 'Schools'}
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <Card><CardBody className="p-16 text-center">
            <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">{isRtl ? 'لا توجد مدارس' : 'No schools found'}</p>
          </CardBody></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((school: any) => (
              <Card key={school.id} className="hover:shadow-md transition-shadow">
                <CardBody className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
                        {school.name?.[0]?.toUpperCase() ?? 'S'}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{school.name}</h3>
                        {school.nameAr && <p className="text-sm text-gray-500 font-arabic">{school.nameAr}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{CURRICULUM_LABELS[school.curriculumType] ?? school.curriculumType}</span>
                          {school.city && <span className="text-xs text-gray-400">{school.city}</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleActive.mutate({ id: school.id, isActive: !school.isActive })}
                      disabled={toggleActive.isPending}
                      title={school.isActive ? (isRtl ? 'إيقاف' : 'Deactivate') : (isRtl ? 'تفعيل' : 'Activate')}
                    >
                      {school.isActive
                        ? <ToggleRight size={28} className="text-green-500 hover:text-green-700 transition-colors" />
                        : <ToggleLeft size={28} className="text-gray-400 hover:text-gray-600 transition-colors" />}
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-gray-400">{isRtl ? 'المستخدمون' : 'Users'}</p>
                      <p className="font-bold text-gray-900">{school._count?.users ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{isRtl ? 'البريد' : 'Email'}</p>
                      <p className="text-xs text-gray-600 truncate">{school.email ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{isRtl ? 'الحالة' : 'Status'}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${school.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {school.isActive ? (isRtl ? 'نشطة' : 'Active') : (isRtl ? 'معطلة' : 'Inactive')}
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
