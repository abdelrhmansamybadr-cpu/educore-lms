'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, getApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useLocale } from 'next-intl'
import { Search, Package, Truck, Plus, Trash2, CheckCircle, Clock, XCircle, User, History } from 'lucide-react'
import toast from 'react-hot-toast'

const STORE_ADMIN_ROLES = new Set(['STORE_MANAGER', 'SCHOOL_ADMIN', 'VICE_PRINCIPAL', 'FINANCE_OFFICER', 'DEVELOPER', 'SUPER_ADMIN'])

type AdminTab = 'inventory' | 'movements' | 'requests' | 'employees'

const movementTypeColor: Record<string, string> = {
  IN: 'bg-green-100 text-green-700',
  OUT: 'bg-red-100 text-red-700',
  ADJUSTMENT: 'bg-blue-100 text-blue-700',
}

const REQUEST_STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
  COLLECTED: 'bg-green-100 text-green-700',
}

// ─── Consumer View (browse items + request) ───────────────────────────────────

function StoreBrowseView() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [search, setSearch] = useState('')
  const [requestModal, setRequestModal] = useState<any>(null)
  const [reqQty, setReqQty] = useState('1')
  const [reqReason, setReqReason] = useState('')
  const [myTab, setMyTab] = useState<'browse' | 'my-requests'>('browse')
  const qc = useQueryClient()

  const { data: items, isLoading } = useQuery({
    queryKey: ['store-items-browse', search],
    queryFn: () =>
      apiClient.get(`/store/items?${search ? new URLSearchParams({ search }) : ''}`).then((r) => r.data?.data ?? r.data ?? []),
    enabled: myTab === 'browse',
  })

  const { data: myRequests = [], isLoading: reqLoading } = useQuery<any[]>({
    queryKey: ['my-store-requests'],
    queryFn: () => apiClient.get('/store/requests').then((r) => r.data?.data ?? r.data ?? []),
    enabled: myTab === 'my-requests',
  })

  const createRequest = useMutation({
    mutationFn: (data: any) => apiClient.post('/store/requests', data),
    onSuccess: () => {
      toast.success('Request submitted — store admin will review it')
      qc.invalidateQueries({ queryKey: ['my-store-requests'] })
      setRequestModal(null); setReqQty('1'); setReqReason('')
    },
    onError: () => toast.error('Failed to submit request'),
  })

  const itemList = Array.isArray(items) ? items : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? '🏪 المخزن' : '🏪 Store & Supplies'}</h1>
        <p className="text-gray-500 text-sm mt-1">{isRtl ? 'تصفح الأصناف وطلب ما تحتاجه' : 'Browse available items and request what you need'}</p>
      </div>

      {/* Tab */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'browse', label: 'Browse Items', icon: <Package size={14} /> },
          { key: 'my-requests', label: 'My Requests', icon: <Clock size={14} /> },
        ].map((t) => (
          <button key={t.key} onClick={() => setMyTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${myTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {myTab === 'browse' && (
        <>
          {/* Search */}
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
              <p>{isRtl ? 'لا توجد أصناف' : 'No items found'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemList.map((item: any) => {
                const isLow = item.quantity <= item.minQuantity
                const isOut = item.quantity === 0
                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                        📦
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                        <p className="text-xs text-gray-500">{item.category}</p>
                        {item.location && <p className="text-xs text-gray-400">{isRtl ? 'الموقع: ' : 'Location: '}{item.location}</p>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mb-3">
                      <div>
                        <span className="text-lg font-bold text-gray-900">{item.quantity}</span>
                        <span className="text-xs text-gray-400 ml-1">{item.unit}</span>
                      </div>
                      {isOut ? (
                        <span className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-medium">
                          {isRtl ? 'نفد المخزون' : 'Out of stock'}
                        </span>
                      ) : isLow ? (
                        <span className="text-xs bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full font-medium">
                          {isRtl ? 'مخزون منخفض' : 'Low stock'}
                        </span>
                      ) : (
                        <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
                          {isRtl ? 'متاح' : 'Available'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => { setRequestModal(item); setReqQty('1'); setReqReason('') }}
                      disabled={isOut}
                      className="w-full text-sm py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

      {myTab === 'my-requests' && (
        <div className="space-y-3">
          {reqLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" /><div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))
          ) : (myRequests as any[]).length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <History size={48} className="mx-auto mb-3 opacity-20" />
              <p>You haven&apos;t made any store requests yet.</p>
            </div>
          ) : (
            (myRequests as any[]).map((req: any) => (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">📦</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{req.item?.name}</p>
                  <p className="text-xs text-gray-500">{req.quantity} {req.item?.unit} · {new Date(req.createdAt).toLocaleDateString()}</p>
                  {req.reason && <p className="text-xs text-gray-400 italic mt-0.5">"{req.reason}"</p>}
                  {req.notes && <p className="text-xs text-blue-600 mt-0.5">Store note: {req.notes}</p>}
                  {req.status === 'COLLECTED' && req.collectedAt && (
                    <p className="text-xs text-green-600 mt-0.5">✓ Collected on {new Date(req.collectedAt).toLocaleDateString()}</p>
                  )}
                  {req.status === 'APPROVED' && (
                    <p className="text-xs text-blue-600 mt-0.5">✓ Approved — go to store to collect your items</p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${REQUEST_STATUS_STYLE[req.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {req.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Request Modal */}
      {requestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold">Request Item</h2>
              <p className="text-sm text-gray-500 mt-1">{requestModal.name} (Available: {requestModal.quantity} {requestModal.unit})</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
                <input
                  type="number" min="1" max={requestModal.quantity}
                  value={reqQty} onChange={(e) => setReqQty(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reason <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea
                  rows={2} value={reqReason} onChange={(e) => setReqReason(e.target.value)}
                  placeholder="Why do you need this item?"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <button onClick={() => setRequestModal(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => createRequest.mutate({ itemId: requestModal.id, quantity: parseInt(reqQty) || 1, reason: reqReason || undefined })}
                disabled={createRequest.isPending}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {createRequest.isPending ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Admin View (manage inventory + requests) ─────────────────────────────────

function StoreAdminView() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [tab, setTab] = useState<AdminTab>('inventory')
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showAdjust, setShowAdjust] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({ name: '', category: 'General', unit: 'pcs', quantity: '0', minQuantity: '5', location: '' })
  const [adjustData, setAdjustData] = useState({ type: 'IN', quantity: '1', reason: '' })
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const queryClient = useQueryClient()

  // ── Incoming Requisitions ──
  const [arrivalModal, setArrivalModal] = useState<any>(null)
  const [invoices, setInvoices] = useState<string[]>([''])

  const { data: stats } = useQuery({
    queryKey: ['store-stats'],
    queryFn: () => apiClient.get('/store/stats').then((r) => r.data?.data ?? r.data ?? []),
  })

  const { data: items, isLoading } = useQuery({
    queryKey: ['store-items', search, lowStockOnly],
    queryFn: () =>
      apiClient.get(`/store/items?${new URLSearchParams({
        ...(search ? { search } : {}),
        ...(lowStockOnly ? { lowStock: 'true' } : {}),
      })}`).then((r) => r.data?.data ?? r.data ?? []),
    enabled: tab === 'inventory',
  })

  const { data: movements, isLoading: movementsLoading } = useQuery({
    queryKey: ['store-movements'],
    queryFn: () => apiClient.get('/store/movements').then((r) => r.data?.data ?? r.data ?? []),
    enabled: tab === 'movements',
  })

  const { data: allRequests = [], isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ['store-all-requests'],
    queryFn: () => apiClient.get('/store/requests').then((r) => r.data?.data ?? r.data ?? []),
    enabled: tab === 'requests',
  })

  const { data: employeeSummary = [], isLoading: empLoading } = useQuery<any[]>({
    queryKey: ['store-employee-summary'],
    queryFn: () => apiClient.get('/store/requests/employees').then((r) => r.data?.data ?? r.data ?? []),
    enabled: tab === 'employees',
  })

  const { data: incomingReqs = [] } = useQuery<any[]>({
    queryKey: ['store-incoming-reqs'],
    queryFn: async () => {
      const res = await apiClient.get('/requisitions?limit=100')
      const p = res.data
      const all = Array.isArray(p) ? p : p?.data ?? []
      return all.filter((r: any) => r.status === 'PURCHASED' || r.status === 'APPROVED')
    },
  })

  const createItem = useMutation({
    mutationFn: (data: any) => apiClient.post('/store/items', data),
    onSuccess: () => {
      toast.success('Item added successfully')
      queryClient.invalidateQueries({ queryKey: ['store-items'] })
      queryClient.invalidateQueries({ queryKey: ['store-stats'] })
      queryClient.invalidateQueries({ queryKey: ['company-store-items'] })
      setShowAddItem(false)
      setNewItem({ name: '', category: 'General', unit: 'pcs', quantity: '0', minQuantity: '5', location: '' })
    },
    onError: (err: any) => toast.error(getApiError(err, 'Failed to add item')),
  })

  const adjustStock = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.post(`/store/items/${id}/adjust`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-items'] })
      queryClient.invalidateQueries({ queryKey: ['store-movements'] })
      queryClient.invalidateQueries({ queryKey: ['store-stats'] })
      setShowAdjust(null)
      setAdjustData({ type: 'IN', quantity: '1', reason: '' })
    },
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => apiClient.patch(`/store/requests/${id}/approve`, { notes }),
    onSuccess: () => { toast.success('Request approved — employee can collect'); queryClient.invalidateQueries({ queryKey: ['store-all-requests'] }) },
    onError: () => toast.error('Failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => apiClient.patch(`/store/requests/${id}/reject`, { notes }),
    onSuccess: () => {
      toast.success('Request rejected')
      queryClient.invalidateQueries({ queryKey: ['store-all-requests'] })
      setRejectModal(null); setRejectNotes('')
    },
    onError: () => toast.error('Failed'),
  })

  const collectMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/store/requests/${id}/collect`),
    onSuccess: () => { toast.success('Marked as collected — stock deducted'); queryClient.invalidateQueries({ queryKey: ['store-all-requests'] }); queryClient.invalidateQueries({ queryKey: ['store-stats'] }) },
    onError: () => toast.error('Failed'),
  })

  const markArrivedMutation = useMutation({
    mutationFn: ({ id, invoiceUrls }: { id: string; invoiceUrls: string[] }) =>
      apiClient.patch(`/owner/requisitions/${id}/items-arrived`, { invoiceUrls }),
    onSuccess: () => {
      toast.success('Items marked as arrived — finance will review and close')
      queryClient.invalidateQueries({ queryKey: ['store-incoming-reqs'] })
      setArrivalModal(null)
      setInvoices([''])
    },
    onError: () => toast.error('Failed to mark arrival'),
  })

  const pendingIncoming = incomingReqs.filter((r) => r.status === 'PURCHASED')
  const pendingRequests = allRequests.filter((r) => r.status === 'PENDING')
  const approvedRequests = allRequests.filter((r) => r.status === 'APPROVED')

  const TABS = [
    { key: 'inventory', label: isRtl ? 'المخزون' : 'Inventory' },
    { key: 'movements', label: isRtl ? 'حركات المخزون' : 'Movements' },
    { key: 'requests', label: isRtl ? 'طلبات الموظفين' : 'Employee Requests', badge: pendingRequests.length },
    { key: 'employees', label: isRtl ? 'سجل الموظفين' : 'Employee History', icon: <User size={14} /> },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'المخزن والمستودع' : 'Store & Inventory'}</h1>
        <p className="text-gray-500 text-sm mt-1">{isRtl ? 'إدارة المستلزمات والمعدات وحركات المخزون' : 'Track supplies, equipment, and stock movements'}</p>
      </div>

      {/* ── Incoming Requisitions Banner ── */}
      {pendingIncoming.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Truck size={18} className="text-amber-600" />
            <h2 className="font-bold text-amber-900">Items Purchased — Confirm Receipt ({pendingIncoming.length})</h2>
            <span className="text-xs text-amber-600">— RM purchased items, confirm what arrived</span>
          </div>
          <div className="space-y-2">
            {pendingIncoming.map((r: any) => (
              <div key={r.id} className="bg-white rounded-xl border border-amber-100 p-3 flex items-center gap-3">
                <Package size={16} className="text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{r.title}</p>
                  <p className="text-xs text-gray-500">{r.category} · {(r.pricedItems as any[])?.length ?? 0} items · Total: {(r.totalPriced ?? 0).toFixed(2)}</p>
                </div>
                <button
                  onClick={() => { setArrivalModal(r); setInvoices(['']) }}
                  className="flex items-center gap-1.5 bg-teal-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-teal-700 transition-colors whitespace-nowrap"
                >
                  <CheckCircle size={13} /> Confirm Receipt
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: isRtl ? 'إجمالي الأصناف' : 'Total Items', value: stats?.totalItems ?? '—', color: 'text-blue-600' },
          { label: isRtl ? 'مخزون منخفض' : 'Low Stock', value: stats?.lowStockItems ?? '—', color: 'text-yellow-600' },
          { label: isRtl ? 'نفد المخزون' : 'Out of Stock', value: stats?.outOfStock ?? '—', color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as AdminTab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}>
            {t.icon}
            {t.label}
            {t.badge && t.badge > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Inventory Tab ── */}
      {tab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRtl ? 'بحث...' : 'Search items...'}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64" />
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} className="rounded" />
              {isRtl ? 'مخزون منخفض فقط' : 'Low stock only'}
            </label>
            <div className="ml-auto">
              <button onClick={() => setShowAddItem(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
                + {isRtl ? 'إضافة صنف' : 'Add Item'}
              </button>
            </div>
          </div>

          {showAddItem && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">{isRtl ? 'صنف جديد' : 'New Inventory Item'}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'name', label: isRtl ? 'الاسم *' : 'Name *', placeholder: 'e.g. A4 Paper Ream' },
                  { key: 'category', label: isRtl ? 'الفئة' : 'Category', placeholder: 'General' },
                  { key: 'unit', label: isRtl ? 'الوحدة' : 'Unit', placeholder: 'pcs / boxes / kg' },
                  { key: 'quantity', label: isRtl ? 'الكمية الأولية' : 'Initial Qty', type: 'number' },
                  { key: 'minQuantity', label: isRtl ? 'الحد الأدنى' : 'Min Qty (alert)', type: 'number' },
                  { key: 'location', label: isRtl ? 'موقع التخزين' : 'Storage Location', placeholder: 'Room 101' },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input type={type ?? 'text'} value={(newItem as any)[key]}
                      onChange={(e) => setNewItem({ ...newItem, [key]: e.target.value })}
                      placeholder={placeholder} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => createItem.mutate({
                    ...newItem,
                    quantity: parseInt(newItem.quantity) || 0,
                    minQuantity: parseInt(newItem.minQuantity) || 5,
                  })}
                  disabled={createItem.isPending || !newItem.name}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                  {createItem.isPending ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ' : 'Save Item')}
                </button>
                <button onClick={() => setShowAddItem(false)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {showAdjust && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">{isRtl ? 'تعديل المخزون' : 'Adjust Stock'}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{isRtl ? 'النوع' : 'Type'}</label>
                  <select value={adjustData.type} onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="IN">{isRtl ? 'وارد' : 'Stock In'}</option>
                    <option value="OUT">{isRtl ? 'صادر' : 'Stock Out'}</option>
                    <option value="ADJUSTMENT">{isRtl ? 'تعديل' : 'Adjustment'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{isRtl ? 'الكمية' : 'Quantity'}</label>
                  <input type="number" min={0} value={adjustData.quantity}
                    onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{isRtl ? 'السبب' : 'Reason'}</label>
                  <input value={adjustData.reason} onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                    placeholder={isRtl ? 'اختياري' : 'Optional'} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => adjustStock.mutate({ id: showAdjust, data: { ...adjustData, quantity: parseInt(adjustData.quantity) } })}
                  disabled={adjustStock.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                  {adjustStock.isPending ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'تطبيق' : 'Apply')}
                </button>
                <button onClick={() => setShowAdjust(null)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="p-8 text-center text-gray-400">{isRtl ? 'جاري التحميل...' : 'Loading inventory...'}</div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {(Array.isArray(items) ? items : []).length === 0 && (
                <div className="p-8 text-center text-gray-400">{isRtl ? 'لا توجد أصناف' : 'No items found'}</div>
              )}
              {(Array.isArray(items) ? items : []).map((item: any) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category} · {item.unit} · {item.location ?? (isRtl ? 'لا يوجد موقع' : 'No location')}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${item.quantity <= item.minQuantity ? 'text-red-600' : 'text-gray-900'}`}>{item.quantity}</p>
                    <p className="text-xs text-gray-400">Min: {item.minQuantity}</p>
                  </div>
                  {item.quantity <= item.minQuantity && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">{isRtl ? 'منخفض' : 'Low Stock'}</span>
                  )}
                  <button onClick={() => setShowAdjust(item.id)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg">
                    {isRtl ? 'تعديل' : 'Adjust'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Movements Tab ── */}
      {tab === 'movements' && (
        <div className="bg-white rounded-xl border border-gray-200">
          {movementsLoading ? (
            <div className="p-8 text-center text-gray-400">{isRtl ? 'جاري التحميل...' : 'Loading...'}</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(Array.isArray(movements) ? movements : []).length === 0 && (
                <div className="p-8 text-center text-gray-400">{isRtl ? 'لا توجد حركات' : 'No movements yet'}</div>
              )}
              {(Array.isArray(movements) ? movements : []).map((m: any) => (
                <div key={m.id} className="p-4 flex items-center gap-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${movementTypeColor[m.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {m.type}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{m.item?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{m.reason ?? (isRtl ? 'لا يوجد سبب' : 'No reason')} · {new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="font-bold text-gray-700">
                    {m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : '='}{m.quantity} {m.item?.unit}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Employee Requests Tab ── */}
      {tab === 'requests' && (
        <div className="space-y-6">
          {requestsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />
            ))
          ) : (
            <>
              {/* Pending requests */}
              {pendingRequests.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-orange-500" />
                    Pending Requests
                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {pendingRequests.map((req: any) => (
                      <div key={req.id} className="bg-white rounded-2xl border border-orange-100 p-4 flex items-center gap-4">
                        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-base flex-shrink-0">📦</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">{req.item?.name}</p>
                          <p className="text-xs text-gray-500">
                            {req.requestedBy?.profile?.firstName} {req.requestedBy?.profile?.lastName} · {req.quantity} {req.item?.unit}
                          </p>
                          {req.reason && <p className="text-xs text-gray-400 italic mt-0.5">"{req.reason}"</p>}
                          <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveMutation.mutate({ id: req.id })}
                            disabled={approveMutation.isPending}
                            className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-xl hover:bg-green-700 disabled:opacity-50"
                          >
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button
                            onClick={() => { setRejectModal({ id: req.id }); setRejectNotes('') }}
                            className="flex items-center gap-1 text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approved — ready to collect */}
              {approvedRequests.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle size={16} className="text-blue-500" />
                    Approved — Employee Ready to Collect
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{approvedRequests.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {approvedRequests.map((req: any) => (
                      <div key={req.id} className="bg-white rounded-2xl border border-blue-100 p-4 flex items-center gap-4">
                        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-base flex-shrink-0">📦</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">{req.item?.name}</p>
                          <p className="text-xs text-gray-500">
                            {req.requestedBy?.profile?.firstName} {req.requestedBy?.profile?.lastName} · {req.quantity} {req.item?.unit}
                          </p>
                          <p className="text-xs text-blue-600 mt-0.5">Approved — waiting for employee to come and collect</p>
                        </div>
                        <button
                          onClick={() => collectMutation.mutate(req.id)}
                          disabled={collectMutation.isPending}
                          className="flex items-center gap-1 text-xs bg-teal-600 text-white px-3 py-1.5 rounded-xl hover:bg-teal-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          <CheckCircle size={12} /> Mark Collected
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All completed requests */}
              {allRequests.filter((r) => ['REJECTED', 'COLLECTED'].includes(r.status)).length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <History size={16} className="text-gray-400" />
                    Recent History
                  </h3>
                  <div className="space-y-2">
                    {allRequests.filter((r) => ['REJECTED', 'COLLECTED'].includes(r.status)).map((req: any) => (
                      <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700">{req.item?.name} · {req.quantity} {req.item?.unit}</p>
                          <p className="text-xs text-gray-400">{req.requestedBy?.profile?.firstName} {req.requestedBy?.profile?.lastName} · {new Date(req.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${REQUEST_STATUS_STYLE[req.status]}`}>
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
                  <p>No employee requests yet.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Employee History Tab ── */}
      {tab === 'employees' && (
        <div className="space-y-4">
          {empLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />
            ))
          ) : (employeeSummary as any[]).length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <User size={48} className="mx-auto mb-3 opacity-20" />
              <p>No employee request history yet.</p>
            </div>
          ) : (
            (employeeSummary as any[]).map((emp: any) => (
              <div key={emp.userId} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700 text-sm flex-shrink-0">
                    {emp.name?.[0] ?? '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{emp.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{emp.requests.length} requests</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {(emp.requests as any[]).map((req: any) => (
                    <div key={req.id} className="flex items-center gap-3 text-sm">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${REQUEST_STATUS_STYLE[req.status]}`}>
                        {req.status}
                      </span>
                      <span className="text-gray-700">{req.item?.name} × {req.quantity} {req.item?.unit}</span>
                      <span className="text-gray-400 text-xs ml-auto">{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Reject Modal ── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Reject Request</h2>
            <textarea rows={3} value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Reason for rejection (required)"
              className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-300 resize-none" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 rounded-xl border text-sm hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => rejectMutation.mutate({ id: rejectModal.id, notes: rejectNotes })}
                disabled={!rejectNotes || rejectMutation.isPending}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Items Arrived Modal ── */}
      {arrivalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold">Confirm Items Received</h2>
              <p className="text-sm text-gray-500 mt-1">{arrivalModal.title}</p>
            </div>
            <div className="p-6 space-y-4">
              {arrivalModal.pricedItems && arrivalModal.pricedItems.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                  {arrivalModal.pricedItems.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{it.name} × {it.qty} {it.unit}</span>
                      <span className="font-medium">{it.total?.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-1 flex justify-between text-sm font-bold">
                    <span>Total</span><span>{(arrivalModal.totalPriced ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice URLs</label>
                {invoices.map((url, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input type="url" value={url} onChange={(e) => setInvoices((p) => { const n = [...p]; n[i] = e.target.value; return n })}
                      placeholder="https://..." className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" />
                    {invoices.length > 1 && (
                      <button onClick={() => setInvoices((p) => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                    )}
                  </div>
                ))}
                <button onClick={() => setInvoices((p) => [...p, ''])} className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-800">
                  <Plus size={13} /> Add invoice
                </button>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <button onClick={() => { setArrivalModal(null); setInvoices(['']) }}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => markArrivedMutation.mutate({ id: arrivalModal.id, invoiceUrls: invoices.filter(Boolean) })}
                disabled={markArrivedMutation.isPending}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50"
              >
                {markArrivedMutation.isPending ? 'Saving…' : 'Confirm Received'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Root Export ──────────────────────────────────────────────────────────────

export default function StorePage() {
  const role = useAuthStore((s) => s.user?.role || '')
  return STORE_ADMIN_ROLES.has(role) ? <StoreAdminView /> : <StoreBrowseView />
}
