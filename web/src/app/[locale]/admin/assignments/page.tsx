'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Skeleton } from '@/components/ui'
import { ClipboardList, Clock } from 'lucide-react'

export default function AdminAssignmentsPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['admin-courses-list'],
    queryFn: () => api.get('/courses?limit=100').then(r => r.data?.data || []),
  })

  const { data: pending, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-grading'],
    queryFn: () => api.get('/assignments/pending-grading').then(r => r.data?.data || []),
  })

  const isLoading = coursesLoading || pendingLoading

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'الواجبات الدراسية' : 'Assignments'}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'متابعة الواجبات وتقارير التسليم' : 'Track assignments and submission reports'}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-primary-900">{courses?.length || 0}</p>
          <p className="text-xs text-gray-500 mt-1">{isRtl ? 'المقررات' : 'Courses'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-yellow-600">{pending?.length || 0}</p>
          <p className="text-xs text-gray-500 mt-1">{isRtl ? 'بانتظار التصحيح' : 'Pending Grading'}</p>
        </div>
      </div>

      {/* Pending Grading */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">{isRtl ? 'واجبات بانتظار التصحيح' : 'Submissions Awaiting Grading'}</h3>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : pending?.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ClipboardList size={40} className="mx-auto mb-2 opacity-30" />
              <p>{isRtl ? 'لا توجد واجبات بانتظار التصحيح' : 'No submissions pending grading'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending?.map((sub: any) => (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{sub.assignment?.title || '—'}</p>
                    <p className="text-xs text-gray-500">
                      {sub.student?.profile?.firstName} {sub.student?.profile?.lastName}
                      {' · '}{sub.assignment?.course?.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={11} />
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : '—'}
                    </span>
                    <Badge variant="warning" className="text-xs">{isRtl ? 'لم يُصحَّح' : 'Ungraded'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Courses with assignment counts */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">{isRtl ? 'الواجبات حسب المقرر' : 'Assignments by Course'}</h3>
        </CardHeader>
        <CardBody>
          {coursesLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <div className="space-y-2">
              {courses?.map((course: any) => (
                <div key={course.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <p className="text-sm font-medium text-gray-800">{isRtl ? (course.titleAr || course.title) : course.title}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{course._count?.assignments || 0} {isRtl ? 'واجب' : 'assignments'}</span>
                    <Badge variant={course.isPublished ? 'success' : 'default'} className="text-xs">
                      {course.isPublished ? (isRtl ? 'منشور' : 'Published') : (isRtl ? 'مسودة' : 'Draft')}
                    </Badge>
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
