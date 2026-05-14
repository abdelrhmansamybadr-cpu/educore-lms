'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { ClipboardCheck, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, MapPin, Tag, Box, Trash2, Plus } from 'lucide-react'
import { apiClient, getApiError } from '@/lib/api'
import toast from 'react-hot-toast'

interface ReqItem { name: string; qty: number; unit: string }

interface Requisition {
  id: string
  title: string
  description?: string
  category: string
  urgency: string
  status: string
  smStatus: string | null
  smNote?: string
  smReviewedAt?: string
  smReviewedBy?: { profile: { firstName: string; lastName: string } }
  storageLocationId?: string
  storageCategory?: string
  storageShelfBin?: string
  storageItemCreated: boolean
  items: ReqItem[] | string
  totalEstimated: number
  createdAt: string
  requestedBy: { profile: { firstName: string; lastName: string; avatar?: string } }
  school?: { name: string }
  storageLocation?: { id: string; name: string }
}

interface StoreLocation { id: string; name: string }

const URGENCY_BADGE: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

function parseItems(items: ReqItem[] | string): ReqItem[] {
  if (Array.isArray(items)) return items
  try { return JSON.parse(items) } catch { return [] }
}

function RequesterAvatar({ req }: { req: Requisition }) {
  const name = `${req.requestedBy.profile.firstName} ${req.requestedBy.profile.lastName}`
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
        {req.requestedBy.profile.firstName[0]}{req.requestedBy.profile.lastName[0]}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">{name}</p>
        {req.school && <p className="text-xs text-gray-400">{req.school.name}</p>}
      </div>
    </div>
  )
}

function ApproveModal({ req, locations, isRtl, onClose, onDone }: {
  req: Requisition; locations: StoreLocation[]; isRtl: boolean
  onClose: () => void; onDone: () => void
}) {
  const [smNote, setSmNote] = useState('')
  const [storageLocationId, setStorageLocationId] = useState(req.storageLocationId ?? '')
  const [storageCategory, setStorageCategory] = useState(req.storageCategory ?? req.category ?? '')
  const [storageShelfBin, setStorageShelfBin] = useState(req.storageShelfBin ?? '')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    try {
      await apiClient.patch(`/store/purchase-reviews/${req.id}/approve`, {
        smNote: smNote || undefined,
        storageLocationId: storageLocationId || undefined,
        storageCategory: storageCategory || undefined,
        storageShelfBin: storageShelfBin || undefined,
      })
      toast.success(isRtl ? 'تمت الموافقة وإحالته لمسؤول المستلزمات' : 'Approved — forwarded to Requisitions Manager')
      onDone()
    } catch (e) { toast.error(getApiError(e)) }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <h3 className="font-bold text-gray-900 text-lg">{isRtl ? 'الموافقة على الطلب' : 'Approve Requisition'}</h3>
        <p className="text-sm text-gray-500">
          {isRtl
            ? 'هذا الطلب سيُحال إلى مسؤول المستلزمات للمعالجة. يمكنك تحديد موقع التخزين الآن أو لاحقاً.'
            : 'This will be forwarded to the Requisitions Manager. You can set storage details now or later.'}
        </p>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'موقع التخزين المقترح' : 'Suggested Storage Location'}</label>
          <select value={storageLocationId} onChange={e => setStorageLocationId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
            <option value="">{isRtl ? '— اختر موقعاً —' : '— Choose location —'}</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'الفئة' : 'Category'}</label>
            <input value={storageCategory} onChange={e => setStorageCategory(e.target.value)}
              placeholder={isRtl ? 'مثال: مستلزمات مكتبية' : 'e.g. Office Supplies'}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'الرف / الصندوق' : 'Shelf / Bin'}</label>
            <input value={storageShelfBin} onChange={e => setStorageShelfBin(e.target.value)}
              placeholder="A-3 / Bin 12"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'ملاحظة (اختياري)' : 'Note (optional)'}</label>
          <textarea value={smNote} onChange={e => setSmNote(e.target.value)} rows={2}
            placeholder={isRtl ? 'أي تعليمات لمسؤول المستلزمات...' : 'Any instructions for the Req Manager...'}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? '...' : isRtl ? 'موافقة وإحالة' : 'Approve & Forward'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeclineModal({ req, isRtl, onClose, onDone }: {
  req: Requisition; isRtl: boolean; onClose: () => void; onDone: () => void
}) {
  const [smNote, setSmNote] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!smNote.trim()) { toast.error(isRtl ? 'أدخل سبب الرفض' : 'Reason required'); return }
    setSaving(true)
    try {
      await apiClient.patch(`/store/purchase-reviews/${req.id}/decline`, { smNote })
      toast.success(isRtl ? 'تم رفض الطلب' : 'Requisition declined')
      onDone()
    } catch (e) { toast.error(getApiError(e)) }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <h3 className="font-bold text-gray-900 text-lg">{isRtl ? 'رفض الطلب' : 'Decline Requisition'}</h3>
        <p className="text-sm text-gray-500">
          {isRtl
            ? 'إذا كان الصنف موجوداً في المخزون، أخبر الموظف بتقديم طلب مخزن بدلاً من ذلك.'
            : 'If the item is in stock, tell the employee to submit a Store Request instead.'}
        </p>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'سبب الرفض *' : 'Reason for declining *'}</label>
          <textarea value={smNote} onChange={e => setSmNote(e.target.value)} rows={3}
            placeholder={isRtl
              ? 'مثال: هذا الصنف متوفر في المخزون، يرجى تقديم طلب مخزن.'
              : 'e.g. This item is already in stock — please submit a Store Request.'}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none" />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50">
            {saving ? '...' : isRtl ? 'رفض' : 'Decline'}
          </button>
        </div>
      </div>
    </div>
  )
}

type AcceptLine = { name: string; unit: string; quantity: number; category: string }

function AcceptItemsModal({ req, locations, isRtl, onClose, onDone }: {
  req: Requisition; locations: StoreLocation[]; isRtl: boolean; onClose: () => void; onDone: () => void
}) {
  // Pre-fill from pricedItems if available, otherwise from original items
  const source = (() => {
    const priced = (req as any).pricedItems
    if (Array.isArray(priced) && priced.length > 0) {
      return priced.map((p: any) => ({
        name: p.name ?? '',
        unit: p.unit ?? 'pcs',
        quantity: Number(p.qty ?? p.quantity ?? 1),
        category: req.storageCategory ?? req.category ?? 'General',
      }))
    }
    const orig = parseItems(req.items)
    return orig.map(i => ({
      name: i.name,
      unit: i.unit,
      quantity: i.qty,
      category: req.storageCategory ?? req.category ?? 'General',
    }))
  })()

  const [lines, setLines] = useState<AcceptLine[]>(source.length > 0 ? source : [{ name: '', unit: 'pcs', quantity: 1, category: req.storageCategory ?? req.category ?? 'General' }])
  const [locationId, setLocationId] = useState(req.storageLocationId ?? '')
  const [shelfBin, setShelfBin] = useState(req.storageShelfBin ?? '')
  const [storeNotes, setStoreNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const updateLine = (idx: number, field: keyof AcceptLine, val: any) =>
    setLines(p => p.map((l, i) => i === idx ? { ...l, [field]: val } : l))

  const removeLine = (idx: number) => setLines(p => p.filter((_, i) => i !== idx))

  const addLine = () => setLines(p => [...p, { name: '', unit: 'pcs', quantity: 1, category: req.storageCategory ?? req.category ?? 'General' }])

  const submit = async () => {
    if (lines.some(l => !l.name.trim())) { toast.error(isRtl ? 'أدخل اسم كل صنف' : 'Enter a name for each item'); return }
    setSaving(true)
    try {
      await apiClient.post(`/store/purchase-reviews/${req.id}/accept-items`, {
        items: lines.map(l => ({ ...l, quantity: Number(l.quantity) })),
        locationId: locationId || undefined,
        shelfBin: shelfBin || undefined,
        storeNotes: storeNotes || undefined,
      })
      toast.success(isRtl ? 'تم قبول الأصناف وإضافتها للمخزون' : 'Items accepted and added to inventory')
      onDone()
    } catch (e) { toast.error(getApiError(e)) }
    setSaving(false)
  }

  const inp = 'border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 w-full'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">{isRtl ? 'قبول الأصناف في المخزون' : 'Accept Items into Inventory'}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {isRtl
              ? 'راجع كل صنف من الطلب وعدّل الكمية أو الاسم إذا لزم، ثم أضفها للمخزون.'
              : 'Review each item from the requisition, edit quantities or names if needed, then add to inventory.'}
          </p>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Items table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{isRtl ? 'الأصناف' : 'Items'}</p>
              <button onClick={addLine} className="flex items-center gap-1 text-xs text-emerald-600 hover:underline">
                <Plus size={12} /> {isRtl ? 'إضافة صنف' : 'Add item'}
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">{isRtl ? 'اسم الصنف' : 'Item Name'}</th>
                    <th className="px-3 py-2 text-left font-medium w-24">{isRtl ? 'الكمية' : 'Qty'}</th>
                    <th className="px-3 py-2 text-left font-medium w-24">{isRtl ? 'الوحدة' : 'Unit'}</th>
                    <th className="px-3 py-2 text-left font-medium w-32">{isRtl ? 'الفئة' : 'Category'}</th>
                    <th className="px-2 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-2 py-1.5">
                        <input value={line.name} onChange={e => updateLine(idx, 'name', e.target.value)}
                          placeholder={isRtl ? 'اسم الصنف' : 'Item name'}
                          className={inp} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" min={1} value={line.quantity} onChange={e => updateLine(idx, 'quantity', e.target.value)}
                          className={inp} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={line.unit} onChange={e => updateLine(idx, 'unit', e.target.value)}
                          className={inp} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={line.category} onChange={e => updateLine(idx, 'category', e.target.value)}
                          className={inp} />
                      </td>
                      <td className="px-2 py-1.5">
                        {lines.length > 1 && (
                          <button onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600 p-0.5">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shared storage fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'موقع التخزين' : 'Storage Location'}</label>
              <select value={locationId} onChange={e => setLocationId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200">
                <option value="">{isRtl ? '— بدون موقع —' : '— No location —'}</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'الرف / الصندوق' : 'Shelf / Bin'}</label>
              <input value={shelfBin} onChange={e => setShelfBin(e.target.value)}
                placeholder="A-3 / Bin 12"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'ملاحظات المخزن' : 'Store Notes'}</label>
            <textarea value={storeNotes} onChange={e => setStoreNotes(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 border-t border-gray-100 pt-4">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
            {saving ? '...' : isRtl ? `قبول ${lines.length} صنف في المخزون` : `Accept ${lines.length} item${lines.length !== 1 ? 's' : ''} into Inventory`}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReqCard({ req, locations, isRtl, onRefresh }: {
  req: Requisition; locations: StoreLocation[]; isRtl: boolean; onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showApprove, setShowApprove] = useState(false)
  const [showDecline, setShowDecline] = useState(false)
  const [showAccept, setShowAccept] = useState(false)

  const items = parseItems(req.items)
  const isPending = req.smStatus === null
  const isApproved = req.smStatus === 'SM_APPROVED'
  const isDeclined = req.smStatus === 'SM_DECLINED'
  const itemsArrived = req.status === 'ITEMS_ARRIVED' || req.status === 'PURCHASED'

  return (
    <>
      {showApprove && <ApproveModal req={req} locations={locations} isRtl={isRtl} onClose={() => setShowApprove(false)} onDone={() => { setShowApprove(false); onRefresh() }} />}
      {showDecline && <DeclineModal req={req} isRtl={isRtl} onClose={() => setShowDecline(false)} onDone={() => { setShowDecline(false); onRefresh() }} />}
      {showAccept && <AcceptItemsModal req={req} locations={locations} isRtl={isRtl} onClose={() => setShowAccept(false)} onDone={() => { setShowAccept(false); onRefresh() }} />}

      <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isPending ? 'border-amber-200' : isApproved ? 'border-indigo-100' : 'border-red-100'}`}>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* Status + urgency badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {isPending && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full px-2.5 py-0.5">
                    <Clock size={11} /> {isRtl ? 'بانتظار مراجعتك' : 'Awaiting SM Review'}
                  </span>
                )}
                {isApproved && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full px-2.5 py-0.5">
                    <CheckCircle size={11} /> {isRtl ? 'وافقت عليه' : 'SM Approved'}
                  </span>
                )}
                {isDeclined && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full px-2.5 py-0.5">
                    <XCircle size={11} /> {isRtl ? 'مرفوض' : 'SM Declined'}
                  </span>
                )}
                {req.storageItemCreated && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full px-2.5 py-0.5">
                    ✓ {isRtl ? 'تم إضافته للمخزون' : 'In Inventory'}
                  </span>
                )}
                <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${URGENCY_BADGE[req.urgency] ?? 'bg-gray-100 text-gray-600'}`}>
                  {req.urgency}
                </span>
                <span className="text-xs text-gray-400 rounded-full bg-gray-50 px-2 py-0.5">{req.category}</span>
              </div>

              <h3 className="font-semibold text-gray-900">{req.title}</h3>
              {req.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{req.description}</p>}

              <div className="flex flex-wrap gap-1.5 mt-2">
                {items.map((item, i) => (
                  <span key={i} className="text-xs bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5">
                    {item.name} × {item.qty} {item.unit}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-3">
                <RequesterAvatar req={req} />
                <span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                {req.totalEstimated > 0 && (
                  <span className="text-xs font-medium text-gray-600">{isRtl ? 'التقدير:' : 'Est:'} {req.totalEstimated.toLocaleString()}</span>
                )}
              </div>

              {/* SM note / storage plan summary */}
              {(req.smNote || req.storageLocation || req.storageCategory) && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs text-gray-600">
                  {req.smNote && (
                    <p><span className="font-medium">{isRtl ? 'ملاحظة:' : 'Note:'}</span> {req.smNote}</p>
                  )}
                  {req.storageLocation && (
                    <p className="flex items-center gap-1"><MapPin size={11} /> {req.storageLocation.name}</p>
                  )}
                  {req.storageCategory && (
                    <p className="flex items-center gap-1"><Tag size={11} /> {req.storageCategory}</p>
                  )}
                  {req.storageShelfBin && (
                    <p className="flex items-center gap-1"><Box size={11} /> {req.storageShelfBin}</p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 items-end shrink-0">
              {isPending && (
                <>
                  <button onClick={() => setShowApprove(true)}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 whitespace-nowrap">
                    {isRtl ? 'موافقة →' : 'Approve →'}
                  </button>
                  <button onClick={() => setShowDecline(true)}
                    className="px-3 py-1.5 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 whitespace-nowrap">
                    {isRtl ? 'رفض' : 'Decline'}
                  </button>
                </>
              )}
              {isApproved && itemsArrived && !req.storageItemCreated && (
                <button onClick={() => setShowAccept(true)}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 whitespace-nowrap">
                  {isRtl ? 'قبول الأصناف ✓' : 'Accept Items ✓'}
                </button>
              )}
              <button onClick={() => setExpanded(p => !p)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Expanded detail */}
          {expanded && (
            <div className="mt-4 pt-4 border-t border-gray-50 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{isRtl ? 'الحالة الكاملة' : 'Full Status'}</p>
                  <p className="font-medium text-gray-700">{req.status}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{isRtl ? 'تاريخ الإنشاء' : 'Created'}</p>
                  <p className="font-medium text-gray-700">{new Date(req.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {req.smReviewedAt && req.smReviewedBy && (
                <div className="text-xs text-gray-500">
                  {isRtl ? 'راجعه' : 'Reviewed by'} {req.smReviewedBy.profile.firstName} {req.smReviewedBy.profile.lastName} {isRtl ? 'في' : 'on'} {new Date(req.smReviewedAt).toLocaleDateString()}
                </div>
              )}
              {isApproved && !itemsArrived && !req.storageItemCreated && (
                <p className="text-xs text-indigo-600 bg-indigo-50 rounded-lg p-2">
                  {isRtl
                    ? 'بانتظار وصول الأصناف من مسؤول المستلزمات. سيظهر زر "قبول الأصناف" عند وصولها.'
                    : 'Waiting for items to arrive via Requisitions Manager. "Accept Items" will appear when status reaches PURCHASED or ITEMS_ARRIVED.'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function PurchaseReviewsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [pending, setPending] = useState<Requisition[]>([])
  const [reviewed, setReviewed] = useState<Requisition[]>([])
  const [locations, setLocations] = useState<StoreLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'approved' | 'declined'>('pending')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, r, l] = await Promise.all([
        apiClient.get('/store/purchase-reviews/pending').then((x: any) => x.data?.data ?? x.data),
        apiClient.get('/store/purchase-reviews/reviewed').then((x: any) => x.data?.data ?? x.data),
        apiClient.get('/store/locations').then((x: any) => x.data?.data ?? x.data),
      ])
      setPending(Array.isArray(p) ? p : [])
      setReviewed(Array.isArray(r) ? r : [])
      setLocations(Array.isArray(l) ? l : [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const approvedList = reviewed.filter(r => r.smStatus === 'SM_APPROVED')
  const declinedList = reviewed.filter(r => r.smStatus === 'SM_DECLINED')

  const listForTab = tab === 'pending' ? pending : tab === 'approved' ? approvedList : declinedList

  const TABS = [
    { key: 'pending' as const, label: isRtl ? 'بانتظار مراجعتي' : 'Awaiting Review', count: pending.length, color: 'text-amber-700 border-amber-500' },
    { key: 'approved' as const, label: isRtl ? 'وافقت عليها' : 'Approved', count: approvedList.length, color: 'text-indigo-700 border-indigo-500' },
    { key: 'declined' as const, label: isRtl ? 'مرفوضة' : 'Declined', count: declinedList.length, color: 'text-red-700 border-red-500' },
  ]

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'مراجعة طلبات الشراء' : 'Purchase Reviews'}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isRtl
            ? 'راجع طلبات الشراء من الموظفين — وافق لإحالتها أو ارفض إذا كان الصنف متوفراً في المخزون'
            : 'Review employee requisitions — approve to forward to Requisitions Manager or decline if item is in stock'}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-700">{pending.length}</p>
          <p className="text-sm text-gray-500 mt-0.5">{isRtl ? 'بانتظار مراجعتي' : 'Awaiting Review'}</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-indigo-700">{approvedList.length}</p>
          <p className="text-sm text-gray-500 mt-0.5">{isRtl ? 'تمت الموافقة' : 'Approved'}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-700">{declinedList.length}</p>
          <p className="text-sm text-gray-500 mt-0.5">{isRtl ? 'مرفوضة' : 'Declined'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? t.color : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 ${tab === t.key ? 'bg-current/10' : 'bg-gray-100 text-gray-500'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl" />)}
        </div>
      ) : listForTab.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardCheck size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400">
            {tab === 'pending'
              ? (isRtl ? 'لا توجد طلبات بانتظار مراجعتك' : 'No requisitions awaiting your review')
              : tab === 'approved'
              ? (isRtl ? 'لم توافق على أي طلبات بعد' : 'No approved requisitions yet')
              : (isRtl ? 'لم ترفض أي طلبات بعد' : 'No declined requisitions yet')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {listForTab.map(req => (
            <ReqCard key={req.id} req={req} locations={locations} isRtl={isRtl} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  )
}
