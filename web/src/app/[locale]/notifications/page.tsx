'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, Skeleton } from '@/components/ui'
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  INFO: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
  SUCCESS: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  WARNING: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ERROR: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ASSIGNMENT: { icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
  GRADE: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  ANNOUNCEMENT: { icon: Bell, color: 'text-primary-700', bg: 'bg-primary-50' },
}

export default function NotificationsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data?.data || []),
    refetchInterval: 30000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const notifications = Array.isArray(data) ? data : (data?.notifications || [])
  const unreadCount = notifications.filter((n: any) => !n.isRead).length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الإشعارات' : 'Notifications'}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {isRtl ? `${unreadCount} إشعار غير مقروء` : `${unreadCount} unread`}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 text-sm text-primary-700 hover:text-primary-900 font-medium"
          >
            <CheckCheck size={16} />
            {isRtl ? 'تحديد الكل كمقروء' : 'Mark all read'}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-16 text-gray-400">
              <Bell size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">{isRtl ? 'لا توجد إشعارات' : 'No notifications'}</p>
              <p className="text-sm mt-1">{isRtl ? 'ستظهر إشعاراتك هنا' : "You're all caught up!"}</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif: any) => {
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.INFO
            const Icon = config.icon
            const timeAgo = notif.createdAt
              ? formatDistanceToNow(new Date(notif.createdAt), {
                  addSuffix: true,
                  locale: isRtl ? ar : undefined,
                })
              : ''

            return (
              <button
                key={notif.id}
                onClick={() => { if (!notif.isRead) markRead.mutate(notif.id) }}
                className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                  notif.isRead
                    ? 'bg-white border-gray-100 hover:border-gray-200'
                    : 'bg-blue-50/50 border-blue-100 hover:border-blue-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                  <Icon size={18} className={config.color} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-sm leading-snug ${notif.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                    {isRtl ? (notif.bodyAr || notif.body) : notif.body}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
