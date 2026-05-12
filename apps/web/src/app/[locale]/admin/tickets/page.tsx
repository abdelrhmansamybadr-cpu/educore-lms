'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Avatar, Skeleton } from '@/components/ui'
import { MessageSquare, CheckCircle } from 'lucide-react'

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

export default function AdminTicketsPage() {
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

  const { data: ticketMessages } = useQuery({
    queryKey: ['ticket-messages', activeTicket?.id],
    queryFn: () => api.get(`/tickets/${activeTicket.id}/messages`).then((r) => r.data?.data || []),
    enabled: !!activeTicket?.id,
    refetchInterval: 5000,
  })

  const addReply = useMutation({
    mutationFn: () => api.post(`/tickets/${activeTicket.id}/reply`, { content: replyText }),
    onSuccess: () => {
      setReplyText('')
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', activeTicket?.id] })
    },
  })

  const sendMessage = useMutation({
    mutationFn: (content: string) => api.post(`/tickets/${activeTicket.id}/messages`, { content }),
    onSuccess: () => {
      setReplyText('')
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', activeTicket?.id] })
    },
  })

  function getSlaCountdown(slaDeadline?: string) {
    if (!slaDeadline) return null
    const diff = new Date(slaDeadline).getTime() - Date.now()
    if (diff <= 0) return { label: 'SLA Breached', color: 'text-red-600 bg-red-50' }
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const color = diff < 3600000 ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'
    return { label: `SLA: ${h}h ${m}m left`, color }
  }

  const STATS = [
    { label: isRtl ? 'مفتوحة' : 'Open', count: tickets?.filter((t: any) => t.status === 'OPEN').length || 0, color: 'text-blue-600 bg-blue-50' },
    { label: isRtl ? 'قيد المعالجة' : 'In Progress', count: tickets?.filter((t: any) => t.status === 'IN_PROGRESS').length || 0, color: 'text-yellow-600 bg-yellow-50' },
    { label: isRtl ? 'محلولة' : 'Resolved', count: tickets?.filter((t: any) => t.status === 'RESOLVED').length || 0, color: 'text-green-600 bg-green-50' },
    { label: isRtl ? 'عاجلة' : 'Urgent', count: tickets?.filter((t: any) => t.priority === 'URGENT').length || 0, color: 'text-red-600 bg-red-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'نظام التذاكر والدعم' : 'Support Tickets'}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'إدارة طلبات الدعم والمشكلات' : 'Manage support requests and issues'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className={`text-3xl font-bold ${s.color.split(' ')[0]}`}>{s.count}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
            >
              <option value="">{isRtl ? 'كل الحالات' : 'All Status'}</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
            >
              <option value="">{isRtl ? 'كل الأولويات' : 'All Priority'}</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* List */}
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : tickets?.length === 0 ? (
              <Card><CardBody><div className="text-center py-8 text-gray-400">{isRtl ? 'لا توجد تذاكر' : 'No tickets'}</div></CardBody></Card>
            ) : tickets?.map((ticket: any) => {
              const submitter = ticket.submitter?.profile
              const isActive = activeTicket?.id === ticket.id
              return (
                <button
                  key={ticket.id}
                  onClick={() => setActiveTicket(ticket)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isActive ? 'border-primary-300 bg-primary-50' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900 text-sm line-clamp-1">{ticket.title}</p>
                    <Badge variant={PRIORITY_COLORS[ticket.priority] as any} className="text-xs flex-shrink-0">
                      {ticket.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ticket.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <Avatar name={`${submitter?.firstName} ${submitter?.lastName}`} size="xs" />
                      <span className="text-xs text-gray-500">
                        {submitter?.firstName} {submitter?.lastName}
                      </span>
                    </div>
                    <Badge variant={STATUS_COLORS[ticket.status] as any} className="text-xs">
                      {ticket.status}
                    </Badge>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Ticket Detail */}
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
                  <div className="flex gap-2 flex-shrink-0">
                    {activeTicket.status === 'OPEN' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: activeTicket.id, status: 'IN_PROGRESS' })}
                        className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200"
                      >
                        {isRtl ? 'قيد المعالجة' : 'Start Working'}
                      </button>
                    )}
                    {activeTicket.status !== 'RESOLVED' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: activeTicket.id, status: 'RESOLVED' })}
                        className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200"
                      >
                        <CheckCircle size={12} className="inline mr-1" />
                        {isRtl ? 'حل' : 'Resolve'}
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {ticketDetail?.description || activeTicket.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {activeTicket.createdAt ? new Date(activeTicket.createdAt).toLocaleString(isRtl ? 'ar-SA' : 'en-US') : ''}
                  </p>
                </div>

                {/* SLA Badge */}
                {(() => {
                  const sla = getSlaCountdown(ticketDetail?.slaDeadline || activeTicket?.slaDeadline)
                  return sla ? (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3 ${sla.color}`}>
                      {sla.label}
                    </div>
                  ) : null
                })()}

                {/* Chat Messages */}
                <div className="space-y-2 mb-4 max-h-52 overflow-y-auto">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{isRtl ? 'الرسائل' : 'Messages'}</p>
                  {(!ticketMessages || ticketMessages.length === 0) && (
                    <p className="text-xs text-gray-400 text-center py-4">{isRtl ? 'لا توجد رسائل بعد' : 'No messages yet'}</p>
                  )}
                  {(ticketMessages ?? []).map((msg: any) => (
                    <div key={msg.id} className="flex gap-2">
                      <Avatar name={`${msg.user?.profile?.firstName ?? msg.user?.email}`} size="xs" />
                      <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-xs font-medium text-gray-700">
                          {msg.user?.profile ? `${msg.user.profile.firstName} ${msg.user.profile.lastName}` : msg.user?.email}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">{msg.content}</p>
                        {msg.attachmentUrl && (
                          <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline mt-1 block">
                            {isRtl ? 'مرفق' : 'Attachment'}
                          </a>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{new Date(msg.createdAt).toLocaleString(isRtl ? 'ar-SA' : 'en-US')}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Replies */}
                <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{isRtl ? 'الردود' : 'Replies'}</p>
                  {ticketDetail?.replies?.map((reply: any) => (
                    <div key={reply.id} className="flex gap-3">
                      <Avatar name={`${reply.user?.profile?.firstName}`} size="xs" />
                      <div className="flex-1 bg-white border border-gray-100 rounded-xl p-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          {reply.user?.profile?.firstName} {reply.user?.profile?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{reply.content}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {reply.createdAt ? new Date(reply.createdAt).toLocaleString(isRtl ? 'ar-SA' : 'en-US') : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    placeholder={isRtl ? 'اكتب رسالة...' : 'Write a message...'}
                    className="w-full px-4 py-3 text-sm outline-none resize-none"
                  />
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                    <button
                      onClick={() => addReply.mutate()}
                      disabled={!replyText.trim() || addReply.isPending}
                      className="border border-gray-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
                    >
                      {isRtl ? 'رد رسمي' : 'Reply'}
                    </button>
                    <button
                      onClick={() => sendMessage.mutate(replyText)}
                      disabled={!replyText.trim() || sendMessage.isPending}
                      className="bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-50"
                    >
                      {isRtl ? 'إرسال رسالة' : 'Send Message'}
                    </button>
                  </div>
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
