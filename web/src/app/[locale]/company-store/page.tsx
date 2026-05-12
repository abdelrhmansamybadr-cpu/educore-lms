'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, getApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useLocale } from 'next-intl'
import {
  Search, Package, Clock, CheckCircle, XCircle, History,
  Truck, User,
} from 'lucide-react'
import toast from 'react-hot-toast'

// Roles that see the full store management admin view
const STORE_ADMIN_ROLES = new Set([
  'STORE_MANAGER', 'SCHOOL_ADMIN', 'VICE_PRINCIPAL',
  'FINANCE_OFFICER', 'DEVELOPER', 'SUPER_ADMIN',
])

const REQUEST_STATUS_STYLE: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  APPROVED:  'bg-blue-100 text-blue-700',
  REJECTED:  'bg-red-100 text-red-700',
  COLLECTED: 'bg-green-100 text-green-700',
}

// ─── Employee Browse + Request View ──────────────────────────────────────────

function StoreEmployeeView() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [search, setSearch] = useState('')
  const [requestModal, setRequestModal] = useState<any>(null)
  const [reqQty, setReqQty] = useState('1')
  const [reqReason, setReqReason] = useState('')
  const [activeTab, setActiveTab] = useState<'browse' | 'my-requests'>('browse')
  const qc = useQueryClient()

  const { data: items, isLoading } = useQuery({
    queryKey: ['company-store-items', search],
    queryFn: () =>
      apiClient.get(`/store/items?${search ? new URLSearchParams({ search }) : ''}`).then(
        (r) => r.data?.data ?? r.data ?? [],
      ),
    enabled: activeTab === 'browse',
  })

  const { data: myRequests = [], isLoading: reqLoading } = useQuery<any[]>({
    queryKey: ['company-store-my-requests'],
    queryFn: () => apiClient.get('/store/requests').then((r) => r.data?.data ?? r.data ?? []),
    enabled: activeTab === 'my-requests',
  })

  const createRequest = useMutation({
    mutationFn: (data: any) => apiClient.post('/store/requests', data),
    onSuccess: () => {
      toast.success('Request submitted — store will review it')
      qc.invalidateQueries({ queryKey: ['company-store-my-requests'] })
      setRequestModal(null)
      setReqQty('1')
      setReqReason('')
    },
    onError: (err: any) => toast.error(getApiError(err, 'Failed to submit request')),
  })

  const itemList = Array.isArray(items) ? items : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isRtl ? '🏪 متجر الشركة' : '🏪 Company Store'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isRtl
            ? 'تصفح الأصناف المتاحة واطلب ما تحتاجه من المخزن'
            : 'Browse available items and request what you need from the store'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { key: 'browse',      label: isRtl ? 'تصفح الأصناف' : 'Browse Items',  icon: <Package size={14} /> },
          { key: 'my-requests', label: isRtl ? 'طلباتي'        : 'My Requests',   icon: <Clock size={14} /> },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Browse Tab ── */}
      {activeTab === 'browse' && (
        <>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 max-w-sm">
            <Search size={16} className="text-gray-400" />
            <input
              placeholder={isRtl ? 'ابحث عن صنف...' : 'Search items...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent"
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : itemList.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Package size={48} className="mx-auto mb-3 opacity-20" />
              <p>{isRtl ? 'لا توجد أصناف متاحة حالياً' : 'No items available right now'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {itemList.map((item: any) => {
                const isOut = item.quantity === 0
                const isLow = !isOut && item.quantity <= item.minQuantity
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col"
                  >
                    {/* Icon + name */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                        📦
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                        {item.location && (
                          <p className="text-xs text-gray-400">
                            {isRtl ? 'الموقع: ' : 'Location: '}
                            {item.location}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stock */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xl font-bold text-gray-900">{item.quantity}</span>
                        <span className="text-xs text-gray-400 ml-1">{item.unit}</span>
                      </div>
                      {isOut ? (
                        <span className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-medium">
                          {isRtl ? 'نفد' : 'Out of stock'}
                        </span>
                      ) : isLow ? (
                        <span className="text-xs bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full font-medium">
                          {isRtl ? 'كمية محدودة' : 'Low stock'}
                        </span>
                      ) : (
                        <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
                          {isRtl ? 'متاح' : 'Available'}
                        </span>
                      )}
                    </div>

                    {/* Request button */}
                    <button
                      onClick={() => {
                        setRequestModal(item)
                        setReqQty('1')
                        setReqReason('')
                      }}
                      disabled={isOut}
                      className="mt-auto w-full py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {isRtl ? 'طلب هذا الصنف' : 'Request Item'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── My Requests Tab ── */}
      {activeTab === 'my-requests' && (
        <div className="space-y-3 max-w-2xl">
          {reqLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-16" />
            ))
          ) : (myRequests as any[]).length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <History size={48} className="mx-auto mb-3 opacity-20" />
              <p>{isRtl ? 'لم تقدم أي طلبات حتى الآن' : "You haven't made any store requests yet."}</p>
            </div>
          ) : (
            (myRequests as any[]).map((req: any) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                  📦
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{req.item?.name}</p>
                  <p className="text-xs text-gray-500">
                    {req.quantity} {req.item?.unit} ·{' '}
                    {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                  {req.reason && (
                    <p className="text-xs text-gray-400 italic mt-0.5">"{req.reason}"</p>
                  )}
                  {req.notes && (
                    <p className="text-xs text-indigo-600 mt-0.5">
                      {isRtl ? 'ملاحظة المخزن: ' : 'Store note: '}
                      {req.notes}
                    </p>
                  )}
                  {req.status === 'APPROVED' && (
                    <p className="text-xs text-blue-600 mt-0.5 font-medium">
                      ✓ {isRtl ? 'تمت الموافقة — توجه للمخزن لاستلام الصنف' : 'Approved — go to the store to collect your item'}
                    </p>
                  )}
                  {req.status === 'COLLECTED' && req.collectedAt && (
                    <p className="text-xs text-green-600 mt-0.5 font-medium">
                      ✓ {isRtl ? 'تم الاستلام بتاريخ ' : 'Collected on '}
                      {new Date(req.collectedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    REQUEST_STATUS_STYLE[req.status] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {req.status === 'PENDING'   ? (isRtl ? 'بانتظار الموافقة' : 'Pending')
                   : req.status === 'APPROVED'  ? (isRtl ? 'موافق عليه'      : 'Approved')
                   : req.status === 'REJECTED'  ? (isRtl ? 'مرفوض'            : 'Rejected')
                   : req.status === 'COLLECTED' ? (isRtl ? 'تم الاستلام'      : 'Collected')
                   : req.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Request Modal ── */}
      {requestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {isRtl ? 'طلب صنف' : 'Request Item'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {requestModal.name} ({isRtl ? 'المتاح: ' : 'Available: '}
                {requestModal.quantity} {requestModal.unit})
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {isRtl ? 'الكمية' : 'Quantity'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={requestModal.quantity}
                  value={reqQty}
                  onChange={(e) => setReqQty(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {isRtl ? 'السبب (اختياري)' : 'Reason (optional)'}
                </label>
                <textarea
                  rows={2}
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder={isRtl ? 'لماذا تحتاج هذا الصنف؟' : 'Why do you need this item?'}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <button
                onClick={() => setRequestModal(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() =>
                  createRequest.mutate({
                    itemId: requestModal.id,
                    quantity: parseInt(reqQty) || 1,
                    reason: reqReason || undefined,
                  })
                }
                disabled={createRequest.isPending}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {createRequest.isPending
                  ? (isRtl ? 'جاري الإرسال...' : 'Submitting…')
                  : (isRtl ? 'إرسال الطلب' : 'Submit Request')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Store Admin View (full management) ──────────────────────────────────────

function StoreManagerView() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [activeTab, setActiveTab] = useState<'browse' | 'approval' | 'my-requests'>('browse')
  const [search, setSearch] = useState('')
  const qc = useQueryClient()

  const { data: items, isLoading } = useQuery({
    queryKey: ['company-store-items', search],
    queryFn: () =>
      apiClient.get(`/store/items?${search ? new URLSearchParams({ search }) : ''}`).then(
        (r) => r.data?.data ?? r.data ?? [],
      ),
    enabled: activeTab === 'browse',
  })

  // All school requests — for admin approval workflow
  const { data: allRequests = [], isLoading: reqLoading } = useQuery<any[]>({
    queryKey: ['company-store-all-requests'],
    queryFn: () => apiClient.get('/store/requests').then((r) => r.data?.data ?? r.data ?? []),
    enabled: activeTab === 'approval',
  })

  // Current user's own requests only
  const { data: myRequests = [], isLoading: myReqLoading } = useQuery<any[]>({
    queryKey: ['company-store-my-requests'],
    queryFn: () => apiClient.get('/store/requests?mine=true').then((r) => r.data?.data ?? r.data ?? []),
    enabled: activeTab === 'my-requests',
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/store/requests/${id}/approve`, {}),
    onSuccess: () => {
      toast.success('Approved — employee notified to come collect')
      qc.invalidateQueries({ queryKey: ['company-store-all-requests'] })
      qc.invalidateQueries({ queryKey: ['company-store-my-requests'] })
    },
    onError: (err: any) => toast.error(getApiError(err, 'Failed to approve request')),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      apiClient.patch(`/store/requests/${id}/reject`, { notes }),
    onSuccess: () => {
      toast.success('Request rejected')
      qc.invalidateQueries({ queryKey: ['company-store-all-requests'] })
      qc.invalidateQueries({ queryKey: ['company-store-my-requests'] })
      setRejectModal(null)
      setRejectNotes('')
    },
    onError: () => toast.error('Failed'),
  })

  const collectMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/store/requests/${id}/collect`),
    onSuccess: () => {
      toast.success('Marked as collected — stock deducted')
      qc.invalidateQueries({ queryKey: ['company-store-all-requests'] })
      qc.invalidateQueries({ queryKey: ['company-store-items'] })
    },
    onError: () => toast.error('Failed'),
  })

  const pendingReqs  = allRequests.filter((r) => r.status === 'PENDING')
  const approvedReqs = allRequests.filter((r) => r.status === 'APPROVED')
  const historyReqs  = allRequests.filter((r) => ['REJECTED', 'COLLECTED'].includes(r.status))
  const itemList = Array.isArray(items) ? items : []

  const TABS = [
    { key: 'browse',       label: isRtl ? 'الأصناف'    : 'All Items',       icon: <Package size={14} /> },
    { key: 'approval',     label: isRtl ? 'الموافقة'   : 'Approval Queue',  icon: <Truck size={14} />,  badge: pendingReqs.length },
    { key: 'my-requests',  label: isRtl ? 'طلباتي'     : 'My Requests',     icon: <User size={14} /> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isRtl ? '🏪 متجر الشركة' : '🏪 Company Store'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isRtl ? 'إدارة الأصناف ومعالجة طلبات الموظفين' : 'Manage inventory and process employee requests'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
            {t.badge && t.badge > 0 ? (
              <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Items Tab ── */}
      {activeTab === 'browse' && (
        <>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 max-w-sm">
            <Search size={16} className="text-gray-400" />
            <input
              placeholder={isRtl ? 'ابحث...' : 'Search items...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent"
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-36" />
              ))}
            </div>
          ) : itemList.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Package size={48} className="mx-auto mb-3 opacity-20" />
              <p>{isRtl ? 'لا توجد أصناف' : 'No items found'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {itemList.map((item: any) => {
                const isOut = item.quantity === 0
                const isLow = !isOut && item.quantity <= item.minQuantity
                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">📦</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                        <p className="text-xs text-gray-400">{item.category}</p>
                        {item.location && <p className="text-xs text-gray-400">{item.location}</p>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                      <div>
                        <span className={`text-xl font-bold ${isLow || isOut ? 'text-red-600' : 'text-gray-900'}`}>
                          {item.quantity}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">{item.unit}</span>
                      </div>
                      {isOut ? (
                        <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full">
                          {isRtl ? 'نفد' : 'Out of stock'}
                        </span>
                      ) : isLow ? (
                        <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">
                          {isRtl ? 'منخفض' : 'Low stock'}
                        </span>
                      ) : (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                          {isRtl ? 'متاح' : 'Available'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Approval Queue Tab (all employees — admin workflow) ── */}
      {activeTab === 'approval' && (
        <div className="space-y-6">
          {reqLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />
            ))
          ) : (
            <>
              {/* Pending */}
              {pendingReqs.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-orange-500" />
                    {isRtl ? 'بانتظار الموافقة' : 'Pending Approval'}
                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {pendingReqs.length}
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {pendingReqs.map((req: any) => (
                      <div
                        key={req.id}
                        className="bg-white rounded-2xl border border-orange-100 p-4 flex items-center gap-4"
                      >
                        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-base flex-shrink-0">📦</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">{req.item?.name}</p>
                          <p className="text-xs text-gray-500">
                            {req.requestedBy?.profile?.firstName} {req.requestedBy?.profile?.lastName} ·{' '}
                            {req.quantity} {req.item?.unit} · {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                          {req.reason && (
                            <p className="text-xs text-gray-400 italic mt-0.5">"{req.reason}"</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => approveMutation.mutate(req.id)}
                            disabled={approveMutation.isPending}
                            className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-xl hover:bg-green-700 disabled:opacity-50"
                          >
                            <CheckCircle size={12} /> {isRtl ? 'موافقة' : 'Approve'}
                          </button>
                          <button
                            onClick={() => { setRejectModal({ id: req.id }); setRejectNotes('') }}
                            className="flex items-center gap-1 text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50"
                          >
                            <XCircle size={12} /> {isRtl ? 'رفض' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approved — awaiting collection */}
              {approvedReqs.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle size={16} className="text-blue-500" />
                    {isRtl ? 'بانتظار الاستلام' : 'Ready for Collection'}
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {approvedReqs.length}
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {approvedReqs.map((req: any) => (
                      <div
                        key={req.id}
                        className="bg-white rounded-2xl border border-blue-100 p-4 flex items-center gap-4"
                      >
                        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-base flex-shrink-0">📦</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">{req.item?.name}</p>
                          <p className="text-xs text-gray-500">
                            {req.requestedBy?.profile?.firstName} {req.requestedBy?.profile?.lastName} ·{' '}
                            {req.quantity} {req.item?.unit}
                          </p>
                          <p className="text-xs text-blue-600 mt-0.5">
                            {isRtl ? 'بانتظار مجيء الموظف للاستلام' : 'Waiting for employee to come collect'}
                          </p>
                        </div>
                        <button
                          onClick={() => collectMutation.mutate(req.id)}
                          disabled={collectMutation.isPending}
                          className="flex items-center gap-1 text-xs bg-teal-600 text-white px-3 py-1.5 rounded-xl hover:bg-teal-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          <CheckCircle size={12} /> {isRtl ? 'تم الاستلام' : 'Mark Collected'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent history */}
              {historyReqs.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-gray-500">
                    <History size={16} />
                    {isRtl ? 'السجل الأخير' : 'Recent History'}
                  </h3>
                  <div className="space-y-2">
                    {historyReqs.slice(0, 20).map((req: any) => (
                      <div
                        key={req.id}
                        className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700">
                            {req.item?.name} × {req.quantity} {req.item?.unit}
                          </p>
                          <p className="text-xs text-gray-400">
                            {req.requestedBy?.profile?.firstName} {req.requestedBy?.profile?.lastName} ·{' '}
                            {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                            REQUEST_STATUS_STYLE[req.status] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {allRequests.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <Package size={48} className="mx-auto mb-3 opacity-20" />
                  <p>{isRtl ? 'لا توجد طلبات بعد' : 'No employee requests yet.'}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── My Requests Tab (personal — current user only) ── */}
      {activeTab === 'my-requests' && (
        <div className="space-y-3 max-w-2xl">
          {myReqLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-16" />
            ))
          ) : (myRequests as any[]).length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <User size={48} className="mx-auto mb-3 opacity-20" />
              <p>{isRtl ? 'لم تقدم أي طلبات بعد' : "You haven't made any store requests yet."}</p>
            </div>
          ) : (
            (myRequests as any[]).map((req: any) => (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">📦</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{req.item?.name}</p>
                  <p className="text-xs text-gray-500">
                    {req.quantity} {req.item?.unit} · {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                  {req.reason && <p className="text-xs text-gray-400 italic mt-0.5">"{req.reason}"</p>}
                  {req.notes && <p className="text-xs text-indigo-600 mt-0.5">{isRtl ? 'ملاحظة: ' : 'Note: '}{req.notes}</p>}
                  {req.status === 'APPROVED' && (
                    <p className="text-xs text-blue-600 mt-0.5 font-medium">✓ {isRtl ? 'موافق عليه — توجه للمخزن' : 'Approved — go to the store to collect'}</p>
                  )}
                  {req.status === 'COLLECTED' && req.collectedAt && (
                    <p className="text-xs text-green-600 mt-0.5 font-medium">✓ {isRtl ? 'تم الاستلام' : 'Collected'} · {new Date(req.collectedAt).toLocaleDateString()}</p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${REQUEST_STATUS_STYLE[req.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {req.status === 'PENDING'   ? (isRtl ? 'بانتظار الموافقة' : 'Pending')
                   : req.status === 'APPROVED'  ? (isRtl ? 'موافق عليه' : 'Approved')
                   : req.status === 'REJECTED'  ? (isRtl ? 'مرفوض' : 'Rejected')
                   : req.status === 'COLLECTED' ? (isRtl ? 'تم الاستلام' : 'Collected')
                   : req.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              {isRtl ? 'رفض الطلب' : 'Reject Request'}
            </h2>
            <textarea
              rows={3}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder={isRtl ? 'سبب الرفض (مطلوب)' : 'Reason for rejection (required)'}
              className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 rounded-xl border text-sm hover:bg-gray-50"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => rejectMutation.mutate({ id: rejectModal.id, notes: rejectNotes })}
                disabled={!rejectNotes || rejectMutation.isPending}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {isRtl ? 'تأكيد الرفض' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function CompanyStorePage() {
  const role = useAuthStore((s) => s.user?.role || '')
  return STORE_ADMIN_ROLES.has(role) ? <StoreManagerView /> : <StoreEmployeeView />
}
