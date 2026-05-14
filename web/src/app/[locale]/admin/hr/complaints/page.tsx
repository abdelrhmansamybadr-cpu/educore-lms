'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api'
import { AlertTriangle, MessageSquare, ChevronDown, ChevronUp, Send, CheckCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Complaint {
  id: string; createdAt: string; status: string; description: string
  itManagerNotes: string | null; hrNotes: string | null; escalatedToHrAt: string | null; resolvedAt: string | null
  submitter: { id: string; email: string; role: string; profile?: { firstName: string; lastName: string; avatar?: string } }
  against: { id: string; email: string; role: string; profile?: { firstName: string; lastName: string } }
  ticket?: { id: string; title: string; ticketNumber?: string }
  messages: any[]
  _count: { messages: number }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  OPEN:            { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Open' },
  UNDER_REVIEW:    { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Under Review' },
  ESCALATED_TO_HR: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Escalated to HR' },
  RESOLVED:        { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Resolved' },
  DISMISSED:       { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Dismissed' },
}

function avatarColor(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return `hsl(${Math.abs(h) % 360}, 60%, 45%)`
}

function UserTag({ user }: { user: Complaint['submitter'] }) {
  const name = user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user?.email ?? 'Unknown'
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ background: avatarColor(name) }}>
        {name[0]?.toUpperCase()}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">{name}</p>
        <p className="text-xs text-gray-400">{user?.role?.replace(/_/g, ' ')}</p>
      </div>
    </div>
  )
}

// ─── Complaint Row ─────────────────────────────────────────────────────────────

function ComplaintRow({ complaint, onUpdate }: { complaint: Complaint; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [msg, setMsg] = useState('')
  const [hrNotes, setHrNotes] = useState(complaint.hrNotes ?? '')
  const [messages, setMessages] = useState(complaint.messages ?? [])
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async () => {
    try {
      const res = await apiClient.get(`/it/complaints/${complaint.id}`).then((r: any) => r.data?.data ?? r.data)
      setMessages(res?.messages ?? [])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch {}
  }, [complaint.id])

  useEffect(() => {
    if (expanded) loadMessages()
  }, [expanded, loadMessages])

  const sendMsg = async () => {
    if (!msg.trim()) return
    setSending(true)
    try {
      await apiClient.post(`/it/complaints/${complaint.id}/messages`, { content: msg })
      setMsg(''); await loadMessages()
    } catch { toast.error('Failed to send') }
    setSending(false)
  }

  const save = async (status?: string) => {
    setSaving(true)
    try {
      await apiClient.patch(`/hr/it-complaints/${complaint.id}`, { hrNotes, ...(status ? { status } : {}) })
      toast.success('Saved')
      onUpdate()
    } catch { toast.error('Failed') }
    setSaving(false)
  }

  const sc = STATUS_COLORS[complaint.status] ?? STATUS_COLORS.OPEN
  const submitterName = complaint.submitter?.profile
    ? `${complaint.submitter.profile.firstName} ${complaint.submitter.profile.lastName}`
    : complaint.submitter?.email
  const againstName = complaint.against?.profile
    ? `${complaint.against.profile.firstName} ${complaint.against.profile.lastName}`
    : complaint.against?.email

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${complaint.status === 'ESCALATED_TO_HR' ? 'border-red-200' : 'border-gray-100'}`}>
      {/* Summary row */}
      <button className="w-full flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
        onClick={() => setExpanded(v => !v)}>
        <AlertTriangle size={18} className={`mt-0.5 shrink-0 ${complaint.status === 'RESOLVED' ? 'text-green-500' : 'text-red-500'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
              {sc.label}
            </span>
            {complaint.ticket && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs truncate max-w-[160px]">
                Re: {complaint.ticket.title}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MessageSquare size={11} /> {complaint._count?.messages ?? messages.length}
            </span>
          </div>
          <p className="text-sm text-gray-800 font-medium">
            <span className="text-red-600">{submitterName}</span>
            {' → complaint against → '}
            <span className="text-indigo-600">{againstName}</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{complaint.description}</p>
          <p className="text-xs text-gray-400 mt-1">
            Escalated {complaint.escalatedToHrAt ? new Date(complaint.escalatedToHrAt).toLocaleDateString() : '—'}
          </p>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-400 shrink-0 mt-1" /> : <ChevronDown size={16} className="text-gray-400 shrink-0 mt-1" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-5 space-y-5">
          {/* People */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">Complainant</p>
              <UserTag user={complaint.submitter} />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">Staff Member</p>
              <UserTag user={complaint.against} />
            </div>
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Complaint</p>
            <p className="text-sm text-gray-700">{complaint.description}</p>
          </div>

          {/* IT Manager notes */}
          {complaint.itManagerNotes && (
            <div className="bg-indigo-50 rounded-xl p-3">
              <p className="text-xs text-indigo-400 mb-1">IT Manager Notes</p>
              <p className="text-sm text-indigo-800">{complaint.itManagerNotes}</p>
            </div>
          )}

          {/* Message thread */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Conversation Thread</p>
            <div className="bg-white border border-gray-100 rounded-xl max-h-48 overflow-y-auto p-3 space-y-2">
              {messages.length === 0
                ? <p className="text-center text-gray-400 text-sm py-4">No messages in this thread</p>
                : messages.map((m: any) => {
                    const name = m.author?.profile
                      ? `${m.author.profile.firstName} ${m.author.profile.lastName}`
                      : m.author?.email ?? 'Unknown'
                    return (
                      <div key={m.id} className="flex gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: avatarColor(name) }}>{name[0]?.toUpperCase()}</div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">{name} · {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          <div className="inline-block bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 text-sm">{m.content}</div>
                        </div>
                      </div>
                    )
                  })}
              <div ref={bottomRef} />
            </div>
            {complaint.status !== 'DISMISSED' && (
              <div className="flex gap-2 mt-2">
                <input value={msg} onChange={e => setMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMsg() } }}
                  placeholder="Add message to thread…"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                <button onClick={sendMsg} disabled={sending || !msg.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40">
                  <Send size={14} />
                </button>
              </div>
            )}
          </div>

          {/* HR Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">HR Notes</label>
            <textarea rows={2} value={hrNotes} onChange={e => setHrNotes(e.target.value)}
              placeholder="Internal HR notes about this complaint…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>

          {/* HR Actions */}
          {!['RESOLVED', 'DISMISSED'].includes(complaint.status) && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => save()} disabled={saving}
                className="px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 disabled:opacity-50">
                Save Notes
              </button>
              <button onClick={() => save('DISMISSED')} disabled={saving}
                className="px-3 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-100 flex items-center gap-1 disabled:opacity-50">
                <X size={12} /> Dismiss
              </button>
              <button onClick={() => save('RESOLVED')} disabled={saving}
                className="px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 flex items-center gap-1 disabled:opacity-50">
                <CheckCircle size={12} /> Mark Resolved
              </button>
            </div>
          )}

          {complaint.resolvedAt && (
            <p className="text-xs text-green-600 font-medium">✓ Resolved on {new Date(complaint.resolvedAt).toLocaleDateString()}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HrComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = filterStatus ? `?status=${filterStatus}` : ''
      const res = await apiClient.get(`/hr/it-complaints${params}`).then((r: any) => r.data?.data ?? r.data ?? [])
      setComplaints(Array.isArray(res) ? res : [])
    } catch {}
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { load() }, [load])

  const openCount = complaints.filter(c => c.status === 'ESCALATED_TO_HR').length
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED').length

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle size={22} className="text-red-600" /> IT Complaints
          </h1>
          <p className="text-sm text-gray-500 mt-1">Complaints escalated from IT Manager for HR review</p>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Awaiting HR', count: openCount, bg: 'bg-red-50', text: 'text-red-700' },
            { label: 'Resolved', count: resolvedCount, bg: 'bg-green-50', text: 'text-green-700' },
            { label: 'Total', count: complaints.length, bg: 'bg-gray-50', text: 'text-gray-700' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
              <p className={`text-3xl font-bold ${s.text}`}>{s.count}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'All' },
          { value: 'ESCALATED_TO_HR', label: 'Awaiting HR' },
          { value: 'RESOLVED', label: 'Resolved' },
          { value: 'DISMISSED', label: 'Dismissed' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilterStatus(f.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filterStatus === f.value ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading
        ? <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        : complaints.length === 0
          ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <AlertTriangle size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No complaints found</p>
              <p className="text-sm text-gray-400 mt-1">
                {filterStatus ? 'Try a different filter' : 'No IT complaints have been escalated to HR yet'}
              </p>
            </div>
          )
          : (
            <div className="space-y-3">
              {complaints.map(c => (
                <ComplaintRow key={c.id} complaint={c} onUpdate={load} />
              ))}
            </div>
          )
      }
    </div>
  )
}
