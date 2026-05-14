'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { ClipboardList, Plus, X, Check, Package } from 'lucide-react'
import { apiClient, getApiError } from '@/lib/api'
import toast from 'react-hot-toast'

type POStatus = 'DRAFT' | 'SENT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED'

interface POItem { id: string; itemId?: string; itemName: string; unit: string; quantity: number; unitCost: number; receivedQty: number; item?: { name: string } }
interface PO {
  id: string; status: POStatus; totalCost: number; notes?: string
  expectedDelivery?: string; receivedAt?: string; createdAt: string
  supplier?: { id: string; name: string }
  createdBy: { profile?: { firstName?: string; lastName?: string } }
  items: POItem[]
}
interface Supplier { id: string; name: string }
interface StoreItem { id: string; name: string; unit: string; unitCost?: number }

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-blue-100 text-blue-700',
  ORDERED: 'bg-indigo-100 text-indigo-700',
  PARTIALLY_RECEIVED: 'bg-amber-100 text-amber-700',
  RECEIVED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

// ─── Create PO Drawer ─────────────────────────────────────────────────────────
function CreatePODrawer({ suppliers, inventoryItems, isRtl, onClose, onSave }: {
  suppliers: Supplier[]; inventoryItems: StoreItem[]; isRtl: boolean; onClose: () => void; onSave: () => void
}) {
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [lines, setLines] = useState([{ itemId: '', itemName: '', unit: 'pcs', quantity: 1, unitCost: 0 }])
  const [saving, setSaving] = useState(false)

  const updateLine = (i: number, field: string, val: any) => {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l))
  }
  const pickItem = (i: number, itemId: string) => {
    const found = inventoryItems.find(x => x.id === itemId)
    if (found) updateLine(i, 'itemId', found.id)
    if (found) updateLine(i, 'itemName', found.name)
    if (found) updateLine(i, 'unit', found.unit)
    if (found && found.unitCost) updateLine(i, 'unitCost', found.unitCost)
  }

  const addLine = () => setLines(prev => [...prev, { itemId: '', itemName: '', unit: 'pcs', quantity: 1, unitCost: 0 }])
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i))

  const total = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0)

  const save = async () => {
    const validLines = lines.filter(l => l.itemName.trim())
    if (!validLines.length) { toast.error('Add at least one item'); return }
    setSaving(true)
    try {
      await apiClient.post('/store/purchase-orders', {
        supplierId: supplierId || undefined,
        notes, expectedDelivery: expectedDelivery || undefined,
        items: validLines,
      })
      toast.success(isRtl ? 'تم إنشاء أمر الشراء' : 'Purchase order created')
      onSave()
    } catch (e) { toast.error(getApiError(e)) }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{isRtl ? 'إنشاء أمر شراء' : 'New Purchase Order'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'المورد' : 'Supplier'}</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="">{isRtl ? 'بدون مورد' : 'No supplier'}</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'التسليم المتوقع' : 'Expected Delivery'}</label>
              <input type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">{isRtl ? 'ملاحظات' : 'Notes'}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">{isRtl ? 'الأصناف' : 'Line Items'}</p>
              <button onClick={addLine} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                <Plus size={12} /> {isRtl ? 'إضافة' : 'Add line'}
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="flex gap-2">
                    <select value={line.itemId} onChange={e => pickItem(i, e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                      <option value="">{isRtl ? 'اختر صنف...' : 'Pick from inventory...'}</option>
                      {inventoryItems.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                    </select>
                    {lines.length > 1 && (
                      <button onClick={() => removeLine(i)} className="p-1.5 hover:bg-red-50 rounded-lg"><X size={13} className="text-red-400" /></button>
                    )}
                  </div>
                  <input value={line.itemName} onChange={e => updateLine(i, 'itemName', e.target.value)}
                    placeholder={isRtl ? 'أو اكتب اسم الصنف يدوياً' : 'Or type item name manually'}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">{isRtl ? 'الكمية' : 'Qty'}</label>
                      <input type="number" min={1} value={line.quantity} onChange={e => updateLine(i, 'quantity', Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">{isRtl ? 'الوحدة' : 'Unit'}</label>
                      <input value={line.unit} onChange={e => updateLine(i, 'unit', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">{isRtl ? 'سعر الوحدة' : 'Unit Cost'}</label>
                      <input type="number" min={0} value={line.unitCost} onChange={e => updateLine(i, 'unitCost', Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none" />
                    </div>
                  </div>
                  <p className="text-xs text-indigo-600 text-right font-medium">
                    {isRtl ? 'المجموع' : 'Subtotal'}: ${(line.quantity * line.unitCost).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 border-t border-gray-50 pt-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-gray-900">{isRtl ? 'الإجمالي' : 'Total'}</span>
            <span className="text-xl font-bold text-indigo-700">${total.toFixed(2)}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {saving ? '...' : isRtl ? 'إنشاء الأمر' : 'Create Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Receive Modal ────────────────────────────────────────────────────────────
function ReceiveModal({ po, isRtl, onClose, onDone }: { po: PO; isRtl: boolean; onClose: () => void; onDone: () => void }) {
  const [received, setReceived] = useState<Record<string, number>>(
    Object.fromEntries(po.items.map(i => [i.id, i.quantity - i.receivedQty]))
  )
  const [saving, setSaving] = useState(false)

  const confirm = async () => {
    setSaving(true)
    try {
      const receivedItems = po.items
        .filter(i => (received[i.id] ?? 0) > 0)
        .map(i => ({ itemId: i.itemId ?? '', poItemId: i.id, receivedQty: received[i.id] }))
      await apiClient.patch(`/store/purchase-orders/${po.id}/receive`, { receivedItems })
      toast.success(isRtl ? 'تم الاستلام' : 'Items received')
      onDone()
    } catch (e) { toast.error(getApiError(e)) }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{isRtl ? 'استلام البضاعة' : 'Receive Goods'}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-6 space-y-3">
          {po.items.map(item => (
            <div key={item.id} className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.itemName}</p>
                <p className="text-xs text-gray-400">{isRtl ? 'المتوقع' : 'Expected'}: {item.quantity} · {isRtl ? 'تم استلام' : 'Received'}: {item.receivedQty}</p>
              </div>
              <input type="number" min={0} max={item.quantity - item.receivedQty}
                value={received[item.id] ?? 0}
                onChange={e => setReceived(p => ({ ...p, [item.id]: Number(e.target.value) }))}
                className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              <span className="text-xs text-gray-400">{item.unit}</span>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">{isRtl ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={confirm} disabled={saving} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
            <Check size={14} className="inline mr-1" />{saving ? '...' : isRtl ? 'تأكيد الاستلام' : 'Confirm Receipt'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PurchaseOrdersPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [orders, setOrders] = useState<PO[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [inventoryItems, setInventoryItems] = useState<StoreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showCreate, setShowCreate] = useState(false)
  const [receiving, setReceiving] = useState<PO | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const [o, s, i] = await Promise.all([
        apiClient.get(`/store/purchase-orders${params}`).then((d: any) => d.data?.data ?? d.data),
        apiClient.get('/store/suppliers').then((d: any) => d.data?.data ?? d.data),
        apiClient.get('/store/items').then((d: any) => d.data?.data ?? d.data),
      ])
      setOrders(Array.isArray(o) ? o : [])
      setSuppliers(Array.isArray(s) ? s : [])
      setInventoryItems(Array.isArray(i) ? i : [])
    } catch {}
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const cancel = async (id: string) => {
    if (!confirm(isRtl ? 'إلغاء أمر الشراء؟' : 'Cancel this order?')) return
    try {
      await apiClient.patch(`/store/purchase-orders/${id}/cancel`, {})
      toast.success(isRtl ? 'تم الإلغاء' : 'Cancelled')
      load()
    } catch (e) { toast.error(getApiError(e)) }
  }

  const counts = {
    total: orders.length,
    pending: orders.filter(o => ['DRAFT', 'SENT', 'ORDERED'].includes(o.status)).length,
    received: orders.filter(o => o.status === 'RECEIVED').length,
  }
  const totalSpend = orders.filter(o => o.status === 'RECEIVED').reduce((s, o) => s + o.totalCost, 0)

  const STATUS_TABS: { id: string; label: string }[] = [
    { id: '', label: isRtl ? 'الكل' : 'All' },
    { id: 'DRAFT', label: isRtl ? 'مسودة' : 'Draft' },
    { id: 'ORDERED', label: isRtl ? 'مُرسل' : 'Ordered' },
    { id: 'RECEIVED', label: isRtl ? 'مُستلم' : 'Received' },
    { id: 'CANCELLED', label: isRtl ? 'ملغي' : 'Cancelled' },
  ]

  return (
    <div className="p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {showCreate && <CreatePODrawer suppliers={suppliers} inventoryItems={inventoryItems} isRtl={isRtl} onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); load() }} />}
      {receiving && <ReceiveModal po={receiving} isRtl={isRtl} onClose={() => setReceiving(null)} onDone={() => { setReceiving(null); load() }} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'أوامر الشراء' : 'Purchase Orders'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRtl ? 'إدارة طلبات الشراء من الموردين' : 'Manage procurement from suppliers'}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={16} /> {isRtl ? 'أمر شراء جديد' : 'New Purchase Order'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: isRtl ? 'إجمالي الأوامر' : 'Total Orders', val: counts.total, color: 'bg-indigo-50 text-indigo-700' },
          { label: isRtl ? 'قيد التنفيذ' : 'Pending', val: counts.pending, color: 'bg-amber-50 text-amber-700' },
          { label: isRtl ? 'مُستلم' : 'Received', val: counts.received, color: 'bg-emerald-50 text-emerald-700' },
          { label: isRtl ? 'الإنفاق الإجمالي' : 'Total Spend', val: `$${totalSpend.toFixed(0)}`, color: 'bg-purple-50 text-purple-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color.split(' ')[0]}`}>
            <p className={`text-xl font-bold ${s.color.split(' ')[1]}`}>{s.val}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {STATUS_TABS.map(t => (
          <button key={t.id} onClick={() => setStatusFilter(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === t.id ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading
        ? <div className="space-y-3 animate-pulse">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}</div>
        : orders.length === 0
          ? <div className="text-center py-16 text-gray-400"><ClipboardList size={40} className="mx-auto mb-3 opacity-20" /><p>{isRtl ? 'لا توجد أوامر' : 'No orders'}</p></div>
          : (
            <div className="space-y-3">
              {orders.map(po => (
                <div key={po.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-400">#{po.id.slice(-8).toUpperCase()}</span>
                        <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${STATUS_COLORS[po.status] ?? 'bg-gray-100 text-gray-600'}`}>{po.status}</span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {po.supplier?.name ?? (isRtl ? 'بدون مورد' : 'No supplier')}
                        {' · '}
                        <span className="text-indigo-600">${po.totalCost.toFixed(2)}</span>
                        <span className="text-gray-400 font-normal"> · {po.items.length} {isRtl ? 'أصناف' : 'items'}</span>
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {isRtl ? 'بواسطة' : 'By'} {po.createdBy?.profile?.firstName} {po.createdBy?.profile?.lastName}
                        {' · '}{new Date(po.createdAt).toLocaleDateString()}
                        {po.expectedDelivery && ` · ${isRtl ? 'التسليم' : 'Due'} ${new Date(po.expectedDelivery).toLocaleDateString()}`}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {po.items.map(item => (
                          <span key={item.id} className="text-xs bg-gray-50 text-gray-600 rounded-full px-2 py-0.5">
                            {item.itemName} × {item.quantity} {item.unit}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {['DRAFT', 'SENT', 'ORDERED', 'PARTIALLY_RECEIVED'].includes(po.status) && (
                        <button onClick={() => setReceiving(po)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors">
                          <Package size={12} /> {isRtl ? 'استلام' : 'Receive'}
                        </button>
                      )}
                      {!['RECEIVED', 'CANCELLED'].includes(po.status) && (
                        <button onClick={() => cancel(po.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors">
                          <X size={12} /> {isRtl ? 'إلغاء' : 'Cancel'}
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
