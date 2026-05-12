'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { Send, Bot, User, Sparkles, Globe, RefreshCw } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUBJECTS = [
  { en: 'Math', ar: 'رياضيات', value: 'math' },
  { en: 'Science', ar: 'علوم', value: 'science' },
  { en: 'Arabic', ar: 'لغة عربية', value: 'arabic' },
  { en: 'English', ar: 'لغة إنجليزية', value: 'english' },
  { en: 'Physics', ar: 'فيزياء', value: 'physics' },
  { en: 'Chemistry', ar: 'كيمياء', value: 'chemistry' },
  { en: 'Biology', ar: 'أحياء', value: 'biology' },
  { en: 'History', ar: 'تاريخ', value: 'history' },
  { en: 'Geography', ar: 'جغرافيا', value: 'geography' },
  { en: 'General', ar: 'عام', value: 'general' },
]

export default function AITutorPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const user = useAuthStore((s) => s.user)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('general')
  const [chatLanguage, setChatLanguage] = useState<'ar' | 'en'>(locale === 'ar' ? 'ar' : 'en')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Show welcome message
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: chatLanguage === 'ar'
          ? `مرحباً ${user?.firstNameAr || user?.firstName || 'طالبي'}! أنا مدرسك الذكي. كيف يمكنني مساعدتك اليوم؟ 😊\n\nيمكنك سؤالي عن أي مادة دراسية وسأساعدك في الفهم والتعلم.`
          : `Hello ${user?.firstName || 'there'}! I'm your AI tutor. How can I help you today? 😊\n\nYou can ask me about any subject and I'll help you understand and learn.`,
        timestamp: new Date(),
      }
    ])
  }, [chatLanguage])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }))
      const { data } = await api.post('/ai/tutor/chat', {
        messages: [...history, { role: 'user', content: text }],
        subject: selectedSubject,
        language: chatLanguage,
        studentName: user?.firstName,
      })

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data?.data?.response || (chatLanguage === 'ar' ? 'عذراً، حدث خطأ. حاول مرة أخرى.' : 'Sorry, something went wrong. Please try again.'),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: chatLanguage === 'ar'
          ? 'عذراً، حدث خطأ في الاتصال. تأكد من اتصالك بالإنترنت وحاول مجدداً.'
          : 'Sorry, a connection error occurred. Please check your internet and try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: chatLanguage === 'ar'
          ? 'تم بدء محادثة جديدة. كيف يمكنني مساعدتك؟ 😊'
          : 'Started a new conversation. How can I help you? 😊',
        timestamp: new Date(),
      }
    ])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-4 mb-4 text-white flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-primary-900" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">
                {isRtl ? 'المدرس الذكي' : 'AI Tutor'}
              </h2>
              <p className="text-primary-200 text-xs">
                {isRtl ? 'مدعوم بالذكاء الاصطناعي' : 'Powered by Claude AI'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={() => setChatLanguage(chatLanguage === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              <Globe size={14} />
              {chatLanguage === 'ar' ? 'العربية' : 'English'}
            </button>
            {/* Clear Chat */}
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg text-sm transition-colors"
              title={isRtl ? 'محادثة جديدة' : 'New chat'}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Subject Selector */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SUBJECTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSelectedSubject(s.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedSubject === s.value
                  ? 'bg-accent text-primary-900'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {chatLanguage === 'ar' ? s.ar : s.en}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'assistant'
                ? 'bg-gradient-to-br from-primary-900 to-primary-700 text-white'
                : 'bg-accent text-primary-900'
            }`}>
              {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary-900 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-100 text-gray-900 rounded-tl-sm shadow-sm'
              }`}
              dir={chatLanguage === 'ar' ? 'rtl' : 'ltr'}
              >
                {msg.content}
              </div>
              <p className="text-xs text-gray-400 mt-1 px-1">
                {msg.timestamp.toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary-900 to-primary-700 text-white">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0 scrollbar-hide">
          {(chatLanguage === 'ar' ? [
            'اشرح لي هذا الموضوع ببساطة',
            'ساعدني في حل هذه المسألة',
            'اعطني أمثلة تطبيقية',
            'كيف أحفظ هذه المعلومات؟',
          ] : [
            'Explain this topic simply',
            'Help me solve this problem',
            'Give me practical examples',
            'How can I remember this?',
          ]).map((prompt) => (
            <button
              key={prompt}
              onClick={() => { setInput(prompt); inputRef.current?.focus() }}
              className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded-full transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 flex gap-2 items-end bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={chatLanguage === 'ar' ? 'اكتب سؤالك هنا... (Enter للإرسال)' : 'Type your question here... (Enter to send)'}
          rows={1}
          dir={chatLanguage === 'ar' ? 'rtl' : 'ltr'}
          className="flex-1 resize-none bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400 max-h-32 py-1.5 px-2"
          style={{ minHeight: '36px' }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = Math.min(target.scrollHeight, 128) + 'px'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="w-10 h-10 bg-primary-900 text-white rounded-xl flex items-center justify-center hover:bg-primary-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-2 flex-shrink-0">
        {isRtl
          ? 'المدرس الذكي يساعدك على الفهم، لا يحل الواجبات نيابةً عنك'
          : 'AI Tutor helps you understand — not do your homework for you'
        }
      </p>
    </div>
  )
}
