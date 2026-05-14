'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { apiClient } from '@/lib/api'
import { ClipboardCheck, Plus, X, Download } from 'lucide-react'

interface Att { id: string; date: string; checkIn?: string; checkOut?: string; status: string; notes?: string; hoursWorked?: number; staff: { user: { email: string; profile?: { firstName: string; lastName: string } } } }

const STATUS_COLORS: Record<string, string> = { PRESENT: 'bg-green-100 text-green-700', ABSENT: 'bg-red-100 text-red-700', LATE: 'bg-yellow-100 text-yellow-700', HALF_DAY: 'bg-orange-100 text-orange-700' }
const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY']

function LogDialog({ onClose, onSave, staffList }: { onClose: () => void; onSave: () => void; staffList: any[] }) {
  const isRtl = useLocale() === 'ar'
  const [form, setForm] = useState({ staffId: '', date: new Date().toISOString().slice(0, 10), checkIn: '08:00', checkOut: '17:00', status: 'PRESENT', notes: '' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.staffId) return
    setSaving(true)
    try {
      await apiClient.post('/hr/attendance', form)
      onSave(); onClose()
    } catch {}
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <p className="font-bold text-gray-900">{isRtl ? 'تسجيل حضور' : 'Log Attendance'}</p>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الموظف' : 'Employee'}</label>
            <select value={form.staffId} onChange={e => setForm(p => ({ ...p, staffId: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="">{isRtl ? 'اختر موظفاً' : 'Select employee'}</option>
              {staffList.map((s: any) => <option key={s.id} value={s.id}>{[s.user?.profile?.firstName, s.user?.profile?.lastName].filter(Boolean).join(' ') || s.user?.email}</option>)}
            </select></div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'التاريخ' : 'Date'}</label>
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'وقت الدخول' : 'Check In'}</label>
              <input type="time" value={form.checkIn} onChange={e => setForm(p => ({ ...p, checkIn: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'وقت الخروج' : 'Check Out'}</label>
              <input type="time" value={form.checkOut} onChange={e => setForm(p => ({ ...p, checkOut: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الحالة' : 'Status'}</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select></div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'ملاحظات' : 'Notes'}</label>
            <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-2">
          <button onClick={save} disabled={saving} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">{saving ? '...' : (isRtl ? 'حفظ' : 'Save')}</button>
          <button onClick={onClose} className="px-4 border border-gray-200 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
        </div>
      </div>
    </div>
  )
}

export default function AttendancePage() {
  const locale = useLocale(); const isRtl = locale === 'ar'
  const now = new Date()
  const [records, setRecords] = useState<Att[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [showDialog, setShowDialog] = useState(false)

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [aRes, sRes] = await Promise.all([
        apiClient.get(`/hr/attendance?month=${month}&year=${year}`).then((r: any) => r.data?.data ?? r.data ?? []),
        apiClient.get('/hr/all-users').then((r: any) => r.data?.data ?? r.data ?? []),
      ])
      setRecords(Array.isArray(aRes) ? aRes : [])
      setStaffList(Array.isArray(sRes) ? sRes : [])
    } catch {}
    setLoading(false)
  }, [month, year])

  useEffect(() => { load() }, [load])

  const summary = { PRESENT: 0, ABSENT: 0, LATE: 0, HALF_DAY: 0 }
  records.forEach(r => { if (r.status in summary) summary[r.status as keyof typeof summary]++ })

  const exportCsv = () => {
    const rows = [['Employee', 'Date', 'Check In', 'Check Out', 'Status', 'Hours']]
    records.forEach(r => rows.push([
      `${r.staff?.user?.profile?.firstName ?? ''} ${r.staff?.user?.profile?.lastName ?? ''}`,
      new Date(r.date).toLocaleDateString(), r.checkIn ?? '', r.checkOut ?? '', r.status, String(r.hoursWorked ?? ''),
    ]))
    const csv = rows.map(row => row.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `attendance-${month}-${year}.csv`; a.click()
  }

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><ClipboardCheck size={22} className="text-indigo-600" />{isRtl ? 'الحضور والغياب' : 'Staff Attendance'}</h1>
          <p className="text-sm text-gray-500 mt-1">{records.length} {isRtl ? 'سجل' : 'records'}</p></div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="border border-gray-200 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 flex items-center gap-1"><Download size={14} />{isRtl ? 'تصدير' : 'Export'}</button>
          <button onClick={() => setShowDialog(true)} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2"><Plus size={14} />{isRtl ? 'تسجيل حضور' : 'Log Attendance'}</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'] as const).map(s => (
          <div key={s} className={`rounded-xl p-4 ${STATUS_COLORS[s].replace('text-', 'border ').replace('bg-', 'bg-')}`}>
            <p className="text-2xl font-bold">{summary[s]}</p>
            <p className="text-sm mt-0.5 opacity-80">{s.replace('_', ' ')}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={month} onChange={e => setMonth(+e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(+e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading
        ? <div className="animate-pulse space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}</div>
        : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-gray-50 bg-gray-50/50">
                {['Employee', 'Date', 'Check In', 'Check Out', 'Status', 'Hours'].map(h =>
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {records.length === 0
                  ? <tr><td colSpan={6} className="text-center py-12 text-gray-400"><ClipboardCheck size={32} className="mx-auto mb-2 opacity-20" />{isRtl ? 'لا توجد سجلات' : 'No records'}</td></tr>
                  : records.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800">{[r.staff?.user?.profile?.firstName, r.staff?.user?.profile?.lastName].filter(Boolean).join(' ') || r.staff?.user?.email}</p>
                        <p className="text-xs text-gray-400">{r.staff?.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.checkIn ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.checkOut ?? '—'}</td>
                      <td className="px-4 py-3"><span className={`text-xs rounded-full px-2.5 py-0.5 font-semibold ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-700'}`}>{r.status}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.hoursWorked ? `${r.hoursWorked}h` : '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )
      }
      {showDialog && <LogDialog staffList={staffList} onClose={() => setShowDialog(false)} onSave={load} />}
    </div>
  )
}
