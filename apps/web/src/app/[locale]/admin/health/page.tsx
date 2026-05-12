'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, CardHeader, Skeleton } from '@/components/ui'
import { Plus, Heart, Home } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function AdminHealthPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const qc = useQueryClient()
  const [showLog, setShowLog] = useState(false)
  const [visitForm, setVisitForm] = useState({ studentId: '', complaint: '', treatment: '', temperature: '', sentHome: false, parentNotified: false })

  const { data: visits, isLoading } = useQuery({
    queryKey: ['health-visits'],
    queryFn: () => api.get('/health/visits').then((r) => r.data?.data || []),
  })

  const logVisit = useMutation({
    mutationFn: (data: any) => api.post('/health/visits', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health-visits'] })
      setShowLog(false)
      setVisitForm({ studentId: '', complaint: '', treatment: '', temperature: '', sentHome: false, parentNotified: false })
      toast.success(isRtl ? 'تم تسجيل الزيارة' : 'Visit logged')
    },
    onError: () => toast.error(isRtl ? 'حدث خطأ' : 'Failed to log visit'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الصحة والتمريض' : 'Health & Nursing'}</h1>
          <p className="text-gray-500 text-sm mt-1">{isRtl ? 'سجل زيارات الطلاب للعيادة' : 'Student nurse visit records'}</p>
        </div>
        <button
          onClick={() => setShowLog(true)}
          className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800"
        >
          <Plus size={16} />
          {isRtl ? 'تسجيل زيارة' : 'Log Visit'}
        </button>
      </div>

      {showLog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader><h3 className="font-semibold">{isRtl ? 'تسجيل زيارة طبية' : 'Log Health Visit'}</h3></CardHeader>
            <CardBody>
              <div className="space-y-3">
                <input placeholder={isRtl ? 'معرّف الطالب (User ID)' : 'Student User ID'} value={visitForm.studentId}
                  onChange={(e) => setVisitForm((f) => ({ ...f, studentId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                <textarea placeholder={isRtl ? 'الشكوى *' : 'Complaint *'} value={visitForm.complaint} rows={2}
                  onChange={(e) => setVisitForm((f) => ({ ...f, complaint: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 resize-none" />
                <textarea placeholder={isRtl ? 'العلاج المُعطى' : 'Treatment given'} value={visitForm.treatment} rows={2}
                  onChange={(e) => setVisitForm((f) => ({ ...f, treatment: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 resize-none" />
                <input type="number" step="0.1" placeholder={isRtl ? 'درجة الحرارة (°C)' : 'Temperature (°C)'} value={visitForm.temperature}
                  onChange={(e) => setVisitForm((f) => ({ ...f, temperature: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={visitForm.sentHome} onChange={(e) => setVisitForm((f) => ({ ...f, sentHome: e.target.checked }))} />
                    {isRtl ? 'أُرسل للمنزل' : 'Sent home'}
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={visitForm.parentNotified} onChange={(e) => setVisitForm((f) => ({ ...f, parentNotified: e.target.checked }))} />
                    {isRtl ? 'تم إبلاغ ولي الأمر' : 'Parent notified'}
                  </label>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowLog(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => logVisit.mutate({ ...visitForm, temperature: visitForm.temperature ? Number(visitForm.temperature) : undefined })}
                    disabled={!visitForm.studentId || !visitForm.complaint || logVisit.isPending}
                    className="flex-1 bg-primary-900 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60"
                  >
                    {isRtl ? 'تسجيل' : 'Log'}
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <Card>
        <CardBody>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : (visits || []).length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Heart size={40} className="mx-auto mb-3 opacity-30" />
              <p>{isRtl ? 'لا توجد زيارات' : 'No visits recorded'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(visits || []).map((visit: any) => (
                <div key={visit.id} className="p-4 rounded-xl border border-gray-100 hover:border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {visit.student?.profile?.firstName} {visit.student?.profile?.lastName}
                        </p>
                        {visit.sentHome && (
                          <span className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                            <Home size={11} />{isRtl ? 'أُرسل للمنزل' : 'Sent home'}
                          </span>
                        )}
                        {visit.parentNotified && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {isRtl ? 'تم إبلاغ ولي الأمر' : 'Parent notified'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{visit.complaint}</p>
                      {visit.treatment && <p className="text-xs text-gray-500 mt-0.5">{isRtl ? 'العلاج: ' : 'Treatment: '}{visit.treatment}</p>}
                      {visit.temperature && <p className="text-xs text-gray-500">{isRtl ? 'الحرارة: ' : 'Temp: '}{visit.temperature}°C</p>}
                    </div>
                    <p className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(visit.visitedAt), { addSuffix: true, locale: isRtl ? ar : undefined })}
                    </p>
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
