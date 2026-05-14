'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api'
import { Star, Users, AlertTriangle, MessageSquare, Send, X, FileText, ChevronUp, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffItem {
  userId: string; name: string; email: string; role: string; avatar: string | null
  totalRatings: number; avgRating: number | null
  breakdown: { star: number; count: number }[]
  recentFeedback: { rating: number; ratingFeedback: string | null; title: string; createdAt: string }[]
  complaintsTotal: number; complaintsOpen: number
}

interface Complaint {
  id: string; createdAt: string; status: string; description: string
  itManagerNotes: string | null; hrNotes: string | null; escalatedToHrAt: string | null
  submitter: { id: string; email: string; profile?: { firstName: string; lastName: string; avatar?: string } }
  against: { id: string; email: string; role: string; profile?: { firstName: string; lastName: string } }
  ticket?: { id: string; title: string; ticketNumber?: string }
  messages: any[]; _count: { messages: number }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  OPEN:            { bg: 'bg-blue-100',   text: 'text-blue-700' },
  UNDER_REVIEW:    { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  ESCALATED_TO_HR: { bg: 'bg-red-100',    text: 'text-red-700' },
  RESOLVED:        { bg: 'bg-green-100',  text: 'text-green-700' },
  DISMISSED:       { bg: 'bg-gray-100',   text: 'text-gray-500' },
}
const ROLE_BADGE: Record<string, string> = {
  IT_ADMIN: 'bg-indigo-100 text-indigo-700', IT_MANAGER: 'bg-purple-100 text-purple-700',
  IT_STAFF: 'bg-blue-100 text-blue-700', SUPPORT_AGENT: 'bg-teal-100 text-teal-700',
}

function avatarColor(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return `hsl(${Math.abs(h) % 360}, 60%, 45%)`
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={13} className={rating >= s ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
      ))}
    </div>
  )
}

function UserAvatar({ name, avatar, size = 10 }: { name: string; avatar?: string | null; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`
  if (avatar) return <img src={avatar} alt={name} className={`${cls} object-cover`} />
  return <div className={cls} style={{ background: avatarColor(name) }}>{name[0]?.toUpperCase()}</div>
}

// ─── Complaint Thread ─────────────────────────────────────────────────────────

function ComplaintThread({ complaint, onUpdate }: { complaint: Complaint; onUpdate: () => void }) {
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState(complaint.messages ?? [])
  const [updating, setUpdating] = useState(false)
  const [notes, setNotes] = useState(complaint.itManagerNotes ?? '')
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async () => {
    try {
      const res = await apiClient.get(`/it/complaints/${complaint.id}`).then((r: any) => r.data?.data ?? r.data)
      setMessages(res?.messages ?? [])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch {}
  }, [complaint.id])

  useEffect(() => { const id = setInterval(loadMessages, 8000); return () => clearInterval(id) }, [loadMessages])

  const sendMsg = async () => {
    if (!msg.trim()) return
    setSending(true)
    try {
      await apiClient.post(`/it/complaints/${complaint.id}/messages`, { content: msg })
      setMsg('')
      await loadMessages()
    } catch { toast.error('Failed to send') }
    setSending(false)
  }

  const updateStatus = async (status: string) => {
    setUpdating(true)
    try {
      await apiClient.patch(`/it/complaints/${complaint.id}`, { status, itManagerNotes: notes })
      toast.success('Updated')
      onUpdate()
    } catch { toast.error('Failed') }
    setUpdating(false)
  }

  const escalateToHr = async () => {
    setUpdating(true)
    try {
      await apiClient.post(`/it/complaints/${complaint.id}/escalate`, { itManagerNotes: notes })
      toast.success('Escalated to HR Manager')
      onUpdate()
    } catch { toast.error('Failed') }
    setUpdating(false)
  }

  const submitterName = complaint.submitter?.profile
    ? `${complaint.submitter.profile.firstName} ${complaint.submitter.profile.lastName}`
    : complaint.submitter?.email

  return (
    <div className="space-y-4">
      {/* Complaint info */}
      <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[complaint.status]?.bg} ${STATUS_COLORS[complaint.status]?.text}`}>
            {complaint.status.replace(/_/g, ' ')}
          </span>
          {complaint.ticket && (
            <span className="text-xs text-gray-400">Re: {complaint.ticket.title}</span>
          )}
        </div>
        <p className="text-gray-700">{complaint.description}</p>
        <p className="text-xs text-gray-400">Submitted {new Date(complaint.createdAt).toLocaleDateString()} by <span className="font-medium">{submitterName}</span></p>
        {complaint.escalatedToHrAt && (
          <p className="text-xs text-red-600 font-medium">Escalated to HR on {new Date(complaint.escalatedToHrAt).toLocaleDateString()}</p>
        )}
      </div>

      {/* Message thread */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Conversation with Employee</p>
        <div className="bg-white border border-gray-100 rounded-xl max-h-56 overflow-y-auto p-3 space-y-3">
          {messages.length === 0
            ? <p className="text-center text-gray-400 text-sm py-4">No messages yet — start the conversation</p>
            : messages.map((m: any) => {
                const name = m.author?.profile
                  ? `${m.author.profile.firstName} ${m.author.profile.lastName}`
                  : m.author?.email ?? 'Unknown'
                return (
                  <div key={m.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{name} · {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <div className="inline-block bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 text-sm">{m.content}</div>
                    </div>
                  </div>
                )
              })}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2 mt-2">
          <input value={msg} onChange={e => setMsg(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMsg() } }}
            placeholder="Reply to employee…"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <button onClick={sendMsg} disabled={sending || !msg.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40">
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* IT Manager notes */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">IT Manager Notes</label>
        <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Internal notes (not visible to employee)…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>

      {/* Actions */}
      {!['RESOLVED', 'DISMISSED', 'ESCALATED_TO_HR'].includes(complaint.status) && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => updateStatus('UNDER_REVIEW')} disabled={updating}
            className="px-3 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl text-xs font-semibold hover:bg-yellow-100 disabled:opacity-50">
            Mark Under Review
          </button>
          <button onClick={() => updateStatus('DISMISSED')} disabled={updating}
            className="px-3 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-100 disabled:opacity-50">
            Dismiss
          </button>
          <button onClick={() => updateStatus('RESOLVED')} disabled={updating}
            className="px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-semibold hover:bg-green-100 disabled:opacity-50">
            Mark Resolved
          </button>
          <button onClick={escalateToHr} disabled={updating}
            className="px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5">
            <ChevronUp size={13} /> Escalate to HR
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Staff Detail Modal ───────────────────────────────────────────────────────

function StaffDetailModal({ staff, onClose }: { staff: StaffItem; onClose: () => void }) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loadingComplaints, setLoadingComplaints] = useState(true)
  const [expandedComplaint, setExpandedComplaint] = useState<string | null>(null)

  const loadComplaints = useCallback(async () => {
    setLoadingComplaints(true)
    try {
      const res = await apiClient.get(`/it/complaints?againstId=${staff.userId}`).then((r: any) => r.data?.data ?? r.data ?? [])
      setComplaints(Array.isArray(res) ? res : [])
    } catch {}
    setLoadingComplaints(false)
  }, [staff.userId])

  useEffect(() => { loadComplaints() }, [loadComplaints])

  const printReport = () => {
    const html = `
      <html><head><title>IT Staff Report — ${staff.name}</title>
      <style>body{font-family:sans-serif;padding:30px;color:#1f2937}h1{font-size:22px;margin-bottom:4px}p{font-size:13px;color:#6b7280}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:8px;border:1px solid #e5e7eb;font-size:12px;text-align:left}th{background:#f9fafb}</style>
      </head><body>
      <h1>${staff.name}</h1>
      <p>${staff.role.replace(/_/g, ' ')} · ${staff.email}</p>
      <p><strong>Avg Rating:</strong> ${staff.avgRating?.toFixed(2) ?? 'N/A'} / 5 (${staff.totalRatings} ratings) &nbsp;|&nbsp; <strong>Complaints:</strong> ${staff.complaintsTotal} total (${staff.complaintsOpen} open)</p>
      <h2 style="font-size:15px;margin-top:24px">Rating Breakdown</h2>
      <table><tr><th>Stars</th><th>Count</th></tr>
      ${staff.breakdown.map(b => `<tr><td>${'★'.repeat(b.star)}</td><td>${b.count}</td></tr>`).join('')}
      </table>
      <h2 style="font-size:15px;margin-top:24px">Recent Feedback</h2>
      <table><tr><th>Ticket</th><th>Rating</th><th>Feedback</th><th>Date</th></tr>
      ${staff.recentFeedback.map(f => `<tr><td>${f.title}</td><td>${f.rating}/5</td><td>${f.ratingFeedback ?? '—'}</td><td>${new Date(f.createdAt).toLocaleDateString()}</td></tr>`).join('')}
      </table>
      <h2 style="font-size:15px;margin-top:24px">Complaints (${complaints.length})</h2>
      <table><tr><th>Status</th><th>Description</th><th>Date</th></tr>
      ${complaints.map(c => `<tr><td>${c.status}</td><td>${c.description}</td><td>${new Date(c.createdAt).toLocaleDateString()}</td></tr>`).join('')}
      </table>
      </body></html>`
    const w = window.open('', '_blank')
    w?.document.write(html); w?.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <UserAvatar name={staff.name} avatar={staff.avatar} />
            <div>
              <p className="font-bold text-gray-900">{staff.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[staff.role] ?? 'bg-gray-100 text-gray-600'}`}>
                {staff.role.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={printReport}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50">
              <FileText size={13} /> Print Report
            </button>
            <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Avg Rating', value: staff.avgRating ? `${staff.avgRating.toFixed(1)}/5` : 'N/A', color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Total Ratings', value: staff.totalRatings, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Complaints', value: staff.complaintsTotal, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Open Complaints', value: staff.complaintsOpen, color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map(k => (
              <div key={k.label} className={`${k.bg} rounded-2xl p-3 text-center`}>
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Rating breakdown chart */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={15} className="text-yellow-500" /> Rating Breakdown
            </p>
            {staff.totalRatings === 0
              ? <p className="text-center text-gray-400 text-sm py-6">No ratings yet</p>
              : (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={staff.breakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="star" tickFormatter={v => `${v}★`} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [`${v} tickets`, 'Count']} labelFormatter={(l) => `${l} Star`} />
                    <Bar dataKey="count" fill="#FBBF24" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>

          {/* Recent feedback */}
          {staff.recentFeedback.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <p className="font-semibold text-gray-800 mb-3">Recent Feedback</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {staff.recentFeedback.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <StarRow rating={f.rating} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{f.title}</p>
                      {f.ratingFeedback && <p className="text-xs text-gray-500 mt-0.5 italic">"{f.ratingFeedback}"</p>}
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">{new Date(f.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complaints */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500" /> Complaints ({complaints.length})
            </p>
            {loadingComplaints
              ? <div className="animate-pulse space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}</div>
              : complaints.length === 0
                ? <p className="text-center text-gray-400 text-sm py-6">No complaints filed against this staff member</p>
                : (
                  <div className="space-y-3">
                    {complaints.map(c => {
                      const submitterName = c.submitter?.profile
                        ? `${c.submitter.profile.firstName} ${c.submitter.profile.lastName}`
                        : c.submitter?.email
                      const isOpen = expandedComplaint === c.id
                      const sc = STATUS_COLORS[c.status] ?? STATUS_COLORS.OPEN
                      return (
                        <div key={c.id} className="border border-gray-100 rounded-xl overflow-hidden">
                          <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                            onClick={() => setExpandedComplaint(isOpen ? null : c.id)}>
                            <AlertTriangle size={14} className="text-red-400 shrink-0" />
                            <div className="flex-1 text-left min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">By: {submitterName}</p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">{c.description}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sc.bg} ${sc.text}`}>
                                {c.status.replace(/_/g, ' ')}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <MessageSquare size={11} /> {c._count?.messages ?? c.messages?.length ?? 0}
                              </span>
                              <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</p>
                            </div>
                          </button>
                          {isOpen && (
                            <div className="border-t border-gray-100 p-4">
                              <ComplaintThread complaint={c} onUpdate={loadComplaints} />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ItStaffAnalyticsPage() {
  const [staff, setStaff] = useState<StaffItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<StaffItem | null>(null)
  const [sort, setSort] = useState<'rating' | 'complaints' | 'name'>('rating')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/it/staff-analytics').then((r: any) => r.data?.data ?? r.data ?? [])
      setStaff(Array.isArray(res) ? res : [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const sorted = [...staff].sort((a, b) => {
    if (sort === 'rating') return (b.avgRating ?? 0) - (a.avgRating ?? 0)
    if (sort === 'complaints') return b.complaintsTotal - a.complaintsTotal
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={22} className="text-indigo-600" /> IT Staff Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">Performance ratings and complaint management per IT staff member</p>
        </div>
        <div className="flex gap-2">
          {(['rating', 'complaints', 'name'] as const).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${sort === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              Sort: {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      {!loading && staff.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'IT Staff Total', value: staff.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Avg Team Rating', value: staff.filter(s => s.avgRating).length > 0 ? (staff.reduce((acc, s) => acc + (s.avgRating ?? 0), 0) / staff.filter(s => s.avgRating).length).toFixed(1) + '/5' : 'N/A', color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Total Complaints', value: staff.reduce((acc, s) => acc + s.complaintsTotal, 0), color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Open Complaints', value: staff.reduce((acc, s) => acc + s.complaintsOpen, 0), color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map(k => (
            <div key={k.label} className={`${k.bg} rounded-2xl p-4 text-center`}>
              <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-sm text-gray-500 mt-1">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Staff grid */}
      {loading
        ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        : sorted.length === 0
          ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Users size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No IT staff found</p>
            </div>
          )
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.map(s => (
                <div key={s.userId}
                  className="bg-white border border-gray-100 rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all"
                  onClick={() => setSelected(s)}>
                  <div className="flex items-center gap-3 mb-4">
                    <UserAvatar name={s.name} avatar={s.avatar} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[s.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {s.role.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Avg Rating</span>
                      <span className="text-sm font-bold text-yellow-600">
                        {s.avgRating ? `${s.avgRating.toFixed(1)}/5` : 'No ratings'} ({s.totalRatings})
                      </span>
                    </div>
                    <StarRow rating={Math.round(s.avgRating ?? 0)} />
                    {/* mini breakdown */}
                    <div className="mt-2 space-y-1">
                      {s.breakdown.slice().reverse().map(b => (
                        <div key={b.star} className="flex items-center gap-1.5 text-xs">
                          <span className="w-5 text-gray-400">{b.star}★</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-yellow-400 h-1.5 rounded-full"
                              style={{ width: s.totalRatings ? `${(b.count / s.totalRatings) * 100}%` : '0%' }} />
                          </div>
                          <span className="w-4 text-gray-400 text-right">{b.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Complaints */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <AlertTriangle size={12} className={s.complaintsOpen > 0 ? 'text-red-500' : 'text-gray-300'} />
                      <span>{s.complaintsTotal} complaint{s.complaintsTotal !== 1 ? 's' : ''}</span>
                      {s.complaintsOpen > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          {s.complaintsOpen} open
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-indigo-600 font-semibold">View Details →</span>
                  </div>
                </div>
              ))}
            </div>
          )
      }

      {selected && <StaffDetailModal staff={selected} onClose={() => { setSelected(null); load() }} />}
    </div>
  )
}
