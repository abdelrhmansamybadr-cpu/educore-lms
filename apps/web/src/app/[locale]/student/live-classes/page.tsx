'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, Badge, Skeleton } from '@/components/ui'
import { Video, Calendar, Play } from 'lucide-react'

export default function StudentLiveClassesPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [selectedCourse, setSelectedCourse] = useState('')

  const { data: courses } = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => api.get('/courses/my-courses').then(r => r.data?.data || []),
  })

  const { data: liveClasses, isLoading } = useQuery({
    queryKey: ['student-live-classes', selectedCourse],
    queryFn: () => api.get(`/live-classes/course/${selectedCourse}`).then(r => r.data?.data || []),
    enabled: !!selectedCourse,
  })

  const joinClass = async (id: string) => {
    try {
      const res = await api.post(`/live-classes/${id}/join`)
      const token = res.data?.data?.token
      if (token) window.open(`/live?token=${token}&room=${id}`, '_blank')
    } catch {
      alert(isRtl ? 'الحصة غير متاحة الآن' : 'Class is not available')
    }
  }

  const statusLabel: Record<string, string> = {
    SCHEDULED: isRtl ? 'مجدول' : 'Scheduled',
    LIVE: isRtl ? 'مباشر الآن' : 'Live Now',
    ENDED: isRtl ? 'انتهت' : 'Ended',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الحصص المباشرة' : 'Live Classes'}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'انضم إلى حصصك المباشرة' : 'Join your live class sessions'}</p>
      </div>

      {/* Course Selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'المقرر' : 'Course'}</label>
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 min-w-64">
          <option value="">{isRtl ? '-- اختر المقرر --' : '-- Select Course --'}</option>
          {courses?.map((c: any) => <option key={c.id} value={c.id}>{isRtl ? (c.titleAr || c.title) : c.title}</option>)}
        </select>
      </div>

      {/* Live Now Banner */}
      {liveClasses?.filter((c: any) => c.status === 'LIVE').map((cls: any) => (
        <div key={cls.id} className="bg-green-600 text-white rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <div>
              <p className="font-bold text-lg">{cls.title}</p>
              <p className="text-green-100 text-sm">{isRtl ? 'الحصة تبث الآن' : 'Class is live now'}</p>
            </div>
          </div>
          <button onClick={() => joinClass(cls.id)} className="flex items-center gap-2 bg-white text-green-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-50">
            <Play size={16} />{isRtl ? 'انضم الآن' : 'Join Now'}
          </button>
        </div>
      ))}

      {!selectedCourse ? (
        <Card><CardBody><div className="text-center py-16 text-gray-400"><Video size={48} className="mx-auto mb-3 opacity-30" /><p>{isRtl ? 'اختر مقررًا لعرض الحصص' : 'Select a course to view classes'}</p></div></CardBody></Card>
      ) : isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : liveClasses?.length === 0 ? (
        <Card><CardBody><div className="text-center py-16 text-gray-400"><Video size={48} className="mx-auto mb-3 opacity-30" /><p>{isRtl ? 'لا توجد حصص مباشرة' : 'No live classes scheduled'}</p></div></CardBody></Card>
      ) : (
        <div className="space-y-3">
          {liveClasses?.map((cls: any) => (
            <Card key={cls.id} className={cls.status === 'LIVE' ? 'border-green-200' : ''}>
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${cls.status === 'LIVE' ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Video size={18} className={cls.status === 'LIVE' ? 'text-green-600' : 'text-gray-500'} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{cls.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <Calendar size={11} />
                        {cls.scheduledAt ? new Date(cls.scheduledAt).toLocaleString(isRtl ? 'ar-SA' : 'en-US') : '—'}
                        <span>· {cls.duration} {isRtl ? 'دقيقة' : 'min'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={cls.status === 'LIVE' ? 'success' : cls.status === 'ENDED' ? 'default' : 'primary'} className="text-xs">
                      {statusLabel[cls.status] || cls.status}
                    </Badge>
                    {cls.status === 'LIVE' && (
                      <button onClick={() => joinClass(cls.id)} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-green-700">
                        <Play size={12} />{isRtl ? 'انضمام' : 'Join'}
                      </button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
