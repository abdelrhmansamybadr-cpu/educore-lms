'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api'
import { ArrowLeft, Wrench, QrCode, Printer, Plus, X, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981', maintenance: '#F59E0B', retired: '#94A3B8', lost: '#EF4444'
}
const CONDITION_COLORS: Record<string, string> = {
  excellent: '#10B981', good: '#3B82F6', fair: '#F59E0B', poor: '#EF4444'
}
const TYPE_ICONS: Record<string, string> = {
  computer: '🖥️', tablet: '📱', projector: '📽️', printer: '🖨️',
  network_switch: '🔌', server: '🗄️', router: '📡', ups: '🔋', other: '📦'
}
const ASSET_STATUSES = ['active', 'maintenance', 'retired', 'lost']

function warrantyStatus(expiry?: string) {
  if (!expiry) return null
  const d = new Date(expiry); const now = new Date(); const soon = new Date()
  soon.setDate(soon.getDate() + 30)
  if (d < now) return 'expired'
  if (d < soon) return 'expiring'
  return 'valid'
}

// ─── Add Maintenance Dialog ───────────────────────────────────────────────────

function MaintenanceDialog({ assetId, onClose, onSaved }: { assetId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ description: '', cost: '', date: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.description) { toast.error('Description required'); return }
    setSaving(true)
    try {
      await apiClient.post(`/it/assets/${assetId}/maintenance`, {
        description: form.description,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        date: form.date,
      })
      toast.success('Maintenance record added')
      onSaved()
    } catch { toast.error('Failed') }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Add Maintenance Record</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
          <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What was done…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Cost (optional)</label>
          <input type="number" min={0} step={0.01} value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
            placeholder="0.00"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
            {saving ? 'Saving…' : 'Add Record'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const [asset, setAsset] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showMaintenance, setShowMaintenance] = useState(false)
  const [editingStatus, setEditingStatus] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get(`/it/assets/${params.id}`).then((r: any) => r.data?.data ?? r.data)
      setAsset(res)
    } catch {}
    setLoading(false)
  }, [params.id])

  useEffect(() => { load() }, [load])

  const updateStatus = async (status: string) => {
    try {
      await apiClient.patch(`/it/assets/${params.id}`, { status })
      toast.success('Status updated')
      setEditingStatus(false)
      await load()
    } catch { toast.error('Failed') }
  }

  const printQR = () => {
    const content = qrRef.current?.innerHTML
    if (!content) return
    const w = window.open('', '_blank')
    w?.document.write(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh">${content}<p style="text-align:center;font-family:sans-serif">${asset?.name} — ${asset?.serialNumber}</p></body></html>`)
    w?.print()
  }

  if (loading) return (
    <div className="p-6 animate-pulse space-y-4">
      <div className="h-8 bg-gray-100 rounded-xl w-64" />
      <div className="h-48 bg-gray-100 rounded-2xl" />
    </div>
  )
  if (!asset) return (
    <div className="p-6 text-center text-gray-400">
      Asset not found
      <a href="../assets" className="text-blue-600 text-sm mt-2 inline-block">← Back</a>
    </div>
  )

  const ws = warrantyStatus(asset.warrantyExpiry)

  return (
    <div className="p-6 space-y-6">
      <a href="../assets" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={15} /> Back to assets
      </a>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-3xl shrink-0">
            {TYPE_ICONS[asset.type] ?? '📦'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: STATUS_COLORS[asset.status] + '22', color: STATUS_COLORS[asset.status] }}>
                {asset.status}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: CONDITION_COLORS[asset.condition] + '22', color: CONDITION_COLORS[asset.condition] }}>
                {asset.condition}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{asset.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{asset.type.replace(/_/g, ' ')} · {asset.serialNumber}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditingStatus(v => !v)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Change Status
            </button>
            <a href={`../assets?edit=${asset.id}`}
              className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100">
              Edit
            </a>
          </div>
        </div>

        {editingStatus && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {ASSET_STATUSES.map(s => (
              <button key={s} onClick={() => updateStatus(s)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                style={{
                  background: asset.status === s ? STATUS_COLORS[s] + '22' : 'transparent',
                  borderColor: STATUS_COLORS[s],
                  color: STATUS_COLORS[s],
                }}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Info + Maintenance ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info grid */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-semibold text-gray-800 mb-4">Asset Details</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {[
                { label: 'School', value: asset.school?.name ?? '—' },
                { label: 'Room / Location', value: asset.room ?? '—' },
                { label: 'Serial Number', value: asset.serialNumber },
                { label: 'Type', value: asset.type.replace(/_/g, ' ') },
                { label: 'Purchase Date', value: asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '—' },
                { label: 'Notes', value: asset.notes ?? '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="font-medium text-gray-800">{value}</p>
                </div>
              ))}
              <div>
                <p className="text-xs text-gray-400">Warranty Expiry</p>
                <p className={`font-medium flex items-center gap-1 ${ws === 'expired' ? 'text-red-600' : ws === 'expiring' ? 'text-yellow-600' : 'text-green-600'}`}>
                  {ws !== 'valid' && <AlertTriangle size={13} />}
                  {asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : '—'}
                  {ws === 'expired' && ' (EXPIRED)'}
                  {ws === 'expiring' && ' (Expiring Soon)'}
                </p>
              </div>
            </div>
          </div>

          {/* Maintenance log */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-gray-800 flex items-center gap-2"><Wrench size={16} className="text-indigo-600" />Maintenance Log</p>
              <button onClick={() => setShowMaintenance(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-100">
                <Plus size={13} /> Add Record
              </button>
            </div>
            {(asset.maintenanceLogs ?? []).length === 0
              ? <p className="text-center text-gray-400 text-sm py-8">No maintenance records</p>
              : (
                <div className="space-y-3">
                  {asset.maintenanceLogs.map((m: any) => (
                    <div key={m.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{m.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{new Date(m.date).toLocaleDateString()}</span>
                          {m.cost != null && <span className="text-indigo-600 font-medium">Cost: ${m.cost.toFixed(2)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>

        {/* ── QR Code Panel ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-gray-800 flex items-center gap-2"><QrCode size={16} className="text-indigo-600" />QR Code</p>
              <button onClick={printQR}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-xl text-xs hover:bg-gray-50">
                <Printer size={13} /> Print
              </button>
            </div>
            <div ref={qrRef} className="flex justify-center p-4 bg-white border border-gray-100 rounded-xl">
              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/admin/it/assets/${asset.id}`}
                size={160}
                level="M"
                includeMargin
              />
            </div>
            <div className="mt-3 text-center">
              <p className="text-xs font-semibold text-gray-700">{asset.name}</p>
              <p className="text-xs text-gray-400 font-mono">{asset.serialNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {showMaintenance && (
        <MaintenanceDialog assetId={params.id} onClose={() => setShowMaintenance(false)} onSaved={() => { setShowMaintenance(false); load() }} />
      )}
    </div>
  )
}
