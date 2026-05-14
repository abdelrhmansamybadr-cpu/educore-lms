'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { apiClient } from '@/lib/api'
import { TrendingUp, Settings, Users, X, Download, Printer, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Leave {
  id: string; type: string; status: string; startDate: string; endDate: string; days: number
  staff: { user: { profile?: { firstName: string; lastName: string } }; department?: string }
}

interface LeavePolicy {
  scope: string; monthlyLimit: number; yearlyLimit: number
  annualLimit: number; sickLimit: number; unpaidLimit: number; maternityLimit: number; paternityLimit: number; notes?: string
}

interface EmployeeAnalysis {
  userId: string; name: string; email: string; role: string; avatar: string | null
  jobTitle: string | null; department: string | null; onLeave: boolean
  approvedThisMonth: number; approvedThisYear: number; pending: number
  leaves: { id: string; type: string; status: string; startDate: string; endDate: string; days: number; reason: string }[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEAVE_TYPES = ['ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'STUDY']
const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
const TYPE_COLORS = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777']
const STATUS_COLORS: Record<string, string> = { PENDING: '#F59E0B', APPROVED: '#10B981', REJECTED: '#EF4444', CANCELLED: '#94A3B8' }
const SCOPE_OPTIONS = [
  { value: 'SCHOOL', label: 'This School' },
  { value: 'ALL_SCHOOLS', label: 'All Schools' },
  { value: 'COMPANY', label: 'Company / Org' },
  { value: 'ALL_USERS', label: 'All Users' },
]

function avatarColor(name: string) {
  const colors = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777', '#EA580C']
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length
  return colors[h]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BarChart({ data, maxVal, color }: { data: { label: string; value: number }[]; maxVal: number; color: string }) {
  return (
    <div className="space-y-2">
      {data.map(item => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-20 shrink-0 truncate">{item.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div className="h-5 rounded-full flex items-center justify-end pr-2 transition-all duration-700"
              style={{ width: maxVal > 0 ? `${(item.value / maxVal) * 100}%` : '0%', background: color }}>
              {item.value > 0 && <span className="text-xs text-white font-bold">{item.value}</span>}
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-600 w-8 text-right">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No data</div>
  let cum = 0
  const r = 40; const cx = 60; const cy = 60; const circ = 2 * Math.PI * r
  const segs = data.filter(d => d.value > 0).map(d => {
    const pct = (d.value / total) * 100; const start = cum; cum += pct
    return { ...d, pct, start }
  })
  return (
    <div className="flex items-center gap-4">
      <svg width={120} height={120} viewBox="0 0 120 120">
        {segs.map((s, i) => {
          const dl = (s.pct / 100) * circ; const off = circ - ((s.start / 100) * circ)
          return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={20}
            strokeDasharray={`${dl} ${circ - dl}`} strokeDashoffset={off}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} />
        })}
        <circle cx={cx} cy={cy} r={27} fill="white" />
        <text x={cx} y={cy} textAnchor="middle" dy="0.35em" fontSize={13} fontWeight="bold" fill="#374151">{total}</text>
      </svg>
      <div className="space-y-1.5">
        {segs.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-gray-600">{s.label}</span>
            <span className="text-xs font-bold text-gray-800">{s.value}</span>
            <span className="text-xs text-gray-400">({s.pct.toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// ─── Employee Detail Modal ────────────────────────────────────────────────────

function EmployeeDetailModal({ emp, policy, onClose }: { emp: EmployeeAnalysis; policy: LeavePolicy; onClose: () => void }) {
  const now = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())
  const takenThisWeek = emp.leaves.filter(l =>
    l.status === 'APPROVED' && new Date(l.startDate) >= weekStart
  ).reduce((s, l) => s + l.days, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
            style={{ background: avatarColor(emp.name) }}>
            {emp.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">{emp.name}</h2>
            <p className="text-sm text-gray-500">{emp.jobTitle ?? emp.role} {emp.department ? `· ${emp.department}` : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Download size={16} /></button>
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Printer size={16} /></button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><X size={16} /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 4 KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Clock, label: 'Taken This Week', value: takenThisWeek, color: '#4F46E5', bg: '#EEF2FF' },
              { icon: Calendar, label: `This Month (/${policy.monthlyLimit})`, value: emp.approvedThisMonth, color: '#0891B2', bg: '#E0F2FE' },
              { icon: CheckCircle, label: `This Year (/${policy.yearlyLimit})`, value: emp.approvedThisYear, color: '#059669', bg: '#D1FAE5' },
              { icon: AlertCircle, label: 'Pending', value: emp.pending, color: '#D97706', bg: '#FEF3C7' },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                <Icon size={20} className="mx-auto mb-1" style={{ color }} />
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs text-gray-600 mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Progress bars */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Taken This Month</span>
                <span className="text-gray-500">{emp.approvedThisMonth}/{policy.monthlyLimit} · <span className="text-green-600 font-semibold">Remaining: {Math.max(policy.monthlyLimit - emp.approvedThisMonth, 0)}</span></span>
              </div>
              <ProgressBar value={emp.approvedThisMonth} max={policy.monthlyLimit} color="#0891B2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Taken This Year</span>
                <span className="text-gray-500">{emp.approvedThisYear}/{policy.yearlyLimit} · <span className="text-green-600 font-semibold">Remaining: {Math.max(policy.yearlyLimit - emp.approvedThisYear, 0)}</span></span>
              </div>
              <ProgressBar value={emp.approvedThisYear} max={policy.yearlyLimit} color="#059669" />
            </div>
          </div>

          {/* Leave history */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Leave History</h3>
            {emp.leaves.length === 0
              ? <p className="text-sm text-gray-400 text-center py-6">No leave records</p>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Dates & Duration', 'Type', 'Days', 'Status', 'Reason'].map(h => (
                          <th key={h} className="text-left text-xs text-gray-500 font-medium pb-2 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {emp.leaves.slice().sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(l => (
                        <tr key={l.id} className="hover:bg-gray-50">
                          <td className="py-2 pr-4 text-gray-700 whitespace-nowrap">
                            {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                          </td>
                          <td className="py-2 pr-4">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">{l.type}</span>
                          </td>
                          <td className="py-2 pr-4 font-semibold text-gray-700">{l.days}</td>
                          <td className="py-2 pr-4">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: STATUS_COLORS[l.status] + '22', color: STATUS_COLORS[l.status] }}>
                              {l.status}
                            </span>
                          </td>
                          <td className="py-2 text-gray-500 max-w-[160px] truncate">{l.reason || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeaveAnalyticsPage() {
  const locale = useLocale(); const isRtl = locale === 'ar'
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear())

  // Policy state
  const [policy, setPolicy] = useState<LeavePolicy>({
    scope: 'SCHOOL', monthlyLimit: 2, yearlyLimit: 21,
    annualLimit: 21, sickLimit: 10, unpaidLimit: 5, maternityLimit: 90, paternityLimit: 7,
  })
  const [policyDraft, setPolicyDraft] = useState<LeavePolicy>(policy)
  const [policyDirty, setPolicyDirty] = useState(false)
  const [savingPolicy, setSavingPolicy] = useState(false)
  const [policySaved, setPolicySaved] = useState(false)

  // Employee analysis state
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [employees, setEmployees] = useState<EmployeeAnalysis[]>([])
  const [empSearch, setEmpSearch] = useState('')
  const [empDeptFilter, setEmpDeptFilter] = useState('')
  const [selectedEmp, setSelectedEmp] = useState<EmployeeAnalysis | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [leavesRes, policyRes] = await Promise.all([
        apiClient.get(`/hr/leaves?year=${yearFilter}`).then((r: any) => r.data?.data ?? r.data ?? []),
        apiClient.get('/hr/leave-policy').then((r: any) => r.data?.data ?? r.data ?? null).catch(() => null),
      ])
      setLeaves(Array.isArray(leavesRes) ? leavesRes : [])
      if (policyRes) { setPolicy(policyRes); setPolicyDraft(policyRes) }
    } catch {}
    setLoading(false)
  }, [yearFilter])

  useEffect(() => { load() }, [load])

  const loadAnalysis = useCallback(async () => {
    setAnalysisLoading(true)
    try {
      const res = await apiClient.get(`/hr/leave-analysis?year=${yearFilter}`).then((r: any) => r.data?.data ?? r.data ?? [])
      setEmployees(Array.isArray(res) ? res : [])
    } catch {}
    setAnalysisLoading(false)
  }, [yearFilter])

  useEffect(() => { if (showAnalysis) loadAnalysis() }, [showAnalysis, loadAnalysis])

  const handleSavePolicy = async () => {
    setSavingPolicy(true)
    try {
      const res = await apiClient.patch('/hr/leave-policy', policyDraft).then((r: any) => r.data?.data ?? r.data)
      if (res) setPolicy(res)
      setPolicyDirty(false)
      setPolicySaved(true)
      setTimeout(() => setPolicySaved(false), 2000)
    } catch {}
    setSavingPolicy(false)
  }

  const updateDraft = (key: keyof LeavePolicy, val: any) => {
    setPolicyDraft(p => ({ ...p, [key]: val }))
    setPolicyDirty(true)
  }

  // Leave chart data
  const byType = LEAVE_TYPES.map((t, i) => ({ label: t, value: leaves.filter(l => l.type === t).length, color: TYPE_COLORS[i] }))
  const byStatus = STATUSES.map(s => ({ label: s, value: leaves.filter(l => l.status === s).length, color: STATUS_COLORS[s] }))
  const approved = leaves.filter(l => l.status === 'APPROVED')
  const byMonth = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(2000, i).toLocaleString('en', { month: 'short' }),
    value: approved.filter(l => new Date(l.startDate).getMonth() === i).length,
  }))
  const totalDaysByType = LEAVE_TYPES.map((t, i) => ({
    label: t, value: leaves.filter(l => l.type === t && l.status === 'APPROVED').reduce((s, l) => s + l.days, 0), color: TYPE_COLORS[i],
  }))
  const deptMap: Record<string, number> = {}
  approved.forEach(l => { const d = l.staff?.department ?? 'Unknown'; deptMap[d] = (deptMap[d] ?? 0) + 1 })
  const byDept = Object.entries(deptMap).sort(([, a], [, b]) => b - a).slice(0, 6).map(([label, value]) => ({ label, value }))

  const kpi = [
    { label: 'Total Requests', value: leaves.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Approved', value: approved.length, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending', value: leaves.filter(l => l.status === 'PENDING').length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Total Days', value: approved.reduce((s, l) => s + l.days, 0), color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  // Employee analysis filters
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))] as string[]
  const filteredEmps = employees.filter(e => {
    const matchSearch = !empSearch || e.name.toLowerCase().includes(empSearch.toLowerCase()) || e.email.toLowerCase().includes(empSearch.toLowerCase())
    const matchDept = !empDeptFilter || e.department === empDeptFilter
    return matchSearch && matchDept
  })

  return (
    <div className="p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={22} className="text-indigo-600" />
            {isRtl ? 'تحليلات الإجازات' : 'Leave Analytics'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{isRtl ? 'نظرة عامة على بيانات الإجازات' : 'Overview of leave data and policy management'}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={yearFilter} onChange={e => setYearFilter(+e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={() => setShowAnalysis(s => !s)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${showAnalysis ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
            <Users size={15} />
            Employee Analysis
          </button>
        </div>
      </div>

      {/* ── Leave Policy Rules Panel ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Leave Policy Rules</h2>
          <span className="text-xs text-gray-400 ml-1">— HR Manager sets limits that apply to employees</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Scope */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Apply To (Scope)</label>
            <select
              value={policyDraft.scope}
              onChange={e => updateDraft('scope', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              {SCOPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Monthly limit */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Leave Limit (days)</label>
            <input type="number" min={0} max={31}
              value={policyDraft.monthlyLimit}
              onChange={e => updateDraft('monthlyLimit', +e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>

          {/* Yearly limit */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Yearly Leave Limit (days)</label>
            <input type="number" min={0} max={365}
              value={policyDraft.yearlyLimit}
              onChange={e => updateDraft('yearlyLimit', +e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>

          {/* Per-type limits */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Annual Leave Limit (days/year)</label>
            <input type="number" min={0} value={policyDraft.annualLimit}
              onChange={e => updateDraft('annualLimit', +e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sick Leave Limit (days/year)</label>
            <input type="number" min={0} value={policyDraft.sickLimit}
              onChange={e => updateDraft('sickLimit', +e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unpaid Leave Limit (days/year)</label>
            <input type="number" min={0} value={policyDraft.unpaidLimit}
              onChange={e => updateDraft('unpaidLimit', +e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Maternity Leave (days)</label>
            <input type="number" min={0} value={policyDraft.maternityLimit}
              onChange={e => updateDraft('maternityLimit', +e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Paternity Leave (days)</label>
            <input type="number" min={0} value={policyDraft.paternityLimit}
              onChange={e => updateDraft('paternityLimit', +e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>

          {/* Notes */}
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
            <input type="text"
              value={policyDraft.notes ?? ''}
              onChange={e => updateDraft('notes', e.target.value)}
              placeholder="e.g. Subject to manager approval"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Current scope:</span>
            <span className="font-semibold text-indigo-600">{SCOPE_OPTIONS.find(o => o.value === policy.scope)?.label}</span>
            <span>·</span>
            <span>{policy.monthlyLimit} days/month · {policy.yearlyLimit} days/year</span>
          </div>
          <button
            onClick={handleSavePolicy}
            disabled={!policyDirty || savingPolicy}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${policyDirty ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            {savingPolicy ? 'Saving…' : policySaved ? 'Saved ✓' : 'Save Policy'}
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpi.map(k => (
          <div key={k.label} className={`${k.bg} rounded-2xl p-4`}>
            <p className={`text-3xl font-bold ${k.color}`}>{loading ? '—' : k.value}</p>
            <p className="text-sm text-gray-600 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      {loading
        ? <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl" />)}</div>
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-4">By Status</p>
              <DonutChart data={byStatus} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-4">By Leave Type</p>
              <DonutChart data={byType.filter(d => d.value > 0)} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-4">Approved Leaves by Month</p>
              <BarChart data={byMonth} maxVal={Math.max(...byMonth.map(d => d.value), 1)} color="#4F46E5" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-4">Total Days Taken by Type</p>
              <BarChart data={totalDaysByType.filter(d => d.value > 0)} maxVal={Math.max(...totalDaysByType.map(d => d.value), 1)} color="#059669" />
            </div>
            {byDept.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 md:col-span-2">
                <p className="font-semibold text-gray-800 mb-4">Approved Leaves by Department</p>
                <BarChart data={byDept} maxVal={Math.max(...byDept.map(d => d.value), 1)} color="#7C3AED" />
              </div>
            )}
          </div>
        )
      }

      {/* ── Employee Analysis Section ── */}
      {showAnalysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-indigo-600" />
              Employee Leave Overview
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search employees…"
                value={empSearch}
                onChange={e => setEmpSearch(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              {departments.length > 0 && (
                <select
                  value={empDeptFilter}
                  onChange={e => setEmpDeptFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
            </div>
          </div>

          {analysisLoading
            ? <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <div key={i} className="h-44 bg-gray-100 rounded-2xl" />)}
              </div>
            : filteredEmps.length === 0
              ? <div className="text-center py-16 text-gray-400">No employees found</div>
              : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredEmps.map(emp => (
                    <button
                      key={emp.userId}
                      onClick={() => setSelectedEmp(emp)}
                      className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
                          style={{ background: avatarColor(emp.name) }}>
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{emp.name}</p>
                          <p className="text-xs text-gray-500 truncate">{emp.jobTitle ?? emp.role}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${emp.onLeave ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          {emp.onLeave ? 'On Leave' : 'Active'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>This Month</span>
                          <span className="font-semibold text-gray-800">{emp.approvedThisMonth}<span className="text-gray-400">/{policy.monthlyLimit}</span></span>
                        </div>
                        <ProgressBar value={emp.approvedThisMonth} max={policy.monthlyLimit} color="#0891B2" />

                        <div className="flex justify-between mt-1">
                          <span>This Year</span>
                          <span className="font-semibold text-gray-800">{emp.approvedThisYear}<span className="text-gray-400">/{policy.yearlyLimit}</span></span>
                        </div>
                        <ProgressBar value={emp.approvedThisYear} max={policy.yearlyLimit} color="#059669" />
                      </div>

                      <div className="flex justify-between mt-3 pt-3 border-t border-gray-50 text-xs">
                        <span className="text-gray-500">Pending: <span className="font-semibold text-yellow-600">{emp.pending}</span></span>
                        <span className="text-green-600 font-medium">Remaining: {Math.max(policy.monthlyLimit - emp.approvedThisMonth, 0)} this month</span>
                      </div>
                    </button>
                  ))}
                </div>
              )
          }
        </div>
      )}

      {/* Employee detail modal */}
      {selectedEmp && (
        <EmployeeDetailModal emp={selectedEmp} policy={policy} onClose={() => setSelectedEmp(null)} />
      )}
    </div>
  )
}
