'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Skeleton } from '@/components/ui'
import { UserCheck, AlertTriangle, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminAttendancePage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const { data: overview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data?.data || r.data),
  })

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics-attendance'],
    queryFn: () => api.get('/analytics/attendance?days=30').then(r => r.data?.data || r.data || []),
  })

  const { data: atRisk } = useQuery({
    queryKey: ['analytics-at-risk'],
    queryFn: () => api.get('/analytics/at-risk').then(r => r.data?.data || r.data || []),
  })

  const lowAttendanceStudents = (atRisk || []).filter((s: any) => s.riskFactors.includes('low_attendance'))

  const chartData = (trends || []).map((t: any) => ({
    date: new Date(t.date).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }),
    rate: t.rate,
    present: t.present,
    absent: t.absent,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'تقارير الحضور' : 'Attendance Reports'}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'متابعة حضور الطلاب خلال الثلاثين يوماً الماضية' : 'Student attendance over the last 30 days'}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck size={20} className="text-green-600" />
            <span className="text-sm text-gray-500">{isRtl ? 'متوسط الحضور' : 'Avg Attendance'}</span>
          </div>
          <p className="text-3xl font-bold text-green-700">{overview?.avgAttendance ?? '—'}%</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="text-blue-600" />
            <span className="text-sm text-gray-500">{isRtl ? 'إجمالي الطلاب' : 'Total Students'}</span>
          </div>
          <p className="text-3xl font-bold text-blue-700">{overview?.totalStudents ?? '—'}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 col-span-2 md:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle size={20} className="text-red-600" />
            <span className="text-sm text-gray-500">{isRtl ? 'حضور منخفض' : 'Low Attendance'}</span>
          </div>
          <p className="text-3xl font-bold text-red-700">{lowAttendanceStudents.length}</p>
          <p className="text-xs text-gray-400">{isRtl ? 'طلاب تحت 75%' : 'students below 75%'}</p>
        </div>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-700" />
            <h3 className="font-semibold text-gray-900">{isRtl ? 'اتجاه الحضور (30 يوماً)' : 'Attendance Trend (30 Days)'}</h3>
          </div>
        </CardHeader>
        <CardBody>
          {trendsLoading ? (
            <Skeleton className="h-48" />
          ) : chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              {isRtl ? 'لا توجد بيانات حضور بعد' : 'No attendance data yet'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Line
                  type="monotone" dataKey="rate"
                  name={isRtl ? 'نسبة الحضور' : 'Attendance Rate'}
                  stroke="#22c55e" strokeWidth={2} dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Table */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">{isRtl ? 'التفاصيل اليومية' : 'Daily Breakdown'}</h3>
          </CardHeader>
          <div className="overflow-auto max-h-72">
            {trendsLoading ? (
              <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}</div>
            ) : trends?.length === 0 ? (
              <CardBody>
                <p className="text-sm text-gray-400 text-center py-6">{isRtl ? 'لا توجد بيانات' : 'No data'}</p>
              </CardBody>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-2 text-start text-xs font-semibold text-gray-600">{isRtl ? 'التاريخ' : 'Date'}</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-green-600">{isRtl ? 'حاضر' : 'Present'}</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-red-600">{isRtl ? 'غائب' : 'Absent'}</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">{isRtl ? 'النسبة' : 'Rate'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...(trends || [])].reverse().map((t: any) => (
                    <tr key={t.date} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-700">
                        {new Date(t.date).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-2 text-center text-green-700 font-medium">{t.present}</td>
                      <td className="px-4 py-2 text-center text-red-600 font-medium">{t.absent}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`text-xs font-semibold ${t.rate >= 75 ? 'text-green-600' : 'text-red-600'}`}>{t.rate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Low Attendance Students */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <h3 className="font-semibold text-gray-900">{isRtl ? 'طلاب بحضور منخفض' : 'Low Attendance Students'}</h3>
            </div>
          </CardHeader>
          <CardBody>
            {lowAttendanceStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <UserCheck size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">{isRtl ? 'جميع الطلاب حضورهم جيد' : 'All students have good attendance'}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {lowAttendanceStudents.map((s: any) => (
                  <div key={s.studentId} className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-sm font-medium text-gray-900">{isRtl ? s.nameAr : s.name}</p>
                    <Badge variant="danger" className="text-xs">
                      {s.attendanceRate !== null ? `${s.attendanceRate}%` : '—'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
