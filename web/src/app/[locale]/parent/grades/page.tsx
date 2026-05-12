'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Skeleton, Avatar } from '@/components/ui'
import { BarChart2 } from 'lucide-react'

const LETTER_COLORS: Record<string, string> = {
  'A+': 'text-green-700 bg-green-100', 'A': 'text-green-700 bg-green-100',
  'B+': 'text-blue-700 bg-blue-100', 'B': 'text-blue-700 bg-blue-100',
  'C+': 'text-yellow-700 bg-yellow-100', 'C': 'text-yellow-700 bg-yellow-100',
  'D': 'text-orange-700 bg-orange-100', 'F': 'text-red-700 bg-red-100',
}

export default function ParentGradesPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const { data, isLoading } = useQuery({
    queryKey: ['parent-children-grades'],
    queryFn: () => api.get('/gradebook/parent/children').then(r => r.data?.data || []),
  })

  const children = data || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'درجات الأبناء' : "Children's Grades"}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'متابعة نتائج أبنائك الدراسية' : "Monitor your children's academic results"}</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>
      ) : children.length === 0 ? (
        <Card><CardBody>
          <div className="text-center py-16 text-gray-400">
            <BarChart2 size={48} className="mx-auto mb-3 opacity-30" />
            <p>{isRtl ? 'لا توجد درجات متاحة' : 'No grades available'}</p>
          </div>
        </CardBody></Card>
      ) : (
        children.map((child: any) => {
          const profile = child.student?.profile
          const grades = child.grades || []
          const avgPct = grades.length > 0
            ? Math.round(grades.reduce((s: number, g: any) => s + (g.percentage || 0), 0) / grades.length)
            : null

          return (
            <Card key={child.studentId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={`${profile?.firstName} ${profile?.lastName}`} src={profile?.avatar} size="sm" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {isRtl && profile?.firstNameAr
                          ? `${profile.firstNameAr} ${profile.lastNameAr || ''}`
                          : `${profile?.firstName || ''} ${profile?.lastName || ''}`}
                      </h3>
                      <p className="text-xs text-gray-500">{child.student?.grade || '—'}</p>
                    </div>
                  </div>
                  {avgPct !== null && (
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${avgPct >= 90 ? 'text-green-600' : avgPct >= 70 ? 'text-blue-600' : avgPct >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>{avgPct}%</p>
                      <p className="text-xs text-gray-400">{isRtl ? 'المعدل العام' : 'Overall avg'}</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                {grades.length === 0 ? (
                  <CardBody><p className="text-sm text-gray-400 text-center py-4">{isRtl ? 'لا توجد درجات' : 'No grades yet'}</p></CardBody>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="px-4 py-3 text-start font-semibold text-gray-600">{isRtl ? 'التقييم' : 'Assessment'}</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'الدرجة' : 'Score'}</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'النسبة' : '%'}</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-600">{isRtl ? 'التقدير' : 'Grade'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {grades.map((g: any) => (
                        <tr key={g.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{g.title || g.type}</p>
                            <p className="text-xs text-gray-400">{g.course?.title}</p>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-900">{g.points}/{g.maxPoints}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-12 bg-gray-100 rounded-full h-1.5">
                                <div className="bg-primary-700 h-1.5 rounded-full" style={{ width: `${Math.min(g.percentage, 100)}%` }} />
                              </div>
                              <span className="text-xs text-gray-600">{Math.round(g.percentage)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-xs font-bold ${LETTER_COLORS[g.letterGrade] || 'text-gray-700 bg-gray-100'}`}>
                              {g.letterGrade || '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          )
        })
      )}
    </div>
  )
}
