'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getApiError } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, Skeleton } from '@/components/ui'
import {
  Package, Search, CheckCircle2, XCircle, DollarSign,
  Truck, FileCheck, Clock, ChevronRight, FileText, Bell,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

// Workflow steps shown in progress bar
const WORKFLOW = [
  { status: 'PENDING',          label: 'Submitted',        labelAr: 'مُرسل',           icon: Clock },
  { status: 'PRICED',           label: 'Priced',           labelAr: 'تم التسعير',       icon: DollarSign },
  { status: 'FINANCE_APPROVED', label: 'Finance Approved', labelAr: 'موافقة مالية',     icon: DollarSign },
  { status: 'APPROVED',         label: 'Owner Approved',   labelAr: 'موافقة المالك',    icon: CheckCircle2 },
  { status: 'ITEMS_ARRIVED',    label: 'Items Arrived',    labelAr: 'وصلت المواد',      icon: Truck },
  { status: 'COMPLETED',        label: 'Completed',        labelAr: 'مكتمل',            icon: FileCheck },
]

const STATUS_META: Record<string, { label: string; labelAr: string; cls: string }> = {
  PENDING:          { label: 'Pending',                labelAr: 'في الانتظار',         cls: 'bg-yellow-100 text-yellow-700' },
  PRICED:           { label: 'With Finance',           labelAr: 'لدى الحسابات',        cls: 'bg-blue-100 text-blue-700' },
  FINANCE_APPROVED: { label: 'Awaiting Your Approval', labelAr: 'بانتظار موافقتك',    cls: 'bg-purple-100 text-purple-700' },
  APPROVED:         { label: 'Approved',               labelAr: 'موافق عليه',          cls: 'bg-green-100 text-green-700' },
  REJECTED:         { label: 'Rejected',               labelAr: 'مرفوض',              cls: 'bg-red-100 text-red-700' },
  FINANCE_RELEASED: { label: 'Budget Released',        labelAr: 'تم إطلاق الميزانية',  cls: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS:      { label: 'In Progress',            labelAr: 'قيد التنفيذ',         cls: 'bg-indigo-100 text-indigo-700' },
  ITEMS_ARRIVED:    { label: 'Items Arrived',          labelAr: 'وصلت المواد',         cls: 'bg-teal-100 text-teal-700' },
  COMPLETED:        { label: 'Completed',              labelAr: 'مكتمل',              cls: 'bg-emerald-100 text-emerald-700' },
  CANCELLED:        { label: 'Cancelled',              labelAr: 'ملغى',               cls: 'bg-gray-100 text-gray-500' },
}

function StatusBadge({ status, isRtl }: { status: string; isRtl: boolean }) {
  const m = STATUS_META[status]
  if (!m) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{status}</span>
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${m.cls}`}>{isRtl ? m.labelAr : m.label}</span>
}

function WorkflowProgress({ status }: { status: string }) {
  const currentIdx = WORKFLOW.findIndex((s) => s.status === status)
  const isTerminal = status === 'REJECTED' || status === 'CANCELLED'

  if (isTerminal) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-600">
        <XCircle size={13} />
        <span>{status === 'REJECTED' ? 'Rejected' : 'Cancelled'}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5">
      {WORKFLOW.map((step, idx) => {
        const done = idx <= currentIdx
        const Icon = step.icon
        return (
          <div key={step.status} className="flex items-center">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${done ? 'bg-green-500' : 'bg-gray-200'}`}>
              <Icon size={10} className={done ? 'text-white' : 'text-gray-400'} />
            </div>
            {idx < WORKFLOW.length - 1 && (
              <div className={`w-4 h-0.5 ${idx < currentIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function RequisitionsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const qc = useQueryClient()

  const [statusFilter, setStatusFilter] = useState('FINANCE_APPROVED')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [approveNotes, setApproveNotes] = useState('')
  const [showApproveNote, setShowApproveNote] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['owner-requisitions', statusFilter],
    queryFn: () => api.get('/owner/requisitions', { params: { status: statusFilter || undefined, limit: 100 } }).then((r) => r.data?.data ?? []),
  })

  const requisitions: any[] = Array.isArray(data) ? data : (data?.data ?? [])
  const filtered = requisitions.filter((r: any) => !search || r.title?.toLowerCase().includes(search.toLowerCase()))

  // Always fetch the pending count for the badge regardless of filter
  const { data: pendingData } = useQuery({
    queryKey: ['owner-requisitions-pending-count'],
    queryFn: () => api.get('/owner/requisitions', { params: { status: 'FINANCE_APPROVED', limit: 100 } }).then((r) => {
      const d = r.data?.data ?? []
      return Array.isArray(d) ? d.length : 0
    }),
  })
  const pendingCount: number = typeof pendingData === 'number' ? pendingData : 0

  const totalApproved = requisitions
    .filter((r: any) => ['APPROVED', 'FINANCE_RELEASED', 'ITEMS_ARRIVED', 'COMPLETED'].includes(r.status))
    .reduce((s: number, r: any) => s + (r.totalPriced ?? r.totalEstimated ?? 0), 0)

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => api.patch(`/owner/requisitions/${id}/approve`, { notes }),
    onSuccess: () => {
      toast.success(isRtl ? 'تمت الموافقة' : 'Approved')
      qc.invalidateQueries({ queryKey: ['owner-requisitions'] })
      qc.invalidateQueries({ queryKey: ['owner-requisitions-pending-count'] })
      closeDetail()
    },
    onError: (err: any) => toast.error(getApiError(err, 'Failed')),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.patch(`/owner/requisitions/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success(isRtl ? 'تم الرفض' : 'Rejected')
      qc.invalidateQueries({ queryKey: ['owner-requisitions'] })
      qc.invalidateQueries({ queryKey: ['owner-requisitions-pending-count'] })
      closeDetail()
    },
    onError: (err: any) => toast.error(getApiError(err, 'Failed')),
  })

  function closeDetail() {
    setSelected(null)
    setShowReject(false)
    setRejectReason('')
    setShowApproveNote(false)
    setApproveNotes('')
  }

  const TAB_FILTERS = [
    { value: 'FINANCE_APPROVED', label: isRtl ? 'بانتظار موافقتي' : 'Awaiting My Approval', urgent: true },
    { value: 'APPROVED',         label: isRtl ? 'وافقت عليها' : 'Approved' },
    { value: 'REJECTED',         label: isRtl ? 'مرفوضة' : 'Rejected' },
    { value: '',                 label: isRtl ? 'الكل' : 'All' },
  ]

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            {isRtl ? 'طلبات التوريد — صندوق الموافقة' : 'Requisitions — Approval Inbox'}
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 text-sm font-semibold bg-purple-600 text-white rounded-full px-3 py-0.5 animate-pulse">
                <Bell size={13} /> {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isRtl
              ? 'هذه الطلبات مرت عبر الموظف → مسؤول المستلزمات → المالية — قرارك هو الأخير'
              : 'These have passed through Employee → Store Manager → Req Manager → Finance — your decision is final'}
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={pendingCount > 0 ? 'ring-2 ring-purple-400' : ''}>
          <CardBody className="p-4 text-center">
            <p className="text-xs text-gray-500">{isRtl ? 'بانتظار موافقتك' : 'Awaiting Your Approval'}</p>
            <p className="text-2xl font-bold text-purple-600">{pendingCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4 text-center">
            <p className="text-xs text-gray-500">{isRtl ? 'قيمة الموافق عليها' : 'Approved Value'}</p>
            <p className="text-2xl font-bold text-green-600">${totalApproved.toLocaleString()}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4 text-center">
            <p className="text-xs text-gray-500">{isRtl ? 'الإجمالي في العرض' : 'Showing'}</p>
            <p className="text-2xl font-bold text-gray-800">{filtered.length}</p>
          </CardBody>
        </Card>
      </div>

      {/* Tab filters */}
      <div className="flex gap-1 border-b border-gray-100">
        {TAB_FILTERS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatusFilter(t.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === t.value
                ? t.urgent ? 'border-purple-500 text-purple-700' : 'border-indigo-500 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.urgent && pendingCount > 0 && (
              <span className="ml-1.5 text-xs bg-purple-100 text-purple-700 rounded-full px-1.5 py-0.5">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isRtl ? 'بحث بالعنوان...' : 'Search by title...'}
          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody className="p-16 text-center">
            <Package size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-medium">
              {statusFilter === 'FINANCE_APPROVED'
                ? (isRtl ? 'لا توجد طلبات بانتظار موافقتك' : 'No requisitions awaiting your approval')
                : (isRtl ? 'لا توجد طلبات' : 'No requisitions')}
            </p>
            {statusFilter === 'FINANCE_APPROVED' && (
              <p className="text-xs text-gray-400 mt-1">
                {isRtl ? 'ستظهر هنا عندما تُحال إليك من قسم المالية' : 'They will appear here once Finance escalates them to you'}
              </p>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((req: any) => (
            <Card
              key={req.id}
              className={`hover:shadow-sm transition-shadow cursor-pointer ${req.status === 'FINANCE_APPROVED' ? 'ring-2 ring-purple-300' : ''}`}
              onClick={() => { setSelected(req); setShowReject(false); setShowApproveNote(false) }}
            >
              <CardBody className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${req.status === 'FINANCE_APPROVED' ? 'bg-purple-100' : 'bg-amber-50'}`}>
                    <Package size={18} className={req.status === 'FINANCE_APPROVED' ? 'text-purple-500' : 'text-amber-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{req.title}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        {req.status === 'FINANCE_APPROVED' && (
                          <span className="text-xs bg-purple-600 text-white px-2.5 py-0.5 rounded-full font-medium animate-pulse">
                            {isRtl ? 'موافقتك مطلوبة' : 'Needs your approval'}
                          </span>
                        )}
                        <StatusBadge status={req.status} isRtl={isRtl} />
                      </div>
                    </div>
                    {req.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{req.description}</p>}
                    <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        <span>{req.category}</span>
                        {req.totalPriced ? (
                          <span className="text-gray-700 font-medium">{isRtl ? 'السعر:' : 'Priced:'} ${req.totalPriced.toLocaleString()}</span>
                        ) : (
                          <span>{isRtl ? 'تقدير:' : 'Est:'} ${req.totalEstimated?.toLocaleString()}</span>
                        )}
                        {req.requestedBy?.profile && (
                          <span>{req.requestedBy.profile.firstName} {req.requestedBy.profile.lastName}</span>
                        )}
                        {req.school && <span>{req.school.name}</span>}
                        <span>{format(new Date(req.createdAt), 'dd MMM yyyy')}</span>
                      </div>
                      <WorkflowProgress status={req.status} />
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* ── Detail / Approval Modal ─────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeDetail}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.title}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selected.category}
                    {selected.requestedBy?.profile && ` · ${selected.requestedBy.profile.firstName} ${selected.requestedBy.profile.lastName}`}
                    {selected.school ? ` · ${selected.school.name}` : ''}
                    {` · ${format(new Date(selected.createdAt), 'dd MMM yyyy')}`}
                  </p>
                </div>
                <StatusBadge status={selected.status} isRtl={isRtl} />
              </div>
              <div className="mt-4">
                <WorkflowProgress status={selected.status} />
              </div>
            </div>

            <div className="p-6 space-y-5">
              {selected.description && <p className="text-sm text-gray-600">{selected.description}</p>}

              {/* Original items */}
              {Array.isArray(selected.items) && selected.items.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">{isRtl ? 'البنود المطلوبة' : 'Requested Items'}</p>
                  <table className="w-full text-xs border border-gray-200 rounded-xl overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">{isRtl ? 'البند' : 'Item'}</th>
                        <th className="px-3 py-2 text-left">{isRtl ? 'الكمية' : 'Qty'}</th>
                        <th className="px-3 py-2 text-left">{isRtl ? 'الوحدة' : 'Unit'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selected.items.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-3 py-1.5">{item.name}</td>
                          <td className="px-3 py-1.5">{item.qty}</td>
                          <td className="px-3 py-1.5">{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Priced items from Req Manager */}
              {Array.isArray(selected.pricedItems) && selected.pricedItems.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                    <DollarSign size={12} className="text-purple-500" />
                    {isRtl ? 'التسعير من قسم المستلزمات' : 'Pricing by Requisitions Dept'}
                    {selected.pricedAt && <span className="text-gray-400">· {format(new Date(selected.pricedAt), 'dd MMM yyyy')}</span>}
                  </p>
                  <table className="w-full text-xs border border-purple-100 rounded-xl overflow-hidden">
                    <thead className="bg-purple-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-purple-700">{isRtl ? 'البند' : 'Item'}</th>
                        <th className="px-3 py-2 text-left font-medium text-purple-700">{isRtl ? 'الكمية' : 'Qty'}</th>
                        <th className="px-3 py-2 text-left font-medium text-purple-700">{isRtl ? 'سعر/وحدة' : 'Price/unit'}</th>
                        <th className="px-3 py-2 text-left font-medium text-purple-700">{isRtl ? 'الإجمالي' : 'Total'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50">
                      {selected.pricedItems.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-3 py-1.5">{item.name}</td>
                          <td className="px-3 py-1.5">{item.qty} {item.unit}</td>
                          <td className="px-3 py-1.5">${item.pricePerUnit?.toLocaleString()}</td>
                          <td className="px-3 py-1.5 font-semibold">${item.total?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-purple-50">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right text-xs font-semibold text-purple-700">{isRtl ? 'الإجمالي الكلي:' : 'Grand Total:'}</td>
                        <td className="px-3 py-2 text-sm font-bold text-purple-700">${selected.totalPriced?.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Workflow audit trail */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">{isRtl ? 'سجل سير العمل' : 'Workflow Audit'}</p>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" /><span>{isRtl ? 'أُرسل' : 'Submitted'} {format(new Date(selected.createdAt), 'dd MMM yyyy HH:mm')}</span></div>
                  {selected.pricedAt && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-400 shrink-0" /><span>{isRtl ? 'تم التسعير' : 'Priced'} {format(new Date(selected.pricedAt), 'dd MMM yyyy HH:mm')} — ${selected.totalPriced?.toLocaleString()}</span></div>}
                  {selected.financeApprovedAt && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" /><span>{isRtl ? 'المالية أحالته إليك' : 'Finance escalated to you'} {format(new Date(selected.financeApprovedAt), 'dd MMM yyyy HH:mm')}</span></div>}
                  {selected.status === 'APPROVED' && selected.reviewNotes && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400 shrink-0" /><span>{isRtl ? 'وافقت عليه' : 'You approved'}{selected.reviewNotes ? ` — "${selected.reviewNotes}"` : ''}</span></div>}
                  {selected.status === 'REJECTED' && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-400 shrink-0" /><span>{isRtl ? 'رفضت:' : 'Rejected:'} {selected.rejectionReason}</span></div>}
                  {selected.financeReleasedAt && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" /><span>{isRtl ? 'المالية أطلقت الميزانية' : 'Finance released budget'} {format(new Date(selected.financeReleasedAt), 'dd MMM yyyy HH:mm')}</span></div>}
                  {selected.itemsArrivedAt && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-400 shrink-0" /><span>{isRtl ? 'وصلت المواد' : 'Items arrived'} {format(new Date(selected.itemsArrivedAt), 'dd MMM yyyy HH:mm')}</span></div>}
                  {selected.status === 'COMPLETED' && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" /><span>{isRtl ? 'مكتمل' : 'Completed'}</span></div>}
                </div>
              </div>

              {/* Invoices */}
              {selected.invoiceUrls?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">{isRtl ? 'الفواتير' : 'Invoices'}</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.invoiceUrls.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-100">
                        <FileText size={12} />{isRtl ? `فاتورة ${i + 1}` : `Invoice ${i + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Approval actions — only when FINANCE_APPROVED (escalated to owner) ── */}
              {selected.status === 'FINANCE_APPROVED' && (
                <div className="bg-purple-50 rounded-xl p-4 space-y-3 border border-purple-200">
                  <p className="text-sm font-semibold text-purple-800">
                    {isRtl
                      ? 'المالية أحالت هذا الطلب إليك بعد مراجعة الأسعار — قرارك مطلوب'
                      : 'Finance has reviewed the pricing and escalated this to you — your decision is required'}
                  </p>

                  {showReject ? (
                    <div className="space-y-2">
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder={isRtl ? 'سبب الرفض...' : 'Reason for rejection...'}
                        className="w-full border border-red-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400 resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => rejectMutation.mutate({ id: selected.id, reason: rejectReason })}
                          disabled={!rejectReason.trim() || rejectMutation.isPending}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2.5 rounded-xl disabled:opacity-50"
                        >
                          {rejectMutation.isPending ? '...' : (isRtl ? 'تأكيد الرفض' : 'Confirm Reject')}
                        </button>
                        <button onClick={() => setShowReject(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : showApproveNote ? (
                    <div className="space-y-2">
                      <textarea
                        value={approveNotes}
                        onChange={(e) => setApproveNotes(e.target.value)}
                        placeholder={isRtl ? 'ملاحظات اختيارية...' : 'Optional notes...'}
                        className="w-full border border-green-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveMutation.mutate({ id: selected.id, notes: approveNotes || undefined })}
                          disabled={approveMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm py-2.5 rounded-xl disabled:opacity-50"
                        >
                          <CheckCircle2 size={15} />
                          {approveMutation.isPending ? '...' : (isRtl ? 'تأكيد الموافقة' : 'Confirm Approve')}
                        </button>
                        <button onClick={() => setShowApproveNote(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowApproveNote(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm py-2.5 rounded-xl font-medium"
                      >
                        <CheckCircle2 size={15} />{isRtl ? 'موافقة' : 'Approve'}
                      </button>
                      <button
                        onClick={() => setShowReject(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm py-2.5 rounded-xl font-medium"
                      >
                        <XCircle size={15} />{isRtl ? 'رفض' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button onClick={closeDetail} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
