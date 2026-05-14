'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import { Ticket, Plus, Search, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#94A3B8', MEDIUM: '#3B82F6', HIGH: '#F59E0B', URGENT: '#EF4444', CRITICAL: '#7C2D12'
}
const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3B82F6', IN_PROGRESS: '#F59E0B', WAITING_USER: '#8B5CF6',
  RESOLVED: '#10B981', CLOSED: '#94A3B8', ESCALATED: '#F97316'
}
const CATEGORIES = ['', 'HARDWARE', 'NETWORK', 'SOFTWARE', 'PORTAL', 'IT_SUPPORT', 'GENERAL', 'BILLING', 'ACADEMIC', 'FACILITIES']
const PRIORITIES = ['', 'LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']
const STATUSES = ['', 'OPEN', 'IN_PROGRESS', 'WAITING_USER', 'ESCALATED', 'RESOLVED', 'CLOSED']

// ─── Create Ticket Dialog ─────────────────────────────────────────────────────

function CreateDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', location: '', category: 'HARDWARE', priority: 'MEDIUM',
  })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.title || !form.description) { toast.error('Title and description required'); return }
    setSaving(true)
    try {
      await apiClient.post('/tickets', form)
      toast.success('Ticket created')
      onCreated()
    } catch { toast.error('Failed to create ticket') }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900">New IT Ticket</h2>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="e.g. Projector not working in Room 204" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
          <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            placeholder="Describe the issue in detail…" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Location / Room</label>
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="e.g. Lab 2, Room 304" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              {['HARDWARE', 'NETWORK', 'SOFTWARE', 'PORTAL', 'IT_SUPPORT', 'GENERAL'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              {['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Creating…' : 'Create Ticket'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SLA Timer ────────────────────────────────────────────────────────────────

function SLATimer({ deadline, breached }: { deadline?: string; breached?: boolean }) {
  const [remaining, setRemaining] = useState('')
  useEffect(() => {
    if (!deadline) return
    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now()
      if (diff <= 0) { setRemaining('BREACHED'); return }
      const h = Math.floor(diff / 3600000); const m = Math.floor((diff % 3600000) / 60000)
      setRemaining(`${h}h ${m}m`)
    }
    update(); const id = setInterval(update, 60000); return () => clearInterval(id)
  }, [deadline])
  if (!deadline) return null
  const isBreached = breached || remaining === 'BREACHED'
  const isWarning = !isBreached && parseInt(remaining) < 2
  const cls = isBreached ? 'bg-red-100 text-red-700' : isWarning ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
  return <span className={`text-xs font-mono px-2 py-0.5 rounded-full font-semibold ${cls}`}>{isBreached ? 'BREACHED' : remaining}</span>
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ItTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBreached, setFilterBreached] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      if (filterPriority) params.set('priority', filterPriority)
      if (filterCategory) params.set('category', filterCategory)
      if (filterBreached) params.set('slaBreached', 'true')
      if (search) params.set('search', search)
      const res = await apiClient.get(`/it/tickets?${params}`).then((r: any) => r.data?.data ?? r.data ?? [])
      setTickets(Array.isArray(res) ? res : [])
    } catch {}
    setLoading(false)
  }, [filterStatus, filterPriority, filterCategory, filterBreached, search])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Ticket size={22} className="text-blue-600" /> IT Tickets
        </h1>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-2xl border border-gray-100 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search tickets…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
          <option value="">All Status</option>
          {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
          <option value="">All Priority</option>
          {PRIORITIES.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
          <option value="">All Categories</option>
          {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-red-600 cursor-pointer">
          <input type="checkbox" checked={filterBreached} onChange={e => setFilterBreached(e.target.checked)} />
          <AlertTriangle size={14} /> SLA Breached only
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading
          ? <div className="animate-pulse p-4 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}</div>
          : tickets.length === 0
            ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Ticket size={40} className="mb-3 opacity-40" />
                <p className="font-medium">No tickets found</p>
                <p className="text-sm mt-1">Adjust filters or create a new ticket</p>
              </div>
            )
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Ticket #', 'Title', 'Category', 'Priority', 'Status', 'Location', 'SLA', 'Created'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tickets.map(t => (
                      <tr key={t.id} className={`hover:bg-gray-50 cursor-pointer transition-colors ${t.slaBreached ? 'bg-red-50/50' : t.status === 'ESCALATED' ? 'bg-orange-50/50' : ''}`}
                        onClick={() => window.location.href = `./tickets/${t.id}`}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.ticketNumber ?? t.id.slice(0, 8)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {t.slaBreached && <AlertTriangle size={13} className="text-red-500 shrink-0" />}
                            <span className="font-medium text-gray-800 max-w-[200px] truncate">{t.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{t.category}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: PRIORITY_COLORS[t.priority] + '22', color: PRIORITY_COLORS[t.priority] }}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: STATUS_COLORS[t.status] + '22', color: STATUS_COLORS[t.status] }}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{t.location ?? '—'}</td>
                        <td className="px-4 py-3"><SLATimer deadline={t.slaDeadline} breached={t.slaBreached} /></td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      </div>

      {showCreate && <CreateDialog onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />}
    </div>
  )
}
