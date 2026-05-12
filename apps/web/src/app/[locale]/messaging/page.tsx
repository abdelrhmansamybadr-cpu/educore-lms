'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { useAuthStore } from '@/stores/authStore'
import { Avatar, Skeleton } from '@/components/ui'
import { Send, Search, MessageCircle } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export default function MessagingPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()

  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [searchUser, setSearchUser] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Socket.io connection
  useEffect(() => {
    if (!token) return
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    socket = io(`${apiBase}/messaging`, {
      auth: { token },
      transports: ['websocket'],
    })
    socket.on('new_message', (msg: any) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    })
    return () => { socket?.disconnect(); socket = null }
  }, [token])

  // Join conversation room when active conv changes
  useEffect(() => {
    if (activeConvId && socket) {
      socket.emit('join_conversation', { conversationId: activeConvId })
    }
  }, [activeConvId])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const { data: conversations, isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/messaging/inbox').then((r) => r.data?.data || []),
    refetchInterval: 30000,
  })

  const { isLoading: msgsLoading } = useQuery({
    queryKey: ['conv-messages', activeConvId],
    queryFn: () => api.get(`/messaging/conversations/${activeConvId}/messages`).then((r) => r.data?.data || []),
    enabled: !!activeConvId,
    onSuccess: (data: any[]) => setMessages(data),
  } as any)

  const sendMessage = useMutation({
    mutationFn: () => api.post('/messaging/send', { conversationId: activeConvId, content: input }),
    onSuccess: (data) => {
      const msg = data.data?.data
      if (msg) setMessages((prev) => [...prev, msg])
      setInput('')
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const handleSend = () => {
    if (!input.trim() || !activeConvId || sendMessage.isPending) return
    // Emit via socket too
    socket?.emit('send_message', {
      conversationId: activeConvId,
      content: input,
      contentType: 'TEXT',
    })
    sendMessage.mutate()
  }

  const activeConv = conversations?.find((c: any) => c.id === activeConvId)
  const otherParticipant = activeConv?.participants?.find((p: any) => p.userId !== user?.id)?.user

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Conversations Sidebar */}
      <div className={`flex flex-col border-r border-gray-100 ${activeConvId ? 'hidden md:flex' : 'flex'} w-full md:w-80`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 mb-3">{isRtl ? 'الرسائل' : 'Messages'}</h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              placeholder={isRtl ? 'بحث عن محادثة...' : 'Search conversations...'}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convsLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : conversations?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
              <MessageCircle size={48} className="mb-3 opacity-30" />
              <p className="text-sm">{isRtl ? 'لا توجد محادثات بعد' : 'No conversations yet'}</p>
            </div>
          ) : (
            conversations?.filter((c: any) => {
              if (!searchUser) return true
              const other = c.participants?.find((p: any) => p.userId !== user?.id)?.user
              const name = `${other?.profile?.firstName || ''} ${other?.profile?.lastName || ''}`.toLowerCase()
              return name.includes(searchUser.toLowerCase())
            }).map((conv: any) => {
              const other = conv.participants?.find((p: any) => p.userId !== user?.id)?.user
              const profile = other?.profile
              const lastMsg = conv.lastMessage
              const isActive = conv.id === activeConvId
              const unread = conv.unreadCount > 0

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${isActive ? 'bg-primary-50 border-r-2 border-primary-700' : ''}`}
                >
                  <div className="relative">
                    <Avatar
                      name={`${profile?.firstName} ${profile?.lastName}`}
                      src={profile?.avatar}
                      size="md"
                    />
                    {unread && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-700 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{conv.unreadCount}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className={`text-sm truncate ${unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {isRtl && profile?.firstNameAr
                          ? `${profile.firstNameAr} ${profile.lastNameAr || ''}`
                          : `${profile?.firstName || ''} ${profile?.lastName || ''}`
                        }
                      </p>
                      {lastMsg?.createdAt && (
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {lastMsg && (
                      <p className={`text-xs truncate ${unread ? 'text-gray-700' : 'text-gray-400'}`}>
                        {lastMsg.senderId === user?.id ? (isRtl ? 'أنت: ' : 'You: ') : ''}{lastMsg.content}
                      </p>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      {activeConvId ? (
        <div className="flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <button
              onClick={() => setActiveConvId(null)}
              className="md:hidden p-1 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
            <Avatar
              name={`${otherParticipant?.profile?.firstName} ${otherParticipant?.profile?.lastName}`}
              src={otherParticipant?.profile?.avatar}
              size="sm"
            />
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {isRtl && otherParticipant?.profile?.firstNameAr
                  ? `${otherParticipant.profile.firstNameAr} ${otherParticipant.profile.lastNameAr || ''}`
                  : `${otherParticipant?.profile?.firstName || ''} ${otherParticipant?.profile?.lastName || ''}`
                }
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p className="text-sm">{isRtl ? 'ابدأ المحادثة الآن' : 'Start the conversation'}</p>
              </div>
            ) : (
              messages.map((msg: any) => {
                const isMe = msg.senderId === user?.id
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-primary-900 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}>
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-end gap-2 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-200">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={isRtl ? 'اكتب رسالة...' : 'Type a message...'}
                rows={1}
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400 resize-none max-h-24 py-1"
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement
                  t.style.height = 'auto'
                  t.style.height = Math.min(t.scrollHeight, 96) + 'px'
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sendMessage.isPending}
                className="w-9 h-9 bg-primary-900 text-white rounded-xl flex items-center justify-center hover:bg-primary-800 disabled:opacity-40 flex-shrink-0 transition-colors"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-400">
          <div className="text-center">
            <MessageCircle size={64} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">{isRtl ? 'اختر محادثة للبدء' : 'Select a conversation to start'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
