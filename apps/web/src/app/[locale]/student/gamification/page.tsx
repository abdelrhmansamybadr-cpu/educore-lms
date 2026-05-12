'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, CardHeader, Skeleton } from '@/components/ui'
import { Trophy, Star, Zap, Medal } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export default function StudentGamificationPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const user = useAuthStore((s) => s.user)

  const { data: points, isLoading: pointsLoading } = useQuery({
    queryKey: ['my-points'],
    queryFn: () => api.get('/gamification/my-points').then((r) => r.data?.data),
  })

  const { data: badges, isLoading: badgesLoading } = useQuery({
    queryKey: ['my-badges'],
    queryFn: () => api.get('/gamification/my-badges').then((r) => r.data?.data || []),
  })

  const { data: leaderboard, isLoading: lbLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/gamification/leaderboard').then((r) => r.data?.data || []),
  })

  const myRank = leaderboard?.findIndex((e: any) => e.userId === user?.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'المكافآت والإنجازات' : 'Rewards & Achievements'}</h1>
        <p className="text-gray-500 text-sm mt-1">{isRtl ? 'نقاطك وشاراتك ومركزك' : 'Your points, badges and ranking'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Star, label: isRtl ? 'إجمالي النقاط' : 'Total Points', value: points?.total ?? 0, color: 'bg-yellow-50 text-yellow-700' },
          { icon: Zap, label: isRtl ? 'التتابع' : 'Streak', value: `${points?.streak ?? 0} ${isRtl ? 'يوم' : 'days'}`, color: 'bg-orange-50 text-orange-700' },
          { icon: Trophy, label: isRtl ? 'مركزي' : 'My Rank', value: myRank !== undefined && myRank >= 0 ? `#${myRank + 1}` : '—', color: 'bg-primary-50 text-primary-700' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              {pointsLoading ? <Skeleton className="h-6 w-16 mb-1" /> : (
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              )}
              <p className="text-xs text-gray-500">{stat.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Badges */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">{isRtl ? 'شاراتي' : 'My Badges'}</h3>
        </CardHeader>
        <CardBody>
          {badgesLoading ? (
            <div className="flex gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-16 rounded-xl" />)}</div>
          ) : (badges || []).length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Medal size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">{isRtl ? 'لم تحصل على شارات بعد' : 'No badges yet — keep earning points!'}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {(badges || []).map((ub: any) => (
                <div key={ub.id} className="flex flex-col items-center gap-1">
                  <div className="w-14 h-14 bg-yellow-50 border-2 border-yellow-200 rounded-xl flex items-center justify-center text-2xl">
                    {ub.badge?.icon || '🏅'}
                  </div>
                  <p className="text-xs text-gray-600 font-medium text-center max-w-[60px] leading-tight">
                    {isRtl ? (ub.badge?.nameAr || ub.badge?.name) : ub.badge?.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">{isRtl ? 'المتصدرون' : 'Leaderboard'}</h3>
        </CardHeader>
        <CardBody>
          {lbLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (leaderboard || []).length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">{isRtl ? 'لا توجد بيانات' : 'No data yet'}</p>
          ) : (
            <div className="space-y-2">
              {(leaderboard || []).slice(0, 10).map((entry: any, idx: number) => {
                const isMe = entry.userId === user?.id
                const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600']
                return (
                  <div key={entry.userId} className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? 'bg-primary-50 border border-primary-200' : 'border border-gray-50 hover:border-gray-100'}`}>
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${idx < 3 ? 'bg-gray-100' : 'text-gray-400'}`}>
                      {idx < 3 ? <Trophy size={14} className={medalColors[idx]} /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isMe ? 'text-primary-800' : 'text-gray-900'}`}>
                        {isRtl ? entry.nameAr : entry.name}
                        {isMe && <span className="ms-1 text-xs text-primary-500">({isRtl ? 'أنا' : 'You'})</span>}
                      </p>
                      <p className="text-xs text-gray-500">{entry.badgeCount} {isRtl ? 'شارة' : 'badges'} · {entry.streak} {isRtl ? 'يوم' : 'day streak'}</p>
                    </div>
                    <div className="text-sm font-bold text-gray-900">{entry.totalPoints.toLocaleString()} <span className="text-xs font-normal text-gray-500">{isRtl ? 'نقطة' : 'pts'}</span></div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Point History */}
      {points?.history?.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">{isRtl ? 'سجل النقاط' : 'Points History'}</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {points.history.map((event: any) => (
                <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <p className="text-sm text-gray-700">{event.reason}</p>
                  <span className="text-sm font-bold text-green-600">+{event.amount}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
