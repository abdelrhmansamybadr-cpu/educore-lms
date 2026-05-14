'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { apiClient } from '@/lib/api'
import { Calendar, X, Check } from 'lucide-react'

interface Leave {
  id: string; type: string; status: string; startDate: string; endDate: string; days: number; reason: string
  staff: { user: { email: string; profile?: { firstName: string; lastName: string } }; department?: string }
  approverNote?: string
}

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
}
const LEAVE_TYPES = ['ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'STUDY']

function AddLeaveDialog({ onClose, onSave, staffList }: { onClose: () => void; onSave: () => void; staffList: any[] }) {
  const isRtl = useLocale() === 'ar'
  const [form, setForm] = useState({ staffId: '', type: 'ANNUAL', startDate: '', endDate: '', reason: '' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.staffId || !form.startDate || !form.endDate) return
    setSaving(true)
    try {
      await apiClient.post('/hr/leaves', form)
      onSave(); onClose()
    } catch {}
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <p className="font-bold text-gray-900">{isRtl ? 'إضافة طلب إجازة' : 'Add Leave Request'}</p>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs text-gray-500 font-medium">{isRtl ? 'الموظف' : 'Employee'}</label>
            <select value={form.staffId} onChange={e => setForm(p => ({ ...p, staffId: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="">{isRtl ? 'اختر موظفاً' : 'Select employee'}</option>
              {staffList.map((s: any) => <option key={s.id} value={s.id}>{[s.user?.profile?.firstName, s.user?.profile?.lastName].filter(Boolean).join(' ') || s.user?.email}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">{isRtl ? 'نوع الإجازة' : 'Leave Type'}</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">{isRtl ? 'من' : 'Start Date'}</label>
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">{isRtl ? 'إلى' : 'End Date'}</label>
              <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">{isRtl ? 'السبب' : 'Reason'}</label>
            <textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} rows={3}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-2">
          <button onClick={save} disabled={saving} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
            {saving ? '...' : (isRtl ? 'إرسال' : 'Submit')}
          </button>
          <button onClick={onClose} className="px-4 border border-gray-200 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
        </div>
      </div>
    </div>
  )
}

export default function LeavesPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<typeof STATUS_TABS[number]>('ALL')
  const [showAdd, setShowAdd] = useState(false)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [lRes, sRes] = await Promise.all([
        apiClient.get('/hr/leaves').then((r: any) => r.data?.data ?? r.data ?? []),
        apiClient.get('/hr/all-users').then((r: any) => r.data?.data ?? r.data ?? []),
      ])
      setLeaves(Array.isArray(lRes) ? lRes : [])
      setStaffList(Array.isArray(sRes) ? sRes : [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = leaves.filter(l => tab === 'ALL' || l.status === tab)

  const approve = async (id: string) => {
    await apiClient.patch(`/hr/leaves/${id}/approve`)
    load()
  }

  const reject = async () => {
    if (!rejectId) return
    await apiClient.patch(`/hr/leaves/${rejectId}/reject`, { note: rejectNote })
    setRejectId(null); setRejectNote(''); load()
  }

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Calendar size={22} className="text-indigo-600" />{isRtl ? 'طلبات الإجازة' : 'Leave Requests'}</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} {isRtl ? 'طلب' : 'requests'}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700">
          <Calendar size={14} /> {isRtl ? 'إضافة طلب' : 'Add Request'}
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-800'}`}>
            {t} {t !== 'ALL' && <span className="ml-1 text-xs opacity-70">{leaves.filter(l => l.status === t).length}</span>}
          </button>
        ))}
      </div>

      {loading
        ? <div className="animate-pulse space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>
        : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  {['Employee', 'Type', 'Start', 'End', 'Days', 'Reason', 'Status', 'Actions'].map(h =>
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0
                  ? <tr><td colSpan={8} className="text-center py-12 text-gray-400"><Calendar size={32} className="mx-auto mb-2 opacity-20" />{isRtl ? 'لا توجد طلبات' : 'No requests'}</td></tr>
                  : filtered.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800">{l.staff?.user?.profile?.firstName} {l.staff?.user?.profile?.lastName}</p>
                        <p className="text-xs text-gray-400">{l.staff?.department ?? l.staff?.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{l.type}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(l.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(l.endDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">{l.days}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-[160px] truncate">{l.reason}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs rounded-full px-2.5 py-0.5 font-semibold ${STATUS_COLORS[l.status] ?? 'bg-gray-100 text-gray-700'}`}>{l.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {l.status === 'PENDING' && (
                          <div className="flex gap-1">
                            <button onClick={() => approve(l.id)} className="p-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors" title="Approve">
                              <Check size={14} />
                            </button>
                            <button onClick={() => { setRejectId(l.id); setRejectNote('') }} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors" title="Reject">
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )
      }

      {showAdd && <AddLeaveDialog staffList={staffList} onClose={() => setShowAdd(false)} onSave={load} />}

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <p className="font-bold text-gray-900">{isRtl ? 'سبب الرفض' : 'Rejection Reason'}</p>
            <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={3}
              placeholder={isRtl ? 'اكتب السبب...' : 'Enter reason...'}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300" />
            <div className="flex gap-2">
              <button onClick={reject} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold">{isRtl ? 'رفض' : 'Reject'}</button>
              <button onClick={() => setRejectId(null)} className="px-4 border border-gray-200 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
