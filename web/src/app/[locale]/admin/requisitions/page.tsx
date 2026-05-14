'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useLocale } from 'next-intl'
import { Skeleton } from '@/components/ui'
import { Package, DollarSign, CheckCircle, Truck, Plus, Trash2, Upload, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Types ──────────────────────────────────────────────────────────────────────
interface ReqItem { name: string; qty: number; unit: string }
interface PricedItem extends ReqItem { pricePerUnit: number; total: number }

interface Requisition {
  id: string
  title: string
  description?: string
  category: string
  status: string
  items: ReqItem[]
  pricedItems?: PricedItem[]
  totalPriced?: number
  invoiceUrls?: string[]
  createdAt: string
  school?: { name: string }
  requester?: { firstName: string; lastName: string }
}

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  PENDING:           'bg-yellow-100 text-yellow-800',
  PRICED:            'bg-blue-100 text-blue-800',
  FINANCE_APPROVED:  'bg-purple-100 text-purple-800',
  APPROVED:          'bg-green-100 text-green-800',
  REJECTED:          'bg-red-100 text-red-800',
  MONEY_RELEASED:    'bg-amber-100 text-amber-800',
  MONEY_RECEIVED:    'bg-orange-100 text-orange-800',
  PURCHASED:         'bg-indigo-100 text-indigo-800',
  STORE_CONFIRMED:   'bg-teal-100 text-teal-800',
  STORE_ISSUE:       'bg-red-100 text-red-700',
  ITEMS_ARRIVED:     'bg-teal-100 text-teal-800',
  COMPLETED:         'bg-gray-100 text-gray-700',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING:           'Awaiting Pricing',
  PRICED:            'With Finance',
  FINANCE_APPROVED:  'Awaiting Owner Approval',
  APPROVED:          'Approved — Awaiting Finance to Release Money',
  REJECTED:          'Rejected',
  MONEY_RELEASED:    'Money Released — Confirm Receipt',
  MONEY_RECEIVED:    'Money Received — Buy Items & Upload Invoice',
  PURCHASED:         'Purchased — Awaiting Store Confirmation',
  STORE_CONFIRMED:   'Store Confirmed — Finance Closing',
  STORE_ISSUE:       'Store Issue — Awaiting Finance Review',
  ITEMS_ARRIVED:     'Items Arrived',
  COMPLETED:         '✓ Completed',
}

// ── Pricing Modal ──────────────────────────────────────────────────────────────
function PricingModal({ req, onClose }: { req: Requisition; onClose: () => void }) {
  const qc = useQueryClient()
  const [rows, setRows] = useState<PricedItem[]>(
    (req.items ?? []).map((it) => ({ ...it, pricePerUnit: 0, total: 0 }))
  )

  const update = (idx: number, field: keyof PricedItem, raw: string) => {
    setRows((prev) => {
      const next = [...prev]
      const val = parseFloat(raw) || 0
      next[idx] = { ...next[idx], [field]: val }
      if (field === 'pricePerUnit' || field === 'qty') {
        next[idx].total = next[idx].qty * next[idx].pricePerUnit
      }
      return next
    })
  }

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.patch(`/owner/requisitions/${req.id}/price`, { items: rows }),
    onSuccess: () => {
      toast.success('Prices submitted — sent to Finance for pre-approval')
      qc.invalidateQueries({ queryKey: ['rm-requisitions'] })
      onClose()
    },
    onError: () => toast.error('Failed to submit prices'),
  })

  const total = rows.reduce((s, r) => s + r.total, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold">Price Items — {req.title}</h2>
          <p className="text-sm text-gray-500 mt-1">{req.school?.name} · {req.category}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase px-1">
            <span className="col-span-4">Item</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-center">Unit</span>
            <span className="col-span-2 text-center">Price/Unit</span>
            <span className="col-span-2 text-right">Total</span>
          </div>
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl px-3 py-2">
              <span className="col-span-4 text-sm font-medium text-gray-800">{row.name}</span>
              <span className="col-span-2 text-center text-sm">{row.qty}</span>
              <span className="col-span-2 text-center text-sm text-gray-500">{row.unit}</span>
              <div className="col-span-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.pricePerUnit || ''}
                  onChange={(e) => update(i, 'pricePerUnit', e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1 text-center focus:ring-2 focus:ring-amber-400 outline-none"
                  placeholder="0.00"
                />
              </div>
              <span className="col-span-2 text-right text-sm font-semibold text-gray-700">
                {row.total.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="p-6 border-t flex items-center justify-between gap-3">
          <div className="text-sm font-bold text-gray-700">
            Grand Total: <span className="text-amber-600 text-lg">{total.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || rows.some((r) => r.pricePerUnit <= 0)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
            >
              {mutation.isPending ? 'Submitting…' : 'Submit to Finance'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Requisition Card ───────────────────────────────────────────────────────────
function ReqCard({
  req,
  onPrice,
  onPurchased,
}: {
  req: Requisition
  onPrice: (r: Requisition) => void
  onPurchased: (r: Requisition) => void
}) {
  const qc = useQueryClient()

  const confirmMoneyMutation = useMutation({
    mutationFn: () => apiClient.patch(`/owner/requisitions/${req.id}/confirm-money`),
    onSuccess: () => { toast.success('Money receipt confirmed'); qc.invalidateQueries({ queryKey: ['rm-requisitions'] }) },
    onError: () => toast.error('Failed'),
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{req.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {req.school?.name} · {req.category} · {new Date(req.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLOR[req.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABEL[req.status] ?? req.status}
        </span>
      </div>

      {/* Items */}
      <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1">
        {(req.items ?? []).slice(0, 3).map((it, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-gray-700">{it.name}</span>
            <span className="text-gray-500">{it.qty} {it.unit}</span>
          </div>
        ))}
        {(req.items ?? []).length > 3 && (
          <p className="text-xs text-gray-400">+{req.items.length - 3} more items</p>
        )}
      </div>

      {/* Priced total if available */}
      {req.totalPriced != null && (
        <div className="flex items-center gap-2 mb-3 text-sm text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
          <DollarSign size={14} />
          <span>Total: <strong>{req.totalPriced.toFixed(2)}</strong></span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-2">
        {req.status === 'PENDING' && (
          <button
            onClick={() => onPrice(req)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            <DollarSign size={15} /> Add Prices
          </button>
        )}
        {(req.status === 'PRICED' || req.status === 'FINANCE_APPROVED') && (
          <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium">
            <FileText size={15} /> {req.status === 'PRICED' ? 'With Finance…' : 'With Owner…'}
          </div>
        )}
        {req.status === 'APPROVED' && (
          <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-green-50 text-green-700 text-sm font-medium">
            <CheckCircle size={15} /> Approved — waiting for Finance to release money
          </div>
        )}
        {req.status === 'MONEY_RELEASED' && (
          <button
            onClick={() => confirmMoneyMutation.mutate()}
            disabled={confirmMoneyMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            <CheckCircle size={15} /> Confirm Money Received
          </button>
        )}
        {req.status === 'MONEY_RECEIVED' && (
          <button
            onClick={() => onPurchased(req)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Upload size={15} /> I Bought Items — Upload Invoice
          </button>
        )}
        {(req.status === 'PURCHASED' || req.status === 'STORE_CONFIRMED' || req.status === 'STORE_ISSUE') && (
          <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-medium">
            <Package size={15} /> {req.status === 'PURCHASED' ? 'Awaiting store…' : 'Store done — Finance closing'}
          </div>
        )}
        {(req.status === 'ITEMS_ARRIVED' || req.status === 'COMPLETED') && (
          <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-green-50 text-green-700 text-sm font-medium">
            <CheckCircle size={15} /> Done
          </div>
        )}
      </div>
    </div>
  )
}

// ── Purchased Modal ────────────────────────────────────────────────────────────
function PurchasedModal({ req, onClose }: { req: Requisition; onClose: () => void }) {
  const qc = useQueryClient()
  const [invoices, setInvoices] = useState<string[]>([''])

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.patch(`/owner/requisitions/${req.id}/purchased`, {
        invoiceUrls: invoices.filter(Boolean),
      }),
    onSuccess: () => {
      toast.success('Marked as purchased — store will confirm receipt')
      qc.invalidateQueries({ queryKey: ['rm-requisitions'] })
      onClose()
    },
    onError: () => toast.error('Failed'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold">Mark Items Purchased</h2>
          <p className="text-sm text-gray-500 mt-1">{req.title} · {req.school?.name}</p>
        </div>
        <div className="p-6 space-y-4">
          {req.pricedItems && req.pricedItems.length > 0 && (
            <div className="bg-indigo-50 rounded-xl p-3 space-y-1">
              <p className="text-xs font-semibold text-indigo-600 uppercase mb-2">Items to Purchase</p>
              {req.pricedItems.map((it, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{it.name} × {it.qty} {it.unit}</span>
                  <span className="font-medium">{it.total.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-indigo-200 pt-2 flex justify-between text-sm font-bold">
                <span>Total</span><span className="text-indigo-700">{(req.totalPriced ?? 0).toFixed(2)}</span>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice URLs <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="space-y-2">
              {invoices.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="url" value={url} onChange={(e) => setInvoices((p) => { const n = [...p]; n[i] = e.target.value; return n })}
                    placeholder="https://drive.google.com/..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                  {invoices.length > 1 && (
                    <button onClick={() => setInvoices((p) => p.filter((_, idx) => idx !== i))} className="p-2 text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setInvoices((p) => [...p, ''])} className="mt-2 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800">
              <Plus size={14} /> Add invoice URL
            </button>
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving…' : 'Confirm Purchased'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function RequisitionsManagerPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [pricingReq, setPricingReq] = useState<Requisition | null>(null)
  const [purchasedReq, setPurchasedReq] = useState<Requisition | null>(null)
  const [tab, setTab] = useState<'action' | 'all'>('action')

  const { data: reqs = [], isLoading } = useQuery<Requisition[]>({
    queryKey: ['rm-requisitions'],
    queryFn: async () => {
      const res = await apiClient.get('/requisitions?limit=200')
      const payload = res.data
      return Array.isArray(payload) ? payload : payload?.data ?? []
    },
  })

  const ACTION_STATUSES = new Set(['PENDING', 'MONEY_RELEASED', 'MONEY_RECEIVED'])
  const pending      = reqs.filter((r) => r.status === 'PENDING')
  const moneyOut     = reqs.filter((r) => r.status === 'MONEY_RELEASED')
  const buying       = reqs.filter((r) => r.status === 'MONEY_RECEIVED')
  const actionNeeded = reqs.filter((r) => ACTION_STATUSES.has(r.status))
  const displayed    = tab === 'action' ? actionNeeded : reqs

  return (
    <div className={`p-6 space-y-6 ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isRtl ? 'طلبات التوريد' : 'Requisitions'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isRtl ? 'تسعير الطلبات ومتابعة الشراء' : 'Price requests and confirm item arrivals'}
        </p>
      </div>

      {/* Stat pills */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
          <Package size={16} className="text-amber-600" />
          <span className="text-sm font-semibold text-amber-700">{pending.length} Awaiting Pricing</span>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
          <DollarSign size={16} className="text-orange-600" />
          <span className="text-sm font-semibold text-orange-700">{moneyOut.length} Confirm Money</span>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2">
          <Truck size={16} className="text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-700">{buying.length} Upload Invoice</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
          <CheckCircle size={16} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-600">{reqs.length} Total</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { key: 'action', label: `Action Required (${actionNeeded.length})` },
          { key: 'all',    label: 'All Requisitions' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package size={48} className="text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">
            {tab === 'action' ? 'No action needed right now' : 'No requisitions yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((r) => (
            <ReqCard
              key={r.id}
              req={r}
              onPrice={setPricingReq}
              onPurchased={setPurchasedReq}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {pricingReq && <PricingModal req={pricingReq} onClose={() => setPricingReq(null)} />}
      {purchasedReq && <PurchasedModal req={purchasedReq} onClose={() => setPurchasedReq(null)} />}
    </div>
  )
}
