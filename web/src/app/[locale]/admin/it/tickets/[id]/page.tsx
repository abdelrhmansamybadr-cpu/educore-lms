'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api'
import { ArrowLeft, Send, Star, AlertTriangle, Clock, User, MapPin, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#94A3B8', MEDIUM: '#3B82F6', HIGH: '#F59E0B', URGENT: '#EF4444', CRITICAL: '#7C2D12'
}
const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3B82F6', IN_PROGRESS: '#F59E0B', WAITING_USER: '#8B5CF6',
  RESOLVED: '#10B981', CLOSED: '#94A3B8', ESCALATED: '#F97316'
}
const STATUS_STEPS = ['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED']
const STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'ESCALATED', 'RESOLVED', 'CLOSED']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']

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
    update(); const id = setInterval(update, 30000); return () => clearInterval(id)
  }, [deadline])
  if (!deadline) return null
  const isBreached = breached || remaining === 'BREACHED'
  const cls = isBreached ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold ${cls}`}>
      <Clock size={13} />
      {isBreached ? 'SLA BREACHED' : `SLA: ${remaining}`}
    </div>
  )
}

// ─── Status Timeline ─────────────────────────────────────────────────────────

function StatusTimeline({ current }: { current: string }) {
  const idx = STATUS_STEPS.indexOf(current)
  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((s, i) => {
        const done = i < idx || current === 'CLOSED'
        const active = s === current
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-100 text-gray-400'}`}>
                {done ? '✓' : i + 1}
              </div>
              <span className="text-xs mt-1 text-gray-500 hidden sm:block">{s.replace(/_/g, ' ')}</span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${i < idx ? 'bg-green-400' : 'bg-gray-200'}`} style={{ minWidth: 20 }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Star Rating ─────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)} onClick={() => onChange(n)}>
          <Star size={24} className="transition-colors" fill={(hovered || value) >= n ? '#F59E0B' : 'none'} stroke={(hovered || value) >= n ? '#F59E0B' : '#D1D5DB'} />
        </button>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [msgText, setMsgText] = useState('')
  const [sending, setSending] = useState(false)
  const [rating, setRating] = useState(0)
  const [ratingFeedback, setRatingFeedback] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [escalationReason, setEscalationReason] = useState('')
  const [showEscalate, setShowEscalate] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get(`/it/tickets/${params.id}`).then((r: any) => r.data?.data ?? r.data)
      setTicket(res)
      if (res?.rating) setRating(res.rating)
    } catch {}
    setLoading(false)
  }, [params.id])

  useEffect(() => { load() }, [load])

  // Poll for new messages every 5 seconds (same as employee side)
  useEffect(() => {
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [load])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [ticket?.messages])

  const sendMessage = async () => {
    if (!msgText.trim()) return
    setSending(true)
    try {
      // Use /messages endpoint so employee sees IT staff replies in real-time
      await apiClient.post(`/tickets/${params.id}/messages`, { content: msgText })
      setMsgText(''); await load()
    } catch { toast.error('Failed to send') }
    setSending(false)
  }

  const updateTicket = async (data: any) => {
    try {
      await apiClient.patch(`/tickets/${params.id}`, data)
      toast.success('Updated'); await load()
    } catch { toast.error('Failed to update') }
  }

  const submitRating = async () => {
    if (!rating) return
    setSubmittingRating(true)
    try {
      await apiClient.post(`/tickets/${params.id}/rate`, { rating, feedback: ratingFeedback })
      toast.success('Rating submitted'); await load()
    } catch { toast.error('Failed') }
    setSubmittingRating(false)
  }

  const escalate = async () => {
    if (!escalationReason) { toast.error('Please provide escalation reason'); return }
    try {
      await apiClient.post(`/tickets/${params.id}/escalate`, { reason: escalationReason })
      toast.success('Ticket escalated'); setShowEscalate(false); await load()
    } catch { toast.error('Failed') }
  }

  if (loading) return (
    <div className="p-6 animate-pulse space-y-4">
      <div className="h-8 bg-gray-100 rounded-xl w-64" />
      <div className="h-48 bg-gray-100 rounded-2xl" />
      <div className="h-64 bg-gray-100 rounded-2xl" />
    </div>
  )

  if (!ticket) return (
    <div className="p-6 text-center text-gray-400">
      <p>Ticket not found</p>
      <a href="../tickets" className="text-blue-600 text-sm mt-2 inline-block">← Back to tickets</a>
    </div>
  )

  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <a href="../tickets" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={15} /> Back to tickets
      </a>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{ticket.ticketNumber ?? ticket.id.slice(0, 8)}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: PRIORITY_COLORS[ticket.priority] + '22', color: PRIORITY_COLORS[ticket.priority] }}>
                {ticket.priority}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: STATUS_COLORS[ticket.status] + '22', color: STATUS_COLORS[ticket.status] }}>
                {ticket.status}
              </span>
              {ticket.slaBreached && (
                <span className="flex items-center gap-1 text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full">
                  <AlertTriangle size={12} /> SLA BREACHED
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
          </div>
          <SLATimer deadline={ticket.slaDeadline} breached={ticket.slaBreached} />
        </div>

        {/* Status timeline */}
        <div className="overflow-x-auto">
          <StatusTimeline current={ticket.status} />
        </div>

        {/* Description */}
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">{ticket.description}</div>

        {/* Meta */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5"><Tag size={12} /> <span className="font-medium">{ticket.category}</span></div>
          {ticket.location && <div className="flex items-center gap-1.5"><MapPin size={12} /> {ticket.location}</div>}
          <div className="flex items-center gap-1.5"><User size={12} /> {ticket.school?.name ?? 'Unknown school'}</div>
          <div className="flex items-center gap-1.5"><Clock size={12} /> {new Date(ticket.createdAt).toLocaleDateString()}</div>
        </div>

        {/* Escalation info */}
        {ticket.escalationReason && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700">
            <span className="font-semibold">Escalation reason:</span> {ticket.escalationReason}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Message Thread ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-semibold text-gray-800 mb-4">Conversation</p>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {(ticket.messages ?? []).length === 0
                ? <p className="text-center text-gray-400 text-sm py-8">No messages yet — send the first message below</p>
                : (ticket.messages ?? []).map((m: any) => {
                    const name = m.user?.profile
                      ? `${m.user.profile.firstName} ${m.user.profile.lastName}`
                      : m.user?.email ?? 'Unknown'
                    const role = m.user?.role ?? ''
                    const isIT = ['IT_ADMIN','IT_MANAGER','IT_STAFF','SUPPORT_AGENT'].includes(role)
                    return (
                      <div key={m.id} className={`flex gap-2 ${isIT ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${isIT ? 'bg-blue-600' : 'bg-gray-400'}`}>
                          {name[0]?.toUpperCase()}
                        </div>
                        <div className={`max-w-[70%] flex flex-col ${isIT ? 'items-end' : 'items-start'}`}>
                          <p className="text-xs text-gray-400 mb-0.5">
                            {name}
                            {isIT && <span className="ml-1 text-blue-500 font-medium">· IT Staff</span>}
                            {' · '}{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <div className={`px-3 py-2 rounded-2xl text-sm ${isIT ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                            {m.content}
                          </div>
                        </div>
                      </div>
                    )
                  })
              }
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            {!isResolved && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="flex gap-2">
                  <input value={msgText} onChange={e => setMsgText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="Reply to submitter… (Enter to send)"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  <button onClick={sendMessage} disabled={sending || !msgText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Rating (shown after resolved) */}
          {isResolved && !ticket.rating && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="font-semibold text-gray-800 mb-3">Rate this resolution</p>
              <StarRating value={rating} onChange={setRating} />
              <textarea rows={2} value={ratingFeedback} onChange={e => setRatingFeedback(e.target.value)}
                placeholder="Optional feedback…"
                className="mt-3 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300" />
              <button onClick={submitRating} disabled={!rating || submittingRating}
                className="mt-3 px-5 py-2 bg-yellow-500 text-white rounded-xl text-sm font-semibold hover:bg-yellow-600 disabled:opacity-50">
                {submittingRating ? 'Submitting…' : 'Submit Rating'}
              </button>
            </div>
          )}
          {isResolved && ticket.rating && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <Star key={n} size={18} fill={ticket.rating >= n ? '#F59E0B' : 'none'} stroke={ticket.rating >= n ? '#F59E0B' : '#D1D5DB'} />)}</div>
              <span className="text-sm text-gray-600">{ticket.ratingFeedback ?? 'No feedback'}</span>
            </div>
          )}
        </div>

        {/* ── Actions Panel ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <p className="font-semibold text-gray-800">Actions</p>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Change Status</label>
              <select defaultValue={ticket.status}
                onChange={e => updateTicket({ status: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Change Priority</label>
              <select defaultValue={ticket.priority}
                onChange={e => updateTicket({ priority: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {ticket.status !== 'ESCALATED' && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
              <div>
                {showEscalate
                  ? (
                    <div className="space-y-2">
                      <textarea rows={2} value={escalationReason} onChange={e => setEscalationReason(e.target.value)}
                        placeholder="Escalation reason…"
                        className="w-full border border-orange-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300" />
                      <div className="flex gap-2">
                        <button onClick={escalate} className="flex-1 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600">Escalate</button>
                        <button onClick={() => setShowEscalate(false)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
                      </div>
                    </div>
                  )
                  : (
                    <button onClick={() => setShowEscalate(true)}
                      className="w-full py-2 border border-orange-300 text-orange-600 rounded-xl text-sm font-semibold hover:bg-orange-50 flex items-center justify-center gap-2">
                      <AlertTriangle size={14} /> Escalate Ticket
                    </button>
                  )
                }
              </div>
            )}
          </div>

          {/* Info card */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-xs text-gray-600">
            <div className="flex justify-between"><span>School</span><span className="font-medium">{ticket.school?.name ?? '—'}</span></div>
            <div className="flex justify-between"><span>Location</span><span className="font-medium">{ticket.location ?? '—'}</span></div>
            <div className="flex justify-between"><span>Category</span><span className="font-medium">{ticket.category}</span></div>
            <div className="flex justify-between"><span>Created</span><span className="font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</span></div>
            {ticket.resolvedAt && <div className="flex justify-between"><span>Resolved</span><span className="font-medium">{new Date(ticket.resolvedAt).toLocaleDateString()}</span></div>}
            {ticket.slaDeadline && <div className="flex justify-between"><span>SLA Deadline</span><span className={`font-medium ${ticket.slaBreached ? 'text-red-600' : 'text-green-600'}`}>{new Date(ticket.slaDeadline).toLocaleString()}</span></div>}
          </div>
        </div>
      </div>
    </div>
  )
}
