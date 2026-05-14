'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import {
  Monitor, AlertTriangle, Package, CheckCircle, Settings,
  FileBarChart, Ticket, RefreshCw, Clock, Users, Star
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashStats {
  openTickets: number; slaBreaches: number; totalAssets: number; resolvedThisWeek: number
  byCategory: { category: string; _count: number }[]
  byMonth: { month: string; count: number }[]
  recentOpen: any[]
}

interface WorkloadItem {
  userId: string; name: string; role: string; avatar: string | null
  openTickets: number; resolvedThisWeek: number; avgRating: number | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#94A3B8', MEDIUM: '#3B82F6', HIGH: '#F59E0B', URGENT: '#EF4444', CRITICAL: '#7C2D12'
}
const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3B82F6', IN_PROGRESS: '#F59E0B', WAITING_USER: '#8B5CF6',
  RESOLVED: '#10B981', CLOSED: '#94A3B8', ESCALATED: '#F97316'
}
const CATEGORY_COLORS = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777', '#EA580C', '#0D9488', '#9333EA', '#E11D48']

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
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [deadline])

  if (!deadline) return null
  const color = breached ? 'bg-red-100 text-red-700' : remaining.startsWith('BREACHED') ? 'bg-red-100 text-red-700' : parseInt(remaining) < 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
  return <span className={`text-xs font-mono px-2 py-0.5 rounded-full font-semibold ${color}`}>{breached ? 'BREACHED' : remaining}</span>
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-2xl p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace('text', 'bg').replace('600', '100')}`}>
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        <p className="text-sm text-gray-600 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ─── Workload Card ────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
  IT_ADMIN:      'bg-indigo-100 text-indigo-700',
  IT_MANAGER:    'bg-purple-100 text-purple-700',
  IT_STAFF:      'bg-blue-100 text-blue-600',
  SUPPORT_AGENT: 'bg-teal-100 text-teal-700',
}

function avatarColor(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  const hue = Math.abs(h) % 360
  return `hsl(${hue}, 60%, 45%)`
}

function WorkloadCard({ item }: { item: WorkloadItem }) {
  const initials = item.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const badgeCls = ROLE_BADGE[item.role] ?? 'bg-gray-100 text-gray-600'
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        {item.avatar
          ? <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
          : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ background: avatarColor(item.name) }}>{initials}</div>
        }
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeCls}`}>{item.role.replace(/_/g, ' ')}</span>
        </div>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-gray-500"><Ticket size={12} className="text-blue-500" /> Open Tickets</span>
          <span className="font-bold text-blue-700">{item.openTickets}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-gray-500"><CheckCircle size={12} className="text-green-500" /> Resolved This Week</span>
          <span className="font-bold text-green-700">{item.resolvedThisWeek}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-gray-500"><Star size={12} className="text-yellow-500" /> Avg Rating</span>
          <span className="font-bold text-yellow-700">{item.avgRating != null ? item.avgRating.toFixed(1) : '—'}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ItDashboardPage() {
  const [tab, setTab] = useState<'overview' | 'reports' | 'settings'>('overview')
  const [stats, setStats] = useState<DashStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [workload, setWorkload] = useState<WorkloadItem[]>([])
  const [workloadLoading, setWorkloadLoading] = useState(false)

  // Settings state
  const [settings, setSettings] = useState<any>(null)
  const [settingsDirty, setSettingsDirty] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/it/dashboard').then((r: any) => r.data?.data ?? r.data)
      setStats(res)
    } catch {}
    setLoading(false)
  }, [])

  const loadWorkload = useCallback(async () => {
    setWorkloadLoading(true)
    try {
      const res = await apiClient.get('/it/staff-workload').then((r: any) => r.data?.data ?? r.data ?? [])
      setWorkload(Array.isArray(res) ? res : [])
    } catch {}
    setWorkloadLoading(false)
  }, [])

  const loadSettings = useCallback(async () => {
    try {
      const res = await apiClient.get('/it/settings').then((r: any) => r.data?.data ?? r.data)
      setSettings(res)
    } catch {}
  }, [])

  useEffect(() => { load(); loadWorkload() }, [load, loadWorkload])
  useEffect(() => { if (tab === 'settings') loadSettings() }, [tab, loadSettings])

  const saveSettings = async () => {
    if (!settings) return
    setSavingSettings(true)
    try {
      await apiClient.patch('/it/settings', settings)
      setSettingsDirty(false)
    } catch {}
    setSavingSettings(false)
  }

  const updateSetting = (key: string, val: any) => {
    setSettings((s: any) => ({ ...s, [key]: val }))
    setSettingsDirty(true)
  }

  const categoryData = (stats?.byCategory ?? []).map((c, i) => ({
    name: c.category, value: c._count, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
  }))

  const TABS = [
    { key: 'overview', label: 'Overview', icon: Monitor },
    { key: 'reports', label: 'Reports', icon: FileBarChart },
    { key: 'settings', label: 'IT Settings', icon: Settings },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Monitor size={22} className="text-blue-600" /> IT Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">IT Support & Asset Management</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><RefreshCw size={16} /></button>
          <a href="./it/tickets" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            <Ticket size={15} /> Tickets
          </a>
          <a href="./it/assets" className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100">
            <Package size={15} /> Assets
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Ticket} label="Open Tickets" value={stats?.openTickets ?? 0} color="text-blue-600" bg="bg-blue-50" />
            <StatCard icon={AlertTriangle} label="SLA Breaches" value={stats?.slaBreaches ?? 0} color="text-red-600" bg="bg-red-50" />
            <StatCard icon={Package} label="Active Assets" value={stats?.totalAssets ?? 0} color="text-indigo-600" bg="bg-indigo-50" />
            <StatCard icon={CheckCircle} label="Resolved This Week" value={stats?.resolvedThisWeek ?? 0} color="text-green-600" bg="bg-green-50" />
          </div>

          {/* Charts */}
          {loading
            ? <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl" />)}</div>
            : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ticket volume by month */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className="font-semibold text-gray-800 mb-4">Ticket Volume (Last 6 Months)</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats?.byMonth ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Ticket by category pie */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className="font-semibold text-gray-800 mb-4">Tickets by Category</p>
                  {categoryData.length === 0
                    ? <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data yet</div>
                    : (
                      <div className="flex items-center gap-4">
                        <ResponsiveContainer width="60%" height={180}>
                          <PieChart>
                            <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={30}>
                              {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5 flex-1">
                          {categoryData.slice(0, 6).map((d, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                              <span className="text-gray-600 truncate">{d.name}</span>
                              <span className="font-bold text-gray-800 ml-auto">{d.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                </div>
              </div>
            )
          }

          {/* Staff Workload */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={16} className="text-blue-600" /> IT Staff Workload
            </p>
            {workloadLoading
              ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
              : workload.length === 0
                ? <p className="text-center text-gray-400 text-sm py-8">No IT staff found in this school</p>
                : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {workload.map(w => <WorkloadCard key={w.userId} item={w} />)}
                  </div>
            }
          </div>

          {/* Recent open tickets */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-gray-800">Recent Open Tickets</p>
              <a href="./it/tickets" className="text-sm text-blue-600 hover:underline">View all →</a>
            </div>
            {loading
              ? <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}</div>
              : (stats?.recentOpen?.length ?? 0) === 0
                ? <div className="text-center py-10 text-gray-400">No open tickets</div>
                : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Ticket #', 'Title', 'Category', 'Priority', 'Status', 'SLA'].map(h => (
                            <th key={h} className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(stats?.recentOpen ?? []).map((t: any) => (
                          <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `./it/tickets/${t.id}`}>
                            <td className="py-2 pr-4 font-mono text-xs text-gray-500">{t.ticketNumber ?? t.id.slice(0, 8)}</td>
                            <td className="py-2 pr-4 font-medium text-gray-800 max-w-[200px] truncate">{t.title}</td>
                            <td className="py-2 pr-4">
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{t.category}</span>
                            </td>
                            <td className="py-2 pr-4">
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{ background: PRIORITY_COLORS[t.priority] + '22', color: PRIORITY_COLORS[t.priority] }}>
                                {t.priority}
                              </span>
                            </td>
                            <td className="py-2 pr-4">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ background: STATUS_COLORS[t.status] + '22', color: STATUS_COLORS[t.status] }}>
                                {t.status}
                              </span>
                            </td>
                            <td className="py-2"><SLATimer deadline={t.slaDeadline} breached={t.slaBreached} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
            }
          </div>
        </div>
      )}

      {/* ── REPORTS TAB ── */}
      {tab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Ticket} label="Open Tickets" value={stats?.openTickets ?? 0} color="text-blue-600" bg="bg-blue-50" />
            <StatCard icon={AlertTriangle} label="SLA Breaches" value={stats?.slaBreaches ?? 0} color="text-red-600" bg="bg-red-50" />
            <StatCard icon={Package} label="Active Assets" value={stats?.totalAssets ?? 0} color="text-indigo-600" bg="bg-indigo-50" />
            <StatCard icon={CheckCircle} label="Resolved This Week" value={stats?.resolvedThisWeek ?? 0} color="text-green-600" bg="bg-green-50" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-4">Monthly Ticket Trend</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats?.byMonth ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-4">Category Breakdown</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab === 'settings' && (
        <div className="space-y-6">
          {!settings
            ? <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl" />)}</div>
            : (
              <>
                {/* SLA Configuration */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Clock size={16} className="text-blue-600" />SLA Response Times</h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { key: 'slaLow', label: 'Low (min)', color: '#94A3B8' },
                      { key: 'slaMedium', label: 'Medium (min)', color: '#3B82F6' },
                      { key: 'slaHigh', label: 'High (min)', color: '#F59E0B' },
                      { key: 'slaUrgent', label: 'Urgent (min)', color: '#EF4444' },
                      { key: 'slaCritical', label: 'Critical (min)', color: '#7C2D12' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-medium mb-1" style={{ color: f.color }}>{f.label}</label>
                        <input type="number" min={1} value={settings[f.key] ?? ''}
                          onChange={e => updateSetting(f.key, +e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Auto-Escalate After (hours)</label>
                    <input type="number" min={1} value={settings.escalationAfterHours ?? 4}
                      onChange={e => updateSetting('escalationAfterHours', +e.target.value)}
                      className="w-40 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  </div>
                </div>

                {/* Notification Rules */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h2 className="font-semibold text-gray-800 mb-4">Notification Rules</h2>
                  <div className="space-y-3">
                    {[
                      { key: 'notifyNewTicket', label: 'New ticket submitted' },
                      { key: 'notifyAssignment', label: 'Ticket assigned to staff' },
                      { key: 'notifySlaBreach', label: 'SLA breach detected' },
                      { key: 'notifyEscalation', label: 'Ticket escalated' },
                      { key: 'notifyResolution', label: 'Ticket resolved' },
                    ].map(n => (
                      <label key={n.key} className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                          <input type="checkbox" className="sr-only" checked={settings[n.key] ?? true}
                            onChange={e => updateSetting(n.key, e.target.checked)} />
                          <div className={`w-10 h-6 rounded-full transition-colors ${settings[n.key] ? 'bg-blue-600' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-1 ${settings[n.key] ? 'translate-x-5' : 'translate-x-1'}`} />
                          </div>
                        </div>
                        <span className="text-sm text-gray-700">{n.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={saveSettings} disabled={!settingsDirty || savingSettings}
                    className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${settingsDirty ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                    {savingSettings ? 'Saving…' : 'Save Settings'}
                  </button>
                </div>
              </>
            )
          }
        </div>
      )}
    </div>
  )
}
