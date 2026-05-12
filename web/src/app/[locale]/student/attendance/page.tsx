'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Skeleton } from '@/components/ui'
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'

const STATUS_CONFIG: Record<string, { color: string; variant: any; icon: any }> = {
  PRESENT: { color: 'text-green-600', variant: 'success', icon: CheckCircle },
  ABSENT: { color: 'text-red-500', variant: 'danger', icon: XCircle },
  LATE: { color: 'text-yellow-600', variant: 'warning', icon: Clock },
  EXCUSED: { color: 'text-blue-500', variant: 'primary', icon: CheckCircle },
}

export default function StudentAttendancePage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const { data, isLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => api.get('/attendance/my').then(r => {
      const d = r.data?.data
      return Array.isArray(d) ? d : (d?.records || d?.data || [])
    }),
  })

  const records = data || []
  const total = records.length
  const present = records.filter((r: any) => r.status === 'PRESENT' || r.status === 'LATE').length
  const absent = records.filter((r: any) => r.status === 'ABSENT').length
  const pct = total > 0 ? Math.round((present / total) * 100) : 0

  const statusLabel: Record<string, string> = {
    PRESENT: isRtl ? 'حاضر' : 'Present',
    ABSENT: isRtl ? 'غائب' : 'Absent',
    LATE: isRtl ? 'متأخر' : 'Late',
    EXCUSED: isRtl ? 'معذور' : 'Excused',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'سجل الحضور' : 'Attendance'}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'سجل حضورك وغيابك' : 'Your attendance record'}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className={`text-3xl font-bold ${pct >= 75 ? 'text-green-600' : 'text-red-500'}`}>{pct}%</p>
          <p className="text-xs text-gray-500 mt-1">{isRtl ? 'نسبة الحضور' : 'Attendance Rate'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-gray-800">{total}</p>
          <p className="text-xs text-gray-500 mt-1">{isRtl ? 'إجمالي الحصص' : 'Total Classes'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{present}</p>
          <p className="text-xs text-gray-500 mt-1">{isRtl ? 'حضور' : 'Present'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-red-500">{absent}</p>
          <p className="text-xs text-gray-500 mt-1">{isRtl ? 'غياب' : 'Absent'}</p>
        </div>
      </div>

      {/* Attendance Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{isRtl ? 'نسبة الحضور الكلية' : 'Overall Attendance'}</span>
          <span className={`text-sm font-bold ${pct >= 75 ? 'text-green-600' : 'text-red-500'}`}>{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div className={`h-3 rounded-full transition-all ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
        </div>
        {pct < 75 && <p className="text-xs text-red-500 mt-2">{isRtl ? '⚠️ نسبة الحضور أقل من الحد المطلوب (75%)' : '⚠️ Attendance below required threshold (75%)'}</p>}
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-primary-700" />
            <h3 className="font-semibold text-gray-900">{isRtl ? 'سجل الحضور التفصيلي' : 'Detailed Attendance Record'}</h3>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : records.length === 0 ? (
            <CardBody>
              <div className="text-center py-12 text-gray-400">
                <Calendar size={40} className="mx-auto mb-2 opacity-30" />
                <p>{isRtl ? 'لا يوجد سجل حضور بعد' : 'No attendance records yet'}</p>
              </div>
            </CardBody>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-start font-semibold text-gray-600">{isRtl ? 'التاريخ' : 'Date'}</th>
                  <th className="px-4 py-3 text-start font-semibold text-gray-600 hidden md:table-cell">{isRtl ? 'المقرر' : 'Course'}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 text-start font-semibold text-gray-600 hidden lg:table-cell">{isRtl ? 'ملاحظة' : 'Note'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((rec: any) => {
                  const cfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.PRESENT
                  const Icon = cfg.icon
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{rec.date ? new Date(rec.date).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">{rec.course?.title || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={cfg.variant} className="text-xs inline-flex items-center gap-1">
                          <Icon size={10} />
                          {statusLabel[rec.status] || rec.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">{rec.note || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
