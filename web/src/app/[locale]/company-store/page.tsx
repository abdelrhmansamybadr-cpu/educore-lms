'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, getApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useLocale } from 'next-intl'
import { Plus, Package, Clock, CheckCircle, XCircle, Inbox, RotateCcw, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

// Roles that can see the full store manager admin view
const STORE_ADMIN_ROLES = new Set([
  'STORE_MANAGER', 'SCHOOL_ADMIN', 'VICE_PRINCIPAL',
  'FINANCE_OFFICER', 'DEVELOPER', 'SUPER_ADMIN',
])

const STATUS_CFG: Record<string, { label: string; labelAr: string; cls: string; icon: any }> = {
  PENDING:   { label: 'Pending',        labelAr: 'قيد الانتظار',   cls: 'bg-yellow-100 text-yellow-700', icon: Clock },
  APPROVED:  { label: 'Approved',       labelAr: 'معتمد',           cls: 'bg-blue-100 text-blue-700',    icon: CheckCircle },
  REJECTED:  { label: 'Rejected',       labelAr: 'مرفوض',           cls: 'bg-red-100 text-red-700',      icon: XCircle },
  READY:     { label: 'Ready to Collect', labelAr: 'جاهز للاستلام', cls: 'bg-teal-100 text-teal-700',   icon: Package },
  COLLECTED: { label: 'Collected',      labelAr: 'تم الاستلام',     cls: 'bg-green-100 text-green-700',  icon: CheckCircle },
}

// ─── Employee View (3 tabs) ────────────────────────────────────────────────────

function StoreEmployeeView() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [tab, setTab] = useState<'new-request' | 'my-requests' | 'my-collections'>('new-request')
  const [form, setForm] = useState({ itemName: '', quantity: '1', reason: '' })
  const qc = useQueryClient()

  const { data: myRequests = [], isLoading: reqLoading } = useQuery<any[]>({
    queryKey: ['company-store-my-requests'],
    queryFn: () => apiClient.get('/store/requests?mine=true').then((r) => r.data?.data ?? r.data ?? []),
    enabled: tab === 'my-requests',
  })

  const { data: collections = [], isLoading: colLoading } = useQuery<any[]>({
    queryKey: ['company-store-collections'],
    queryFn: () => apiClient.get('/store/my-collections').then((r) => r.data?.data ?? r.data ?? []),
    enabled: tab === 'my-collections',
  })

  const createRequest = useMutation({
    mutationFn: (data: any) => apiClient.post('/store/requests', data),
    onSuccess: () => {
      toast.success(isRtl ? 'تم إرسال الطلب' : 'Request submitted — store manager will review it')
      qc.invalidateQueries({ queryKey: ['company-store-my-requests'] })
      setForm({ itemName: '', quantity: '1', reason: '' })
      setTab('my-requests')
    },
    onError: (err: any) => toast.error(getApiError(err, isRtl ? 'فشل إرسال الطلب' : 'Failed to submit request')),
  })

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!form.itemName.trim()) { toast.error(isRtl ? 'أدخل اسم الصنف' : 'Enter an item name'); return }
    createRequest.mutate({ itemName: form.itemName.trim(), quantity: parseInt(form.quantity) || 1, reason: form.reason || undefined })
  }

  const TABS = [
    { key: 'new-request',    label: isRtl ? 'طلب جديد'     : 'New Request',    icon: Plus },
    { key: 'my-requests',    label: isRtl ? 'طلباتي'        : 'My Requests',    icon: Clock },
    { key: 'my-collections', label: isRtl ? 'مستلماتي'      : 'My Collections', icon: Package },
  ] as const

  return (
    <div className="p-6 max-w-3xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3 mb-6">
        <Package size={24} className="text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'المخزن' : 'Store'}</h1>
          <p className="text-sm text-gray-500">{isRtl ? 'اطلب ما تحتاجه من مدير المخزن' : 'Request items from the store manager'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: New Request */}
      {tab === 'new-request' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            {isRtl ? 'تقديم طلب جديد' : 'Submit a New Request'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRtl ? 'اسم الصنف المطلوب *' : 'Item Name *'}
              </label>
              <input
                type="text"
                value={form.itemName}
                onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
                placeholder={isRtl ? 'مثال: حبر طابعة، كرسي، جهاز لابتوب...' : 'e.g. Printer ink, Chair, Laptop charger...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRtl ? 'الكمية' : 'Quantity'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRtl ? 'السبب (اختياري)' : 'Reason (optional)'}
                </label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder={isRtl ? 'لماذا تحتاجه؟' : 'Why do you need it?'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={createRequest.isPending}
              className="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {createRequest.isPending ? (isRtl ? 'جارٍ الإرسال...' : 'Submitting...') : (isRtl ? 'إرسال الطلب' : 'Submit Request')}
            </button>
          </form>
        </div>
      )}

      {/* Tab: My Requests */}
      {tab === 'my-requests' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">{isRtl ? 'طلباتي' : 'My Requests'}</h2>
          </div>
          {reqLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : myRequests.length === 0 ? (
            <div className="p-10 text-center">
              <Inbox size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">{isRtl ? 'لا توجد طلبات بعد' : 'No requests yet'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {myRequests.map((req: any) => {
                const cfg = STATUS_CFG[req.status] ?? { label: req.status, labelAr: req.status, cls: 'bg-gray-100 text-gray-600', icon: Clock }
                const Icon = cfg.icon
                const isOverdue = req.isLoan && req.loanDueDate && !req.returnedAt && new Date(req.loanDueDate) < new Date()
                return (
                  <div key={req.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{req.itemName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isRtl ? 'الكمية:' : 'Qty:'} {req.quantity}
                          {req.reason && <span> · {req.reason}</span>}
                          <span> · {new Date(req.createdAt).toLocaleDateString(locale)}</span>
                        </p>
                        {req.status === 'REJECTED' && req.notes && (
                          <div className="mt-1.5 flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                            <XCircle size={13} className="text-red-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-red-600">{isRtl ? 'سبب الرفض' : 'Rejection Reason'}</p>
                              <p className="text-xs text-red-700">{req.notes}</p>
                            </div>
                          </div>
                        )}
                        {req.status !== 'REJECTED' && req.notes && (
                          <p className="mt-1 text-xs text-gray-600 italic">
                            {isRtl ? 'ملاحظة:' : 'Note:'} {req.notes}
                          </p>
                        )}
                        {req.status === 'APPROVED' && (
                          <p className="mt-1 text-xs font-medium text-blue-600">
                            {isRtl ? 'تمت الموافقة — توجه إلى المخزن لاستلام بضاعتك' : 'Approved — go to the store to collect your items'}
                          </p>
                        )}
                        {req.status === 'READY' && (
                          <p className="mt-1 text-xs font-medium text-teal-600">
                            {isRtl ? 'جاهز للاستلام — توجه إلى المخزن الآن' : 'Ready for pickup — go to the store now'}
                          </p>
                        )}
                        {req.isLoan && req.loanDueDate && (
                          <p className={`mt-1 text-xs font-medium flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                            <AlertCircle size={12} />
                            {isRtl ? 'عارية — يُرجى الإعادة قبل:' : 'Loan — return by:'} {new Date(req.loanDueDate).toLocaleDateString(locale)}
                            {isOverdue && (isRtl ? ' (متأخر)' : ' (OVERDUE)')}
                          </p>
                        )}
                      </div>
                      <span className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
                        <Icon size={11} />
                        {isRtl ? cfg.labelAr : cfg.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: My Collections */}
      {tab === 'my-collections' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">{isRtl ? 'مستلماتي من المخزن' : 'Items I Collected from Store'}</h2>
          </div>
          {colLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : collections.length === 0 ? (
            <div className="p-10 text-center">
              <Package size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">{isRtl ? 'لم تستلم أي أصناف بعد' : 'No collected items yet'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {collections.map((req: any) => {
                const isOverdue = req.isLoan && req.loanDueDate && !req.returnedAt && new Date(req.loanDueDate) < new Date()
                return (
                  <div key={req.id} className="px-6 py-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{req.itemName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {isRtl ? 'الكمية:' : 'Qty:'} {req.quantity}
                        {req.collectedAt && <span> · {isRtl ? 'استُلم:' : 'Collected:'} {new Date(req.collectedAt).toLocaleDateString(locale)}</span>}
                      </p>
                      {req.isLoan && (
                        <div className="mt-1">
                          {req.returnedAt ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                              <RotateCcw size={11} />
                              {isRtl ? 'تم الإعادة:' : 'Returned:'} {new Date(req.returnedAt).toLocaleDateString(locale)}
                            </span>
                          ) : (
                            <span className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                              <AlertCircle size={11} />
                              {isRtl ? 'عارية — يُرجى الإعادة قبل:' : 'Loan — return by:'} {new Date(req.loanDueDate).toLocaleDateString(locale)}
                              {isOverdue && (isRtl ? ' ⚠ متأخر' : ' ⚠ OVERDUE')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${req.isLoan ? (req.returnedAt ? 'bg-green-100 text-green-700' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700') : 'bg-gray-100 text-gray-700'}`}>
                      {req.isLoan ? (req.returnedAt ? (isRtl ? 'مُعاد' : 'Returned') : isOverdue ? (isRtl ? 'متأخر' : 'Overdue') : (isRtl ? 'عارية' : 'On Loan')) : (isRtl ? 'مستلم' : 'Kept')}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Store Manager Admin View ──────────────────────────────────────────────────

function StoreManagerView() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [tab, setTab] = useState<'requests' | 'my-requests'>('requests')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [approveModal, setApproveModal] = useState<any>(null)
  const [approveOpts, setApproveOpts] = useState({ notes: '', isLoan: false, loanDueDate: '' })
  const qc = useQueryClient()

  const { data: allRequests = [], isLoading } = useQuery<any[]>({
    queryKey: ['store-mgr-all-requests'],
    queryFn: () => apiClient.get('/store/requests').then((r) => r.data?.data ?? r.data ?? []),
    enabled: tab === 'requests',
  })

  const { data: myRequests = [] } = useQuery<any[]>({
    queryKey: ['store-mgr-my-requests'],
    queryFn: () => apiClient.get('/store/requests?mine=true').then((r) => r.data?.data ?? r.data ?? []),
    enabled: tab === 'my-requests',
  })

  const approve = useMutation({
    mutationFn: ({ id, opts }: any) => apiClient.patch(`/store/requests/${id}/approve`, opts),
    onSuccess: () => {
      toast.success(isRtl ? 'تمت الموافقة' : 'Approved')
      qc.invalidateQueries({ queryKey: ['store-mgr-all-requests'] })
      setApproveModal(null)
      setApproveOpts({ notes: '', isLoan: false, loanDueDate: '' })
    },
    onError: (err: any) => toast.error(getApiError(err, 'Failed to approve')),
  })

  const reject = useMutation({
    mutationFn: ({ id, notes }: any) => apiClient.patch(`/store/requests/${id}/reject`, { notes }),
    onSuccess: () => {
      toast.success(isRtl ? 'تم الرفض' : 'Rejected')
      qc.invalidateQueries({ queryKey: ['store-mgr-all-requests'] })
      setRejectId(null)
      setRejectReason('')
    },
    onError: (err: any) => toast.error(getApiError(err, 'Failed to reject')),
  })

  const markReady = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/store/requests/${id}/ready`, {}),
    onSuccess: () => { toast.success(isRtl ? 'تم تحديد الحالة: جاهز للاستلام' : 'Marked ready for pickup'); qc.invalidateQueries({ queryKey: ['store-mgr-all-requests'] }) },
    onError: (err: any) => toast.error(getApiError(err, 'Failed')),
  })

  const collect = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/store/requests/${id}/collect`, {}),
    onSuccess: () => { toast.success(isRtl ? 'تم الاستلام' : 'Marked collected'); qc.invalidateQueries({ queryKey: ['store-mgr-all-requests'] }) },
    onError: (err: any) => toast.error(getApiError(err, 'Failed')),
  })

  const returnLoan = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/store/requests/${id}/return`, {}),
    onSuccess: () => { toast.success(isRtl ? 'تمت الإعادة' : 'Loan returned'); qc.invalidateQueries({ queryKey: ['store-mgr-all-requests'] }) },
    onError: (err: any) => toast.error(getApiError(err, 'Failed')),
  })

  const pendingCount = allRequests.filter((r: any) => r.status === 'PENDING').length
  const requests = tab === 'requests' ? allRequests : myRequests

  return (
    <div className="p-6 max-w-4xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3 mb-6">
        <Package size={24} className="text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'إدارة الطلبات' : 'Employee Requests'}</h1>
          <p className="text-sm text-gray-500">{isRtl ? 'راجع طلبات الموظفين واتخذ القرار' : 'Review and act on employee store requests'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-1">
        {[
          { key: 'requests', label: isRtl ? `طلبات الموظفين${pendingCount ? ` (${pendingCount})` : ''}` : `All Requests${pendingCount ? ` (${pendingCount} pending)` : ''}` },
          { key: 'my-requests', label: isRtl ? 'طلباتي' : 'My Requests' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Requests list */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center"><Inbox size={36} className="mx-auto text-gray-300 mb-2" /><p className="text-gray-500 text-sm">{isRtl ? 'لا توجد طلبات' : 'No requests'}</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((req: any) => {
              const cfg = STATUS_CFG[req.status] ?? { label: req.status, labelAr: req.status, cls: 'bg-gray-100 text-gray-600', icon: Clock }
              const isOverdue = req.isLoan && req.loanDueDate && !req.returnedAt && new Date(req.loanDueDate) < new Date()
              const requesterName = `${req.requestedBy?.profile?.firstName ?? ''} ${req.requestedBy?.profile?.lastName ?? ''}`.trim() || req.requestedBy?.email
              return (
                <div key={req.id} className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-gray-900 text-sm">{req.itemName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>{isRtl ? cfg.labelAr : cfg.label}</span>
                        {req.isLoan && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{isRtl ? 'عارية' : 'LOAN'}{isOverdue ? (isRtl ? ' - متأخر' : ' - OVERDUE') : ''}</span>}
                      </div>
                      <p className="text-xs text-gray-500">
                        {isRtl ? 'الموظف:' : 'By:'} {requesterName} · {isRtl ? 'الكمية:' : 'Qty:'} {req.quantity}
                        {req.reason && <span> · {req.reason}</span>}
                        <span> · {new Date(req.createdAt).toLocaleDateString(locale)}</span>
                      </p>
                      {req.notes && <p className="mt-0.5 text-xs text-gray-600 italic">{req.notes}</p>}
                      {req.isLoan && req.loanDueDate && (
                        <p className={`mt-0.5 text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                          {isRtl ? 'تاريخ الإعادة:' : 'Return by:'} {new Date(req.loanDueDate).toLocaleDateString(locale)}
                          {req.returnedAt && <span className="text-green-600 ms-2">{isRtl ? '✓ مُعاد' : '✓ Returned'}</span>}
                        </p>
                      )}
                    </div>
                    {/* Actions (only for admin tabs) */}
                    {tab === 'requests' && (
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                        {req.status === 'PENDING' && (
                          <>
                            <button onClick={() => { setApproveModal(req); setApproveOpts({ notes: '', isLoan: false, loanDueDate: '' }) }} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">{isRtl ? 'موافقة' : 'Approve'}</button>
                            <button onClick={() => setRejectId(req.id)} className="px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200">{isRtl ? 'رفض' : 'Reject'}</button>
                          </>
                        )}
                        {req.status === 'APPROVED' && (
                          <button onClick={() => markReady.mutate(req.id)} className="px-3 py-1.5 bg-teal-100 text-teal-700 text-xs rounded-lg hover:bg-teal-200">{isRtl ? 'جاهز للاستلام' : 'Mark Ready'}</button>
                        )}
                        {req.status === 'READY' && (
                          <button onClick={() => collect.mutate(req.id)} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">{isRtl ? 'تم الاستلام' : 'Mark Collected'}</button>
                        )}
                        {req.status === 'COLLECTED' && req.isLoan && !req.returnedAt && (
                          <button onClick={() => returnLoan.mutate(req.id)} className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs rounded-lg hover:bg-purple-200">{isRtl ? 'تم الإعادة' : 'Mark Returned'}</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-base font-semibold mb-3">{isRtl ? 'سبب الرفض' : 'Rejection Reason'}</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder={isRtl ? 'أدخل سبب الرفض...' : 'Enter reason for rejection...'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { if (!rejectReason.trim()) { toast.error('Enter a reason'); return; } reject.mutate({ id: rejectId, notes: rejectReason }) }} disabled={reject.isPending} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">{isRtl ? 'تأكيد الرفض' : 'Confirm Reject'}</button>
              <button onClick={() => { setRejectId(null); setRejectReason('') }} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-base font-semibold mb-1">{isRtl ? 'تأكيد الموافقة' : 'Approve Request'}</h3>
            <p className="text-sm text-gray-500 mb-4">{approveModal.itemName} × {approveModal.quantity}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{isRtl ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</label>
                <input type="text" value={approveOpts.notes} onChange={(e) => setApproveOpts((o) => ({ ...o, notes: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={approveOpts.isLoan} onChange={(e) => setApproveOpts((o) => ({ ...o, isLoan: e.target.checked }))} className="rounded" />
                <span className="text-sm font-medium text-gray-700">{isRtl ? 'عارية (يجب الإعادة)' : 'This is a loan (must be returned)'}</span>
              </label>
              {approveOpts.isLoan && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isRtl ? 'تاريخ الإعادة' : 'Return Due Date'}</label>
                  <input type="date" value={approveOpts.loanDueDate} onChange={(e) => setApproveOpts((o) => ({ ...o, loanDueDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => approve.mutate({ id: approveModal.id, opts: approveOpts })} disabled={approve.isPending} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">{isRtl ? 'تأكيد الموافقة' : 'Confirm Approve'}</button>
              <button onClick={() => setApproveModal(null)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function CompanyStorePage() {
  const user = useAuthStore((s) => s.user)
  const isStoreAdmin = STORE_ADMIN_ROLES.has(user?.role ?? '')
  return isStoreAdmin ? <StoreManagerView /> : <StoreEmployeeView />
}
