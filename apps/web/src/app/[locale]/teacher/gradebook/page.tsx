'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, Skeleton } from '@/components/ui'
import { Save, Download } from 'lucide-react'

export default function GradebookPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()

  const [selectedCourse, setSelectedCourse] = useState('')
  const [editingCell, setEditingCell] = useState<{ studentId: string; type: string; refId: string } | null>(null)
  const [pendingGrades, setPendingGrades] = useState<Record<string, { points: number; maxPoints: number }>>({})
  const [saving, setSaving] = useState(false)

  const { data: courses } = useQuery({
    queryKey: ['teacher-courses-gradebook'],
    queryFn: () => api.get('/courses?limit=100').then((r) => r.data?.data || []),
  })

  const { data: gradebook, isLoading } = useQuery({
    queryKey: ['gradebook-course', selectedCourse],
    queryFn: () => api.get(`/gradebook/course/${selectedCourse}`).then((r) => r.data?.data),
    enabled: !!selectedCourse,
  })

  const saveGrades = async () => {
    setSaving(true)
    try {
      await Promise.all(
        Object.entries(pendingGrades).map(([key, value]) => {
          const [studentId, type, refId] = key.split('::')
          return api.post('/gradebook/grade', {
            studentId,
            courseId: selectedCourse,
            points: value.points,
            maxPoints: value.maxPoints,
          })
        })
      )
      setPendingGrades({})
      queryClient.invalidateQueries({ queryKey: ['gradebook-course', selectedCourse] })
    } finally {
      setSaving(false)
    }
  }

  const getCellKey = (studentId: string, type: string, refId: string) => `${studentId}::${type}::${refId}`


  // API returns array of { studentId, student: { name, avatar }, grades: [...], average, letterGrade }
  const students = Array.isArray(gradebook) ? gradebook : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'دفتر الدرجات' : 'Gradebook'}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{isRtl ? 'إدارة درجات الطلاب' : 'Manage student grades'}</p>
        </div>
        <div className="flex gap-3">
          {Object.keys(pendingGrades).length > 0 && (
            <button
              onClick={saveGrades}
              disabled={saving}
              className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-60"
            >
              <Save size={14} />
              {saving ? (isRtl ? 'حفظ...' : 'Saving...') : `${isRtl ? 'حفظ' : 'Save'} (${Object.keys(pendingGrades).length})`}
            </button>
          )}
          <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-50">
            <Download size={14} />
            {isRtl ? 'تصدير' : 'Export'}
          </button>
        </div>
      </div>

      {/* Course Selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{isRtl ? 'المقرر' : 'Course'}</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 min-w-64"
        >
          <option value="">{isRtl ? '-- اختر المقرر --' : '-- Select Course --'}</option>
          {courses?.map((c: any) => (
            <option key={c.id} value={c.id}>{isRtl ? (c.titleAr || c.title) : c.title}</option>
          ))}
        </select>
      </div>

      {selectedCourse && (
        <div className="overflow-x-auto">
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : students.length === 0 ? (
            <Card>
              <CardBody>
                <div className="text-center py-10 text-gray-400">{isRtl ? 'لا يوجد طلاب' : 'No students enrolled'}</div>
              </CardBody>
            </Card>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-48">{isRtl ? 'الطالب' : 'Student'}</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700">{isRtl ? 'عدد التقييمات' : 'Assessments'}</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700">{isRtl ? 'المتوسط' : 'Average'}</th>
                    <th className="px-3 py-3 text-center font-semibold text-gray-700 bg-primary-50">{isRtl ? 'التقدير' : 'Grade'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((row: any) => (
                    <tr key={row.studentId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{row.student?.name || row.studentId}</div>
                        {row.student?.studentId && <div className="text-xs text-gray-400">{row.student.studentId}</div>}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600">{row.grades?.length || 0}</td>
                      <td className="px-3 py-3 text-center">
                        {row.average !== null ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 bg-gray-100 rounded-full h-2">
                              <div className="bg-primary-700 h-2 rounded-full" style={{ width: `${Math.min(row.average, 100)}%` }} />
                            </div>
                            <span className="font-semibold text-gray-800">{row.average}%</span>
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-3 text-center bg-primary-50">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold ${
                          row.letterGrade?.startsWith('A') ? 'text-green-700 bg-green-100' :
                          row.letterGrade?.startsWith('B') ? 'text-blue-700 bg-blue-100' :
                          row.letterGrade?.startsWith('C') ? 'text-yellow-700 bg-yellow-100' :
                          row.letterGrade === 'F' ? 'text-red-700 bg-red-100' : 'text-gray-500 bg-gray-100'
                        }`}>{row.letterGrade || '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {Object.keys(pendingGrades).length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 bg-primary-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
          <span className="text-sm">{Object.keys(pendingGrades).length} {isRtl ? 'تعديل غير محفوظ' : 'unsaved changes'}</span>
          <button onClick={saveGrades} disabled={saving} className="bg-white text-primary-900 px-4 py-1.5 rounded-xl text-sm font-semibold hover:bg-gray-100 disabled:opacity-60">
            {saving ? '...' : (isRtl ? 'حفظ' : 'Save')}
          </button>
        </div>
      )}
    </div>
  )
}
