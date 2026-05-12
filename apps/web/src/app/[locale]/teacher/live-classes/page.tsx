'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, Badge, Skeleton } from '@/components/ui'
import { Video, Plus, Play, Square, Calendar, X } from 'lucide-react'

export default function TeacherLiveClassesPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()
  const [selectedCourse, setSelectedCourse] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', scheduledAt: '', duration: '60' })

  const { data: courses } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: () => api.get('/courses?limit=100').then(r => r.data?.data || []),
  })

  const { data: liveClasses, isLoading } = useQuery({
    queryKey: ['live-classes', selectedCourse],
    queryFn: () => api.get(`/live-classes/course/${selectedCourse}`).then(r => r.data?.data || []),
    enabled: !!selectedCourse,
  })

  const create = useMutation({
    mutationFn: (data: any) => api.post('/live-classes', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['live-classes'] }); setShowCreate(false); setForm({ title: '', scheduledAt: '', duration: '60' }) },
  })

  const endClass = useMutation({
    mutationFn: (id: string) => api.post(`/live-classes/${id}/end`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['live-classes'] }),
  })

  const joinClass = async (id: string) => {
    try {
      const res = await api.post(`/live-classes/${id}/join`)
      const token = res.data?.data?.token
      if (token) window.open(`/live?token=${token}&room=${id}`, '_blank')
    } catch {
      alert(isRtl ? 'تعذر الانضمام' : 'Could not join class')
    }
  }

  const statusColor: Record<string, any> = { SCHEDULED: 'default', LIVE: 'success', ENDED: 'default' }
  const statusLabel: Record<string, string> = { SCHEDULED: isRtl ? 'مجدول' : 'Scheduled', LIVE: isRtl ? 'مباشر' : 'Live', ENDED: isRtl ? 'انتهى' : 'Ended' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الحصص المباشرة' : 'Live Classes'}</h1>
          <p className="text-gray-500 text-sm">{isRtl ? 'جدولة وإدارة الحصص المباشرة' : 'Schedule and manage live sessions'}</p>
        </div>
        {selectedCourse && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800">
            <Plus size={16} />{isRtl ? 'حصة جديدة' : 'New Class'}
          </button>
        )}
      </div>

      {/* Course Selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'المقرر' : 'Course'}</label>
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 min-w-64">
          <option value="">{isRtl ? '-- اختر المقرر --' : '-- Select Course --'}</option>
          {courses?.map((c: any) => <option key={c.id} value={c.id}>{isRtl ? (c.titleAr || c.title) : c.title}</option>)}
        </select>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{isRtl ? 'جدولة حصة مباشرة' : 'Schedule Live Class'}</h3>
              <button onClick={() => setShowCreate(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={isRtl ? 'عنوان الحصة' : 'Class title'} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'وقت البدء' : 'Start Time'}</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'المدة (دقيقة)' : 'Duration (min)'}</label>
                <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button
                  onClick={() => create.mutate({ title: form.title, courseId: selectedCourse, scheduledAt: form.scheduledAt, duration: Number(form.duration) })}
                  disabled={!form.title || !form.scheduledAt || create.isPending}
                  className="flex-1 py-2.5 bg-primary-900 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {create.isPending ? '...' : (isRtl ? 'جدولة' : 'Schedule')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Classes */}
      {!selectedCourse ? (
        <Card><CardBody><div className="text-center py-12 text-gray-400"><Video size={40} className="mx-auto mb-2 opacity-30" /><p>{isRtl ? 'اختر مقررًا لعرض الحصص' : 'Select a course to view classes'}</p></div></CardBody></Card>
      ) : isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : liveClasses?.length === 0 ? (
        <Card><CardBody><div className="text-center py-12 text-gray-400"><Video size={40} className="mx-auto mb-2 opacity-30" /><p>{isRtl ? 'لا توجد حصص مجدولة' : 'No classes scheduled'}</p></div></CardBody></Card>
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
                    <Badge variant={statusColor[cls.status]} className="text-xs">{statusLabel[cls.status] || cls.status}</Badge>
                    {cls.status === 'LIVE' && (
                      <>
                        <button onClick={() => joinClass(cls.id)} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-green-700">
                          <Play size={12} />{isRtl ? 'انضمام' : 'Join'}
                        </button>
                        <button onClick={() => endClass.mutate(cls.id)} className="flex items-center gap-1.5 bg-red-100 text-red-600 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-red-200">
                          <Square size={12} />{isRtl ? 'إنهاء' : 'End'}
                        </button>
                      </>
                    )}
                    {cls.status === 'SCHEDULED' && (
                      <button onClick={() => joinClass(cls.id)} className="flex items-center gap-1.5 bg-primary-900 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-primary-800">
                        <Play size={12} />{isRtl ? 'بدء' : 'Start'}
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
