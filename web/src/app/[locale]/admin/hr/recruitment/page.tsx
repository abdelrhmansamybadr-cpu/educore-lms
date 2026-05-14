'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { apiClient } from '@/lib/api'
import { Briefcase, Plus, X, Search, FileText } from 'lucide-react'

interface JobPosting { id: string; title: string; department: string; location: string; jobType: string; description: string; requirements: string; salary?: string; status: string; isInternal: boolean; _count?: { applications: number }; createdAt: string }
interface Application { id: string; name: string; email: string; phone?: string; appliedFor: string; source: string; status: string; interviewDate?: string; interviewerName?: string; postingId?: string; createdAt: string }

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']
const JOB_STATUSES = ['OPEN', 'CLOSED', 'DRAFT', 'ON_HOLD']
const APP_STATUSES = ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']
const APP_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700', SCREENING: 'bg-yellow-100 text-yellow-700',
  INTERVIEW: 'bg-purple-100 text-purple-700', OFFER: 'bg-indigo-100 text-indigo-700',
  HIRED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-700',
}
const SOURCES = ['WEBSITE', 'REFERRAL', 'LINKEDIN', 'AGENCY', 'WALK_IN', 'OTHER']

function PostingDialog({ posting, onClose, onSave }: { posting?: JobPosting; onClose: () => void; onSave: () => void }) {
  const isRtl = useLocale() === 'ar'
  const [form, setForm] = useState({
    title: posting?.title ?? '', department: posting?.department ?? '', location: posting?.location ?? '',
    jobType: posting?.jobType ?? 'FULL_TIME', description: posting?.description ?? '',
    requirements: posting?.requirements ?? '', salary: posting?.salary ?? '',
    status: posting?.status ?? 'OPEN', isInternal: posting?.isInternal ?? false,
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      if (posting) await apiClient.patch(`/hr/job-postings/${posting.id}`, form)
      else await apiClient.post('/hr/job-postings', form)
      onSave(); onClose()
    } catch {}
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <p className="font-bold text-gray-900">{posting ? (isRtl ? 'تعديل وظيفة' : 'Edit Posting') : (isRtl ? 'نشر وظيفة جديدة' : 'New Job Posting')}</p>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'المسمى الوظيفي' : 'Job Title'}</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'القسم' : 'Department'}</label>
              <input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الموقع' : 'Location'}</label>
              <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'نوع العمل' : 'Job Type'}</label>
              <select value={form.jobType} onChange={e => setForm(p => ({ ...p, jobType: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {JOB_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الحالة' : 'Status'}</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {JOB_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select></div>
          </div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الراتب' : 'Salary Range'}</label>
            <input value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))}
              placeholder="e.g. $3,000 – $5,000 / mo"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الوصف' : 'Description'}</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" /></div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'المتطلبات' : 'Requirements'}</label>
            <textarea value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} rows={3}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isInternal} onChange={e => setForm(p => ({ ...p, isInternal: e.target.checked }))}
              className="w-4 h-4 rounded text-indigo-600" />
            <span className="text-sm text-gray-700">{isRtl ? 'إعلان داخلي فقط' : 'Internal posting only'}</span>
          </label>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-2 sticky bottom-0 bg-white">
          <button onClick={save} disabled={saving} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">{saving ? '...' : (isRtl ? 'حفظ' : 'Save')}</button>
          <button onClick={onClose} className="px-4 border border-gray-200 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
        </div>
      </div>
    </div>
  )
}

function AppDialog({ postings, onClose, onSave }: { postings: JobPosting[]; onClose: () => void; onSave: () => void }) {
  const isRtl = useLocale() === 'ar'
  const [form, setForm] = useState({ name: '', email: '', phone: '', appliedFor: '', source: 'WEBSITE', postingId: '', status: 'NEW', interviewDate: '', interviewerName: '' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.name.trim() || !form.appliedFor.trim()) return
    setSaving(true)
    try {
      await apiClient.post('/hr/hr-applications', form)
      onSave(); onClose()
    } catch {}
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <p className="font-bold text-gray-900">{isRtl ? 'إضافة مقدم طلب' : 'Add Applicant'}</p>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الاسم' : 'Full Name'}</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'البريد' : 'Email'}</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الهاتف' : 'Phone'}</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الوظيفة المتقدم لها' : 'Applying For'}</label>
            <input value={form.appliedFor} onChange={e => setForm(p => ({ ...p, appliedFor: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'المصدر' : 'Source'}</label>
              <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {SOURCES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'الحالة' : 'Status'}</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {APP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
          </div>
          {postings.length > 0 && (
            <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'ربط بإعلان وظيفي' : 'Link to Posting'}</label>
              <select value={form.postingId} onChange={e => setForm(p => ({ ...p, postingId: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                <option value="">{isRtl ? 'بدون ربط' : 'None'}</option>
                {postings.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select></div>
          )}
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'تاريخ المقابلة' : 'Interview Date'}</label>
            <input type="datetime-local" value={form.interviewDate} onChange={e => setForm(p => ({ ...p, interviewDate: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-gray-500 font-medium">{isRtl ? 'المحاور' : 'Interviewer'}</label>
            <input value={form.interviewerName} onChange={e => setForm(p => ({ ...p, interviewerName: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-2 sticky bottom-0 bg-white">
          <button onClick={save} disabled={saving} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">{saving ? '...' : (isRtl ? 'حفظ' : 'Save')}</button>
          <button onClick={onClose} className="px-4 border border-gray-200 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
        </div>
      </div>
    </div>
  )
}

export default function RecruitmentPage() {
  const locale = useLocale(); const isRtl = locale === 'ar'
  const [tab, setTab] = useState<'postings' | 'applications'>('postings')
  const [postings, setPostings] = useState<JobPosting[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [showPostDialog, setShowPostDialog] = useState(false)
  const [showAppDialog, setShowAppDialog] = useState(false)
  const [editingPost, setEditingPost] = useState<JobPosting | undefined>()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, aRes] = await Promise.all([
        apiClient.get('/hr/job-postings').then((r: any) => r.data?.data ?? r.data ?? []),
        apiClient.get('/hr/hr-applications').then((r: any) => r.data?.data ?? r.data ?? []),
      ])
      setPostings(Array.isArray(pRes) ? pRes : [])
      setApplications(Array.isArray(aRes) ? aRes : [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const delPost = async (id: string) => {
    if (!confirm(isRtl ? 'حذف هذا الإعلان؟' : 'Delete this posting?')) return
    await apiClient.delete(`/hr/job-postings/${id}`); load()
  }

  const updateAppStatus = async (id: string, status: string) => {
    await apiClient.patch(`/hr/hr-applications/${id}`, { status }); load()
  }

  const filteredApps = applications.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.appliedFor.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  const openPostings = postings.filter(p => p.status === 'OPEN').length
  const pendingApps = applications.filter(a => ['NEW', 'SCREENING'].includes(a.status)).length

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Briefcase size={22} className="text-indigo-600" />{isRtl ? 'التوظيف' : 'Recruitment'}</h1>
          <p className="text-sm text-gray-500 mt-1">{openPostings} {isRtl ? 'وظيفة مفتوحة' : 'open positions'} · {pendingApps} {isRtl ? 'طلب معلق' : 'pending applications'}</p>
        </div>
        <button
          onClick={() => { if (tab === 'postings') { setEditingPost(undefined); setShowPostDialog(true) } else setShowAppDialog(true) }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700">
          <Plus size={14} />{tab === 'postings' ? (isRtl ? 'نشر وظيفة' : 'Post Job') : (isRtl ? 'إضافة مقدم' : 'Add Applicant')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['postings', 'applications'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-800'}`}>
            {t === 'postings' ? (isRtl ? 'الإعلانات' : 'Job Postings') : (isRtl ? 'المتقدمون' : 'Applications')}
          </button>
        ))}
      </div>

      {loading
        ? <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-gray-100 rounded-2xl" />)}</div>
        : tab === 'postings'
          ? (
            postings.length === 0
              ? <div className="flex flex-col items-center justify-center py-24"><Briefcase size={48} className="text-gray-200 mb-4" /><p className="text-gray-400">{isRtl ? 'لا توجد إعلانات' : 'No job postings yet'}</p></div>
              : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {postings.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs rounded-full px-2.5 py-0.5 font-semibold ${p.status === 'OPEN' ? 'bg-green-100 text-green-700' : p.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>{p.status}</span>
                          {p.isInternal && <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 font-medium">{isRtl ? 'داخلي' : 'Internal'}</span>}
                          <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{p.jobType.replace('_', ' ')}</span>
                        </div>
                        <p className="font-bold text-gray-800 mt-2">{p.title}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{p.department} · {p.location}</p>
                        {p.salary && <p className="text-xs text-emerald-600 mt-1 font-medium">{p.salary}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditingPost(p); setShowPostDialog(true) }} className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600 text-xs">✏️</button>
                        <button onClick={() => delPost(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 text-xs">🗑️</button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">{p._count?.applications ?? 0} {isRtl ? 'طلب' : 'applications'} · {new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
          )
          : (
            <div className="space-y-4">
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isRtl ? 'بحث...' : 'Search applicants...'}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
                  <option value="ALL">{isRtl ? 'الكل' : 'All Statuses'}</option>
                  {APP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {filteredApps.length === 0
                ? <div className="flex flex-col items-center justify-center py-24"><FileText size={48} className="text-gray-200 mb-4" /><p className="text-gray-400">{isRtl ? 'لا توجد طلبات' : 'No applications'}</p></div>
                : <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-50 bg-gray-50/50">
                      {['Applicant', 'Position', 'Source', 'Interview', 'Status', 'Actions'].map(h =>
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>)}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredApps.map(a => (
                        <tr key={a.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-800">{a.name}</p>
                            <p className="text-xs text-gray-400">{a.email}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{a.appliedFor}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{a.source.replace('_', ' ')}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {a.interviewDate ? new Date(a.interviewDate).toLocaleString() : '—'}
                            {a.interviewerName && <p className="text-gray-400">{a.interviewerName}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <select value={a.status} onChange={e => updateAppStatus(a.id, e.target.value)}
                              className={`text-xs rounded-full px-2.5 py-0.5 font-semibold border-0 cursor-pointer ${APP_STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-700'}`}>
                              {APP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => { if (confirm('Delete this application?')) apiClient.delete(`/hr/hr-applications/${a.id}`).then(() => load()) }}
                              className="text-xs text-red-500 hover:text-red-700">Del</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }
            </div>
          )
      }

      {showPostDialog && <PostingDialog posting={editingPost} onClose={() => { setShowPostDialog(false); setEditingPost(undefined) }} onSave={load} />}
      {showAppDialog && <AppDialog postings={postings} onClose={() => setShowAppDialog(false)} onSave={load} />}
    </div>
  )
}
