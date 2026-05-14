'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import {
  Users, Calendar, Briefcase, DollarSign,
  UserCheck, ClipboardList, BarChart2, Megaphone,
} from 'lucide-react'
import Link from 'next/link'

const HR_ADMIN_ROLES = new Set(['HR_MANAGER', 'SCHOOL_ADMIN', 'VICE_PRINCIPAL', 'ACADEMIC_DIRECTOR', 'SUPER_ADMIN'])

// ── Self-service (non-HR-admin) ─────────────────────────────────────────────
function StaffSelfServiceDashboard({ locale }: { locale: string }) {
  const isRtl = locale === 'ar'
  const searchParams = useSearchParams()
  const tab = (searchParams.get('tab') as 'profile' | 'leaves' | 'announcements') ?? 'profile'
  const [me, setMe] = useState<any>(null)
  const [leaves, setLeaves] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [leaveForm, setLeaveForm] = useState({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' })
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    const [meRes, leaveRes, annRes] = await Promise.allSettled([
      apiClient.get('/hr/staff/me').then((r: any) => r.data?.data ?? r.data),
      apiClient.get('/hr/leaves').then((r: any) => r.data?.data ?? r.data ?? []),
      apiClient.get('/hr/announcements').then((r: any) => r.data?.data ?? r.data ?? []),
    ])
    if (meRes.status === 'fulfilled') setMe(meRes.value)
    if (leaveRes.status === 'fulfilled') setLeaves(Array.isArray(leaveRes.value) ? leaveRes.value : [])
    if (annRes.status === 'fulfilled') setAnnouncements(Array.isArray(annRes.value) ? annRes.value : [])
  }, [])

  useEffect(() => { load() }, [load])

  const submitLeave = async () => {
    if (!leaveForm.startDate || !leaveForm.endDate) return
    await apiClient.post('/hr/leaves', leaveForm)
    setShowForm(false)
    setLeaveForm({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' })
    load()
  }

  const leaveStatus: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-600',
  }
  const priColor: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-green-100 text-green-700',
  }

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'شؤوني الوظيفية' : 'My HR'}</h1>

      {/* Profile Tab */}
      {tab === 'profile' && me && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl">
              {me.user?.profile?.firstName?.[0] ?? '?'}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{me.user?.profile?.firstName} {me.user?.profile?.lastName}</p>
              <p className="text-gray-500">{me.jobTitle ?? me.user?.role}</p>
              <p className="text-sm text-gray-400">{me.department ?? '—'}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-400">{isRtl ? 'رقم الموظف' : 'Employee ID'}</p>
              <p className="font-mono font-bold text-gray-700">{me.employeeId ?? '—'}</p>
              <p className="text-xs text-gray-400 mt-1">{isRtl ? 'منذ' : 'Since'} {me.hireDate ? new Date(me.hireDate).toLocaleDateString() : '—'}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-gray-50">
            <div><p className="text-xs text-gray-400">{isRtl ? 'البريد' : 'Email'}</p><p className="text-sm font-medium text-gray-700">{me.user?.email}</p></div>
            <div><p className="text-xs text-gray-400">{isRtl ? 'القسم' : 'Department'}</p><p className="text-sm font-medium text-gray-700">{me.department ?? '—'}</p></div>
            <div><p className="text-xs text-gray-400">{isRtl ? 'نوع العقد' : 'Contract'}</p><p className="text-sm font-medium text-gray-700">{me.contracts?.[0]?.type ?? '—'}</p></div>
            <div><p className="text-xs text-gray-400">{isRtl ? 'الحالة' : 'Status'}</p><span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-semibold">{isRtl ? 'نشط' : 'Active'}</span></div>
          </div>
        </div>
      )}

      {/* Leaves Tab */}
      {tab === 'leaves' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">
              {isRtl ? '+ طلب إجازة' : '+ Request Leave'}
            </button>
          </div>
          {showForm && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
              <p className="font-semibold text-gray-800">{isRtl ? 'طلب إجازة جديدة' : 'New Leave Request'}</p>
              <select value={leaveForm.type} onChange={e => setLeaveForm(p => ({ ...p, type: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full">
                {['ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'STUDY'].map(t =>
                  <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">{isRtl ? 'من' : 'From'}</label>
                  <input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm(p => ({ ...p, startDate: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">{isRtl ? 'إلى' : 'To'}</label>
                  <input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm(p => ({ ...p, endDate: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full mt-1" />
                </div>
              </div>
              <textarea value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))}
                placeholder={isRtl ? 'السبب...' : 'Reason...'}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full resize-none" rows={3} />
              <div className="flex gap-2">
                <button onClick={submitLeave} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm">{isRtl ? 'إرسال' : 'Submit'}</button>
                <button onClick={() => setShowForm(false)} className="border border-gray-200 px-4 py-2 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {['Type', 'Start', 'End', 'Days', 'Status'].map(h =>
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {leaves.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">{isRtl ? 'لا توجد إجازات' : 'No leave requests'}</td></tr>
                  : leaves.map((l: any) => (
                    <tr key={l.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{l.type}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(l.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(l.endDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{l.days}</td>
                      <td className="px-4 py-3"><span className={`text-xs rounded-full px-2.5 py-0.5 font-semibold ${leaveStatus[l.status] ?? 'bg-gray-100 text-gray-700'}`}>{l.status}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {tab === 'announcements' && (
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="text-center py-16 text-gray-400"><Megaphone size={40} className="mx-auto mb-3 opacity-20" />{isRtl ? 'لا توجد إعلانات' : 'No announcements'}</div>
          ) : announcements.map((a: any) => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {a.isPinned && <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">📌 Pinned</span>}
                    <span className={`text-xs rounded-full px-2.5 py-0.5 font-semibold ${priColor[a.priority] ?? 'bg-gray-100 text-gray-700'}`}>{a.priority}</span>
                  </div>
                  <p className="font-semibold text-gray-800">{a.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{a.content}</p>
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap">{new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
              {a.author && <p className="text-xs text-gray-400 mt-2">{a.author.profile?.firstName} {a.author.profile?.lastName}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── HR Manager Dashboard ────────────────────────────────────────────────────
function HrManagerDashboard({ locale }: { locale: string }) {
  const isRtl = locale === 'ar'
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    apiClient.get('/hr/full-stats').then((r: any) => setStats(r.data?.data ?? r.data)).catch(() => {})
  }, [])

  const kpis = stats ? [
    { label: isRtl ? 'إجمالي الموظفين' : 'Total Staff', value: stats.totalStaff ?? 0, color: 'bg-indigo-50 text-indigo-700', icon: <Users size={20} /> },
    { label: isRtl ? 'في إجازة اليوم' : 'On Leave Today', value: stats.onLeaveToday ?? 0, color: 'bg-amber-50 text-amber-700', icon: <Calendar size={20} /> },
    { label: isRtl ? 'وظائف مفتوحة' : 'Open Positions', value: stats.openJobs ?? 0, color: 'bg-blue-50 text-blue-700', icon: <Briefcase size={20} /> },
    { label: isRtl ? 'طلبات إجازة معلقة' : 'Pending Leaves', value: stats.pendingLeaves ?? 0, color: 'bg-rose-50 text-rose-700', icon: <ClipboardList size={20} /> },
    { label: isRtl ? 'طلبات توظيف جديدة' : 'New Applications', value: stats.newApplications ?? 0, color: 'bg-violet-50 text-violet-700', icon: <UserCheck size={20} /> },
    { label: isRtl ? 'إجمالي رواتب الشهر' : 'Monthly Payroll', value: `$${(stats.monthlyPayroll ?? 0).toLocaleString()}`, color: 'bg-emerald-50 text-emerald-700', icon: <DollarSign size={20} /> },
  ] : []

  const quickLinks = [
    { label: isRtl ? 'إضافة موظف' : 'Add Employee', href: `employees`, color: 'bg-indigo-600 text-white' },
    { label: isRtl ? 'طلبات الإجازة' : 'Leave Requests', href: `leaves`, color: 'bg-amber-500 text-white' },
    { label: isRtl ? 'كشف الرواتب' : 'Payroll', href: `payroll`, color: 'bg-emerald-600 text-white' },
    { label: isRtl ? 'إضافة إعلان' : 'Announcement', href: `announcements`, color: 'bg-violet-600 text-white' },
  ]

  return (
    <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'لوحة تحكم الموارد البشرية' : 'HR Dashboard'}</h1>
        <p className="text-sm text-gray-500 mt-1">{isRtl ? 'نظرة عامة على الموارد البشرية' : 'Overview of your HR department'}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className={`${k.color} rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-2">{k.icon}<span className="text-2xl font-bold">{k.value}</span></div>
            <p className="text-sm font-medium opacity-80">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-sm font-semibold text-gray-500 mb-3">{isRtl ? 'إجراءات سريعة' : 'Quick Actions'}</p>
        <div className="flex flex-wrap gap-3">
          {quickLinks.map(q => (
            <Link key={q.href} href={q.href} className={`${q.color} px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity`}>{q.label}</Link>
          ))}
        </div>
      </div>

      {/* Dept breakdown */}
      {stats?.byDepartment?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-indigo-600" />{isRtl ? 'توزيع الموظفين بالأقسام' : 'Staff by Department'}</p>
          <div className="space-y-2">
            {stats.byDepartment.map((d: any) => {
              const pct = stats.totalStaff > 0 ? Math.round((d.count / stats.totalStaff) * 100) : 0
              return (
                <div key={d.department} className="flex items-center gap-3">
                  <p className="text-sm text-gray-700 w-32 truncate">{d.department}</p>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">{d.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
function HrPageInner() {
  const locale = useLocale()
  const user = useAuthStore(s => s.user)
  const isAdmin = HR_ADMIN_ROLES.has(user?.role ?? '')

  if (isAdmin) return <HrManagerDashboard locale={locale} />
  return <StaffSelfServiceDashboard locale={locale} />
}

export default function HrPage() {
  return (
    <Suspense>
      <HrPageInner />
    </Suspense>
  )
}
