'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, Badge, Skeleton } from '@/components/ui'
import { BarChart2 } from 'lucide-react'

const LETTER_COLORS: Record<string, string> = {
  'A+': 'text-green-700 bg-green-100',
  'A': 'text-green-700 bg-green-100',
  'B+': 'text-blue-700 bg-blue-100',
  'B': 'text-blue-700 bg-blue-100',
  'C+': 'text-yellow-700 bg-yellow-100',
  'C': 'text-yellow-700 bg-yellow-100',
  'D': 'text-orange-700 bg-orange-100',
  'F': 'text-red-700 bg-red-100',
}

export default function StudentGradesPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const { data: grades, isLoading } = useQuery({
    queryKey: ['my-grades'],
    queryFn: () => api.get('/gradebook/my-grades').then((r) => {
      const d = r.data?.data
      return Array.isArray(d) ? d : (d?.grades || [])
    }),
  })

  const avgGrade = grades?.length > 0
    ? Math.round(grades.reduce((sum: number, g: any) => sum + (g.percentage || 0), 0) / grades.length)
    : null

  // Group by course
  const byCourse: Record<string, any[]> = {}
  grades?.forEach((g: any) => {
    const key = g.courseId || 'general'
    if (!byCourse[key]) byCourse[key] = []
    byCourse[key].push(g)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'درجاتي' : 'My Grades'}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'نتائج الاختبارات والواجبات' : 'Your assessment results'}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-primary-900">{avgGrade !== null ? `${avgGrade}%` : '—'}</p>
          <p className="text-xs text-gray-500 mt-1">{isRtl ? 'المتوسط العام' : 'Overall Average'}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{grades?.filter((g: any) => g.percentage >= 90).length || 0}</p>
          <p className="text-xs text-gray-500 mt-1">{isRtl ? 'ممتاز (A)' : 'Excellent (A)'}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-gray-700">{grades?.length || 0}</p>
          <p className="text-xs text-gray-500 mt-1">{isRtl ? 'إجمالي التقييمات' : 'Total Assessments'}</p>
        </Card>
      </div>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">{isRtl ? 'جميع الدرجات' : 'All Grades'}</h3>
        </CardHeader>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : grades?.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <BarChart2 size={48} className="mx-auto mb-3 opacity-30" />
              <p>{isRtl ? 'لا توجد درجات بعد' : 'No grades yet'}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{isRtl ? 'التقييم' : 'Assessment'}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">{isRtl ? 'النوع' : 'Type'}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'الدرجة' : 'Score'}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'النسبة' : 'Percentage'}</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'التقدير' : 'Grade'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {grades.map((grade: any) => (
                  <tr key={grade.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{grade.title || grade.type}</p>
                      <p className="text-xs text-gray-400">
                        {grade.createdAt ? new Date(grade.createdAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="default" className="text-xs">{grade.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">
                      {grade.points}/{grade.maxPoints}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-primary-700 h-2 rounded-full"
                            style={{ width: `${Math.min(grade.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-10">{Math.round(grade.percentage)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold ${
                        LETTER_COLORS[grade.letterGrade] || 'text-gray-700 bg-gray-100'
                      }`}>
                        {grade.letterGrade || '—'}
                      </span>
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
