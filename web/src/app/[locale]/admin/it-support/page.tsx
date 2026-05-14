'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api'
import { HelpCircle, Plus, X, Send, ChevronRight, Clock, CheckCircle, AlertTriangle, Star } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────

const IT_CATEGORIES = ['IT_SUPPORT', 'HARDWARE', 'NETWORK', 'SOFTWARE', 'PORTAL']
const IT_CATEGORY_LABELS: Record<string, string> = {
  IT_SUPPORT: 'General IT', HARDWARE: 'Hardware', NETWORK: 'Network / Internet',
  SOFTWARE: 'Software', PORTAL: 'Portal / Login Access',
}
const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#94A3B8', MEDIUM: '#3B82F6', HIGH: '#F59E0B', URGENT: '#EF4444',
}
const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3B82F6', IN_PROGRESS: '#F59E0B', WAITING_USER: '#8B5CF6',
  RESOLVED: '#10B981', CLOSED: '#94A3B8', ESCALATED: '#F97316',
}

// ─── SLA Badge ────────────────────────────────────────────────────────────────

function SLABadge({ deadline, breached }: { deadline?: string; breached?: boolean }) {
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
  const cls = isBreached ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
  return <span className={`text-xs font-mono px-2 py-0.5 rounded-full font-semibold ${cls}`}>{isBreached ? 'BREACHED' : remaining}</span>
}

// ─── Star Rating Input ────────────────────────────────────────────────────────

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="focus:outline-none transition-transform hover:scale-110">
          <Star size={28}
            className={`transition-colors ${(hovered || value) >= s ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  )
}

// ─── Rating + Complaint modal (mandatory for resolved tickets) ────────────────

// @ts-ignore — reserved for future use
function RateAndComplainModal({
  ticket, onDone, onDismiss,
}: { ticket: any; onDone: () => void; onDismiss: () => void }) {
  const [step, setStep] = useState<'rate' | 'complaint' | 'done'>('rate')
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [wantComplain, setWantComplain] = useState(false)
  const [complaintDesc, setComplaintDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const submitRating = async () => {
    if (!rating) { toast.error('Please select a star rating'); return }
    setSaving(true)
    try {
      await apiClient.post(`/tickets/${ticket.id}/rate`, { rating, feedback })
      toast.success('Rating submitted!')
      if (wantComplain) {
        setStep('complaint')
      } else {
        setStep('done')
        onDone()
      }
    } catch { toast.error('Failed to submit rating') }
    setSaving(false)
  }

  const submitComplaint = async () => {
    if (!complaintDesc.trim()) { toast.error('Please describe your complaint'); return }
    setSaving(true)
    try {
      await apiClient.post('/it/complaints', {
        againstId: ticket.assigneeId,
        description: complaintDesc,
        ticketId: ticket.id,
      })
      toast.success('Complaint filed. The IT Manager has been notified.')
      setStep('done')
      onDone()
    } catch { toast.error('Failed to file complaint') }
    setSaving(false)
  }

  if (step === 'done') return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        {step === 'rate' && (
          <>
            <div className="text-center">
              <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Star size={28} className="text-yellow-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Rate your support experience</h2>
              <p className="text-sm text-gray-500 mt-1">
                Your ticket <span className="font-semibold text-gray-700">&quot;{ticket.title}&quot;</span> has been resolved.
                Please rate the IT team's support.
              </p>
            </div>

            <div className="flex justify-center">
              <StarInput value={rating} onChange={setRating} />
            </div>
            {rating > 0 && (
              <p className="text-center text-sm font-medium text-gray-600">
                {['', 'Very Poor', 'Poor', 'Average', 'Good', 'Excellent'][rating]}
              </p>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Additional comments (optional)</label>
              <textarea rows={3} value={feedback} onChange={e => setFeedback(e.target.value)}
                placeholder="Tell us more about your experience…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300" />
            </div>

            {rating <= 2 && rating > 0 && (
              <label className="flex items-start gap-2.5 p-3 bg-red-50 rounded-xl border border-red-100 cursor-pointer">
                <input type="checkbox" checked={wantComplain} onChange={e => setWantComplain(e.target.checked)}
                  className="mt-0.5 accent-red-600" />
                <span className="text-sm text-red-700">
                  <span className="font-semibold">File a complaint</span> — I want to escalate an issue about the staff member who handled this ticket.
                </span>
              </label>
            )}

            <button onClick={submitRating} disabled={saving || !rating}
              className="w-full py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 disabled:opacity-50 transition-colors">
              {saving ? 'Submitting…' : 'Submit Rating'}
            </button>
            <button onClick={onDismiss}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600">
              I'll rate later
            </button>
          </>
        )}

        {step === 'complaint' && (
          <>
            <div className="text-center">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={28} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">File a Complaint</h2>
              <p className="text-sm text-gray-500 mt-1">This will be reviewed by the IT Manager.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Describe your complaint *</label>
              <textarea rows={5} value={complaintDesc} onChange={e => setComplaintDesc(e.target.value)}
                placeholder="Please describe what happened and why you are filing this complaint…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setStep('done'); onDone() }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                Skip
              </button>
              <button onClick={submitComplaint} disabled={saving}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {saving ? 'Submitting…' : 'File Complaint'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Create Request Dialog ─────────────────────────────────────────────────────

function CreateDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', location: '', category: 'IT_SUPPORT', priority: 'MEDIUM',
  })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.title || !form.description) { toast.error('Title and description required'); return }
    setSaving(true)
    try {
      await apiClient.post('/tickets', form)
      toast.success('Request submitted!')
      onCreated()
    } catch { toast.error('Failed to submit request') }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">New IT Request</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="e.g. My laptop can't connect to WiFi" />
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
              placeholder="e.g. Room 204" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              {IT_CATEGORIES.map(c => <option key={c} value={c}>{IT_CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Ticket Detail Panel ──────────────────────────────────────────────────────

function TicketDetailPanel({ ticket, onClose, onRated }: { ticket: any; onClose: () => void; onRated: () => void }) {
  const [messages, setMessages] = useState<any[]>([])
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [inlineRating, setInlineRating] = useState(0)
  const [inlineFeedback, setInlineFeedback] = useState('')
  const [inlineSaving, setInlineSaving] = useState(false)
  const [wantComplain, setWantComplain] = useState(false)
  const [complaintDesc, setComplaintDesc] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const isResolved = ['RESOLVED', 'CLOSED'].includes(ticket.status)
  const needsRating = isResolved && !ticket.rating

  const submitInlineRating = async () => {
    if (!inlineRating) { toast.error('Please select a star rating'); return }
    setInlineSaving(true)
    try {
      await apiClient.post(`/tickets/${ticket.id}/rate`, { rating: inlineRating, feedback: inlineFeedback })
      toast.success('Rating submitted!')
      if (wantComplain && complaintDesc.trim()) {
        await apiClient.post('/it/complaints', { againstId: ticket.assigneeId, description: complaintDesc, ticketId: ticket.id })
        toast.success('Complaint filed. The IT Manager has been notified.')
      }
      onRated()
    } catch { toast.error('Failed to submit rating') }
    setInlineSaving(false)
  }

  const loadMessages = useCallback(async () => {
    try {
      const res = await apiClient.get(`/tickets/${ticket.id}/messages`).then((r: any) => r.data?.data ?? r.data ?? [])
      setMessages(Array.isArray(res) ? res : [])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch {}
  }, [ticket.id])

  useEffect(() => {
    loadMessages()
    const id = setInterval(loadMessages, 5000)
    return () => clearInterval(id)
  }, [loadMessages])

  const sendMessage = async () => {
    if (!msg.trim()) return
    setSending(true)
    try {
      await apiClient.post(`/tickets/${ticket.id}/messages`, { content: msg })
      setMsg('')
      await loadMessages()
    } catch { toast.error('Failed to send') }
    setSending(false)
  }

  const statusColor = STATUS_COLORS[ticket.status] ?? '#94A3B8'

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: statusColor + '22', color: statusColor }}>
                  {ticket.status?.replace(/_/g, ' ')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: PRIORITY_COLORS[ticket.priority] + '22', color: PRIORITY_COLORS[ticket.priority] }}>
                  {ticket.priority}
                </span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{IT_CATEGORY_LABELS[ticket.category] ?? ticket.category}</span>
                <SLABadge deadline={ticket.slaDeadline} breached={ticket.slaBreached} />
              </div>
              <h2 className="text-base font-bold text-gray-900 truncate">{ticket.title}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Submitted {new Date(ticket.createdAt).toLocaleDateString()}</p>
            </div>
            <button onClick={onClose} className="ml-3 shrink-0"><X size={18} className="text-gray-400" /></button>
          </div>

          {/* Already rated — show summary */}
          {ticket.rating && (
            <div className="px-5 py-3 bg-green-50 border-b border-green-100 flex items-center gap-3">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={14}
                    className={ticket.rating >= s ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                ))}
              </div>
              <p className="text-xs text-green-700 font-medium">You rated this ticket {ticket.rating}/5</p>
              {ticket.ratingFeedback && <p className="text-xs text-green-600 truncate">"{ticket.ratingFeedback}"</p>}
            </div>
          )}

          {/* Inline rating section for resolved/unrated tickets */}
          {needsRating && (
            <div className="px-5 py-4 bg-yellow-50 border-b border-yellow-200 space-y-3">
              <div className="flex items-center gap-2">
                <Star size={16} className="text-yellow-500 fill-yellow-400" />
                <p className="text-sm font-semibold text-yellow-900">Rate your support experience</p>
                <span className="ml-auto text-xs text-yellow-600 font-medium">Required</span>
              </div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" onClick={() => setInlineRating(s)}
                    className="focus:outline-none transition-transform hover:scale-110">
                    <Star size={32} className={`transition-colors ${inlineRating >= s ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  </button>
                ))}
                {inlineRating > 0 && (
                  <span className="ml-2 self-center text-sm font-semibold text-yellow-700">
                    {['','Very Poor','Poor','Average','Good','Excellent'][inlineRating]}
                  </span>
                )}
              </div>
              <textarea rows={2} value={inlineFeedback} onChange={e => setInlineFeedback(e.target.value)}
                placeholder="Additional comments (optional)…"
                className="w-full border border-yellow-200 bg-white rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300" />
              {inlineRating > 0 && inlineRating <= 2 && (
                <label className="flex items-start gap-2.5 p-3 bg-red-50 rounded-xl border border-red-100 cursor-pointer">
                  <input type="checkbox" checked={wantComplain} onChange={e => setWantComplain(e.target.checked)}
                    className="mt-0.5 accent-red-600" />
                  <span className="text-sm text-red-700">
                    <span className="font-semibold">File a complaint</span> — escalate an issue about the staff member
                  </span>
                </label>
              )}
              {wantComplain && (
                <textarea rows={3} value={complaintDesc} onChange={e => setComplaintDesc(e.target.value)}
                  placeholder="Describe your complaint…"
                  className="w-full border border-red-200 bg-white rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300" />
              )}
              <button onClick={submitInlineRating} disabled={inlineSaving || !inlineRating}
                className="w-full py-2.5 bg-yellow-500 text-white rounded-xl text-sm font-semibold hover:bg-yellow-600 disabled:opacity-50 transition-colors">
                {inlineSaving ? 'Submitting…' : 'Submit Rating'}
              </button>
            </div>
          )}

          {/* Assignee banner */}
          {ticket.assignee ? (
            <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {(ticket.assignee.profile
                  ? `${ticket.assignee.profile.firstName} ${ticket.assignee.profile.lastName}`
                  : ticket.assignee.email)[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-blue-500 font-medium">Handled by</p>
                <p className="text-sm font-semibold text-blue-900">
                  {ticket.assignee.profile
                    ? `${ticket.assignee.profile.firstName} ${ticket.assignee.profile.lastName}`
                    : ticket.assignee.email}
                  <span className="ml-1.5 text-xs font-normal text-blue-500">
                    · {ticket.assignee.role?.replace(/_/g, ' ')}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <p className="text-xs text-gray-500">Waiting for an IT staff member to take this request…</p>
            </div>
          )}

          {/* Description */}
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700">{ticket.description}</p>
            {ticket.location && <p className="text-xs text-gray-400 mt-1">Location: {ticket.location}</p>}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0
              ? <p className="text-center text-gray-400 text-sm py-8">No messages yet. Send one below.</p>
              : messages.map((m: any) => {
                  const name = m.user?.profile ? `${m.user.profile.firstName} ${m.user.profile.lastName}` : m.user?.email ?? 'Unknown'
                  const role = m.user?.role ?? ''
                  const isIT = ['IT_ADMIN','IT_MANAGER','IT_STAFF','SUPPORT_AGENT'].includes(role)
                  return (
                    <div key={m.id} className={`flex gap-2 ${isIT ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${isIT ? 'bg-blue-600' : 'bg-gray-400'}`}>
                        {name[0]?.toUpperCase()}
                      </div>
                      <div className={`max-w-[75%] flex flex-col ${isIT ? 'items-end' : 'items-start'}`}>
                        <p className="text-xs text-gray-400 mb-0.5">
                          {name}{isIT && <span className="ml-1 text-blue-500 font-medium">· IT Staff</span>}
                          {' · '}{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className={`px-3 py-2 text-sm rounded-2xl ${isIT ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                          {m.content}
                        </div>
                      </div>
                    </div>
                  )
                })
            }
            <div ref={bottomRef} />
          </div>

          {/* Send */}
          {!isResolved && (
            <div className="p-4 border-t border-gray-100 flex gap-2">
              <input value={msg} onChange={e => setMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Type a message…"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <button onClick={sendMessage} disabled={sending || !msg.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40">
                <Send size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ItSupportPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/tickets/my-tickets').then((r: any) => r.data?.data ?? r.data ?? [])
      const all = Array.isArray(res) ? res : []
      setTickets(all.filter((t: any) => IT_CATEGORIES.includes(t.category)))
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-show rating modal for resolved unrated tickets
  const unreatedResolved = tickets.find(t => ['RESOLVED', 'CLOSED'].includes(t.status) && !t.rating)

  const openTickets = tickets.filter(t => !['RESOLVED', 'CLOSED'].includes(t.status))
  const closedTickets = tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status))
  const pendingRatings = closedTickets.filter(t => !t.rating).length

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle size={22} className="text-blue-600" /> IT Support
          </h1>
          <p className="text-sm text-gray-500 mt-1">Report IT issues and track your requests</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm">
          <Plus size={16} /> New Request
        </button>
      </div>

      {/* Pending rating alert */}
      {pendingRatings > 0 && !selected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
          <Star size={18} className="text-yellow-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800">
              You have {pendingRatings} resolved ticket{pendingRatings > 1 ? 's' : ''} awaiting your rating
            </p>
            <p className="text-xs text-yellow-600 mt-0.5">Click on a resolved ticket to rate the support you received</p>
          </div>
          {unreatedResolved && (
            <button onClick={() => setSelected(unreatedResolved)}
              className="shrink-0 px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-xs font-semibold hover:bg-yellow-600">
              Rate Now
            </button>
          )}
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open', count: openTickets.length, icon: <Clock size={18} className="text-blue-500" />, bg: 'bg-blue-50' },
          { label: 'Total', count: tickets.length, icon: <HelpCircle size={18} className="text-gray-500" />, bg: 'bg-gray-50' },
          { label: 'Resolved', count: closedTickets.length, icon: <CheckCircle size={18} className="text-green-500" />, bg: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex items-center gap-3`}>
            {s.icon}
            <div>
              <p className="text-xl font-bold text-gray-900">{s.count}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ticket list */}
      {loading
        ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        )
        : tickets.length === 0
          ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <HelpCircle size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No IT requests yet</p>
              <p className="text-sm text-gray-400 mt-1">Submit your first request to get help from the IT team</p>
              <button onClick={() => setShowCreate(true)}
                className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
                Submit Request
              </button>
            </div>
          )
          : (
            <div className="space-y-3">
              {tickets.map(t => {
                const statusColor = STATUS_COLORS[t.status] ?? '#94A3B8'
                const resolvedUnrated = ['RESOLVED', 'CLOSED'].includes(t.status) && !t.rating
                return (
                  <div key={t.id}
                    className={`bg-white rounded-2xl border p-4 flex items-center gap-4 cursor-pointer hover:shadow-sm transition-all ${resolvedUnrated ? 'border-yellow-300 bg-yellow-50/30' : 'border-gray-100 hover:border-blue-200'}`}
                    onClick={() => setSelected(t)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: statusColor + '22', color: statusColor }}>
                          {t.status?.replace(/_/g, ' ')}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {IT_CATEGORY_LABELS[t.category] ?? t.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: PRIORITY_COLORS[t.priority] + '22', color: PRIORITY_COLORS[t.priority] }}>
                          {t.priority}
                        </span>
                        {resolvedUnrated && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                            <Star size={10} className="fill-yellow-500 text-yellow-500" /> Rate pending
                          </span>
                        )}
                        {t.rating && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            <Star size={10} className="fill-yellow-400 text-yellow-400" /> {t.rating}/5
                          </span>
                        )}
                        {t.slaBreached && <AlertTriangle size={12} className="text-red-500" />}
                        <SLABadge deadline={t.slaDeadline} breached={t.slaBreached} />
                      </div>
                      <p className="font-medium text-gray-800 truncate">{t.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                        {t.assignee && (
                          <p className="text-xs text-blue-500 font-medium">
                            {t.assignee.profile
                              ? `${t.assignee.profile.firstName} ${t.assignee.profile.lastName}`
                              : t.assignee.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </div>
                )
              })}
            </div>
          )
      }

      {showCreate && (
        <CreateDialog onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />
      )}
      {selected && (
        <TicketDetailPanel
          ticket={selected}
          onClose={() => setSelected(null)}
          onRated={() => { setSelected(null); load() }}
        />
      )}
    </div>
  )
}
