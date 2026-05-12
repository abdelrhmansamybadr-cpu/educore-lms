'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Skeleton } from '@/components/ui'
import { Bell, Plus, Trash2, X } from 'lucide-react'

export default function TeacherAnnouncementsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['teacher-announcements'],
    queryFn: () => api.get('/messaging/announcements').then(r => r.data?.data || []),
  })

  const create = useMutation({
    mutationFn: (data: any) => api.post('/messaging/announcements', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teacher-announcements'] }); setShowCreate(false); setForm({ title: '', content: '' }) },
  })

  const deleteAnn = useMutation({
    mutationFn: (id: string) => api.delete(`/messaging/announcements/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-announcements'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الإعلانات' : 'Announcements'}</h1>
          <p className="text-gray-500 text-sm">{isRtl ? 'أرسل إعلانات لطلابك' : 'Send announcements to your students'}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800">
          <Plus size={16} />{isRtl ? 'إعلان جديد' : 'New Announcement'}
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{isRtl ? 'إعلان جديد' : 'New Announcement'}</h3>
              <button onClick={() => setShowCreate(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={isRtl ? 'عنوان الإعلان' : 'Title'} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500" />
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder={isRtl ? 'نص الإعلان...' : 'Content...'} rows={5} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 resize-none" />
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={() => create.mutate({ title: form.title, content: form.content, targetRole: 'STUDENT' })} disabled={!form.title || !form.content || create.isPending} className="flex-1 py-2.5 bg-primary-900 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                  {create.isPending ? '...' : (isRtl ? 'إرسال' : 'Publish')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-primary-700" />
            <h3 className="font-semibold text-gray-900">{isRtl ? 'الإعلانات' : 'All Announcements'}</h3>
          </div>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : announcements?.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Bell size={40} className="mx-auto mb-2 opacity-30" /><p>{isRtl ? 'لا توجد إعلانات' : 'No announcements'}</p></div>
          ) : (
            <div className="space-y-3">
              {announcements?.map((ann: any) => (
                <div key={ann.id} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{ann.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ann.content}</p>
                    <p className="text-xs text-gray-400 mt-2">{ann.createdAt ? new Date(ann.createdAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : ''}</p>
                  </div>
                  <button onClick={() => { if (confirm(isRtl ? 'حذف؟' : 'Delete?')) deleteAnn.mutate(ann.id) }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
