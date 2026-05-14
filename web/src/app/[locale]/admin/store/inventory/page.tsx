'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { Plus, Search, AlertTriangle, X, Edit2, ArrowUpDown } from 'lucide-react'
import { apiClient, getApiError } from '@/lib/api'
import toast from 'react-hot-toast'

interface Location { id: string; name: string }
interface Item {
  id: string; name: string; nameAr?: string; sku?: string; category: string; unit: string
  quantity: number; minQuantity: number; location?: string; description?: string
  imageUrl?: string; locationId?: string
  storeLocation?: { id: string; name: string }
}

const CATEGORIES = ['General', 'Stationery', 'Electronics', 'Furniture', 'Cleaning', 'Sports', 'Medical', 'Kitchen', 'Safety', 'Other']

function ItemForm({ item, locations, isRtl, onClose, onSave }: {
  item?: Item; locations: Location[]; isRtl: boolean
  onClose: () => void; onSave: () => void
}) {
  const [form, setForm] = useState({
    name: item?.name ?? '', nameAr: item?.nameAr ?? '', sku: item?.sku ?? '',
    category: item?.category ?? 'General', unit: item?.unit ?? 'pcs',
    quantity: item?.quantity ?? 0, minQuantity: item?.minQuantity ?? 5,
    location: item?.location ?? '',
    locationId: item?.locationId ?? '',
    description: item?.description ?? '',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return }
    setSaving(true)
    try {
      if (item) await apiClient.patch(`/store/items/${item.id}`, form)
      else await apiClient.post('/store/items', form)
      toast.success(item ? 'Item updated' : 'Item created')
      onSave()
    } catch (e) { toast.error(getApiError(e)) }
    setSaving(false)
  }

  const f = (field: string, val: any) => setForm(p => ({ ...p, [field]: val }))

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{item ? (isRtl ? 'تعديل الصنف' : 'Edit Item') : (isRtl ? 'إضافة صنف' : 'Add Item')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'الاسم (إنجليزي) *' : 'Name (English) *'}</label>
              <input value={form.name} onChange={e => f('name', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'الاسم (عربي)' : 'Name (Arabic)'}</label>
              <input value={form.nameAr} onChange={e => f('nameAr', e.target.value)} dir="rtl"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">SKU</label>
              <input value={form.sku} onChange={e => f('sku', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'الفئة' : 'Category'}</label>
              <select value={form.category} onChange={e => f('category', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'الوحدة' : 'Unit'}</label>
              <input value={form.unit} onChange={e => f('unit', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'الكمية' : 'Quantity'}</label>
              <input type="number" value={form.quantity} onChange={e => f('quantity', Number(e.target.value))} min={0}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'حد التنبيه' : 'Min Qty'}</label>
              <input type="number" value={form.minQuantity} onChange={e => f('minQuantity', Number(e.target.value))} min={0}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'الموقع' : 'Location'}</label>
              <select value={form.locationId} onChange={e => f('locationId', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="">{isRtl ? 'بدون موقع' : 'No location'}</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'رف/صندوق' : 'Shelf/Bin'}</label>
              <input value={form.location} onChange={e => f('location', e.target.value)}
                placeholder="A-01-03"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'الوصف' : 'Description'}</label>
              <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">{isRtl ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? '...' : item ? (isRtl ? 'حفظ' : 'Save') : (isRtl ? 'إضافة' : 'Add')}
          </button>
        </div>
      </div>
    </div>
  )
}

function AdjustModal({ item, isRtl, onClose, onDone }: { item: Item; isRtl: boolean; onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN')
  const [qty, setQty] = useState(1)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await apiClient.post(`/store/items/${item.id}/adjust`, { type, quantity: qty, reason })
      toast.success(isRtl ? 'تم تعديل المخزون' : 'Stock adjusted')
      onDone()
    } catch (e) { toast.error(getApiError(e)) }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{isRtl ? 'تعديل المخزون' : 'Adjust Stock'}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-600">{item.name} — {isRtl ? 'الكمية الحالية' : 'Current'}: <span className="font-semibold">{item.quantity} {item.unit}</span></p>
        <div className="flex gap-2">
          {(['IN', 'OUT', 'ADJUSTMENT'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {t}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">{type === 'ADJUSTMENT' ? (isRtl ? 'الكمية الجديدة' : 'New total qty') : (isRtl ? 'الكمية' : 'Quantity')}</label>
          <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} min={1}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'السبب' : 'Reason'}</label>
          <input value={reason} onChange={e => setReason(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">{isRtl ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? '...' : isRtl ? 'تطبيق' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [items, setItems] = useState<Item[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [lowStock, setLowStock] = useState(false)
  const [editing, setEditing] = useState<Item | undefined>(undefined)
  const [showForm, setShowForm] = useState(false)
  const [adjusting, setAdjusting] = useState<Item | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (category) params.set('category', category)
      if (locationFilter) params.set('locationId', locationFilter)
      if (lowStock) params.set('lowStock', 'true')
      const [i, l] = await Promise.all([
        apiClient.get(`/store/items?${params}`).then((d: any) => d.data?.data ?? d.data),
        apiClient.get('/store/locations').then((d: any) => d.data?.data ?? d.data),
      ])
      setItems(Array.isArray(i) ? i : [])
      setLocations(Array.isArray(l) ? l : [])
    } catch {}
    setLoading(false)
  }, [search, category, locationFilter, lowStock])

  useEffect(() => { load() }, [load])

  const categories = [...new Set(items.map(i => i.category))]

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {(showForm || editing) && (
        <ItemForm
          item={editing}
          locations={locations}
          isRtl={isRtl}
          onClose={() => { setShowForm(false); setEditing(undefined) }}
          onSave={() => { setShowForm(false); setEditing(undefined); load() }}
        />
      )}
      {adjusting && (
        <AdjustModal item={adjusting} isRtl={isRtl} onClose={() => setAdjusting(null)} onDone={() => { setAdjusting(null); load() }} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'إدارة المخزون' : 'Inventory'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRtl ? `${items.length} صنف في المخزون` : `${items.length} items in inventory`}</p>
        </div>
        <button onClick={() => { setEditing(undefined); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={16} /> {isRtl ? 'إضافة صنف' : 'Add Item'}
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: isRtl ? 'إجمالي' : 'Total', val: items.length, color: 'bg-indigo-50 text-indigo-700' },
          { label: isRtl ? 'الفئات' : 'Categories', val: categories.length, color: 'bg-blue-50 text-blue-700' },
          { label: isRtl ? 'مخزون منخفض' : 'Low Stock', val: items.filter(i => i.quantity <= i.minQuantity && i.quantity > 0).length, color: 'bg-amber-50 text-amber-700' },
          { label: isRtl ? 'نفد' : 'Out of Stock', val: items.filter(i => i.quantity === 0).length, color: 'bg-red-50 text-red-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 ${s.color.split(' ')[0]} text-center`}>
            <p className={`text-xl font-bold ${s.color.split(' ')[1]}`}>{s.val}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isRtl ? 'بحث بالاسم أو الرمز...' : 'Search name or SKU...'}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="">{isRtl ? 'كل الفئات' : 'All categories'}</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="">{isRtl ? 'كل المواقع' : 'All locations'}</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
          <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)} className="rounded" />
          {isRtl ? 'مخزون منخفض فقط' : 'Low stock only'}
        </label>
      </div>

      {/* Grid */}
      {loading
        ? <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
            {[...Array(8)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl" />)}
          </div>
        : items.length === 0
          ? <div className="text-center py-16 text-gray-400"><ArrowUpDown size={40} className="mx-auto mb-3 opacity-20" /><p>{isRtl ? 'لا توجد أصناف' : 'No items'}</p></div>
          : <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map(item => {
                const isLow = item.quantity <= item.minQuantity
                const isOut = item.quantity === 0
                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</p>
                        {item.sku && <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>}
                      </div>
                      {isOut
                        ? <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">OUT</span>
                        : isLow
                          ? <AlertTriangle size={14} className="text-amber-500 mt-0.5" />
                          : null
                      }
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{isRtl ? 'الكمية' : 'Qty'}</span>
                        <span className={`font-semibold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                          {item.quantity} / {item.minQuantity} {item.unit}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, (item.quantity / Math.max(item.minQuantity * 3, 1)) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 space-y-0.5">
                      <div className="flex justify-between">
                        <span>{isRtl ? 'الفئة' : 'Category'}</span>
                        <span className="font-medium text-gray-600">{item.category}</span>
                      </div>
                      {item.storeLocation && (
                        <div className="flex justify-between">
                          <span>{isRtl ? 'الموقع' : 'Location'}</span>
                          <span className="font-medium text-gray-600">{item.storeLocation.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setAdjusting(item)}
                        className="flex-1 py-1.5 text-xs border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                        {isRtl ? 'تعديل' : 'Adjust'}
                      </button>
                      <button onClick={() => { setEditing(item); setShowForm(false) }}
                        className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Edit2 size={13} className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
      }
    </div>
  )
}
