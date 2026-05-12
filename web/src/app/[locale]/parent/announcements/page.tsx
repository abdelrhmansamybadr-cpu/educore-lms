'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Skeleton } from '@/components/ui'
import { Bell, Megaphone } from 'lucide-react'

export default function ParentAnnouncementsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/messaging/announcements').then(r => r.data?.data || []),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'إعلانات المدرسة' : 'School Announcements'}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'آخر إعلانات وأخبار المدرسة' : 'Latest school news and announcements'}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-primary-700" />
            <h3 className="font-semibold text-gray-900">{isRtl ? 'جميع الإعلانات' : 'All Announcements'}</h3>
          </div>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
          ) : announcements?.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Bell size={48} className="mx-auto mb-3 opacity-30" />
              <p>{isRtl ? 'لا توجد إعلانات حالياً' : 'No announcements yet'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements?.map((ann: any, idx: number) => (
                <div key={ann.id} className={`p-4 rounded-xl border ${idx === 0 ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${idx === 0 ? 'bg-primary-100' : 'bg-white'}`}>
                      <Megaphone size={16} className={idx === 0 ? 'text-primary-700' : 'text-gray-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm">{ann.title}</h4>
                        {idx === 0 && (
                          <span className="text-xs bg-primary-700 text-white px-2 py-0.5 rounded-full flex-shrink-0">{isRtl ? 'جديد' : 'New'}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{ann.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{ann.createdAt ? new Date(ann.createdAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
                        {ann.author && <span>· {ann.author.profile?.firstName} {ann.author.profile?.lastName}</span>}
                        {ann.targetRole && <span>· {ann.targetRole}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
