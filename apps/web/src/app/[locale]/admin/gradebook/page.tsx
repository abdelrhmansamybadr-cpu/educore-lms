'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Skeleton } from '@/components/ui'
import { BookOpen, BarChart2, ExternalLink } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

const LETTER_COLORS: Record<string, string> = {
  'A+': 'success', 'A': 'success', 'A-': 'success',
  'B+': 'default', 'B': 'default', 'B-': 'default',
  'C+': 'warning', 'C': 'warning', 'C-': 'warning',
  'D+': 'danger', 'D': 'danger', 'D-': 'danger', 'F': 'danger',
}

export default function AdminGradebookPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [selectedCourse, setSelectedCourse] = useState<string>('')

  const { data: courses } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => api.get('/courses?limit=100').then(r => r.data?.data?.data || r.data?.data || []),
  })

  const { data: gradebook, isLoading: gradebookLoading } = useQuery({
    queryKey: ['admin-gradebook', selectedCourse],
    queryFn: () => api.get(`/gradebook/course/${selectedCourse}`).then(r => r.data?.data || r.data || []),
    enabled: !!selectedCourse,
  })

  const { data: gradeAnalytics } = useQuery({
    queryKey: ['admin-grade-analytics', selectedCourse],
    queryFn: () => api.get(`/analytics/grades?courseId=${selectedCourse}`).then(r => r.data?.data || r.data),
    enabled: !!selectedCourse,
  })

  const chartData = gradeAnalytics ? [
    { grade: 'A', count: gradeAnalytics.A || 0 },
    { grade: 'B', count: gradeAnalytics.B || 0 },
    { grade: 'C', count: gradeAnalytics.C || 0 },
    { grade: 'D', count: gradeAnalytics.D || 0 },
    { grade: 'F', count: gradeAnalytics.F || 0 },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'سجل الدرجات' : 'Gradebook'}</h1>
          <p className="text-gray-500 text-sm">{isRtl ? 'مراجعة درجات الطلاب لكل مقرر' : 'Review student grades per course'}</p>
        </div>
      </div>

      {/* Course Selector */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-primary-700" />
              <label className="text-sm font-medium text-gray-700">
                {isRtl ? 'اختر المقرر:' : 'Select Course:'}
              </label>
            </div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="flex-1 max-w-xs border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{isRtl ? '— اختر مقرراً —' : '— Select a course —'}</option>
              {(courses || []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {isRtl ? (c.titleAr || c.title) : c.title}
                </option>
              ))}
            </select>
            {selectedCourse && (
              <Link
                href={`/${locale}/teacher/gradebook`}
                className="flex items-center gap-1 text-xs text-primary-700 hover:underline"
              >
                <ExternalLink size={12} />
                {isRtl ? 'فتح في واجهة المعلم' : 'Open in Teacher View'}
              </Link>
            )}
          </div>
        </CardBody>
      </Card>

      {!selectedCourse ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p>{isRtl ? 'اختر مقرراً لعرض سجل الدرجات' : 'Select a course to view the gradebook'}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Gradebook Table */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{isRtl ? 'درجات الطلاب' : 'Student Grades'}</h3>
                {gradeAnalytics && (
                  <span className="text-xs text-gray-400">
                    {isRtl ? 'المتوسط: ' : 'Avg: '}{gradeAnalytics.average}% · {isRtl ? 'نجاح: ' : 'Pass: '}{gradeAnalytics.passRate}%
                  </span>
                )}
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              {gradebookLoading ? (
                <div className="p-4 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12" />)}</div>
              ) : !gradebook || gradebook.length === 0 ? (
                <CardBody>
                  <div className="text-center py-10 text-gray-400 text-sm">{isRtl ? 'لا يوجد طلاب مسجلون' : 'No enrolled students'}</div>
                </CardBody>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-start font-semibold text-gray-600">{isRtl ? 'الطالب' : 'Student'}</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'عدد التقييمات' : 'Assessments'}</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'المتوسط' : 'Average'}</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'الدرجة' : 'Grade'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {gradebook.map((row: any) => (
                      <tr key={row.studentId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{row.student?.name}</p>
                          {row.student?.studentId && (
                            <p className="text-xs text-gray-400">#{row.student.studentId}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{row.grades?.length || 0}</td>
                        <td className="px-4 py-3 text-center">
                          {row.average !== null ? (
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${(row.average || 0) >= 60 ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(row.average || 0, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-700">{row.average}%</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.letterGrade ? (
                            <Badge variant={LETTER_COLORS[row.letterGrade] as any || 'default'} className="text-xs font-bold">
                              {row.letterGrade}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          {/* Grade Distribution Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart2 size={16} className="text-primary-700" />
                <h3 className="font-semibold text-gray-900">{isRtl ? 'توزيع الدرجات' : 'Distribution'}</h3>
              </div>
            </CardHeader>
            <CardBody>
              {chartData.every(d => d.count === 0) ? (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                  {isRtl ? 'لا توجد درجات' : 'No grades yet'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name={isRtl ? 'طلاب' : 'Students'} fill="#6366f1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {gradeAnalytics && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-sm font-bold text-gray-800">{gradeAnalytics.average}%</p>
                    <p className="text-xs text-gray-400">{isRtl ? 'المتوسط' : 'Average'}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-sm font-bold text-green-700">{gradeAnalytics.passRate}%</p>
                    <p className="text-xs text-gray-400">{isRtl ? 'نجاح' : 'Pass Rate'}</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
