'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { apiClient } from '@/lib/api'
import { Building2, Plus, Edit2, Trash2, X } from 'lucide-react'

interface Dept { id: string; name: string; description?: string; headId?: string; budget?: number }

function DeptDialog({ dept, onClose, onSave, staffList }: { dept?: Dept; onClose: () => void; onSave: () => void; staffList: any[] }) {
  const isRtl = useLocale() === 'ar'
  const [form, setForm] = useState({ name: dept?.name ?? '', description: dept?.description ?? '', headId: dept?.headId ?? '', budget: dept?.budget ?? '' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (dept) await apiClient.patch(`/hr/departments/${dept.id}`, form)
      else await apiClient.post('/hr/departments', form)
      onSave(); onClose()
    } catch {}
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <p className="font-bold text-gray-900">{dept ? (isRtl ? 'تعديل قسم' : 'Edit Department') : (isRtl ? 'إضافة قسم' : 'Add Department')}</p>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الاسم' : 'Name'}</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الوصف' : 'Description'}</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'رئيس القسم' : 'Department Head'}</label>
            <select value={form.headId} onChange={e => setForm(p => ({ ...p, headId: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="">{isRtl ? 'بدون رئيس' : 'None'}</option>
              {staffList.map((s: any) => <option key={s.user?.id} value={s.user?.id}>{[s.user?.profile?.firstName, s.user?.profile?.lastName].filter(Boolean).join(' ') || s.user?.email}</option>)}
            </select></div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الميزانية' : 'Budget'}</label>
            <input type="number" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))}
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

export default function DepartmentsPage() {
  const locale = useLocale(); const isRtl = locale === 'ar'
  const [depts, setDepts] = useState<Dept[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Dept | undefined>()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dRes, sRes] = await Promise.all([
        apiClient.get('/hr/departments').then((r: any) => r.data?.data ?? r.data ?? []),
        apiClient.get('/hr/all-users').then((r: any) => r.data?.data ?? r.data ?? []),
      ])
      setDepts(Array.isArray(dRes) ? dRes : [])
      setStaffList(Array.isArray(sRes) ? sRes : [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const del = async (id: string) => {
    if (!confirm(isRtl ? 'حذف هذا القسم؟' : 'Delete this department?')) return
    await apiClient.delete(`/hr/departments/${id}`)
    load()
  }

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Building2 size={22} className="text-indigo-600" />{isRtl ? 'الأقسام' : 'Departments'}</h1>
          <p className="text-sm text-gray-500 mt-1">{depts.length} {isRtl ? 'قسم' : 'departments'}</p></div>
        <button onClick={() => { setEditing(undefined); setShowDialog(true) }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700">
          <Plus size={14} />{isRtl ? 'إضافة قسم' : 'Add Department'}
        </button>
      </div>
      {loading
        ? <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}</div>
        : depts.length === 0
          ? <div className="flex flex-col items-center justify-center py-24"><Building2 size={48} className="text-gray-200 mb-4" /><p className="text-gray-400">{isRtl ? 'لا توجد أقسام بعد' : 'No departments yet'}</p></div>
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {depts.map(d => (
                <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><Building2 size={18} className="text-indigo-600" /></div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(d); setShowDialog(true) }} className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600"><Edit2 size={14} /></button>
                      <button onClick={() => del(d.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <p className="font-bold text-gray-800 mt-3">{d.name}</p>
                  {d.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{d.description}</p>}
                  {d.budget && <p className="text-xs text-emerald-600 mt-2 font-medium">{isRtl ? 'الميزانية:' : 'Budget:'} ${Number(d.budget).toLocaleString()}</p>}
                </div>
              ))}
            </div>
          )
      }
      {showDialog && <DeptDialog dept={editing} staffList={staffList} onClose={() => { setShowDialog(false); setEditing(undefined) }} onSave={load} />}
    </div>
  )
}
