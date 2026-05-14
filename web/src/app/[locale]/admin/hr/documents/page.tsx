'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { apiClient } from '@/lib/api'
import { FileText, Plus, X, Check, Upload } from 'lucide-react'

interface DocType { id: string; name: string; required: boolean; hasExpiry: boolean; sortOrder: number }
interface Document { id: string; typeId: string; fileUrl: string; fileName: string; status: string; expiresAt?: string; notes?: string; type?: { name: string; hasExpiry: boolean }; staff: { user: { email: string; profile?: { firstName: string; lastName: string } } } }

const DOC_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700', APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700', EXPIRED: 'bg-orange-100 text-orange-700',
}

function DocTypeDialog({ type, onClose, onSave }: { type?: DocType; onClose: () => void; onSave: () => void }) {
  const isRtl = useLocale() === 'ar'
  const [form, setForm] = useState({ name: type?.name ?? '', required: type?.required ?? false, hasExpiry: type?.hasExpiry ?? false, sortOrder: type?.sortOrder ?? 0 })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (type) await apiClient.patch(`/hr/document-types/${type.id}`, form)
      else await apiClient.post('/hr/document-types', form)
      onSave(); onClose()
    } catch {}
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <p className="font-bold text-gray-900">{type ? (isRtl ? 'تعديل نوع المستند' : 'Edit Document Type') : (isRtl ? 'نوع مستند جديد' : 'New Document Type')}</p>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الاسم' : 'Name'}</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الترتيب' : 'Sort Order'}</label>
            <input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: +e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.required} onChange={e => setForm(p => ({ ...p, required: e.target.checked }))} className="w-4 h-4 rounded text-indigo-600" />
            <span className="text-sm text-gray-700">{isRtl ? 'مطلوب' : 'Required'}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.hasExpiry} onChange={e => setForm(p => ({ ...p, hasExpiry: e.target.checked }))} className="w-4 h-4 rounded text-indigo-600" />
            <span className="text-sm text-gray-700">{isRtl ? 'له تاريخ انتهاء' : 'Has Expiry Date'}</span>
          </label>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-2">
          <button onClick={save} disabled={saving} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">{saving ? '...' : (isRtl ? 'حفظ' : 'Save')}</button>
          <button onClick={onClose} className="px-4 border border-gray-200 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
        </div>
      </div>
    </div>
  )
}

function UploadDocDialog({ docTypes, staffList, onClose, onSave }: { docTypes: DocType[]; staffList: any[]; onClose: () => void; onSave: () => void }) {
  const isRtl = useLocale() === 'ar'
  const [form, setForm] = useState({ staffId: '', typeId: '', fileUrl: '', fileName: '', expiresAt: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const selectedType = docTypes.find(t => t.id === form.typeId)

  const save = async () => {
    if (!form.staffId || !form.typeId || !form.fileUrl.trim()) return
    setSaving(true)
    try {
      await apiClient.post('/hr/documents', form)
      onSave(); onClose()
    } catch {}
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <p className="font-bold text-gray-900">{isRtl ? 'رفع مستند' : 'Upload Document'}</p>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الموظف' : 'Employee'}</label>
            <select value={form.staffId} onChange={e => setForm(p => ({ ...p, staffId: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="">{isRtl ? 'اختر موظفاً' : 'Select employee'}</option>
              {staffList.map((s: any) => <option key={s.id} value={s.id}>{[s.user?.profile?.firstName, s.user?.profile?.lastName].filter(Boolean).join(' ') || s.user?.email}</option>)}
            </select></div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'نوع المستند' : 'Document Type'}</label>
            <select value={form.typeId} onChange={e => setForm(p => ({ ...p, typeId: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="">{isRtl ? 'اختر النوع' : 'Select type'}</option>
              {docTypes.map(t => <option key={t.id} value={t.id}>{t.name}{t.required ? ' *' : ''}</option>)}
            </select></div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'رابط الملف (URL)' : 'File URL'}</label>
            <input value={form.fileUrl} onChange={e => setForm(p => ({ ...p, fileUrl: e.target.value }))}
              placeholder="https://..."
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'اسم الملف' : 'File Name'}</label>
            <input value={form.fileName} onChange={e => setForm(p => ({ ...p, fileName: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          {selectedType?.hasExpiry && (
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          )}
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'ملاحظات' : 'Notes'}</label>
            <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-2">
          <button onClick={save} disabled={saving} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">{saving ? '...' : (isRtl ? 'رفع' : 'Upload')}</button>
          <button onClick={onClose} className="px-4 border border-gray-200 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
        </div>
      </div>
    </div>
  )
}

export default function DocumentsPage() {
  const locale = useLocale(); const isRtl = locale === 'ar'
  const [docs, setDocs] = useState<Document[]>([])
  const [docTypes, setDocTypes] = useState<DocType[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'documents' | 'types'>('documents')
  const [showUpload, setShowUpload] = useState(false)
  const [showTypeDialog, setShowTypeDialog] = useState(false)
  const [editingType, setEditingType] = useState<DocType | undefined>()
  const [staffFilter, setStaffFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dRes, tRes, sRes] = await Promise.all([
        apiClient.get('/hr/documents').then((r: any) => r.data?.data ?? r.data ?? []),
        apiClient.get('/hr/document-types').then((r: any) => r.data?.data ?? r.data ?? []),
        apiClient.get('/hr/all-users').then((r: any) => r.data?.data ?? r.data ?? []),
      ])
      setDocs(Array.isArray(dRes) ? dRes : [])
      setDocTypes(Array.isArray(tRes) ? tRes : [])
      setStaffList(Array.isArray(sRes) ? sRes : [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const reviewDoc = async (id: string, status: string) => {
    await apiClient.patch(`/hr/documents/${id}/review`, { status }); load()
  }

  const delDoc = async (id: string) => {
    if (!confirm(isRtl ? 'حذف هذا المستند؟' : 'Delete document?')) return
    await apiClient.delete(`/hr/documents/${id}`); load()
  }

  const delType = async (id: string) => {
    if (!confirm(isRtl ? 'حذف هذا النوع؟' : 'Delete type?')) return
    await apiClient.delete(`/hr/document-types/${id}`); load()
  }

  const filteredDocs = docs.filter(d => {
    const name = `${d.staff?.user?.profile?.firstName ?? ''} ${d.staff?.user?.profile?.lastName ?? ''}`
    const matchStaff = !staffFilter || name.toLowerCase().includes(staffFilter.toLowerCase()) || d.staff?.user?.email?.toLowerCase().includes(staffFilter.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter
    return matchStaff && matchStatus
  })

  const pending = docs.filter(d => d.status === 'PENDING').length

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FileText size={22} className="text-indigo-600" />{isRtl ? 'مستندات الموظفين' : 'Employee Documents'}</h1>
          <p className="text-sm text-gray-500 mt-1">{docs.length} {isRtl ? 'مستند' : 'documents'}{pending > 0 && <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">{pending} {isRtl ? 'معلق' : 'pending review'}</span>}</p>
        </div>
        <div className="flex gap-2">
          {view === 'types' && (
            <button onClick={() => { setEditingType(undefined); setShowTypeDialog(true) }}
              className="flex items-center gap-1 border border-gray-200 px-3 py-2 rounded-xl text-sm hover:bg-gray-50">
              <Plus size={14} />{isRtl ? 'نوع جديد' : 'Add Type'}
            </button>
          )}
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700">
            <Upload size={14} />{isRtl ? 'رفع مستند' : 'Upload Doc'}
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['documents', 'types'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === v ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-800'}`}>
            {v === 'documents' ? (isRtl ? 'المستندات' : 'Documents') : (isRtl ? 'أنواع المستندات' : 'Document Types')}
          </button>
        ))}
      </div>

      {view === 'types'
        ? (
          loading
            ? <div className="animate-pulse space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}</div>
            : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {docTypes.length === 0
                  ? <div className="py-16 text-center text-gray-400">{isRtl ? 'لا توجد أنواع مستندات' : 'No document types yet'}</div>
                  : docTypes.sort((a, b) => a.sortOrder - b.sortOrder).map(t => (
                    <div key={t.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{t.name}</p>
                          <div className="flex gap-2 mt-0.5">
                            {t.required && <span className="text-xs text-red-500 font-medium">{isRtl ? 'مطلوب' : 'Required'}</span>}
                            {t.hasExpiry && <span className="text-xs text-orange-500">{isRtl ? 'له تاريخ انتهاء' : 'Has expiry'}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingType(t); setShowTypeDialog(true) }} className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600 text-xs">✏️</button>
                        <button onClick={() => delType(t.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 text-xs">🗑️</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            )
        )
        : (
          <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <input value={staffFilter} onChange={e => setStaffFilter(e.target.value)} placeholder={isRtl ? 'بحث بالموظف...' : 'Filter by employee...'}
                className="flex-1 min-w-48 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
                <option value="ALL">{isRtl ? 'كل الحالات' : 'All Statuses'}</option>
                {['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {loading
              ? <div className="animate-pulse space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div>
              : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-50 bg-gray-50/50">
                      {['Employee', 'Document Type', 'File', 'Expiry', 'Status', 'Actions'].map(h =>
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>)}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredDocs.length === 0
                        ? <tr><td colSpan={6} className="text-center py-12 text-gray-400"><FileText size={32} className="mx-auto mb-2 opacity-20" />{isRtl ? 'لا توجد مستندات' : 'No documents'}</td></tr>
                        : filteredDocs.map(d => {
                          const isExpired = d.expiresAt && new Date(d.expiresAt) < new Date()
                          return (
                            <tr key={d.id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium text-gray-800">{d.staff?.user?.profile?.firstName} {d.staff?.user?.profile?.lastName}</p>
                                <p className="text-xs text-gray-400">{d.staff?.user?.email}</p>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{d.type?.name ?? '—'}</td>
                              <td className="px-4 py-3">
                                {d.fileUrl
                                  ? <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline truncate max-w-[120px] block">{d.fileName || 'View'}</a>
                                  : <span className="text-sm text-gray-400">—</span>
                                }
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {d.expiresAt
                                  ? <span className={isExpired ? 'text-red-500 font-medium' : 'text-gray-600'}>{new Date(d.expiresAt).toLocaleDateString()}</span>
                                  : <span className="text-gray-400">—</span>
                                }
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs rounded-full px-2.5 py-0.5 font-semibold ${DOC_STATUS_COLORS[isExpired ? 'EXPIRED' : d.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                  {isExpired ? 'EXPIRED' : d.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  {d.status === 'PENDING' && <>
                                    <button onClick={() => reviewDoc(d.id, 'APPROVED')} className="p-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100" title="Approve"><Check size={13} /></button>
                                    <button onClick={() => reviewDoc(d.id, 'REJECTED')} className="p-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-100" title="Reject"><X size={13} /></button>
                                  </>}
                                  <button onClick={() => delDoc(d.id)} className="p-1 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 text-xs">🗑️</button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      }
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        )
      }

      {showUpload && <UploadDocDialog docTypes={docTypes} staffList={staffList} onClose={() => setShowUpload(false)} onSave={load} />}
      {showTypeDialog && <DocTypeDialog type={editingType} onClose={() => { setShowTypeDialog(false); setEditingType(undefined) }} onSave={load} />}
    </div>
  )
}
