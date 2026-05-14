'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, Skeleton } from '@/components/ui'
import { Plus, CalendarDays, MapPin, Trash2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'

const EVENT_ADMIN_ROLES = new Set(['EVENT_COORDINATOR', 'SCHOOL_ADMIN', 'VICE_PRINCIPAL', 'ACADEMIC_DIRECTOR', 'DEVELOPER', 'SUPER_ADMIN'])

// ─── Consumer View (view upcoming events) ────────────────────────────────────

function EventsViewerView() {
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const { data: events, isLoading } = useQuery({
    queryKey: ['public-events'],
    queryFn: () => api.get('/events').then((r) => r.data?.data || []),
  })

  const eventList = Array.isArray(events) ? events : []
  const now = new Date()
  const upcoming = eventList.filter((e: any) => new Date(e.startDate) >= now)
  const past = eventList.filter((e: any) => new Date(e.startDate) < now)

  function formatEventDate(event: any) {
    const start = new Date(event.startDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { dateStyle: 'long' })
    if (event.endDate) {
      const end = new Date(event.endDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { dateStyle: 'long' })
      return `${start} → ${end}`
    }
    return start
  }

  function EventCard({ event, isPast }: { event: any; isPast?: boolean }) {
    return (
      <Card className={isPast ? 'opacity-60' : ''}>
        <CardBody>
          <div className="flex gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl ${
              isPast ? 'bg-gray-100' : 'bg-primary-100'
            }`}>
              🎉
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{isRtl ? (event.titleAr || event.title) : event.title}</h3>
              {event.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{event.description}</p>}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className={`flex items-center gap-1 text-xs font-medium ${isPast ? 'text-gray-400' : 'text-primary-700'}`}>
                  <CalendarDays size={12} />
                  {formatEventDate(event)}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={11} />{event.location}
                  </span>
                )}
              </div>
            </div>
            {!isPast && (
              <div className="flex-shrink-0">
                <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
                  {isRtl ? 'قادم' : 'Upcoming'}
                </span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? '🎉 الفعاليات' : '🎉 Events'}</h1>
        <p className="text-gray-500 text-sm mt-1">{isRtl ? 'الفعاليات والأنشطة المدرسية القادمة' : 'Upcoming school events and activities'}</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : eventList.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12 text-gray-400">
              <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
              <p>{isRtl ? 'لا توجد فعاليات مجدولة' : 'No events scheduled'}</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{isRtl ? 'الفعاليات القادمة' : 'Upcoming Events'}</p>
              {upcoming.map((event: any) => <EventCard key={event.id} event={event} />)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">{isRtl ? 'الفعاليات السابقة' : 'Past Events'}</p>
              {past.map((event: any) => <EventCard key={event.id} event={event} isPast />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Admin View (manage events) ───────────────────────────────────────────────

// ── Defined outside EventsAdminView to prevent input focus loss on re-render ──
function EventForm({ onSubmit, onClose, isPending, isEditing, form, setForm }: {
  onSubmit: () => void
  onClose: () => void
  isPending: boolean
  isEditing: boolean
  form: any
  setForm: (fn: any) => void
}) {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3">
        <h3 className="font-semibold text-gray-900">{isEditing ? (isRtl ? 'تعديل الفعالية' : 'Edit Event') : (isRtl ? 'فعالية جديدة' : 'New Event')}</h3>
        <input placeholder={isRtl ? 'العنوان (إنجليزي) *' : 'Title *'} value={form.title}
          onChange={(e) => setForm((f: any) => ({ ...f, title: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
        <input placeholder="العنوان (عربي)" value={form.titleAr} dir="rtl"
          onChange={(e) => setForm((f: any) => ({ ...f, titleAr: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
        <textarea placeholder={isRtl ? 'الوصف' : 'Description'} value={form.description} rows={2}
          onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 resize-none" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">{isRtl ? 'تاريخ البداية' : 'Start Date'}</label>
            <input type="datetime-local" value={form.startDate}
              onChange={(e) => setForm((f: any) => ({ ...f, startDate: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500">{isRtl ? 'تاريخ النهاية' : 'End Date'}</label>
            <input type="datetime-local" value={form.endDate}
              onChange={(e) => setForm((f: any) => ({ ...f, endDate: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500" />
          </div>
        </div>
        <input placeholder={isRtl ? 'الموقع' : 'Location'} value={form.location}
          onChange={(e) => setForm((f: any) => ({ ...f, location: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={onSubmit} disabled={!form.title || !form.startDate || isPending}
            className="flex-1 bg-primary-900 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60">
            {isRtl ? 'حفظ' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EventsAdminView() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editEvent, setEditEvent] = useState<any>(null)
  const [form, setForm] = useState({ title: '', titleAr: '', description: '', startDate: '', endDate: '', location: '' })

  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => api.get('/events').then((r) => r.data?.data || []),
  })

  const createEvent = useMutation({
    mutationFn: (data: any) => api.post('/events', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-events'] })
      setShowCreate(false)
      setForm({ title: '', titleAr: '', description: '', startDate: '', endDate: '', location: '' })
      toast.success(isRtl ? 'تم إنشاء الفعالية' : 'Event created')
    },
  })

  const updateEvent = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/events/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-events'] })
      setEditEvent(null)
      toast.success(isRtl ? 'تم التحديث' : 'Updated')
    },
  })

  const deleteEvent = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-events'] })
      toast.success(isRtl ? 'تم الحذف' : 'Deleted')
    },
  })

  // EventForm defined outside this component (above EventsAdminView) to prevent input focus loss

  const eventList = Array.isArray(events) ? events : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الفعاليات' : 'Events'}</h1>
          <p className="text-gray-500 text-sm mt-1">{isRtl ? 'إدارة فعاليات المدرسة' : 'Manage school events'}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800">
          <Plus size={16} />
          {isRtl ? 'فعالية جديدة' : 'New Event'}
        </button>
      </div>

      {showCreate && (
        <EventForm
          isEditing={false}
          form={form}
          setForm={(fn: any) => setForm((f) => typeof fn === 'function' ? fn(f) : fn)}
          onClose={() => setShowCreate(false)}
          isPending={createEvent.isPending}
          onSubmit={() => createEvent.mutate({ ...form, startDate: form.startDate ? new Date(form.startDate) : undefined, endDate: form.endDate ? new Date(form.endDate) : undefined })}
        />
      )}
      {editEvent && (
        <EventForm
          isEditing={true}
          form={editEvent}
          setForm={(fn: any) => setEditEvent((f: any) => typeof fn === 'function' ? fn(f) : fn)}
          onClose={() => setEditEvent(null)}
          isPending={updateEvent.isPending}
          onSubmit={() => updateEvent.mutate({ id: editEvent.id, data: { title: editEvent.title, titleAr: editEvent.titleAr, description: editEvent.description, location: editEvent.location, startDate: editEvent.startDate ? new Date(editEvent.startDate) : undefined, endDate: editEvent.endDate ? new Date(editEvent.endDate) : undefined } })}
        />
      )}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : eventList.length === 0 ? (
        <Card><CardBody>
          <div className="text-center py-12 text-gray-400">
            <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
            <p>{isRtl ? 'لا توجد فعاليات' : 'No events'}</p>
          </div>
        </CardBody></Card>
      ) : (
        <div className="space-y-3">
          {eventList.map((event: any) => (
            <Card key={event.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0 text-center">
                      <CalendarDays size={20} className="text-primary-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{isRtl ? (event.titleAr || event.title) : event.title}</h3>
                      {event.description && <p className="text-sm text-gray-500 mt-0.5">{event.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs text-gray-500">
                          {new Date(event.startDate).toLocaleDateString(isRtl ? 'ar' : 'en', { dateStyle: 'medium' })}
                          {event.endDate && ` → ${new Date(event.endDate).toLocaleDateString(isRtl ? 'ar' : 'en', { dateStyle: 'medium' })}`}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={11} />{event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditEvent(event)} className="p-1.5 text-gray-400 hover:text-primary-700 hover:bg-primary-50 rounded-lg"><Edit2 size={14} /></button>
                    <button onClick={() => deleteEvent.mutate(event.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
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

// ─── Root Export ──────────────────────────────────────────────────────────────

export default function AdminEventsPage() {
  const role = useAuthStore((s) => s.user?.role || '')
  return EVENT_ADMIN_ROLES.has(role) ? <EventsAdminView /> : <EventsViewerView />
}
