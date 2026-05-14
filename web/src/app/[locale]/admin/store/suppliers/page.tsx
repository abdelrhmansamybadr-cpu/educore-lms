'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { Truck, Plus, X, Edit2, Trash2, Star, Phone, Mail, MapPin } from 'lucide-react'
import { apiClient, getApiError } from '@/lib/api'
import toast from 'react-hot-toast'

interface Supplier {
  id: string; name: string; email?: string; phone?: string; address?: string
  contactPerson?: string; notes?: string; rating: number
  _count: { purchaseOrders: number; items: number }
  purchaseOrders: { createdAt: string; status: string; totalCost: number }[]
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange?.(i)} className={onChange ? 'cursor-pointer' : 'cursor-default'}>
          <Star size={16} className={i <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
        </button>
      ))}
    </div>
  )
}

function SupplierForm({ supplier, isRtl, onClose, onSave }: { supplier?: Supplier; isRtl: boolean; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: supplier?.name ?? '',
    email: supplier?.email ?? '',
    phone: supplier?.phone ?? '',
    address: supplier?.address ?? '',
    contactPerson: supplier?.contactPerson ?? '',
    notes: supplier?.notes ?? '',
    rating: supplier?.rating ?? 0,
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return }
    setSaving(true)
    try {
      if (supplier) await apiClient.patch(`/store/suppliers/${supplier.id}`, form)
      else await apiClient.post('/store/suppliers', form)
      toast.success(supplier ? (isRtl ? 'تم التحديث' : 'Updated') : (isRtl ? 'تم الإنشاء' : 'Created'))
      onSave()
    } catch (e) { toast.error(getApiError(e)) }
    setSaving(false)
  }

  const f = (field: string, val: any) => setForm(p => ({ ...p, [field]: val }))

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{supplier ? (isRtl ? 'تعديل المورد' : 'Edit Supplier') : (isRtl ? 'إضافة مورد' : 'Add Supplier')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'اسم المورد *' : 'Supplier Name *'}</label>
            <input value={form.name} onChange={e => f('name', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'جهة الاتصال' : 'Contact Person'}</label>
            <input value={form.contactPerson} onChange={e => f('contactPerson', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'البريد الإلكتروني' : 'Email'}</label>
              <input type="email" value={form.email} onChange={e => f('email', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'الهاتف' : 'Phone'}</label>
              <input type="tel" value={form.phone} onChange={e => f('phone', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'العنوان' : 'Address'}</label>
            <input value={form.address} onChange={e => f('address', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'التقييم' : 'Rating'}</label>
            <StarRating value={form.rating} onChange={v => f('rating', v)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'ملاحظات' : 'Notes'}</label>
            <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">{isRtl ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? '...' : isRtl ? 'حفظ' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SuppliersPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supplier | undefined>(undefined)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await apiClient.get('/store/suppliers').then((x: any) => x.data?.data ?? x.data)
      setSuppliers(Array.isArray(d) ? d : [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const del = async (id: string) => {
    if (!confirm(isRtl ? 'حذف المورد؟' : 'Delete supplier?')) return
    try {
      await apiClient.delete(`/store/suppliers/${id}`)
      toast.success(isRtl ? 'تم الحذف' : 'Deleted')
      load()
    } catch (e) { toast.error(getApiError(e)) }
  }

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {(showForm || editing) && (
        <SupplierForm supplier={editing} isRtl={isRtl}
          onClose={() => { setShowForm(false); setEditing(undefined) }}
          onSave={() => { setShowForm(false); setEditing(undefined); load() }} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الموردون' : 'Suppliers'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRtl ? 'إدارة موردي المواد والمستلزمات' : 'Manage your suppliers and vendors'}</p>
        </div>
        <button onClick={() => { setEditing(undefined); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={16} /> {isRtl ? 'إضافة مورد' : 'Add Supplier'}
        </button>
      </div>

      {loading
        ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl" />)}
          </div>
        : suppliers.length === 0
          ? (
            <div className="text-center py-16">
              <Truck size={48} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400">{isRtl ? 'لا يوجد موردون' : 'No suppliers yet'}</p>
              <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-indigo-600 hover:underline">
                {isRtl ? 'إضافة أول مورد' : 'Add your first supplier'}
              </button>
            </div>
          )
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map(s => (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{s.name}</h3>
                      {s.contactPerson && <p className="text-sm text-gray-500 mt-0.5">{s.contactPerson}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditing(s)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 size={13} className="text-gray-400" /></button>
                      <button onClick={() => del(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={13} className="text-red-400" /></button>
                    </div>
                  </div>
                  <StarRating value={s.rating} />
                  <div className="space-y-1.5 text-sm text-gray-500">
                    {s.email && <div className="flex items-center gap-2"><Mail size={12} className="shrink-0" /><span className="truncate">{s.email}</span></div>}
                    {s.phone && <div className="flex items-center gap-2"><Phone size={12} className="shrink-0" /><span>{s.phone}</span></div>}
                    {s.address && <div className="flex items-center gap-2"><MapPin size={12} className="shrink-0" /><span className="truncate">{s.address}</span></div>}
                  </div>
                  {s.notes && <p className="text-xs text-gray-400 italic line-clamp-2">"{s.notes}"</p>}
                  <div className="flex items-center gap-3 pt-1 border-t border-gray-50 text-xs text-gray-500">
                    <span className="bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5 font-medium">
                      {s._count.purchaseOrders} {isRtl ? 'أوامر' : 'POs'}
                    </span>
                    <span className="bg-gray-50 text-gray-600 rounded-full px-2 py-0.5 font-medium">
                      {s._count.items} {isRtl ? 'أصناف' : 'items'}
                    </span>
                    {s.purchaseOrders?.[0] && (
                      <span className="text-gray-400">
                        {isRtl ? 'آخر طلب' : 'Last'}: {new Date(s.purchaseOrders[0].createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
      }
    </div>
  )
}
