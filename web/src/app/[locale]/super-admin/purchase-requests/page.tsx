'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getApiError } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, Skeleton } from '@/components/ui'
import { ShoppingCart, Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const CATEGORIES = [
  { value: 'EQUIPMENT', label: 'Equipment', labelAr: 'معدات' },
  { value: 'SUPPLIES',  label: 'Supplies',  labelAr: 'مستلزمات' },
  { value: 'SOFTWARE',  label: 'Software',  labelAr: 'برمجيات' },
  { value: 'SERVICES',  label: 'Services',  labelAr: 'خدمات' },
  { value: 'MAINTENANCE', label: 'Maintenance', labelAr: 'صيانة' },
  { value: 'FURNITURE', label: 'Furniture', labelAr: 'أثاث' },
  { value: 'IT',        label: 'IT',        labelAr: 'تقنية معلومات' },
  { value: 'BOOKS',     label: 'Books',     labelAr: 'كتب' },
  { value: 'SPORTS',    label: 'Sports',    labelAr: 'رياضة' },
  { value: 'OTHER',     label: 'Other',     labelAr: 'أخرى' },
]

const URGENCIES = [
  { value: 'LOW',    label: 'Low',    labelAr: 'منخفض' },
  { value: 'NORMAL', label: 'Normal', labelAr: 'عادي' },
  { value: 'HIGH',   label: 'High',   labelAr: 'عالي' },
  { value: 'URGENT', label: 'Urgent', labelAr: 'عاجل' },
]

function statusBadge(status: string, isRtl: boolean) {
  const map: Record<string, { label: string; labelAr: string; cls: string }> = {
    PENDING:     { label: 'Pending',     labelAr: 'في الانتظار', cls: 'bg-yellow-100 text-yellow-700' },
    APPROVED:    { label: 'Approved',    labelAr: 'موافق عليه', cls: 'bg-green-100 text-green-700' },
    REJECTED:    { label: 'Rejected',    labelAr: 'مرفوض',      cls: 'bg-red-100 text-red-700' },
    IN_PROGRESS: { label: 'In Progress', labelAr: 'قيد التنفيذ', cls: 'bg-blue-100 text-blue-700' },
    COMPLETED:   { label: 'Completed',   labelAr: 'مكتمل',      cls: 'bg-teal-100 text-teal-700' },
    CANCELLED:   { label: 'Cancelled',   labelAr: 'ملغى',       cls: 'bg-gray-100 text-gray-500' },
  }
  const s = map[status]
  if (!s) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{status}</span>
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${s.cls}`}>{isRtl ? s.labelAr : s.label}</span>
}

function inputCls() { return 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white' }

export default function PurchaseRequestsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const qc = useQueryClient()

  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [reviewForm, setReviewForm] = useState({ status: '', reviewNotes: '', approvedCost: '' })
  const [form, setForm] = useState({ title: '', description: '', category: 'OTHER', quantity: '1', urgency: 'NORMAL', justification: '', neededBy: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['owner-purchases', statusFilter],
    queryFn: () => api.get('/owner/purchase-requests', { params: { status: statusFilter || undefined, limit: 50 } }).then((r) => r.data?.data ?? []),
  })

  const requests: any[] = Array.isArray(data) ? data : (data?.data ?? [])

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/owner/purchase-requests', body),
    onSuccess: () => { toast.success(isRtl ? 'تم إنشاء الطلب' : 'Request submitted'); qc.invalidateQueries({ queryKey: ['owner-purchases'] }); setShowForm(false); setForm({ title: '', description: '', category: 'OTHER', quantity: '1', urgency: 'NORMAL', justification: '', neededBy: '' }) },
    onError: (err: any) => toast.error(getApiError(err, isRtl ? 'فشل الإنشاء' : 'Failed to submit')),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.patch(`/owner/purchase-requests/${id}/review`, body),
    onSuccess: () => { toast.success(isRtl ? 'تم تحديث الطلب' : 'Request updated'); qc.invalidateQueries({ queryKey: ['owner-purchases'] }); setSelected(null) },
    onError: (err: any) => toast.error(getApiError(err, isRtl ? 'فشل التحديث' : 'Failed to update')),
  })

  const filtered = requests.filter((r: any) => !search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.requestedBy?.profile?.firstName?.toLowerCase().includes(search.toLowerCase()))

  const totalPending = requests.filter((r: any) => r.status === 'PENDING').length
  const totalValue = requests.filter((r: any) => r.status === 'APPROVED').reduce((s: number, r: any) => s + (r.approvedCost ?? r.estimatedCost ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold text-gray-900 ${isRtl ? 'font-arabic' : ''}`}>{isRtl ? 'طلبات الشراء' : 'Purchase Requests'}</h1>
          <p className="text-gray-500 text-sm mt-1">{isRtl ? 'إدارة وموافقة طلبات الشراء لجميع المدارس' : 'Manage and approve purchase requests across all schools'}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700">
          <Plus size={16} /> {isRtl ? 'طلب جديد' : 'New Request'}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardBody className="p-4 text-center"><p className="text-xs text-gray-500">{isRtl ? 'معلقة' : 'Pending'}</p><p className="text-2xl font-bold text-yellow-600">{totalPending}</p></CardBody></Card>
        <Card><CardBody className="p-4 text-center"><p className="text-xs text-gray-500">{isRtl ? 'إجمالي الموافق عليه' : 'Total Approved Value'}</p><p className="text-2xl font-bold text-green-600">${totalValue.toLocaleString()}</p></CardBody></Card>
        <Card><CardBody className="p-4 text-center"><p className="text-xs text-gray-500">{isRtl ? 'إجمالي الطلبات' : 'Total Requests'}</p><p className="text-2xl font-bold text-gray-800">{requests.length}</p></CardBody></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRtl ? 'بحث...' : 'Search requests...'} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 bg-white">
          <option value="">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
          {['PENDING','APPROVED','REJECTED','IN_PROGRESS','COMPLETED','CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardBody className="p-12 text-center"><ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-400">{isRtl ? 'لا توجد طلبات بعد' : 'No purchase requests yet'}</p></CardBody></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((pr: any) => (
            <Card key={pr.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setSelected(pr); setReviewForm({ status: pr.status, reviewNotes: pr.reviewNotes ?? '', approvedCost: pr.approvedCost ?? '' }) }}>
              <CardBody className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <ShoppingCart size={18} className="text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900">{pr.title}</p>
                      {statusBadge(pr.status, isRtl)}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{pr.description}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                      <span>{pr.category}</span>
                      <span>·</span>
                      <span>{pr.currency} {pr.estimatedCost?.toLocaleString()}</span>
                      {pr.school && <><span>·</span><span>{pr.school.name}</span></>}
                      {pr.requestedBy?.profile && <><span>·</span><span>{pr.requestedBy.profile.firstName} {pr.requestedBy.profile.lastName}</span></>}
                      <span>·</span>
                      <span>{format(new Date(pr.requestedAt), 'dd MMM yyyy')}</span>
                      {pr.urgency !== 'NORMAL' && <><span>·</span><span className={`font-medium ${pr.urgency === 'URGENT' ? 'text-red-500' : pr.urgency === 'HIGH' ? 'text-orange-500' : 'text-gray-400'}`}>{pr.urgency}</span></>}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{isRtl ? 'طلب شراء جديد' : 'New Purchase Request'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">{isRtl ? 'عنوان الطلب *' : 'Request Title *'}</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls()} placeholder={isRtl ? 'مثال: شراء أجهزة حاسوب' : 'e.g. Purchase 10 Laptops'} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">{isRtl ? 'الوصف *' : 'Description *'}</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputCls()} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{isRtl ? 'الفئة' : 'Category'}</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls()}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{isRtl ? c.labelAr : c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{isRtl ? 'الأولوية' : 'Urgency'}</label>
                  <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} className={inputCls()}>
                    {URGENCIES.map((u) => <option key={u.value} value={u.value}>{isRtl ? u.labelAr : u.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{isRtl ? 'الكمية' : 'Quantity'}</label>
                  <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputCls()} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{isRtl ? 'مطلوب قبل' : 'Needed By'}</label>
                  <input type="date" value={form.neededBy} onChange={(e) => setForm({ ...form, neededBy: e.target.value })} className={inputCls()} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">{isRtl ? 'مبرر الطلب' : 'Justification'}</label>
                  <textarea value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} rows={2} className={inputCls()} />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
              <button
                onClick={() => createMutation.mutate({ title: form.title, description: form.description, category: form.category, estimatedCost: 0, quantity: parseInt(form.quantity), urgency: form.urgency, justification: form.justification || undefined, neededBy: form.neededBy || undefined })}
                disabled={!form.title || !form.description || createMutation.isPending}
                className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >{isRtl ? 'إرسال الطلب' : 'Submit Request'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{selected.title}</h2>
              <p className="text-xs text-gray-400 mt-1">{selected.category} · {selected.currency} {selected.estimatedCost?.toLocaleString()}</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">{selected.description}</p>
              {selected.justification && <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600"><strong>{isRtl ? 'المبرر: ' : 'Justification: '}</strong>{selected.justification}</div>}
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div><strong>{isRtl ? 'المورد:' : 'Vendor:'}</strong> {selected.vendor ?? '—'}</div>
                <div><strong>{isRtl ? 'الكمية:' : 'Quantity:'}</strong> {selected.quantity}</div>
                <div><strong>{isRtl ? 'مطلوب قبل:' : 'Needed by:'}</strong> {selected.neededBy ? format(new Date(selected.neededBy), 'dd MMM yyyy') : '—'}</div>
                <div><strong>{isRtl ? 'طالب الشراء:' : 'Requested by:'}</strong> {selected.requestedBy?.profile ? `${selected.requestedBy.profile.firstName} ${selected.requestedBy.profile.lastName}` : '—'}</div>
              </div>
              <hr />
              <div>
                <label className="block text-xs text-gray-500 mb-1">{isRtl ? 'الإجراء' : 'Action'}</label>
                <select value={reviewForm.status} onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })} className={inputCls()}>
                  <option value="">{isRtl ? 'اختر الإجراء' : 'Choose action'}</option>
                  {['APPROVED','REJECTED','IN_PROGRESS','COMPLETED','CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {reviewForm.status === 'APPROVED' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{isRtl ? 'المبلغ المعتمد' : 'Approved Amount'}</label>
                  <input type="number" value={reviewForm.approvedCost} onChange={(e) => setReviewForm({ ...reviewForm, approvedCost: e.target.value })} className={inputCls()} placeholder={selected.estimatedCost} />
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-500 mb-1">{isRtl ? 'ملاحظات المراجعة' : 'Review Notes'}</label>
                <textarea value={reviewForm.reviewNotes} onChange={(e) => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })} rows={2} className={inputCls()} />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm">{isRtl ? 'إغلاق' : 'Close'}</button>
              <button
                onClick={() => reviewMutation.mutate({ id: selected.id, body: { status: reviewForm.status, reviewNotes: reviewForm.reviewNotes || undefined, approvedCost: reviewForm.approvedCost ? parseFloat(reviewForm.approvedCost) : undefined } })}
                disabled={!reviewForm.status || reviewMutation.isPending}
                className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >{isRtl ? 'حفظ' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
