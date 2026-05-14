'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { apiClient } from '@/lib/api'
import { useSchoolContext } from '@/stores/schoolContextStore'
import { Users, Search, Edit2, X, UserPlus } from 'lucide-react'

interface Employee {
  id: string            // staffProfileId if exists, userId otherwise
  _userId: string
  hasStaffProfile: boolean
  employeeId?: string | null
  department?: string | null
  jobTitle?: string | null
  hireDate?: string | null
  salary?: number | null
  contracts?: { type: string; status: string }[]
  user: { id: string; email: string; role: string; isActive: boolean; profile?: { firstName: string; lastName: string; avatar?: string } | null }
}

const ROLES = ['TEACHER', 'SCHOOL_ADMIN', 'HR_MANAGER', 'VICE_PRINCIPAL', 'ACADEMIC_DIRECTOR', 'STORE_MANAGER', 'CANTEEN_MANAGER', 'ACCOUNTANT', 'RECEPTIONIST', 'COUNSELOR', 'LIBRARIAN']

function Avatar({ emp }: { emp: Employee }) {
  const name = `${emp.user.profile?.firstName ?? ''} ${emp.user.profile?.lastName ?? ''}`.trim()
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : (emp.user.email[0] ?? '?').toUpperCase()
  if (emp.user.profile?.avatar) return <img src={emp.user.profile.avatar} className="w-9 h-9 rounded-full object-cover" alt={name} />
  return <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">{initials}</div>
}

function EditDialog({ emp, onClose, onSave }: { emp: Employee; onClose: () => void; onSave: () => void }) {
  const isRtl = useLocale() === 'ar'
  const [form, setForm] = useState({
    employeeId: emp.employeeId ?? '',
    department: emp.department ?? '',
    jobTitle: emp.jobTitle ?? '',
    hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().slice(0, 10) : '',
    salary: String(emp.salary ?? ''),
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      if (emp.hasStaffProfile) {
        // Update existing staff profile
        await apiClient.patch(`/hr/staff/${emp.id}`, form)
      } else {
        // Create staff profile for this user
        await apiClient.post('/hr/staff', { userId: emp._userId, ...form })
      }
      onSave()
      onClose()
    } catch {}
    setSaving(false)
  }

  const field = (key: keyof typeof form, label: string, type = 'text') => (
    <div>
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
    </div>
  )

  const fullName = `${emp.user.profile?.firstName ?? ''} ${emp.user.profile?.lastName ?? ''}`.trim() || emp.user.email

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900">{emp.hasStaffProfile ? (isRtl ? 'تعديل بيانات الموظف' : 'Edit Employee') : (isRtl ? 'إنشاء ملف وظيفي' : 'Create Staff Profile')}</p>
            <p className="text-xs text-gray-400 mt-0.5">{fullName}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          {!emp.hasStaffProfile && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 text-xs text-yellow-700">
              {isRtl ? 'هذا المستخدم ليس لديه ملف وظيفي بعد. سيتم إنشاؤه عند الحفظ.' : 'This user has no staff profile yet. It will be created on save.'}
            </div>
          )}
          {field('employeeId', isRtl ? 'رقم الموظف' : 'Employee ID')}
          {field('department', isRtl ? 'القسم' : 'Department')}
          {field('jobTitle', isRtl ? 'المسمى الوظيفي' : 'Job Title')}
          {field('hireDate', isRtl ? 'تاريخ التعيين' : 'Hire Date', 'date')}
          {field('salary', isRtl ? 'الراتب' : 'Salary', 'number')}
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-2">
          <button onClick={save} disabled={saving} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
            {saving ? '...' : (isRtl ? 'حفظ' : 'Save')}
          </button>
          <button onClick={onClose} className="px-4 border border-gray-200 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
        </div>
      </div>
    </div>
  )
}

const ROLE_COLORS: Record<string, string> = {
  TEACHER: 'bg-blue-100 text-blue-700',
  SCHOOL_ADMIN: 'bg-indigo-100 text-indigo-700',
  HR_MANAGER: 'bg-purple-100 text-purple-700',
  VICE_PRINCIPAL: 'bg-cyan-100 text-cyan-700',
  ACADEMIC_DIRECTOR: 'bg-teal-100 text-teal-700',
  STORE_MANAGER: 'bg-orange-100 text-orange-700',
  CANTEEN_MANAGER: 'bg-amber-100 text-amber-700',
  SUPER_ADMIN: 'bg-red-100 text-red-700',
}

export default function EmployeesPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const { selectedSchoolId } = useSchoolContext()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editing, setEditing] = useState<Employee | undefined>()
  const [showDialog, setShowDialog] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      const d = await apiClient.get(`/hr/all-users?${params}`).then((r: any) => r.data?.data ?? r.data ?? [])
      setEmployees(Array.isArray(d) ? d : [])
    } catch {}
    setLoading(false)
  }, [search, roleFilter, selectedSchoolId])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const withProfile = employees.filter(e => e.hasStaffProfile).length
  const withoutProfile = employees.length - withProfile

  const exportCsv = () => {
    const rows = [['Name', 'Email', 'Role', 'Job Title', 'Department', 'Employee ID', 'Status']]
    employees.forEach(e => rows.push([
      `${e.user.profile?.firstName ?? ''} ${e.user.profile?.lastName ?? ''}`.trim(),
      e.user.email, e.user.role, e.jobTitle ?? '', e.department ?? '',
      e.employeeId ?? '', e.user.isActive ? 'Active' : 'Inactive',
    ]))
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'employees.csv'; a.click()
  }

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={22} className="text-indigo-600" />
            {isRtl ? 'الموظفون' : 'Employees'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {employees.length} {isRtl ? 'مستخدم' : 'users'}
            {!loading && withoutProfile > 0 && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5">
                {withoutProfile} {isRtl ? 'بدون ملف وظيفي' : 'without HR profile'}
              </span>
            )}
          </p>
        </div>
        <button onClick={exportCsv} className="border border-gray-200 px-4 py-2 rounded-xl text-sm hover:bg-gray-50">
          {isRtl ? 'تصدير CSV' : 'Export CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isRtl ? 'بحث بالاسم أو البريد أو المسمى...' : 'Search name, email, job title...'}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
          <option value="">{isRtl ? 'كل الأدوار' : 'All Roles'}</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading
        ? <div className="animate-pulse space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div>
        : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    {(isRtl
                      ? ['الإجراءات', 'الحالة', 'الدور', 'القسم', 'المسمى الوظيفي', 'الموظف']
                      : ['Employee', 'Job Title', 'Department', 'Role', 'Status', 'Actions']
                    ).map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.length === 0
                    ? (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-gray-400">
                          <Users size={36} className="mx-auto mb-2 opacity-20" />
                          {isRtl ? 'لا يوجد موظفون' : 'No users found'}
                        </td>
                      </tr>
                    )
                    : employees.map(emp => {
                      const name = `${emp.user.profile?.firstName ?? ''} ${emp.user.profile?.lastName ?? ''}`.trim()
                      return (
                        <tr key={emp._userId} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar emp={emp} />
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {name || <span className="italic text-gray-400">{isRtl ? 'بدون اسم' : 'No name'}</span>}
                                </p>
                                <p className="text-xs text-gray-400">{emp.user.email}</p>
                                {emp.employeeId && <p className="text-xs font-mono text-gray-400">#{emp.employeeId}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{emp.jobTitle ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{emp.department ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs rounded-full px-2.5 py-0.5 font-semibold ${ROLE_COLORS[emp.user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                              {emp.user.role.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs rounded-full px-2.5 py-0.5 font-semibold ${emp.user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {emp.user.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'غير نشط' : 'Inactive')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => { setEditing(emp); setShowDialog(true) }}
                              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${emp.hasStaffProfile ? 'hover:bg-indigo-50 text-indigo-600' : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700'}`}
                              title={emp.hasStaffProfile ? 'Edit HR profile' : 'Create HR profile'}
                            >
                              {emp.hasStaffProfile ? <Edit2 size={13} /> : <UserPlus size={13} />}
                              {emp.hasStaffProfile ? (isRtl ? 'تعديل' : 'Edit') : (isRtl ? 'إنشاء ملف' : 'Add Profile')}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      {showDialog && editing && (
        <EditDialog emp={editing} onClose={() => { setShowDialog(false); setEditing(undefined) }} onSave={load} />
      )}
    </div>
  )
}
