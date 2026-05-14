'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getApiError } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, Skeleton } from '@/components/ui'
import { Users, Search, Plus, RefreshCw, Shield, X, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

// Roles that work across ALL schools in the org (not tied to a single school)
const ORG_LEVEL_ROLES = new Set([
  'IT_ADMIN', 'IT_MANAGER', 'IT_STAFF', 'HR_MANAGER', 'FINANCE_OFFICER', 'TRANSPORT_MANAGER',
  'STORE_MANAGER', 'SUPPORT_AGENT', 'ACTIVITIES_COORDINATOR', 'REQUISITIONS_MANAGER',
  'CFO', 'FINANCE_MANAGER', 'PAYROLL_OFFICER', 'PROCUREMENT_OFFICER', 'AUDITOR',
])

const ROLE_OPTIONS = [
  // ── School-specific roles ─────────────────────────────────────────────────
  { value: 'SCHOOL_ADMIN',           label: 'School Admin',            labelAr: 'مدير مدرسة',       orgLevel: false },
  { value: 'VICE_PRINCIPAL',         label: 'Vice Principal',          labelAr: 'وكيل مدرسة',       orgLevel: false },
  { value: 'ACADEMIC_DIRECTOR',      label: 'Academic Director',       labelAr: 'مدير أكاديمي',     orgLevel: false },
  { value: 'DEPARTMENT_HEAD',        label: 'Department Head',         labelAr: 'رئيس قسم',          orgLevel: false },
  { value: 'TEACHER',                label: 'Teacher',                 labelAr: 'معلم',              orgLevel: false },
  { value: 'SUB_TEACHER',            label: 'Substitute Teacher',      labelAr: 'معلم بديل',         orgLevel: false },
  { value: 'COUNSELOR',              label: 'Counselor',               labelAr: 'مرشد طلابي',        orgLevel: false },
  { value: 'LIBRARIAN',              label: 'Librarian',               labelAr: 'أمين مكتبة',        orgLevel: false },
  { value: 'NURSE',                  label: 'Nurse',                   labelAr: 'ممرضة',             orgLevel: false },
  { value: 'CANTEEN_MANAGER',        label: 'Canteen Manager',         labelAr: 'مدير مقصف',         orgLevel: false },
  { value: 'RECEPTIONIST',           label: 'Receptionist',            labelAr: 'موظف استقبال',      orgLevel: false },
  { value: 'ADMISSION_OFFICER',      label: 'Admission Officer',       labelAr: 'مسؤول قبول',        orgLevel: false },
  { value: 'MATRON',                 label: 'Matron',                  labelAr: 'مشرفة سكن',         orgLevel: false },
  { value: 'EVENT_COORDINATOR',      label: 'Event Coordinator',       labelAr: 'منسق فعاليات',      orgLevel: false },
  // ── Org-level roles (cover ALL schools) ──────────────────────────────────
  { value: 'IT_ADMIN',               label: 'IT Admin',                labelAr: 'مدير تقنية',             orgLevel: true },
  { value: 'IT_MANAGER',             label: 'IT Manager',              labelAr: 'مدير تقنية معلومات',    orgLevel: true },
  { value: 'IT_STAFF',               label: 'IT Staff',                labelAr: 'موظف تقنية معلومات',    orgLevel: true },
  { value: 'HR_MANAGER',             label: 'HR Manager',              labelAr: 'مدير موارد بشرية',      orgLevel: true },
  { value: 'FINANCE_OFFICER',        label: 'Finance Officer',         labelAr: 'مسؤول مالي',        orgLevel: true },
  { value: 'TRANSPORT_MANAGER',      label: 'Transport Manager',       labelAr: 'مدير نقل',          orgLevel: true },
  { value: 'STORE_MANAGER',          label: 'Store Manager',           labelAr: 'مدير مخزن',         orgLevel: true },
  { value: 'SUPPORT_AGENT',          label: 'Support Agent',           labelAr: 'وكيل دعم',          orgLevel: true },
  { value: 'ACTIVITIES_COORDINATOR',  label: 'Activities Coordinator',  labelAr: 'منسق أنشطة',              orgLevel: true },
  { value: 'REQUISITIONS_MANAGER',    label: 'Requisitions Manager',    labelAr: 'مدير المستلزمات',         orgLevel: true },
  // ── Finance Department roles ──────────────────────────────────────────────
  { value: 'CFO',                     label: 'CFO',                     labelAr: 'المدير المالي التنفيذي',  orgLevel: true },
  { value: 'FINANCE_MANAGER',         label: 'Finance Manager',         labelAr: 'مدير المالية',             orgLevel: true },
  { value: 'SCHOOL_ACCOUNTANT',       label: 'School Accountant',       labelAr: 'محاسب المدرسة',            orgLevel: false },
  { value: 'CASHIER',                 label: 'Cashier',                 labelAr: 'أمين الصندوق',             orgLevel: false },
  { value: 'PAYROLL_OFFICER',         label: 'Payroll Officer',         labelAr: 'مسؤول الرواتب',            orgLevel: true },
  { value: 'PROCUREMENT_OFFICER',     label: 'Procurement Officer',     labelAr: 'مسؤول المشتريات',         orgLevel: true },
  { value: 'AUDITOR',                 label: 'Auditor',                 labelAr: 'مدقق الحسابات',           orgLevel: true },
  { value: 'BRANCH_FINANCE_ADMIN',    label: 'Branch Finance Admin',    labelAr: 'مسؤول مالي الفرع',        orgLevel: false },
]

const ROLE_BADGE_COLORS: Record<string, string> = {
  SCHOOL_ADMIN: 'bg-purple-100 text-purple-700',
  VICE_PRINCIPAL: 'bg-purple-100 text-purple-600',
  ACADEMIC_DIRECTOR: 'bg-blue-100 text-blue-700',
  DEPARTMENT_HEAD: 'bg-blue-100 text-blue-600',
  TEACHER: 'bg-green-100 text-green-700',
  SUB_TEACHER: 'bg-green-100 text-green-600',
  COUNSELOR: 'bg-teal-100 text-teal-700',
  LIBRARIAN: 'bg-amber-100 text-amber-700',
  NURSE: 'bg-pink-100 text-pink-700',
  FINANCE_OFFICER: 'bg-yellow-100 text-yellow-700',
  HR_MANAGER: 'bg-orange-100 text-orange-700',
  STORE_MANAGER: 'bg-gray-100 text-gray-700',
  CANTEEN_MANAGER: 'bg-red-100 text-red-600',
  IT_ADMIN: 'bg-indigo-100 text-indigo-700',
  IT_MANAGER: 'bg-purple-100 text-purple-700',
  IT_STAFF: 'bg-blue-100 text-blue-600',
  TRANSPORT_MANAGER: 'bg-sky-100 text-sky-700',
  RECEPTIONIST: 'bg-lime-100 text-lime-700',
  ADMISSION_OFFICER: 'bg-violet-100 text-violet-700',
  REQUISITIONS_MANAGER: 'bg-amber-100 text-amber-800',
  CFO: 'bg-emerald-100 text-emerald-800',
  FINANCE_MANAGER: 'bg-green-100 text-green-700',
  SCHOOL_ACCOUNTANT: 'bg-teal-100 text-teal-700',
  CASHIER: 'bg-cyan-100 text-cyan-700',
  PAYROLL_OFFICER: 'bg-lime-100 text-lime-800',
  PROCUREMENT_OFFICER: 'bg-yellow-100 text-yellow-800',
  AUDITOR: 'bg-orange-100 text-orange-700',
  BRANCH_FINANCE_ADMIN: 'bg-amber-100 text-amber-700',
}

function roleBadge(role: string, isRtl: boolean) {
  const opt = ROLE_OPTIONS.find((r) => r.value === role)
  const label = opt ? (isRtl ? opt.labelAr : opt.label) : role
  const color = ROLE_BADGE_COLORS[role] ?? 'bg-gray-100 text-gray-600'
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{label}</span>
}

export default function EmployeesPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showReset, setShowReset] = useState<{ id: string; name: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [form, setForm] = useState({
    firstName: '', firstNameAr: '', lastName: '', lastNameAr: '',
    email: '', phone: '', role: 'TEACHER', schoolId: '',
    password: '', department: '',
  })
  const [resetPassword, setResetPassword] = useState('')

  // Fetch org info for school dropdown
  const { data: orgData } = useQuery({
    queryKey: ['owner-org'],
    queryFn: () => api.get('/owner/org').then((r) => r.data?.data ?? r.data),
  })
  const schools: any[] = orgData?.schools ?? []

  // Fetch employees
  const { data, isLoading } = useQuery({
    queryKey: ['owner-employees', search, roleFilter],
    queryFn: () =>
      api.get('/owner/employees', { params: { search: search || undefined, role: roleFilter || undefined } })
        .then((r) => r.data?.data ?? r.data),
  })
  const employees: any[] = Array.isArray(data) ? data : data?.employees ?? []
  const total: number = data?.total ?? employees.length

  const createMutation = useMutation({
    mutationFn: (dto: any) => api.post('/owner/employees', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-employees'] })
      toast.success(isRtl ? 'تم إنشاء الموظف بنجاح' : 'Employee created successfully')
      setShowCreate(false)
      setForm({ firstName: '', firstNameAr: '', lastName: '', lastNameAr: '', email: '', phone: '', role: 'TEACHER', schoolId: '', password: '', department: '' })
    },
    onError: (err: any) => toast.error(getApiError(err, isRtl ? 'فشل إنشاء الموظف' : 'Failed to create employee')),
  })

  const resetMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      api.patch(`/owner/employees/${id}/reset-password`, { newPassword }),
    onSuccess: () => {
      toast.success(isRtl ? 'تم إعادة تعيين كلمة المرور' : 'Password reset successfully')
      setShowReset(null)
      setResetPassword('')
    },
    onError: (err: any) => toast.error(getApiError(err, isRtl ? 'فشلت العملية' : 'Failed')),
  })

  const handleCreate = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.role) {
      toast.error(isRtl ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields')
      return
    }
    createMutation.mutate({
      ...form,
      schoolId: form.schoolId || undefined,
      phone: form.phone || undefined,
      department: form.department || undefined,
      firstNameAr: form.firstNameAr || undefined,
      lastNameAr: form.lastNameAr || undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold text-gray-900 ${isRtl ? 'font-arabic' : ''}`}>
            {isRtl ? 'الموظفون' : 'Employees'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isRtl ? 'إدارة حسابات موظفي مؤسستك' : 'Manage employee accounts across your organization'}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          {isRtl ? 'موظف جديد' : 'New Employee'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : (
          <>
            <Card><CardBody className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center"><Users size={18} className="text-blue-600" /></div>
              <div><p className="text-xs text-gray-500">{isRtl ? 'إجمالي الموظفين' : 'Total Employees'}</p><p className="text-xl font-bold text-gray-900">{total}</p></div>
            </CardBody></Card>
            <Card><CardBody className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center"><Shield size={18} className="text-green-600" /></div>
              <div><p className="text-xs text-gray-500">{isRtl ? 'نشط' : 'Active'}</p><p className="text-xl font-bold text-gray-900">{employees.filter((e) => e.isActive).length}</p></div>
            </CardBody></Card>
            <Card><CardBody className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center"><RefreshCw size={18} className="text-amber-600" /></div>
              <div><p className="text-xs text-gray-500">{isRtl ? 'ينتظر تغيير كلمة المرور' : 'Pending Password'}</p><p className="text-xl font-bold text-gray-900">{employees.filter((e) => e.mustChangePassword).length}</p></div>
            </CardBody></Card>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRtl ? 'بحث بالاسم أو البريد...' : 'Search by name or email...'}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 bg-white"
        >
          <option value="">{isRtl ? 'جميع الأدوار' : 'All Roles'}</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{isRtl ? r.labelAr : r.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : employees.length === 0 ? (
        <Card>
          <CardBody className="p-16 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">{isRtl ? 'لا يوجد موظفون' : 'No employees found'}</p>
            <p className="text-gray-400 text-sm mt-1">{isRtl ? 'أنشئ حساب موظف جديد من الزر أعلاه' : 'Create a new employee account using the button above'}</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-start px-4 py-3 font-medium text-gray-500">{isRtl ? 'الموظف' : 'Employee'}</th>
                  <th className="text-start px-4 py-3 font-medium text-gray-500">{isRtl ? 'الدور' : 'Role'}</th>
                  <th className="text-start px-4 py-3 font-medium text-gray-500">{isRtl ? 'المدرسة' : 'School'}</th>
                  <th className="text-start px-4 py-3 font-medium text-gray-500">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="text-start px-4 py-3 font-medium text-gray-500">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp: any) => {
                  const name = `${emp.profile?.firstName ?? ''} ${emp.profile?.lastName ?? ''}`.trim() || emp.email
                  const school = schools.find((s) => s.id === emp.schoolId)
                  return (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                            {(emp.profile?.firstName?.[0] ?? emp.email[0]).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{name}</p>
                            <p className="text-xs text-gray-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{roleBadge(emp.role, isRtl)}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{school?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${emp.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {emp.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
                          </span>
                          {emp.mustChangePassword && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full w-fit">
                              {isRtl ? 'لم يغير كلمة المرور' : 'Password not changed'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setShowReset({ id: emp.id, name })}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition-colors px-2 py-1 rounded-lg hover:bg-primary-50"
                        >
                          <RefreshCw size={13} />
                          {isRtl ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Employee Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">{isRtl ? 'إنشاء حساب موظف جديد' : 'Create New Employee Account'}</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4">
              {/* Info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                {isRtl
                  ? 'سيتم إنشاء الحساب وسيُطلب من الموظف تغيير كلمة المرور عند أول تسجيل دخول.'
                  : 'The account will be created and the employee will be required to change their password on first login.'}
              </div>

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'الاسم الأول *' : 'First Name *'}</label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
                    placeholder="Ahmed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'اسم العائلة *' : 'Last Name *'}</label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
                    placeholder="Mohamed"
                  />
                </div>
              </div>

              {/* Arabic name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">الاسم الأول (عربي)</label>
                  <input
                    value={form.firstNameAr}
                    onChange={(e) => setForm((f) => ({ ...f, firstNameAr: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 font-arabic"
                    placeholder="أحمد"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">اسم العائلة (عربي)</label>
                  <input
                    value={form.lastNameAr}
                    onChange={(e) => setForm((f) => ({ ...f, lastNameAr: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 font-arabic"
                    placeholder="محمد"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'البريد الإلكتروني *' : 'Email *'}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
                    placeholder="ahmed@school.edu"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'رقم الهاتف' : 'Phone'}</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
                    placeholder="+966 5x xxx xxxx"
                  />
                </div>
              </div>

              {/* Role + School — interdependent */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'الدور / القسم *' : 'Role / Department *'}</label>
                  <select
                    value={form.role}
                    onChange={(e) => {
                      const newRole = e.target.value
                      // Org-level roles → clear schoolId (covers all schools)
                      setForm((f) => ({ ...f, role: newRole, schoolId: ORG_LEVEL_ROLES.has(newRole) ? '' : f.schoolId }))
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 bg-white"
                  >
                    <optgroup label={isRtl ? 'أدوار خاصة بالمدرسة' : 'School-specific roles'}>
                      {ROLE_OPTIONS.filter((r) => !r.orgLevel).map((r) => (
                        <option key={r.value} value={r.value}>{isRtl ? r.labelAr : r.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label={isRtl ? 'أدوار على مستوى المؤسسة (كل المدارس)' : 'Org-level roles (all schools)'}>
                      {ROLE_OPTIONS.filter((r) => r.orgLevel).map((r) => (
                        <option key={r.value} value={r.value}>{isRtl ? r.labelAr : r.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {isRtl ? 'المدرسة' : 'School'}
                    {ORG_LEVEL_ROLES.has(form.role) && (
                      <span className="ms-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full">
                        {isRtl ? 'كل المدارس' : 'All Schools'}
                      </span>
                    )}
                  </label>
                  {ORG_LEVEL_ROLES.has(form.role) ? (
                    <div className="w-full border border-indigo-200 bg-indigo-50 rounded-xl px-3 py-2 text-sm text-indigo-700 flex items-center gap-2">
                      <span className="text-base">🏫</span>
                      <span>
                        {schools.length > 1
                          ? (isRtl ? `كل المدارس (${schools.length})` : `All ${schools.length} schools`)
                          : (schools[0]?.name ?? (isRtl ? 'كل المدارس' : 'All Schools'))}
                      </span>
                    </div>
                  ) : (
                    <select
                      value={form.schoolId}
                      onChange={(e) => setForm((f) => ({ ...f, schoolId: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 bg-white"
                    >
                      <option value="">{isRtl ? '— اختر مدرسة —' : '— Select school —'}</option>
                      {schools.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                  {!ORG_LEVEL_ROLES.has(form.role) && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      {isRtl ? 'هذا الدور خاص بمدرسة واحدة' : 'This role is specific to one school'}
                    </p>
                  )}
                </div>
              </div>
              {ORG_LEVEL_ROLES.has(form.role) && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-700 flex items-start gap-2">
                  <span className="text-base shrink-0">ℹ️</span>
                  <span>
                    {isRtl
                      ? `دور "${ROLE_OPTIONS.find(r => r.value === form.role)?.labelAr}" يغطي جميع مدارس المؤسسة تلقائياً — لا حاجة لاختيار مدرسة بعينها.`
                      : `"${ROLE_OPTIONS.find(r => r.value === form.role)?.label}" covers all schools in your organization automatically — no need to pick a specific school.`}
                  </span>
                </div>
              )}

              {/* Department label */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'القسم / التخصص' : 'Department / Specialization'}</label>
                <input
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
                  placeholder={isRtl ? 'مثال: رياضيات، علوم...' : 'e.g. Mathematics, Science...'}
                />
              </div>

              {/* Temp password */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'كلمة المرور المؤقتة *' : 'Temporary Password *'}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-10 text-sm outline-none focus:border-primary-500"
                    placeholder={isRtl ? 'كلمة مرور مؤقتة...' : 'Temporary password...'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {isRtl
                    ? 'الموظف سيُجبر على تغيير هذه الكلمة عند أول تسجيل دخول'
                    : 'Employee will be forced to change this on first login'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl transition-colors"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? (isRtl ? 'جارٍ الإنشاء...' : 'Creating...') : (isRtl ? 'إنشاء الحساب' : 'Create Account')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showReset && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{isRtl ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}</h2>
              <button onClick={() => { setShowReset(null); setResetPassword('') }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                {isRtl
                  ? `إعادة تعيين كلمة مرور الموظف: ${showReset.name}`
                  : `Reset password for: ${showReset.name}`}
              </p>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-10 text-sm outline-none focus:border-primary-500"
                  placeholder={isRtl ? 'كلمة المرور الجديدة...' : 'New password...'}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => { setShowReset(null); setResetPassword('') }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:text-gray-900 transition-colors"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => resetMutation.mutate({ id: showReset.id, newPassword: resetPassword })}
                disabled={!resetPassword || resetMutation.isPending}
                className="px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {resetMutation.isPending ? (isRtl ? 'جارٍ...' : 'Saving...') : (isRtl ? 'حفظ' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
