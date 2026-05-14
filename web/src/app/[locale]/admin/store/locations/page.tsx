'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { MapPin, Plus, Edit2, Trash2, X, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { apiClient, getApiError } from '@/lib/api'
import toast from 'react-hot-toast'

interface Location { id: string; name: string; _count: { items: number } }
interface Item { id: string; name: string; quantity: number; unit: string; sku?: string }

export default function LocationsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [locations, setLocations] = useState<Location[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [locItems, setLocItems] = useState<Record<string, Item[]>>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [formName, setFormName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/store/locations')
      const data = res.data?.data ?? res.data
      setLocations(Array.isArray(data) ? data : [])
    } catch (e) {
      toast.error(getApiError(e, 'Failed to load locations'))
      setLocations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = async (id: string) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!locItems[id]) {
      try {
        const res = await apiClient.get(`/store/items?locationId=${id}`)
        const items = res.data?.data ?? res.data
        setLocItems(p => ({ ...p, [id]: Array.isArray(items) ? items : [] }))
      } catch {
        setLocItems(p => ({ ...p, [id]: [] }))
      }
    }
  }

  const openCreate = () => { setEditing(null); setFormName(''); setShowForm(true) }
  const openEdit = (loc: Location) => { setEditing(loc); setFormName(loc.name); setShowForm(true) }

  const save = async () => {
    if (!formName.trim()) { toast.error(isRtl ? 'الاسم مطلوب' : 'Name is required'); return }
    setSaving(true)
    try {
      if (editing) {
        await apiClient.patch(`/store/locations/${editing.id}`, { name: formName.trim() })
        toast.success(isRtl ? 'تم تحديث الموقع' : 'Location updated')
      } else {
        await apiClient.post('/store/locations', { name: formName.trim() })
        toast.success(isRtl ? 'تم إنشاء الموقع' : 'Location created')
      }
      setShowForm(false)
      setEditing(null)
      setFormName('')
      // Clear expanded items cache so they reload fresh
      setLocItems({})
      await load()
    } catch (e) {
      toast.error(getApiError(e, 'Failed to save location'))
    } finally {
      setSaving(false)
    }
  }

  const del = async (id: string, name: string) => {
    if (!confirm(isRtl ? `حذف "${name}"؟ ستُنقل الأصناف لـ"بدون موقع"` : `Delete "${name}"? Items will be unlinked.`)) return
    setDeleting(id)
    try {
      await apiClient.delete(`/store/locations/${id}`)
      toast.success(isRtl ? 'تم الحذف' : 'Location deleted')
      setLocItems(p => { const n = { ...p }; delete n[id]; return n })
      if (expanded === id) setExpanded(null)
      await load()
    } catch (e) {
      toast.error(getApiError(e, 'Failed to delete'))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                {editing ? (isRtl ? 'تعديل الموقع' : 'Edit Location') : (isRtl ? 'إضافة موقع جديد' : 'Add New Location')}
              </h3>
              <button onClick={() => { setShowForm(false); setEditing(null) }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                {isRtl ? 'اسم الموقع *' : 'Location Name *'}
              </label>
              <input
                autoFocus
                value={formName}
                onChange={e => setFormName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !saving && save()}
                placeholder={isRtl ? 'مثال: المستودع الرئيسي' : 'e.g. Main Warehouse, Store A'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowForm(false); setEditing(null) }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={save}
                disabled={saving || !formName.trim()}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? (isRtl ? 'جار الحفظ...' : 'Saving...') : editing ? (isRtl ? 'حفظ' : 'Save') : (isRtl ? 'إضافة' : 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'مواقع التخزين' : 'Store Locations'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRtl ? `${locations.length} موقع` : `${locations.length} location${locations.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            title={isRtl ? 'تحديث' : 'Refresh'}
          >
            <RefreshCw size={15} className="text-gray-500" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> {isRtl ? 'إضافة موقع' : 'Add Location'}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-20">
          <MapPin size={52} className="mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400 font-medium">{isRtl ? 'لا توجد مواقع بعد' : 'No locations yet'}</p>
          <p className="text-sm text-gray-300 mt-1">{isRtl ? 'أضف موقعاً لتنظيم المخزون' : 'Add a location to organize your inventory'}</p>
          <button
            onClick={openCreate}
            className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            {isRtl ? 'إضافة أول موقع' : 'Add your first location'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map(loc => (
            <div key={loc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Location Header */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="p-2.5 bg-indigo-50 rounded-xl shrink-0">
                  <MapPin size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{loc.name}</p>
                  <p className="text-sm text-gray-400">
                    {loc._count?.items ?? 0} {isRtl ? 'صنف' : `item${(loc._count?.items ?? 0) !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(loc)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title={isRtl ? 'تعديل' : 'Edit'}
                  >
                    <Edit2 size={14} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => del(loc.id, loc.name)}
                    disabled={deleting === loc.id}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                    title={isRtl ? 'حذف' : 'Delete'}
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                  <button
                    onClick={() => toggle(loc.id)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title={isRtl ? 'عرض الأصناف' : 'View items'}
                  >
                    {expanded === loc.id
                      ? <ChevronUp size={14} className="text-gray-500" />
                      : <ChevronDown size={14} className="text-gray-500" />}
                  </button>
                </div>
              </div>

              {/* Expanded Items */}
              {expanded === loc.id && (
                <div className="border-t border-gray-50">
                  {!locItems[loc.id] ? (
                    <p className="text-sm text-gray-400 text-center py-4">{isRtl ? 'جار التحميل...' : 'Loading...'}</p>
                  ) : locItems[loc.id].length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-5">{isRtl ? 'لا توجد أصناف في هذا الموقع' : 'No items in this location'}</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {locItems[loc.id].map(item => (
                        <div key={item.id} className="flex items-center justify-between px-5 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{item.name}</p>
                            {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                          </div>
                          <span className={`text-sm font-semibold ${item.quantity === 0 ? 'text-red-500' : 'text-gray-700'}`}>
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
