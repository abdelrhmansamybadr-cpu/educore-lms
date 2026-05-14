'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import { Package, Plus, Search, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────

const ASSET_TYPES = ['computer', 'tablet', 'projector', 'printer', 'network_switch', 'server', 'router', 'ups', 'other']
const ASSET_STATUSES = ['active', 'maintenance', 'retired', 'lost']
const ASSET_CONDITIONS = ['excellent', 'good', 'fair', 'poor']

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

function warrantyStatus(expiry?: string) {
  if (!expiry) return null
  const d = new Date(expiry)
  const now = new Date()
  const soon = new Date(); soon.setDate(soon.getDate() + 30)
  if (d < now) return 'expired'
  if (d < soon) return 'expiring'
  return 'valid'
}

// ─── Add/Edit Asset Dialog ────────────────────────────────────────────────────

function AssetDialog({ asset, onClose, onSaved }: { asset?: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: asset?.name ?? '',
    type: asset?.type ?? 'computer',
    serialNumber: asset?.serialNumber ?? '',
    room: asset?.room ?? '',
    purchaseDate: asset?.purchaseDate ? asset.purchaseDate.slice(0, 10) : '',
    warrantyExpiry: asset?.warrantyExpiry ? asset.warrantyExpiry.slice(0, 10) : '',
    status: asset?.status ?? 'active',
    condition: asset?.condition ?? 'good',
    notes: asset?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.name || !form.serialNumber) { toast.error('Name and serial number required'); return }
    setSaving(true)
    try {
      if (asset?.id) {
        await apiClient.patch(`/it/assets/${asset.id}`, form)
        toast.success('Asset updated')
      } else {
        await apiClient.post('/it/assets', form)
        toast.success('Asset created')
      }
      onSaved()
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to save asset')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{asset ? 'Edit Asset' : 'Add Asset'}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'name', label: 'Asset Name *', type: 'text', full: true },
            { key: 'serialNumber', label: 'Serial Number *', type: 'text' },
            { key: 'room', label: 'Room / Location', type: 'text' },
            { key: 'purchaseDate', label: 'Purchase Date', type: 'date' },
            { key: 'warrantyExpiry', label: 'Warranty Expiry', type: 'date' },
          ].map(f => (
            <div key={f.key} className={f.full ? 'col-span-2' : ''}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
              <input type={f.type} value={(form as any)[f.key]}
                onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
              {ASSET_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
              {ASSET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Condition</label>
            <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
              {ASSET_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Asset'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ItAssetsPage() {
  const [assets, setAssets] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editAsset, setEditAsset] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCondition, setFilterCondition] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType) params.set('type', filterType)
      if (filterStatus) params.set('status', filterStatus)
      if (filterCondition) params.set('condition', filterCondition)
      if (search) params.set('search', search)
      const [assetRes, statsRes] = await Promise.all([
        apiClient.get(`/it/assets?${params}`).then((r: any) => r.data?.data ?? r.data ?? []),
        apiClient.get('/it/assets/stats').then((r: any) => r.data?.data ?? r.data).catch(() => null),
      ])
      setAssets(Array.isArray(assetRes) ? assetRes : [])
      setStats(statsRes)
    } catch {}
    setLoading(false)
  }, [filterType, filterStatus, filterCondition, search])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package size={22} className="text-indigo-600" /> IT Assets
        </h1>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
          <Plus size={16} /> Add Asset
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-800', bg: 'bg-gray-50' },
            { label: 'Active', value: stats.active, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Maintenance', value: stats.maintenance, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Warranty Expiring', value: stats.warrantyExpiringSoon, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-2xl border border-gray-100 p-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search by name or serial…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
          <option value="">All Types</option>
          {ASSET_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
          <option value="">All Status</option>
          {ASSET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterCondition} onChange={e => setFilterCondition(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
          <option value="">All Conditions</option>
          {ASSET_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading
          ? <div className="animate-pulse p-4 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}</div>
          : assets.length === 0
            ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Package size={40} className="mb-3 opacity-40" />
                <p className="font-medium">No assets found</p>
                <p className="text-sm mt-1">Add your first asset to get started</p>
              </div>
            )
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Asset', 'Type', 'Serial #', 'School', 'Room', 'Status', 'Condition', 'Warranty'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {assets.map(a => {
                      const ws = warrantyStatus(a.warrantyExpiry)
                      return (
                        <tr key={a.id} className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => window.location.href = `./assets/${a.id}`}>
                          <td className="px-4 py-3 font-medium text-gray-800">{a.name}</td>
                          <td className="px-4 py-3 text-gray-500">{TYPE_ICONS[a.type]} {a.type.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.serialNumber}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{a.school?.name ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{a.room ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: STATUS_COLORS[a.status] + '22', color: STATUS_COLORS[a.status] }}>
                              {a.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: CONDITION_COLORS[a.condition] + '22', color: CONDITION_COLORS[a.condition] }}>
                              {a.condition}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {a.warrantyExpiry
                              ? <span className={`flex items-center gap-1 text-xs font-medium ${ws === 'expired' ? 'text-red-600' : ws === 'expiring' ? 'text-yellow-600' : 'text-green-600'}`}>
                                  {ws !== 'valid' && <AlertTriangle size={11} />}
                                  {new Date(a.warrantyExpiry).toLocaleDateString()}
                                </span>
                              : <span className="text-gray-400 text-xs">—</span>
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
        }
      </div>

      {showAdd && <AssetDialog onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />}
      {editAsset && <AssetDialog asset={editAsset} onClose={() => setEditAsset(null)} onSaved={() => { setEditAsset(null); load() }} />}
    </div>
  )
}
