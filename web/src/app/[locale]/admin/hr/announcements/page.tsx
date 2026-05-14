'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { apiClient } from '@/lib/api'
import { Megaphone, Plus, X, Pin, Trash2, Edit2, AlertCircle, Info, AlertTriangle } from 'lucide-react'

interface Announcement { id: string; title: string; content: string; priority: string; targetType: string; targetDept?: string; isPinned: boolean; createdAt: string; author?: { profile?: { firstName: string; lastName: string } } }

const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT']
const TARGET_TYPES = ['ALL', 'DEPARTMENT', 'MANAGEMENT', 'TEACHERS', 'STAFF']
const PRIORITY_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  LOW: { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600', icon: <Info size={14} /> },
  NORMAL: { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700', icon: <Info size={14} /> },
  HIGH: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', icon: <AlertTriangle size={14} /> },
  URGENT: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: <AlertCircle size={14} /> },
}

function AnnouncementDialog({ ann, onClose, onSave }: { ann?: Announcement; onClose: () => void; onSave: () => void }) {
  const isRtl = useLocale() === 'ar'
  const [form, setForm] = useState({
    title: ann?.title ?? '', content: ann?.content ?? '', priority: ann?.priority ?? 'NORMAL',
    targetType: ann?.targetType ?? 'ALL', targetDept: ann?.targetDept ?? '', isPinned: ann?.isPinned ?? false,
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    try {
      if (ann) await apiClient.patch(`/hr/announcements/${ann.id}`, form)
      else await apiClient.post('/hr/announcements', form)
      onSave(); onClose()
    } catch {}
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <p className="font-bold text-gray-900">{ann ? (isRtl ? 'تعديل الإعلان' : 'Edit Announcement') : (isRtl ? 'إعلان جديد' : 'New Announcement')}</p>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'العنوان' : 'Title'}</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'المحتوى' : 'Content'}</label>
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={5}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الأولوية' : 'Priority'}</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {PRIORITIES.map(pr => <option key={pr} value={pr}>{pr}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الموجه إلى' : 'Target'}</label>
              <select value={form.targetType} onChange={e => setForm(p => ({ ...p, targetType: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {TARGET_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select></div>
          </div>
          {form.targetType === 'DEPARTMENT' && (
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'القسم' : 'Department'}</label>
              <input value={form.targetDept} onChange={e => setForm(p => ({ ...p, targetDept: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPinned} onChange={e => setForm(p => ({ ...p, isPinned: e.target.checked }))}
              className="w-4 h-4 rounded text-indigo-600" />
            <span className="text-sm text-gray-700">{isRtl ? 'تثبيت هذا الإعلان' : 'Pin this announcement'}</span>
          </label>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-2">
          <button onClick={save} disabled={saving} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">{saving ? '...' : (isRtl ? 'نشر' : 'Publish')}</button>
          <button onClick={onClose} className="px-4 border border-gray-200 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
        </div>
      </div>
    </div>
  )
}

export default function AnnouncementsPage() {
  const locale = useLocale(); const isRtl = locale === 'ar'
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Announcement | undefined>()
  const [priorityFilter, setPriorityFilter] = useState('ALL')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/hr/announcements').then((r: any) => r.data?.data ?? r.data ?? [])
      setAnnouncements(Array.isArray(res) ? res : [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const del = async (id: string) => {
    if (!confirm(isRtl ? 'حذف هذا الإعلان؟' : 'Delete this announcement?')) return
    await apiClient.delete(`/hr/announcements/${id}`); load()
  }

  const togglePin = async (ann: Announcement) => {
    await apiClient.patch(`/hr/announcements/${ann.id}`, { isPinned: !ann.isPinned }); load()
  }

  const filtered = announcements.filter(a => priorityFilter === 'ALL' || a.priority === priorityFilter)
  const pinned = filtered.filter(a => a.isPinned)
  const unpinned = filtered.filter(a => !a.isPinned)

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Megaphone size={22} className="text-indigo-600" />{isRtl ? 'الإعلانات' : 'Announcements'}</h1>
          <p className="text-sm text-gray-500 mt-1">{announcements.length} {isRtl ? 'إعلان' : 'announcements'}</p>
        </div>
        <button onClick={() => { setEditing(undefined); setShowDialog(true) }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700">
          <Plus size={14} />{isRtl ? 'إعلان جديد' : 'New Announcement'}
        </button>
      </div>

      {/* Priority filter */}
      <div className="flex gap-1 flex-wrap">
        {['ALL', ...PRIORITIES].map(p => (
          <button key={p} onClick={() => setPriorityFilter(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${priorityFilter === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {p === 'ALL' ? (isRtl ? 'الكل' : 'All') : p}
          </button>
        ))}
      </div>

      {loading
        ? <div className="animate-pulse space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}</div>
        : (
          <div className="space-y-4">
            {/* Pinned */}
            {pinned.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1"><Pin size={12} />{isRtl ? 'مثبتة' : 'Pinned'}</p>
                <div className="space-y-3">
                  {pinned.map(a => <AnnouncementCard key={a.id} ann={a} isRtl={isRtl} onEdit={() => { setEditing(a); setShowDialog(true) }} onDelete={() => del(a.id)} onTogglePin={() => togglePin(a)} />)}
                </div>
              </div>
            )}

            {/* Regular */}
            {unpinned.length > 0 && (
              <div>
                {pinned.length > 0 && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{isRtl ? 'الأخيرة' : 'Recent'}</p>}
                <div className="space-y-3">
                  {unpinned.map(a => <AnnouncementCard key={a.id} ann={a} isRtl={isRtl} onEdit={() => { setEditing(a); setShowDialog(true) }} onDelete={() => del(a.id)} onTogglePin={() => togglePin(a)} />)}
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24">
                <Megaphone size={48} className="text-gray-200 mb-4" />
                <p className="text-gray-400">{isRtl ? 'لا توجد إعلانات' : 'No announcements yet'}</p>
              </div>
            )}
          </div>
        )
      }

      {showDialog && <AnnouncementDialog ann={editing} onClose={() => { setShowDialog(false); setEditing(undefined) }} onSave={load} />}
    </div>
  )
}

function AnnouncementCard({ ann, isRtl, onEdit, onDelete, onTogglePin }: { ann: Announcement; isRtl: boolean; onEdit: () => void; onDelete: () => void; onTogglePin: () => void }) {
  const style = PRIORITY_COLORS[ann.priority] ?? PRIORITY_COLORS.NORMAL
  const authorName = ann.author ? `${ann.author.profile?.firstName ?? ''} ${ann.author.profile?.lastName ?? ''}`.trim() : ''

  return (
    <div className={`rounded-2xl border p-5 ${style.bg} ${ann.isPinned ? 'ring-2 ring-indigo-200' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {ann.isPinned && <Pin size={13} className="text-indigo-600" />}
            <span className={`text-xs font-bold uppercase ${style.text}`}>{ann.priority}</span>
            <span className="text-xs bg-white/70 text-gray-600 rounded-full px-2 py-0.5">{ann.targetType.replace('_', ' ')}</span>
            {ann.targetDept && <span className="text-xs text-gray-500">({ann.targetDept})</span>}
          </div>
          <p className="font-bold text-gray-900 mt-1">{ann.title}</p>
          <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{ann.content}</p>
          <p className="text-xs text-gray-400 mt-3">
            {authorName && <span>{isRtl ? 'بواسطة:' : 'By'} {authorName} · </span>}
            {new Date(ann.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onTogglePin} className={`p-1.5 rounded-lg transition-colors ${ann.isPinned ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-white/70 text-gray-400'}`} title={ann.isPinned ? 'Unpin' : 'Pin'}>
            <Pin size={14} />
          </button>
          <button onClick={onEdit} className="p-1.5 hover:bg-white/70 rounded-lg text-gray-500"><Edit2 size={14} /></button>
          <button onClick={onDelete} className="p-1.5 hover:bg-red-100 rounded-lg text-red-500"><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  )
}
