'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { Plus, Trash2, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiClient, getApiError } from '@/lib/api'

const STATUS_LABELS: Record<string, { en: string; ar: string; color: string }> = {
  PENDING:          { en: 'Awaiting Pricing',       ar: 'بانتظار التسعير',     color: 'bg-yellow-100 text-yellow-800' },
  PRICED:           { en: 'With Finance',            ar: 'مع المالية',           color: 'bg-blue-100 text-blue-800' },
  FINANCE_APPROVED: { en: 'With Owner',              ar: 'مع المدير',            color: 'bg-purple-100 text-purple-800' },
  APPROVED:         { en: 'Approved — Purchasing',   ar: 'معتمد — قيد الشراء',  color: 'bg-green-100 text-green-800' },
  REJECTED:         { en: 'Rejected',                ar: 'مرفوض',               color: 'bg-red-100 text-red-800' },
  ITEMS_ARRIVED:    { en: 'Items Arrived',           ar: 'وصلت البضاعة',        color: 'bg-teal-100 text-teal-800' },
  COMPLETED:        { en: '✓ In Store',              ar: '✓ في المخزن',          color: 'bg-gray-100 text-gray-800' },
}

const CATEGORIES = ['STATIONERY', 'CLEANING', 'CATERING', 'PRINTING', 'MAINTENANCE', 'IT_SUPPLIES', 'MEDICAL', 'SPORTS', 'EVENTS', 'OTHER'] as const
const URGENCIES  = ['NORMAL', 'HIGH', 'URGENT'] as const

const emptyItem = () => ({ name: '', qty: 1, unit: 'pcs' })

export default function MyPurchasesPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const qc = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'STATIONERY' as typeof CATEGORIES[number], urgency: 'NORMAL' as typeof URGENCIES[number] })
  const [items, setItems] = useState([emptyItem()])

  const { data: requisitions = [], isLoading } = useQuery({
    queryKey: ['my-requisitions'],
    queryFn: () => apiClient.get('/requisitions').then((r) => r.data?.data ?? r.data ?? []),
  })

  const submit = useMutation({
    mutationFn: (payload: any) => apiClient.post('/requisitions', payload),
    onSuccess: () => {
      toast.success(isRtl ? 'تم تقديم الطلب' : 'Request submitted')
      qc.invalidateQueries({ queryKey: ['my-requisitions'] })
      setShowForm(false)
      setForm({ title: '', category: 'STATIONERY', urgency: 'NORMAL' })
      setItems([emptyItem()])
    },
    onError: (err: any) => toast.error(getApiError(err, isRtl ? 'فشل تقديم الطلب' : 'Failed to submit')),
  })

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error(isRtl ? 'أدخل عنوان الطلب' : 'Enter a request title'); return }
    if (items.some((i) => !i.name.trim())) { toast.error(isRtl ? 'أدخل اسم كل صنف' : 'Enter a name for each item'); return }
    submit.mutate({ ...form, items })
  }

  const setItem = (idx: number, field: string, value: any) =>
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))

  return (
    <div className="p-6 max-w-4xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShoppingCart size={24} className="text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isRtl ? 'طلبات الشراء الخاصة بي' : 'My Purchase Requests'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isRtl ? 'تقديم طلبات الشراء ومتابعة حالتها' : 'Submit purchase requests and track their status'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          {isRtl ? 'طلب جديد' : 'New Request'}
        </button>
      </div>

      {/* New Request Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {isRtl ? 'تفاصيل الطلب' : 'Request Details'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRtl ? 'عنوان الطلب' : 'Request Title'}
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={isRtl ? 'مثال: مستلزمات مكتبية' : 'e.g. Office Supplies Q3'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Category + Urgency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRtl ? 'الفئة' : 'Category'}
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRtl ? 'الأولوية' : 'Urgency'}
                </label>
                <select
                  value={form.urgency}
                  onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {URGENCIES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {isRtl ? 'الأصناف المطلوبة' : 'Requested Items'}
                </label>
                <button
                  type="button"
                  onClick={() => setItems((prev) => [...prev, emptyItem()])}
                  className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> {isRtl ? 'إضافة صنف' : 'Add Item'}
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder={isRtl ? 'اسم الصنف' : 'Item name'}
                      value={item.name}
                      onChange={(e) => setItem(idx, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => setItem(idx, 'qty', parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder={isRtl ? 'الوحدة' : 'Unit'}
                      value={item.unit}
                      onChange={(e) => setItem(idx, 'unit', e.target.value)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submit.isPending}
                className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {submit.isPending ? (isRtl ? 'جارٍ الإرسال…' : 'Submitting…') : (isRtl ? 'إرسال الطلب' : 'Submit Request')}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setItems([emptyItem()]) }}
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requests List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            {isRtl ? 'طلباتي' : 'My Requests'}
          </h2>
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-6 py-4 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-48 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-32" />
              </div>
            ))}
          </div>
        ) : requisitions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              {isRtl ? 'لا توجد طلبات شراء بعد' : 'No purchase requests yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requisitions.map((req: any) => {
              const s = STATUS_LABELS[req.status] ?? { en: req.status, ar: req.status, color: 'bg-gray-100 text-gray-700' }
              return (
                <div key={req.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{req.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {req.category} · {req.urgency} · {req.items?.length ?? 0} {isRtl ? 'أصناف' : 'items'} · {new Date(req.createdAt).toLocaleDateString(locale)}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>
                    {isRtl ? s.ar : s.en}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
