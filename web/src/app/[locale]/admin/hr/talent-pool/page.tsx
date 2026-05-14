'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { apiClient } from '@/lib/api'
import { Users, Plus, X, Star, Search, Trash2, Edit2 } from 'lucide-react'

interface Candidate { id: string; name: string; email: string; phone?: string; appliedPosition: string; department: string; score: number; status: string; notes?: string; createdAt: string }

const CANDIDATE_STATUSES = ['ACTIVE', 'CONTACTED', 'INTERVIEWING', 'HIRED', 'REJECTED', 'ON_HOLD']
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-blue-100 text-blue-700', CONTACTED: 'bg-yellow-100 text-yellow-700',
  INTERVIEWING: 'bg-purple-100 text-purple-700', HIRED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700', ON_HOLD: 'bg-gray-100 text-gray-600',
}

function CandidateDialog({ candidate, onClose, onSave }: { candidate?: Candidate; onClose: () => void; onSave: () => void }) {
  const isRtl = useLocale() === 'ar'
  const [form, setForm] = useState({
    name: candidate?.name ?? '', email: candidate?.email ?? '', phone: candidate?.phone ?? '',
    appliedPosition: candidate?.appliedPosition ?? '', department: candidate?.department ?? '',
    score: candidate?.score ?? 3, status: candidate?.status ?? 'ACTIVE', notes: candidate?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (candidate) await apiClient.patch(`/hr/talent/${candidate.id}`, form)
      else await apiClient.post('/hr/talent', form)
      onSave(); onClose()
    } catch {}
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <p className="font-bold text-gray-900">{candidate ? (isRtl ? 'تعديل مرشح' : 'Edit Candidate') : (isRtl ? 'إضافة مرشح' : 'Add Candidate')}</p>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الاسم' : 'Full Name'}</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'البريد' : 'Email'}</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الهاتف' : 'Phone'}</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'المنصب' : 'Target Position'}</label>
              <input value={form.appliedPosition} onChange={e => setForm(p => ({ ...p, appliedPosition: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'القسم' : 'Department'}</label>
              <input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="text-xs text-gray-500 font-medium mb-2 block">{isRtl ? 'التقييم' : 'Score'} ({form.score}/5)</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setForm(p => ({ ...p, score: n }))}
                  className={`transition-colors ${n <= form.score ? 'text-amber-400' : 'text-gray-200'}`}>
                  <Star size={24} fill="currentColor" />
                </button>
              ))}
            </div>
          </div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الحالة' : 'Status'}</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
              {CANDIDATE_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select></div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'ملاحظات' : 'Notes'}</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" /></div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-2">
          <button onClick={save} disabled={saving} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">{saving ? '...' : (isRtl ? 'حفظ' : 'Save')}</button>
          <button onClick={onClose} className="px-4 border border-gray-200 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
        </div>
      </div>
    </div>
  )
}

export default function TalentPoolPage() {
  const locale = useLocale(); const isRtl = locale === 'ar'
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Candidate | undefined>()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/hr/talent').then((r: any) => r.data?.data ?? r.data ?? [])
      setCandidates(Array.isArray(res) ? res : [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const del = async (id: string) => {
    if (!confirm(isRtl ? 'حذف هذا المرشح؟' : 'Delete this candidate?')) return
    await apiClient.delete(`/hr/talent/${id}`); load()
  }

  const filtered = candidates.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.appliedPosition.toLowerCase().includes(search.toLowerCase()) || c.department.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const byStatus = CANDIDATE_STATUSES.reduce((acc, s) => ({ ...acc, [s]: candidates.filter(c => c.status === s).length }), {} as Record<string, number>)

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Users size={22} className="text-indigo-600" />{isRtl ? 'بنك المواهب' : 'Talent Pool'}</h1>
          <p className="text-sm text-gray-500 mt-1">{candidates.length} {isRtl ? 'مرشح' : 'candidates'}</p>
        </div>
        <button onClick={() => { setEditing(undefined); setShowDialog(true) }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700">
          <Plus size={14} />{isRtl ? 'إضافة مرشح' : 'Add Candidate'}
        </button>
      </div>

      {/* Status summary chips */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setStatusFilter('ALL')}
          className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${statusFilter === 'ALL' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          {isRtl ? 'الكل' : 'All'} ({candidates.length})
        </button>
        {CANDIDATE_STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s.replace('_', ' ')} ({byStatus[s] ?? 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isRtl ? 'بحث...' : 'Search candidates...'}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm" />
      </div>

      {loading
        ? <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl" />)}</div>
        : filtered.length === 0
          ? <div className="flex flex-col items-center justify-center py-24"><Users size={48} className="text-gray-200 mb-4" /><p className="text-gray-400">{isRtl ? 'لا توجد مرشحين' : 'No candidates found'}</p></div>
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(c => (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(c); setShowDialog(true) }} className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600"><Edit2 size={13} /></button>
                      <button onClick={() => del(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <p className="font-bold text-gray-800 mt-3">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.appliedPosition}</p>
                  <p className="text-xs text-gray-400">{c.department}</p>
                  <div className="flex items-center gap-0.5 mt-2">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={13} fill={n <= c.score ? '#F59E0B' : 'transparent'} className={n <= c.score ? 'text-amber-400' : 'text-gray-200'} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs rounded-full px-2.5 py-0.5 font-semibold ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-600'}`}>{c.status.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  {c.notes && <p className="text-xs text-gray-400 mt-2 line-clamp-2 italic">{c.notes}</p>}
                </div>
              ))}
            </div>
          )
      }

      {showDialog && <CandidateDialog candidate={editing} onClose={() => { setShowDialog(false); setEditing(undefined) }} onSave={load} />}
    </div>
  )
}
