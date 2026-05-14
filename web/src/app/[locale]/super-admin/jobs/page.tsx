'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, Skeleton } from '@/components/ui'
import { Briefcase, Search, Mail, Phone, Globe, FileText, Eye, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const JOB_STATUSES = [
  { value: 'RECEIVED',             label: 'Received',            labelAr: 'مستلم',         cls: 'bg-gray-100 text-gray-700' },
  { value: 'SCREENING',            label: 'Screening',           labelAr: 'مراجعة أولية',   cls: 'bg-purple-100 text-purple-700' },
  { value: 'SHORTLISTED',          label: 'Shortlisted',         labelAr: 'مدرج',           cls: 'bg-indigo-100 text-indigo-700' },
  { value: 'INTERVIEW_SCHEDULED',  label: 'Interview Scheduled', labelAr: 'تحديد مقابلة',   cls: 'bg-blue-100 text-blue-700' },
  { value: 'INTERVIEWED',          label: 'Interviewed',         labelAr: 'تمت المقابلة',   cls: 'bg-cyan-100 text-cyan-700' },
  { value: 'OFFER_SENT',           label: 'Offer Sent',          labelAr: 'تم إرسال العرض', cls: 'bg-orange-100 text-orange-700' },
  { value: 'HIRED',                label: 'Hired',               labelAr: 'تم التوظيف',    cls: 'bg-green-100 text-green-700' },
  { value: 'REJECTED',             label: 'Rejected',            labelAr: 'مرفوض',          cls: 'bg-red-100 text-red-700' },
  { value: 'WITHDRAWN',            label: 'Withdrawn',           labelAr: 'منسحب',          cls: 'bg-gray-100 text-gray-500' },
]

function statusBadge(status: string, isRtl: boolean) {
  const s = JOB_STATUSES.find((x) => x.value === status)
  if (!s) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{status}</span>
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${s.cls}`}>{isRtl ? s.labelAr : s.label}</span>
}

const PIPELINE_ORDER = ['RECEIVED','SCREENING','SHORTLISTED','INTERVIEW_SCHEDULED','INTERVIEWED','OFFER_SENT','HIRED']

export default function JobApplicationsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [view, setView] = useState<'list' | 'pipeline' | 'approvals'>('pipeline')
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['owner-jobs', statusFilter],
    queryFn: () => api.get('/owner/job-applications', { params: { status: statusFilter || undefined, limit: 100 } }).then((r) => r.data?.data ?? []),
  })

  const applications: any[] = Array.isArray(data) ? data : (data?.data ?? [])

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/owner/job-applications/${id}/approve`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-jobs'] })
      setSelected(null)
      toast.success(isRtl ? 'تمت الموافقة على الطلب' : 'Application approved')
    },
    onError: () => toast.error(isRtl ? 'فشل في الموافقة' : 'Failed to approve'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/owner/job-applications/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-jobs'] })
      setSelected(null)
      setRejectReason('')
      setShowRejectInput(false)
      toast.success(isRtl ? 'تم رفض الطلب' : 'Application rejected')
    },
    onError: () => toast.error(isRtl ? 'فشل في الرفض' : 'Failed to reject'),
  })

  const filtered = applications.filter((a: any) =>
    (!search || a.fullName?.toLowerCase().includes(search.toLowerCase()) || a.position?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase()))
  )

  const byStatus = (status: string) => filtered.filter((a: any) => a.status === status)
  const hired = applications.filter((a: any) => a.status === 'HIRED').length
  const open = applications.filter((a: any) => PIPELINE_ORDER.includes(a.status) && a.status !== 'HIRED').length
  const pendingApprovals = applications.filter((a: any) => a.ownerApprovalStatus === 'PENDING')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold text-gray-900 ${isRtl ? 'font-arabic' : ''}`}>{isRtl ? 'طلبات التوظيف' : 'Job Applications'}</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
            <Eye size={14} className="text-gray-400" />
            {isRtl ? 'عرض السير الذاتية — تتم الإضافة من قِبل قسم الموارد البشرية' : 'View only — applications are managed by HR'}
          </p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(['pipeline','list','approvals'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors relative ${view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              {v === 'pipeline' ? (isRtl ? 'خط التوظيف' : 'Pipeline') : v === 'list' ? (isRtl ? 'قائمة' : 'List') : (isRtl ? 'الموافقات' : 'Approvals')}
              {v === 'approvals' && pendingApprovals.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">{pendingApprovals.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardBody className="p-4 text-center"><p className="text-xs text-gray-500">{isRtl ? 'مفتوحة' : 'In Pipeline'}</p><p className="text-2xl font-bold text-indigo-600">{open}</p></CardBody></Card>
        <Card><CardBody className="p-4 text-center"><p className="text-xs text-gray-500">{isRtl ? 'تم توظيفهم' : 'Hired'}</p><p className="text-2xl font-bold text-green-600">{hired}</p></CardBody></Card>
        <Card className={pendingApprovals.length > 0 ? 'ring-2 ring-orange-400' : ''}><CardBody className="p-4 text-center"><p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Clock size={11} />{isRtl ? 'تنتظر موافقتك' : 'Awaiting Approval'}</p><p className="text-2xl font-bold text-orange-500">{pendingApprovals.length}</p></CardBody></Card>
        <Card><CardBody className="p-4 text-center"><p className="text-xs text-gray-500">{isRtl ? 'الإجمالي' : 'Total'}</p><p className="text-2xl font-bold text-gray-800">{applications.length}</p></CardBody></Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRtl ? 'بحث...' : 'Search by name, position...'} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500" />
        </div>
        {view === 'list' && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 bg-white">
            <option value="">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
            {JOB_STATUSES.map((s) => <option key={s.value} value={s.value}>{isRtl ? s.labelAr : s.label}</option>)}
          </select>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : view === 'approvals' ? (
        /* Pending Owner Approvals */
        <div className="space-y-3">
          {pendingApprovals.length === 0 ? (
            <Card><CardBody className="p-12 text-center">
              <CheckCircle size={40} className="mx-auto text-green-300 mb-3" />
              <p className="text-gray-400">{isRtl ? 'لا توجد طلبات تنتظر موافقتك' : 'No pending approvals — you\'re all caught up!'}</p>
            </CardBody></Card>
          ) : (
            pendingApprovals.map((app: any) => (
              <Card key={app.id}>
                <CardBody className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold shrink-0">{app.fullName?.[0]?.toUpperCase() ?? '?'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="font-semibold text-gray-900">{app.fullName}</p>
                          <p className="text-sm text-indigo-600">{app.position}{app.department ? ` · ${app.department}` : ''}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {app.experience}yr exp · {app.education ?? '—'} · {app.currency} {app.expectedSalary?.toLocaleString() ?? '—'}
                          </p>
                          {app.ownerApprovalRequestedAt && (
                            <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                              <Clock size={11} />{isRtl ? 'طلب الموافقة في:' : 'Requested:'} {format(new Date(app.ownerApprovalRequestedAt), 'dd MMM yyyy')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => approveMutation.mutate(app.id)}
                            disabled={approveMutation.isPending}
                            className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl disabled:opacity-50"
                          >
                            <CheckCircle size={15} />
                            {isRtl ? 'موافقة' : 'Approve'}
                          </button>
                          <button
                            onClick={() => { setSelected(app); setShowRejectInput(true) }}
                            className="flex items-center gap-1.5 text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl"
                          >
                            <XCircle size={15} />
                            {isRtl ? 'رفض' : 'Reject'}
                          </button>
                        </div>
                      </div>
                      {app.cvUrl && (
                        <a href={app.cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary-600 underline mt-2">
                          <FileText size={11} />{isRtl ? 'عرض السيرة الذاتية' : 'View CV'}
                        </a>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      ) : view === 'pipeline' ? (
        /* Pipeline Kanban view */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_ORDER.map((status) => {
            const group = byStatus(status)
            const st = JOB_STATUSES.find((s) => s.value === status)!
            return (
              <div key={status} className="flex-shrink-0 w-64">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>{isRtl ? st.labelAr : st.label}</span>
                  <span className="text-xs text-gray-400 font-medium">{group.length}</span>
                </div>
                <div className="space-y-2 min-h-20">
                  {group.map((app: any) => (
                    <Card key={app.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSelected(app)}>
                      <CardBody className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">{app.fullName?.[0]?.toUpperCase() ?? '?'}</div>
                          <p className="text-sm font-medium text-gray-900 truncate">{app.fullName}</p>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{app.position}</p>
                        {app.department && <p className="text-xs text-gray-400 truncate">{app.department}</p>}
                        <p className="text-xs text-gray-300 mt-1">{format(new Date(app.appliedAt), 'dd MMM')}</p>
                      </CardBody>
                    </Card>
                  ))}
                  {group.length === 0 && <div className="border-2 border-dashed border-gray-200 rounded-xl h-16 flex items-center justify-center"><p className="text-xs text-gray-300">{isRtl ? 'لا يوجد' : 'Empty'}</p></div>}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List view */
        filtered.length === 0 ? (
          <Card><CardBody className="p-12 text-center"><Briefcase size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-400">{isRtl ? 'لا توجد طلبات' : 'No applications yet'}</p></CardBody></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((app: any) => (
              <Card key={app.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSelected(app)}>
                <CardBody className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">{app.fullName?.[0]?.toUpperCase() ?? '?'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900">{app.fullName}</p>
                        {statusBadge(app.status, isRtl)}
                      </div>
                      <p className="text-sm text-primary-600 font-medium">{app.position}{app.department ? ` · ${app.department}` : ''}</p>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Mail size={11} />{app.email}</span>
                        {app.phone && <span className="flex items-center gap-1"><Phone size={11} />{app.phone}</span>}
                        <span>{app.experience}yr exp</span>
                        {app.education && <span>{app.education}</span>}
                        <span>{isRtl ? 'المتوقع:' : 'Expected:'} {app.currency} {app.expectedSalary?.toLocaleString() ?? '—'}</span>
                        <span>{format(new Date(app.appliedAt), 'dd MMM yyyy')}</span>
                      </div>
                      {app.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {app.skills.slice(0, 5).map((sk: string) => <span key={sk} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{sk}</span>)}
                          {app.skills.length > 5 && <span className="text-xs text-gray-400">+{app.skills.length - 5}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => { setSelected(null); setShowRejectInput(false); setRejectReason('') }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shrink-0">{selected.fullName?.[0]?.toUpperCase() ?? '?'}</div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.fullName}</h2>
                  <p className="text-sm text-primary-600 font-medium">{selected.position}{selected.department ? ` · ${selected.department}` : ''}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-gray-600"><Mail size={13} className="text-gray-400" />{selected.email}</div>
                {selected.phone && <div className="flex items-center gap-2 text-gray-600"><Phone size={13} className="text-gray-400" />{selected.phone}</div>}
                {selected.linkedIn && <div className="flex items-center gap-2 text-gray-600 col-span-2"><Globe size={13} className="text-gray-400" /><a href={selected.linkedIn} target="_blank" rel="noreferrer" className="text-primary-600 underline truncate">{selected.linkedIn}</a></div>}
                {selected.cvUrl && <div className="flex items-center gap-2 col-span-2"><FileText size={13} className="text-gray-400" /><a href={selected.cvUrl} target="_blank" rel="noreferrer" className="text-primary-600 underline">{isRtl ? 'عرض السيرة الذاتية' : 'View CV'}</a></div>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                <div><strong>{isRtl ? 'الخبرة:' : 'Experience:'}</strong> {selected.experience} {isRtl ? 'سنوات' : 'yrs'}</div>
                <div><strong>{isRtl ? 'المؤهل:' : 'Education:'}</strong> {selected.education ?? '—'}</div>
                <div><strong>{isRtl ? 'الجامعة:' : 'University:'}</strong> {selected.university ?? '—'}</div>
                <div><strong>{isRtl ? 'الجنسية:' : 'Nationality:'}</strong> {selected.nationality ?? '—'}</div>
                <div><strong>{isRtl ? 'الراتب المتوقع:' : 'Expected:'}</strong> {selected.currency} {selected.expectedSalary?.toLocaleString() ?? '—'}</div>
                <div><strong>{isRtl ? 'نوع التوظيف:' : 'Type:'}</strong> {selected.employmentType}</div>
                {selected.availableFrom && <div className="col-span-2"><strong>{isRtl ? 'متاح من:' : 'Available from:'}</strong> {format(new Date(selected.availableFrom), 'dd MMM yyyy')}</div>}
              </div>
              {selected.skills?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">{isRtl ? 'المهارات' : 'Skills'}</p>
                  <div className="flex flex-wrap gap-1">{selected.skills.map((sk: string) => <span key={sk} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full">{sk}</span>)}</div>
                </div>
              )}
              {selected.languages?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">{isRtl ? 'اللغات' : 'Languages'}</p>
                  <div className="flex flex-wrap gap-1">{selected.languages.map((lang: string) => <span key={lang} className="text-xs bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full">{lang}</span>)}</div>
                </div>
              )}
              {selected.coverLetter && (
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
                  <strong className="block mb-1">{isRtl ? 'رسالة التغطية:' : 'Cover Letter:'}</strong>
                  {selected.coverLetter}
                </div>
              )}
              <hr />
              {selected.internalNotes && (
                <div className="bg-yellow-50 rounded-xl p-3 text-xs text-gray-600">
                  <strong className="block mb-1">{isRtl ? 'ملاحظات داخلية:' : 'Internal Notes:'}</strong>
                  {selected.internalNotes}
                </div>
              )}
              {selected.ownerApprovalStatus && (
                <div className={`rounded-xl p-3 text-xs font-medium flex items-center gap-1.5 ${
                  selected.ownerApprovalStatus === 'APPROVED' ? 'bg-green-50 text-green-700' :
                  selected.ownerApprovalStatus === 'REJECTED' ? 'bg-red-50 text-red-700' :
                  'bg-orange-50 text-orange-700'
                }`}>
                  {selected.ownerApprovalStatus === 'APPROVED' && <><CheckCircle size={12} />{isRtl ? 'وافقت عليه' : 'You approved this candidate'}</>}
                  {selected.ownerApprovalStatus === 'REJECTED' && <><XCircle size={12} />{isRtl ? 'رفضته' : 'You rejected this candidate'}{selected.ownerApprovalNote ? `: ${selected.ownerApprovalNote}` : ''}</>}
                  {selected.ownerApprovalStatus === 'PENDING' && <><Clock size={12} />{isRtl ? 'ينتظر موافقتك' : 'Awaiting your approval'}</>}
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
                <p className="flex items-center gap-1.5"><Eye size={12} />{isRtl ? 'عرض فقط — تحديث الحالة من اختصاص قسم الموارد البشرية' : 'View only — status updates are handled by HR'}</p>
              </div>
            </div>
            {selected.ownerApprovalStatus === 'PENDING' && (
              <div className="px-6 pb-4 space-y-3">
                <p className="text-xs font-medium text-orange-600 flex items-center gap-1.5"><Clock size={12} />{isRtl ? 'هذا الطلب ينتظر موافقتك' : 'This candidate is awaiting your approval'}</p>
                {showRejectInput ? (
                  <div className="space-y-2">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder={isRtl ? 'اكتب سبب الرفض...' : 'Write rejection reason...'}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400 resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => rejectMutation.mutate({ id: selected.id, reason: rejectReason })}
                        disabled={!rejectReason.trim() || rejectMutation.isPending}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-xl disabled:opacity-50"
                      >
                        {rejectMutation.isPending ? '...' : (isRtl ? 'تأكيد الرفض' : 'Confirm Reject')}
                      </button>
                      <button onClick={() => setShowRejectInput(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveMutation.mutate(selected.id)}
                      disabled={approveMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded-xl disabled:opacity-50"
                    >
                      <CheckCircle size={14} />{isRtl ? 'موافقة' : 'Approve'}
                    </button>
                    <button
                      onClick={() => setShowRejectInput(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-xl"
                    >
                      <XCircle size={14} />{isRtl ? 'رفض' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button onClick={() => { setSelected(null); setShowRejectInput(false); setRejectReason('') }} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">{isRtl ? 'إغلاق' : 'Close'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
