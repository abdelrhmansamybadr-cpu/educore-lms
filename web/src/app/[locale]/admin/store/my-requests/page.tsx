'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { ShoppingCart, Plus, X, Clock } from 'lucide-react'
import { apiClient, getApiError } from '@/lib/api'
import toast from 'react-hot-toast'

interface Request {
  id: string; itemName: string; quantity: number; reason?: string; status: string
  notes?: string; isLoan: boolean; loanDueDate?: string; collectedAt?: string; returnedAt?: string
  fulfillmentItems?: { itemName: string; quantity: number; unit: string }[]
  createdAt: string
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
  READY: 'bg-purple-100 text-purple-700',
  COLLECTED: 'bg-emerald-100 text-emerald-700',
}

export default function MyRequestsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ itemName: '', quantity: 1, reason: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await apiClient.get('/store/requests?mine=true').then((x: any) => x.data?.data ?? x.data)
      setRequests(Array.isArray(d) ? d : [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    if (!form.itemName.trim()) { toast.error(isRtl ? 'أدخل اسم الصنف' : 'Item name required'); return }
    setSubmitting(true)
    try {
      await apiClient.post('/store/requests', form)
      toast.success(isRtl ? 'تم إرسال الطلب' : 'Request submitted')
      setForm({ itemName: '', quantity: 1, reason: '' })
      setShowForm(false)
      load()
    } catch (e) { toast.error(getApiError(e)) }
    setSubmitting(false)
  }

  const STATUS_LABELS: Record<string, string> = {
    PENDING: isRtl ? 'معلق' : 'Pending',
    APPROVED: isRtl ? 'موافق عليه' : 'Approved',
    REJECTED: isRtl ? 'مرفوض' : 'Rejected',
    READY: isRtl ? 'جاهز للاستلام' : 'Ready for pickup',
    COLLECTED: isRtl ? 'تم الاستلام' : 'Collected',
  }

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* New Request Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{isRtl ? 'طلب صنف' : 'Request an Item'}</h3>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'اسم الصنف المطلوب *' : 'Item Name *'}</label>
              <input value={form.itemName} onChange={e => setForm(p => ({ ...p, itemName: e.target.value }))}
                placeholder={isRtl ? 'مثال: طباشير، كرسي، طابعة...' : 'e.g. Chalk, Chair, Printer...'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'الكمية' : 'Quantity'}</label>
              <input type="number" min={1} value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'السبب (اختياري)' : 'Reason (optional)'}</label>
              <textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                rows={3} placeholder={isRtl ? 'لماذا تحتاج هذا الصنف؟' : 'Why do you need this?'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={submit} disabled={submitting}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {submitting ? '...' : isRtl ? 'إرسال' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'طلباتي' : 'My Requests'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRtl ? 'اطلب أصنافاً من المخزن وتتبع طلباتك' : 'Request items from the store and track your requests'}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={16} /> {isRtl ? 'طلب جديد' : 'New Request'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: isRtl ? 'إجمالي الطلبات' : 'Total', val: requests.length, color: 'bg-indigo-50 text-indigo-700' },
          { label: isRtl ? 'معلق / موافق' : 'Pending/Approved', val: requests.filter(r => ['PENDING', 'APPROVED', 'READY'].includes(r.status)).length, color: 'bg-amber-50 text-amber-700' },
          { label: isRtl ? 'تم استلامه' : 'Collected', val: requests.filter(r => r.status === 'COLLECTED').length, color: 'bg-emerald-50 text-emerald-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color.split(' ')[0]}`}>
            <p className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.val}</p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {loading
        ? <div className="space-y-3 animate-pulse">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>
        : requests.length === 0
          ? (
            <div className="text-center py-16">
              <ShoppingCart size={48} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400">{isRtl ? 'لم تقم بأي طلبات بعد' : 'No requests yet'}</p>
              <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-indigo-600 hover:underline">
                {isRtl ? 'قدّم طلبك الأول' : 'Submit your first request'}
              </button>
            </div>
          )
          : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${STATUS_BADGE[req.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[req.status] ?? req.status}
                        </span>
                        {req.isLoan && <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2.5 py-0.5">LOAN</span>}
                        {req.status === 'READY' && (
                          <span className="text-xs text-purple-700 flex items-center gap-1">
                            <Clock size={11} /> {isRtl ? 'جاهز للاستلام!' : 'Ready for pickup!'}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">{req.itemName} <span className="text-gray-400 font-normal">× {req.quantity}</span></p>
                      <p className="text-sm text-gray-400 mt-0.5">{new Date(req.createdAt).toLocaleDateString()}</p>
                      {req.reason && <p className="text-sm text-gray-500 mt-1">"{req.reason}"</p>}
                      {req.status === 'REJECTED' && req.notes && (
                        <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                          <X size={14} className="text-red-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-red-600">{isRtl ? 'سبب الرفض' : 'Rejection Reason'}</p>
                            <p className="text-sm text-red-700 mt-0.5">{req.notes}</p>
                          </div>
                        </div>
                      )}
                      {req.status !== 'REJECTED' && req.notes && (
                        <p className="text-sm mt-1">
                          <span className="font-medium text-gray-600">{isRtl ? 'ملاحظة المخزن' : 'Store note'}: </span>
                          <span className="text-gray-500">{req.notes}</span>
                        </p>
                      )}
                      {req.fulfillmentItems && req.fulfillmentItems.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-xs text-gray-400">{isRtl ? 'ستستلم' : 'You will receive'}:</span>
                          {req.fulfillmentItems.map((fi, i) => (
                            <span key={i} className="text-xs bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5">
                              {fi.itemName} × {fi.quantity} {fi.unit}
                            </span>
                          ))}
                        </div>
                      )}
                      {req.collectedAt && (
                        <p className="text-xs text-emerald-600 mt-1">
                          ✓ {isRtl ? 'تم الاستلام في' : 'Collected on'} {new Date(req.collectedAt).toLocaleDateString()}
                        </p>
                      )}
                      {req.isLoan && req.loanDueDate && !req.returnedAt && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⏰ {isRtl ? 'يجب الإرجاع بتاريخ' : 'Due back by'} {new Date(req.loanDueDate).toLocaleDateString()}
                        </p>
                      )}
                      {req.returnedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          ↩ {isRtl ? 'تم الإرجاع في' : 'Returned on'} {new Date(req.returnedAt).toLocaleDateString()}
                        </p>
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
