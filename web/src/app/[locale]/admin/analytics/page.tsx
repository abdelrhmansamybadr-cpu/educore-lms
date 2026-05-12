'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Skeleton } from '@/components/ui'
import { Users, BookOpen, TrendingUp, AlertTriangle, BarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'


export default function AdminAnalyticsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data?.data || r.data),
  })

  const { data: gradesDist } = useQuery({
    queryKey: ['analytics-grades'],
    queryFn: () => api.get('/analytics/grades').then(r => r.data?.data || r.data),
  })

  const { data: engagement } = useQuery({
    queryKey: ['analytics-engagement'],
    queryFn: () => api.get('/analytics/engagement').then(r => r.data?.data || r.data || []),
  })

  const { data: atRisk } = useQuery({
    queryKey: ['analytics-at-risk'],
    queryFn: () => api.get('/analytics/at-risk').then(r => r.data?.data || r.data || []),
  })

  const gradeChartData = gradesDist ? [
    { grade: 'A', count: gradesDist.A || 0 },
    { grade: 'B', count: gradesDist.B || 0 },
    { grade: 'C', count: gradesDist.C || 0 },
    { grade: 'D', count: gradesDist.D || 0 },
    { grade: 'F', count: gradesDist.F || 0 },
  ] : []

  const kpiCards = [
    {
      label: isRtl ? 'إجمالي الطلاب' : 'Total Students',
      value: overview?.totalStudents ?? '—',
      icon: Users, color: 'text-blue-600', bg: 'bg-blue-50',
    },
    {
      label: isRtl ? 'إجمالي المعلمين' : 'Total Teachers',
      value: overview?.totalTeachers ?? '—',
      icon: Users, color: 'text-purple-600', bg: 'bg-purple-50',
    },
    {
      label: isRtl ? 'متوسط الدرجات' : 'Avg Grade',
      value: overview?.avgGrade ? `${overview.avgGrade}%` : '—',
      icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50',
    },
    {
      label: isRtl ? 'نسبة الحضور' : 'Avg Attendance',
      value: overview?.avgAttendance ? `${overview.avgAttendance}%` : '—',
      icon: BarChart2, color: 'text-orange-600', bg: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'التحليلات والتقارير' : 'Analytics & Reports'}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'نظرة شاملة على أداء المدرسة' : 'Comprehensive school performance overview'}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={`${card.bg} rounded-xl p-3`}>
              <card.icon size={20} className={card.color} />
            </div>
            <div>
              {overviewLoading ? <Skeleton className="h-6 w-16 mb-1" /> : (
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              )}
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-primary-700" />
              <h3 className="font-semibold text-gray-900">{isRtl ? 'توزيع الدرجات' : 'Grade Distribution'}</h3>
            </div>
            {gradesDist && (
              <p className="text-xs text-gray-400">
                {isRtl ? 'معدل النجاح: ' : 'Pass rate: '}{gradesDist.passRate}% · {isRtl ? 'المتوسط: ' : 'Avg: '}{gradesDist.average}%
              </p>
            )}
          </CardHeader>
          <CardBody>
            {gradeChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                {isRtl ? 'لا توجد بيانات' : 'No grade data yet'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={gradeChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name={isRtl ? 'عدد الطلاب' : 'Students'} radius={[4, 4, 0, 0]}
                    fill="#6366f1"
                    label={{ position: 'top', fontSize: 11 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* At-Risk Students */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              <h3 className="font-semibold text-gray-900">{isRtl ? 'الطلاب في خطر' : 'At-Risk Students'}</h3>
            </div>
          </CardHeader>
          <CardBody>
            {!atRisk || atRisk.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <AlertTriangle size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">{isRtl ? 'لا يوجد طلاب في خطر' : 'No at-risk students'}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {atRisk.map((s: any) => (
                  <div key={s.studentId} className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{isRtl ? s.nameAr : s.name}</p>
                      <div className="flex gap-1 mt-1">
                        {s.riskFactors.includes('low_grades') && (
                          <Badge variant="danger" className="text-xs">{isRtl ? 'درجات منخفضة' : 'Low Grades'}</Badge>
                        )}
                        {s.riskFactors.includes('low_attendance') && (
                          <Badge variant="warning" className="text-xs">{isRtl ? 'غياب متكرر' : 'Low Attendance'}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-end">
                      {s.avgGrade !== null && (
                        <p className="text-sm font-semibold text-red-600">{s.avgGrade}%</p>
                      )}
                      {s.attendanceRate !== null && (
                        <p className="text-xs text-gray-500">{s.attendanceRate}% {isRtl ? 'حضور' : 'attend.'}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Top Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-primary-700" />
            <h3 className="font-semibold text-gray-900">{isRtl ? 'أفضل المقررات' : 'Top Courses by Enrollment'}</h3>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          {!engagement || engagement.length === 0 ? (
            <CardBody>
              <div className="text-center py-8 text-gray-400 text-sm">{isRtl ? 'لا توجد مقررات' : 'No courses yet'}</div>
            </CardBody>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-start font-semibold text-gray-600">{isRtl ? 'المقرر' : 'Course'}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'المسجلون' : 'Enrolled'}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'متوسط التقدم' : 'Avg Progress'}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'معدل الإتمام' : 'Completion'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {engagement.map((c: any) => (
                  <tr key={c.courseId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {isRtl ? (c.titleAr || c.title) : c.title}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{c.enrollmentCount}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-20 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${c.avgProgress}%` }} />
                        </div>
                        <span className="text-xs text-gray-600">{c.avgProgress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={c.completionRate >= 50 ? 'success' : 'default'} className="text-xs">
                        {c.completionRate}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
