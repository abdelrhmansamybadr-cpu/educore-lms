'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { Package, Check, X, Clock, Truck, RotateCcw, Search } from 'lucide-react'
import { apiClient, getApiError } from '@/lib/api'
import toast from 'react-hot-toast'

interface StoreItem { id: string; name: string; unit: string; quantity: number }
interface Request {
  id: string; itemName: string; quantity: number; reason?: string; status: string
  notes?: string; isLoan: boolean; loanDueDate?: string; collectedAt?: string; returnedAt?: string
  fulfillmentItems?: { itemId: string; itemName: string; quantity: number; unit: string }[]
  requestedBy: { id: string; email: string; profile?: { firstName?: string; lastName?: string; avatar?: string } }
  item?: { id: string; name: string; unit: string; quantity: number }
  approvedBy?: { profile?: { firstName?: string; lastName?: string } }
  createdAt: string
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
  READY: 'bg-purple-100 text-purple-700',
  COLLECTED: 'bg-emerald-100 text-emerald-700',
}

// ─── Fulfill Modal ────────────────────────────────────────────────────────────
function FulfillModal({ req, onClose, onDone, isRtl }: { req: Request; onClose: () => void; onDone: () => void; isRtl: boolean }) {
  const [items, setItems] = useState<StoreItem[]>([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<{ itemId: string; itemName: string; quantity: number; unit: string }[]>([])
  const [notes, setNotes] = useState('')
  const [isLoan, setIsLoan] = useState(false)
  const [loanDueDate, setLoanDueDate] = useState('')
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiClient.get('/store/items').then((d: any) => setItems(d.data?.data ?? d.data)).catch(() => {})
  }, [])

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i as any).sku?.toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = (item: StoreItem) => {
    if (cart.find(c => c.itemId === item.id)) return
    setCart(prev => [...prev, { itemId: item.id, itemName: item.name, quantity: 1, unit: (item as any).unit ?? 'pcs' }])
  }

  const updateQty = (itemId: string, qty: number) => setCart(prev => prev.map(c => c.itemId === itemId ? { ...c, quantity: qty } : c))
  const removeFromCart = (itemId: string) => setCart(prev => prev.filter(c => c.itemId !== itemId))

  const approve = async () => {
    setSaving(true)
    try {
      await apiClient.patch(`/store/requests/${req.id}/approve`, {
        notes, isLoan, loanDueDate: isLoan && loanDueDate ? loanDueDate : undefined,
        fulfillmentItems: cart.length ? cart : undefined,
      })
      toast.success(isRtl ? 'تمت الموافقة' : 'Request approved')
      onDone()
    } catch (e) { toast.error(getApiError(e)) }
    setSaving(false)
  }

  const reject = async () => {
    if (!rejectNote.trim()) { toast.error(isRtl ? 'يجب إدخال سبب الرفض' : 'Rejection reason required'); return }
    setSaving(true)
    try {
      await apiClient.patch(`/store/requests/${req.id}/reject`, { notes: rejectNote })
      toast.success(isRtl ? 'تم الرفض' : 'Request rejected')
      onDone()
    } catch (e) { toast.error(getApiError(e)) }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">{isRtl ? 'تنفيذ الطلب' : 'Fulfill Request'}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{req.itemName} × {req.quantity}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
        </div>

        {rejectMode ? (
          <div className="p-6 space-y-4 flex-1">
            <p className="text-sm font-medium text-gray-700">{isRtl ? 'سبب الرفض (إلزامي)' : 'Rejection reason (required)'}</p>
            <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
              rows={4} placeholder={isRtl ? 'اكتب السبب...' : 'Enter reason...'}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setRejectMode(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={reject} disabled={saving}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {isRtl ? 'رفض الطلب' : 'Reject Request'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              {/* Search inventory */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">{isRtl ? 'اختر أصناف التنفيذ' : 'Select fulfillment items'}</p>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={isRtl ? 'بحث في المخزون...' : 'Search inventory...'}
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                  {filtered.slice(0, 20).map(item => (
                    <button key={item.id} onClick={() => addToCart(item)}
                      disabled={cart.some(c => c.itemId === item.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-indigo-50 text-left disabled:opacity-40 disabled:cursor-not-allowed border-b border-gray-50 last:border-0">
                      <span className="text-sm font-medium text-gray-800">{item.name}</span>
                      <span className="text-xs text-gray-500">{item.quantity} {item.unit}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-4">{isRtl ? 'لا نتائج' : 'No results'}</p>}
                </div>
              </div>

              {/* Cart */}
              {cart.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">{isRtl ? 'سلة التنفيذ' : 'Fulfillment cart'}</p>
                  {cart.map(c => (
                    <div key={c.itemId} className="flex items-center gap-3 bg-indigo-50 rounded-xl px-3 py-2">
                      <span className="text-sm font-medium text-gray-800 flex-1">{c.itemName}</span>
                      <input type="number" min={1} value={c.quantity}
                        onChange={e => updateQty(c.itemId, Number(e.target.value))}
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center" />
                      <span className="text-xs text-gray-500">{c.unit}</span>
                      <button onClick={() => removeFromCart(c.itemId)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Options */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isLoan} onChange={e => setIsLoan(e.target.checked)} className="rounded" />
                  <span className="text-sm text-gray-700">{isRtl ? 'عارية (يُعاد)' : 'This is a loan (to be returned)'}</span>
                </label>
                {isLoan && (
                  <input type="date" value={loanDueDate} onChange={e => setLoanDueDate(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                )}
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  rows={2} placeholder={isRtl ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setRejectMode(true)}
                className="flex-1 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50">
                <X size={14} className="inline mr-1" />{isRtl ? 'رفض' : 'Reject'}
              </button>
              <button onClick={approve} disabled={saving}
                className="flex-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                <Check size={14} className="inline mr-1" />{isRtl ? 'موافقة' : 'Approve'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RequestsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [requests, setRequests] = useState<Request[]>([])
  const [tab, setTab] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'HISTORY'>('ALL')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [fulfilling, setFulfilling] = useState<Request | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await apiClient.get('/store/requests').then((x: any) => x.data?.data ?? x.data)
      setRequests(Array.isArray(d) ? d : [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = requests.filter(r => {
    const matchSearch = !search || r.itemName.toLowerCase().includes(search.toLowerCase()) ||
      `${r.requestedBy?.profile?.firstName} ${r.requestedBy?.profile?.lastName}`.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (tab === 'PENDING') return r.status === 'PENDING'
    if (tab === 'ACTIVE') return ['APPROVED', 'READY'].includes(r.status)
    if (tab === 'HISTORY') return ['COLLECTED', 'REJECTED'].includes(r.status)
    return true
  })

  const action = async (id: string, endpoint: string, label: string) => {
    try {
      await apiClient.patch(`/store/requests/${id}/${endpoint}`, {})
      toast.success(label)
      load()
    } catch (e) { toast.error(getApiError(e)) }
  }

  const counts = {
    PENDING: requests.filter(r => r.status === 'PENDING').length,
    APPROVED: requests.filter(r => r.status === 'APPROVED').length,
    COLLECTED: requests.filter(r => r.status === 'COLLECTED').length,
  }

  const TABS = [
    { id: 'ALL', label: isRtl ? 'الكل' : 'All', count: requests.length },
    { id: 'PENDING', label: isRtl ? 'معلق' : 'Pending', count: counts.PENDING },
    { id: 'ACTIVE', label: isRtl ? 'موافق عليه' : 'Approved/Ready', count: counts.APPROVED },
    { id: 'HISTORY', label: isRtl ? 'السجل' : 'History', count: counts.COLLECTED },
  ] as const

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {fulfilling && (
        <FulfillModal req={fulfilling} isRtl={isRtl} onClose={() => setFulfilling(null)} onDone={() => { setFulfilling(null); load() }} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'طلبات الموظفين' : 'Employee Requests'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRtl ? 'إدارة وتنفيذ طلبات المخزون' : 'Manage and fulfill inventory requests'}</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: isRtl ? 'معلق' : 'Pending', val: counts.PENDING, color: 'text-amber-600 bg-amber-50' },
          { label: isRtl ? 'موافق عليه' : 'Approved', val: counts.APPROVED, color: 'text-blue-600 bg-blue-50' },
          { label: isRtl ? 'مُسلّم' : 'Collected', val: counts.COLLECTED, color: 'text-emerald-600 bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color.split(' ')[1]} flex items-center gap-3`}>
            <span className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.val}</span>
            <span className="text-sm font-medium text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isRtl ? 'بحث...' : 'Search...'}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-900'}`}>
              {t.label} {t.count > 0 && <span className="ml-1 text-xs bg-indigo-100 text-indigo-700 rounded-full px-1.5">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading
        ? <div className="space-y-3 animate-pulse">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}</div>
        : filtered.length === 0
          ? <div className="text-center py-16 text-gray-400"><Package size={40} className="mx-auto mb-3 opacity-20" /><p>{isRtl ? 'لا توجد طلبات' : 'No requests'}</p></div>
          : (
            <div className="space-y-3">
              {filtered.map(req => (
                <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${STATUS_BADGE[req.status] ?? 'bg-gray-100 text-gray-700'}`}>{req.status}</span>
                        {req.isLoan && <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2.5 py-0.5">LOAN</span>}
                      </div>
                      <p className="font-semibold text-gray-900">{req.itemName} <span className="text-gray-400 font-normal">× {req.quantity}</span></p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {req.requestedBy?.profile?.firstName} {req.requestedBy?.profile?.lastName}
                        {' · '}{new Date(req.createdAt).toLocaleDateString()}
                      </p>
                      {req.reason && <p className="text-sm text-gray-400 mt-1">"{req.reason}"</p>}
                      {req.fulfillmentItems && req.fulfillmentItems.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {req.fulfillmentItems.map((fi, i) => (
                            <span key={i} className="text-xs bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5">
                              {fi.itemName} × {fi.quantity} {fi.unit}
                            </span>
                          ))}
                        </div>
                      )}
                      {req.notes && <p className="text-xs text-gray-400 mt-1 italic">{req.notes}</p>}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {req.status === 'PENDING' && (
                        <button onClick={() => setFulfilling(req)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
                          <Check size={13} /> {isRtl ? 'تنفيذ' : 'Fulfill'}
                        </button>
                      )}
                      {req.status === 'APPROVED' && (
                        <button onClick={() => action(req.id, 'ready', isRtl ? 'جاهز للاستلام' : 'Marked ready')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
                          <Clock size={13} /> {isRtl ? 'جاهز' : 'Mark Ready'}
                        </button>
                      )}
                      {req.status === 'READY' && (
                        <button onClick={() => action(req.id, 'collect', isRtl ? 'تم التسليم' : 'Marked collected')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors">
                          <Truck size={13} /> {isRtl ? 'تسليم' : 'Collect'}
                        </button>
                      )}
                      {req.status === 'COLLECTED' && req.isLoan && !req.returnedAt && (
                        <button onClick={() => action(req.id, 'return', isRtl ? 'تم الإرجاع' : 'Returned')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 transition-colors">
                          <RotateCcw size={13} /> {isRtl ? 'استرداد' : 'Return'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      }
    </div>
  )
}
