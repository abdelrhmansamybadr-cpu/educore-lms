'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Avatar, Skeleton } from '@/components/ui'
import { MessageSquare, CheckCircle, Plus, Send, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'

const TICKET_ADMIN_ROLES = new Set(['IT_ADMIN', 'IT_MANAGER', 'IT_STAFF', 'SUPPORT_AGENT', 'SCHOOL_ADMIN', 'VICE_PRINCIPAL', 'DEVELOPER', 'SUPER_ADMIN'])

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'default',
  MEDIUM: 'primary',
  HIGH: 'warning',
  URGENT: 'danger',
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'primary',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
}

// ─── Consumer View (submit & track own tickets) ───────────────────────────────

function TicketSubmitView() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [activeTicket, setActiveTicket] = useState<any>(null)
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', category: 'GENERAL' })
  const [messageText, setMessageText] = useState('')

  const { data: myTickets, isLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => api.get('/tickets/my-tickets').then((r) => r.data?.data || []),
  })

  const { data: ticketMessages } = useQuery({
    queryKey: ['ticket-messages', activeTicket?.id],
    queryFn: () => api.get(`/tickets/${activeTicket.id}/messages`).then((r) => r.data?.data || []),
    enabled: !!activeTicket?.id,
    refetchInterval: 5000,
  })

  const createTicket = useMutation({
    mutationFn: (data: any) => api.post('/tickets', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-tickets'] })
      setShowCreate(false)
      setForm({ title: '', description: '', priority: 'MEDIUM', category: 'GENERAL' })
      toast.success(isRtl ? 'تم إرسال التذكرة' : 'Ticket submitted')
    },
    onError: () => toast.error(isRtl ? 'حدث خطأ' : 'Failed to submit ticket'),
  })

  const sendMessage = useMutation({
    mutationFn: (content: string) => api.post(`/tickets/${activeTicket.id}/messages`, { content }),
    onSuccess: () => {
      setMessageText('')
      qc.invalidateQueries({ queryKey: ['ticket-messages', activeTicket?.id] })
    },
  })

  const ticketList = Array.isArray(myTickets) ? myTickets : []
  const msgList = Array.isArray(ticketMessages) ? ticketMessages : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? '🎫 طلبات الدعم' : '🎫 Support Tickets'}</h1>
          <p className="text-gray-500 text-sm mt-1">{isRtl ? 'أرسل طلب دعم وتابع حالته' : 'Submit a support request and track its progress'}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800"
        >
          <Plus size={16} />
          {isRtl ? 'تذكرة جديدة' : 'New Ticket'}
        </button>
      </div>

      {/* Create Ticket Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader><h3 className="font-semibold">{isRtl ? 'طلب دعم جديد' : 'New Support Request'}</h3></CardHeader>
            <CardBody>
              <div className="space-y-3">
                <input
                  placeholder={isRtl ? 'عنوان المشكلة *' : 'Issue title *'}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                />
                <textarea
                  placeholder={isRtl ? 'وصف المشكلة بالتفصيل...' : 'Describe the issue in detail...'}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500">
                    <option value="LOW">{isRtl ? 'منخفض' : 'Low'}</option>
                    <option value="MEDIUM">{isRtl ? 'متوسط' : 'Medium'}</option>
                    <option value="HIGH">{isRtl ? 'عالي' : 'High'}</option>
                    <option value="URGENT">{isRtl ? 'عاجل' : 'Urgent'}</option>
                  </select>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500">
                    <option value="GENERAL">{isRtl ? 'عام' : 'General'}</option>
                    <option value="IT">{isRtl ? 'تقنية' : 'IT'}</option>
                    <option value="HR">{isRtl ? 'موارد بشرية' : 'HR'}</option>
                    <option value="MAINTENANCE">{isRtl ? 'صيانة' : 'Maintenance'}</option>
                    <option value="FINANCE">{isRtl ? 'مالية' : 'Finance'}</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowCreate(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => createTicket.mutate(form)}
                    disabled={!form.title || !form.description || createTicket.isPending}
                    className="flex-1 bg-primary-900 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60"
                  >
                    {isRtl ? 'إرسال' : 'Submit'}
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* My Tickets List */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{isRtl ? 'تذاكري' : 'My Tickets'}</p>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          ) : ticketList.length === 0 ? (
            <Card>
              <CardBody>
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare size={40} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">{isRtl ? 'لا توجد تذاكر' : 'No tickets yet'}</p>
                </div>
              </CardBody>
            </Card>
          ) : ticketList.map((ticket: any) => (
            <button
              key={ticket.id}
              onClick={() => setActiveTicket(ticket)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                activeTicket?.id === ticket.id ? 'border-primary-300 bg-primary-50' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-gray-900 text-sm line-clamp-1">{ticket.title}</p>
                <Badge variant={STATUS_COLORS[ticket.status] as any} className="text-xs flex-shrink-0">
                  {ticket.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ticket.description}</p>
              <div className="flex items-center justify-between mt-2">
                <Badge variant={PRIORITY_COLORS[ticket.priority] as any} className="text-xs">{ticket.priority}</Badge>
                <span className="text-xs text-gray-400">{new Date(ticket.createdAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Ticket Detail + Chat */}
        <div className="lg:col-span-3">
          {activeTicket ? (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">{activeTicket.title}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge variant={PRIORITY_COLORS[activeTicket.priority] as any}>{activeTicket.priority}</Badge>
                  <Badge variant={STATUS_COLORS[activeTicket.status] as any}>{activeTicket.status}</Badge>
                </div>
              </CardHeader>
              <CardBody>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700">{activeTicket.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(activeTicket.createdAt).toLocaleString(isRtl ? 'ar-SA' : 'en-US')}</p>
                </div>

                {/* Chat Messages */}
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{isRtl ? 'المحادثة' : 'Conversation'}</p>
                  {msgList.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">{isRtl ? 'لا توجد رسائل بعد' : 'No messages yet'}</p>
                  ) : msgList.map((msg: any) => (
                    <div key={msg.id} className="flex gap-2">
                      <Avatar name={msg.user?.profile?.firstName ?? msg.user?.email ?? '?'} size="xs" />
                      <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-xs font-medium text-gray-700">
                          {msg.user?.profile ? `${msg.user.profile.firstName} ${msg.user.profile.lastName}` : msg.user?.email}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">{msg.content}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(msg.createdAt).toLocaleString(isRtl ? 'ar-SA' : 'en-US')}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Send Message */}
                {activeTicket.status !== 'CLOSED' && activeTicket.status !== 'RESOLVED' && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={2}
                      placeholder={isRtl ? 'اكتب رسالة...' : 'Write a message...'}
                      className="w-full px-4 py-3 text-sm outline-none resize-none"
                    />
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => sendMessage.mutate(messageText)}
                        disabled={!messageText.trim() || sendMessage.isPending}
                        className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                      >
                        <Send size={14} />
                        {isRtl ? 'إرسال' : 'Send'}
                      </button>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full bg-white rounded-2xl border border-gray-100 min-h-64 text-gray-400">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                <p>{isRtl ? 'اختر تذكرة لعرض التفاصيل' : 'Select a ticket to view details'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Admin View (manage all tickets) ─────────────────────────────────────────

function TicketAdminView() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [activeTicket, setActiveTicket] = useState<any>(null)
  const [replyText, setReplyText] = useState('')

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['admin-tickets', statusFilter, priorityFilter],
    queryFn: () => api.get('/tickets', { params: { status: statusFilter || undefined, priority: priorityFilter || undefined } })
      .then((r) => r.data?.data || []),
  })

  const { data: ticketDetail } = useQuery({
    queryKey: ['ticket-detail', activeTicket?.id],
    queryFn: () => api.get(`/tickets/${activeTicket.id}`).then((r) => r.data?.data),
    enabled: !!activeTicket?.id,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/tickets/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', activeTicket?.id] })
    },
  })

  const takeTicket = useMutation({
    mutationFn: (id: string) => api.post(`/tickets/${id}/take`, {}),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', id] })
      toast.success('You are now assigned to this ticket')
    },
    onError: () => toast.error('Failed to take ticket'),
  })

  const { data: ticketMessages } = useQuery({
    queryKey: ['ticket-messages', activeTicket?.id],
    queryFn: () => api.get(`/tickets/${activeTicket.id}/messages`).then((r) => r.data?.data || []),
    enabled: !!activeTicket?.id,
    refetchInterval: 5000,
  })

  const msgBottomRef = useRef<HTMLDivElement>(null)

  const sendMessage = useMutation({
    mutationFn: (content: string) => api.post(`/tickets/${activeTicket.id}/messages`, { content }),
    onSuccess: () => {
      setReplyText('')
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', activeTicket?.id] })
      setTimeout(() => msgBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    },
    onError: () => toast.error('Failed to send message'),
  })

  useEffect(() => {
    setTimeout(() => msgBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [ticketMessages])

  function getSlaCountdown(slaDeadline?: string) {
    if (!slaDeadline) return null
    const diff = new Date(slaDeadline).getTime() - Date.now()
    if (diff <= 0) return { label: 'SLA Breached', color: 'text-red-600 bg-red-50' }
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const color = diff < 3600000 ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'
    return { label: `SLA: ${h}h ${m}m left`, color }
  }

  const ticketList = Array.isArray(tickets) ? tickets : []

  const STATS = [
    { label: isRtl ? 'مفتوحة' : 'Open', count: ticketList.filter((t: any) => t.status === 'OPEN').length, color: 'text-blue-600 bg-blue-50' },
    { label: isRtl ? 'قيد المعالجة' : 'In Progress', count: ticketList.filter((t: any) => t.status === 'IN_PROGRESS').length, color: 'text-yellow-600 bg-yellow-50' },
    { label: isRtl ? 'محلولة' : 'Resolved', count: ticketList.filter((t: any) => t.status === 'RESOLVED').length, color: 'text-green-600 bg-green-50' },
    { label: isRtl ? 'عاجلة' : 'Urgent', count: ticketList.filter((t: any) => t.priority === 'URGENT').length, color: 'text-red-600 bg-red-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'نظام التذاكر والدعم' : 'Support Tickets'}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'إدارة طلبات الدعم والمشكلات' : 'Manage support requests and issues'}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className={`text-3xl font-bold ${s.color.split(' ')[0]}`}>{s.count}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500">
              <option value="">{isRtl ? 'كل الحالات' : 'All Status'}</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500">
              <option value="">{isRtl ? 'كل الأولويات' : 'All Priority'}</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : ticketList.length === 0 ? (
              <Card><CardBody><div className="text-center py-8 text-gray-400">{isRtl ? 'لا توجد تذاكر' : 'No tickets'}</div></CardBody></Card>
            ) : ticketList.map((ticket: any) => {
              const submitter = ticket.submitter?.profile
              const isActive = activeTicket?.id === ticket.id
              return (
                <button key={ticket.id} onClick={() => setActiveTicket(ticket)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isActive ? 'border-primary-300 bg-primary-50' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                  }`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900 text-sm line-clamp-1">{ticket.title}</p>
                    <Badge variant={PRIORITY_COLORS[ticket.priority] as any} className="text-xs flex-shrink-0">{ticket.priority}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ticket.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <Avatar name={`${submitter?.firstName ?? '?'} ${submitter?.lastName ?? ''}`} size="xs" />
                      <span className="text-xs text-gray-500">{submitter?.firstName} {submitter?.lastName}</span>
                    </div>
                    <Badge variant={STATUS_COLORS[ticket.status] as any} className="text-xs">{ticket.status}</Badge>
                  </div>
                  {ticket.assignee ? (
                    <p className="text-xs text-blue-500 mt-1.5 flex items-center gap-1">
                      <UserCheck size={11} />
                      {ticket.assignee.profile
                        ? `${ticket.assignee.profile.firstName} ${ticket.assignee.profile.lastName}`
                        : ticket.assignee.email}
                    </p>
                  ) : (
                    <p className="text-xs text-orange-400 mt-1.5">⚡ Unassigned</p>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeTicket ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{ticketDetail?.title || activeTicket.title}</h3>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={PRIORITY_COLORS[activeTicket.priority] as any}>{activeTicket.priority}</Badge>
                      <Badge variant={STATUS_COLORS[activeTicket.status] as any}>{activeTicket.status}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 flex-wrap">
                    {!activeTicket.assigneeId && !['RESOLVED','CLOSED'].includes(activeTicket.status) && (
                      <button onClick={() => takeTicket.mutate(activeTicket.id)} disabled={takeTicket.isPending}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1 disabled:opacity-60">
                        <UserCheck size={12} /> {isRtl ? 'أخذ التذكرة' : 'Take Ticket'}
                      </button>
                    )}
                    {activeTicket.status === 'OPEN' && activeTicket.assigneeId && (
                      <button onClick={() => updateStatus.mutate({ id: activeTicket.id, status: 'IN_PROGRESS' })}
                        className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200">
                        {isRtl ? 'قيد المعالجة' : 'Start Working'}
                      </button>
                    )}
                    {!['RESOLVED','CLOSED'].includes(activeTicket.status) && (
                      <button onClick={() => updateStatus.mutate({ id: activeTicket.id, status: 'RESOLVED' })}
                        className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 flex items-center gap-1">
                        <CheckCircle size={12} />
                        {isRtl ? 'حل' : 'Resolve'}
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {/* Submitter + Assignee row */}
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">From</span>
                    <div className="flex items-center gap-1.5">
                      <Avatar name={activeTicket.submitter?.profile
                        ? `${activeTicket.submitter.profile.firstName} ${activeTicket.submitter.profile.lastName}`
                        : activeTicket.submitter?.email ?? '?'} size="xs" />
                      <span className="text-sm font-medium text-gray-700">
                        {activeTicket.submitter?.profile
                          ? `${activeTicket.submitter.profile.firstName} ${activeTicket.submitter.profile.lastName}`
                          : activeTicket.submitter?.email}
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-300">→</span>
                  {activeTicket.assignee ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 uppercase tracking-wide">Handled by</span>
                      <div className="flex items-center gap-1.5">
                        <Avatar name={activeTicket.assignee.profile
                          ? `${activeTicket.assignee.profile.firstName} ${activeTicket.assignee.profile.lastName}`
                          : activeTicket.assignee.email} size="xs" />
                        <span className="text-sm font-semibold text-blue-700">
                          {activeTicket.assignee.profile
                            ? `${activeTicket.assignee.profile.firstName} ${activeTicket.assignee.profile.lastName}`
                            : activeTicket.assignee.email}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-orange-400 font-medium">⚡ Unassigned — click "Take Ticket" to handle this</span>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">{ticketDetail?.description || activeTicket.description}</p>
                  <p className="text-xs text-gray-400 mt-2">{activeTicket.createdAt ? new Date(activeTicket.createdAt).toLocaleString(isRtl ? 'ar-SA' : 'en-US') : ''}</p>
                </div>

                {(() => {
                  const sla = getSlaCountdown(ticketDetail?.slaDeadline || activeTicket?.slaDeadline)
                  return sla ? (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3 ${sla.color}`}>{sla.label}</div>
                  ) : null
                })()}

                {/* Unified conversation thread */}
                <div className="border border-gray-100 rounded-2xl overflow-hidden flex flex-col" style={{ height: 340 }}>
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {isRtl ? 'المحادثة' : 'Conversation'}
                      <span className="ml-2 text-gray-400 font-normal normal-case">(visible to both employee and IT staff)</span>
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {(!ticketMessages || (Array.isArray(ticketMessages) && (ticketMessages as any[]).length === 0)) && (
                      <p className="text-xs text-gray-400 text-center py-8">{isRtl ? 'لا توجد رسائل بعد' : 'No messages yet — start the conversation'}</p>
                    )}
                    {(Array.isArray(ticketMessages) ? ticketMessages : []).map((msg: any) => {
                      const name = msg.user?.profile
                        ? `${msg.user.profile.firstName} ${msg.user.profile.lastName}`
                        : msg.user?.email ?? '?'
                      const role = msg.user?.role ?? ''
                      const isIT = ['IT_ADMIN','IT_MANAGER','IT_STAFF','SUPPORT_AGENT'].includes(role)
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isIT ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${isIT ? 'bg-blue-600' : 'bg-gray-500'}`}>
                            {name[0]?.toUpperCase()}
                          </div>
                          <div className={`max-w-[75%] ${isIT ? 'items-end' : 'items-start'} flex flex-col`}>
                            <p className="text-xs text-gray-400 mb-0.5">{name}{isIT && <span className="ml-1 text-blue-400">· IT Staff</span>}</p>
                            <div className={`px-3 py-2 rounded-2xl text-sm ${isIT ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                              {msg.content}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={msgBottomRef} />
                  </div>
                  {!['RESOLVED','CLOSED'].includes(activeTicket.status) && (
                    <div className="border-t border-gray-100 flex gap-2 p-2">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (replyText.trim()) sendMessage.mutate(replyText) } }}
                        placeholder={isRtl ? 'اكتب رسالة...' : 'Type a message…'}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
                      />
                      <button
                        onClick={() => { if (replyText.trim()) sendMessage.mutate(replyText) }}
                        disabled={!replyText.trim() || sendMessage.isPending}
                        className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 flex items-center gap-1">
                        <Send size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full bg-white rounded-2xl border border-gray-100 min-h-64 text-gray-400">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                <p>{isRtl ? 'اختر تذكرة لعرض التفاصيل' : 'Select a ticket to view details'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Root Export ──────────────────────────────────────────────────────────────

export default function AdminTicketsPage() {
  const role = useAuthStore((s) => s.user?.role || '')
  return TICKET_ADMIN_ROLES.has(role) ? <TicketAdminView /> : <TicketSubmitView />
}
