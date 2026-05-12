'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardHeader, CardBody, Badge, Avatar, Skeleton } from '@/components/ui'
import { BookOpen, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function TeacherDashboardPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const user = useAuthStore((s) => s.user)

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: () => api.get('/courses?limit=5').then((r) => r.data?.data || []),
  })

  const { data: pending, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-grading'],
    queryFn: () => api.get('/assignments/pending-grading').then((r) => r.data?.data || []),
  })

  const greeting = isRtl
    ? `مرحباً، ${user?.firstNameAr || user?.firstName || 'أستاذ'} 👋`
    : `Hello, ${user?.firstName || 'Teacher'} 👋`

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">{greeting}</h2>
        <p className="text-primary-200 text-sm">
          {isRtl ? 'إليك ما يحدث اليوم في فصولك الدراسية' : "Here's what's happening in your classes today"}
        </p>
        <div className="flex gap-4 mt-4">
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-bold">{courses?.length || 0}</p>
            <p className="text-xs text-primary-200">{isRtl ? 'مقررات' : 'Courses'}</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-bold">{pending?.length || 0}</p>
            <p className="text-xs text-primary-200">{isRtl ? 'واجبات للتصحيح' : 'To Grade'}</p>
          </div>
        </div>
      </div>

      {/* My Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {isRtl ? 'مقرراتي الدراسية' : 'My Courses'}
            </h3>
            <Link
              href={`/${locale}/teacher/courses`}
              className="text-sm text-primary-700 hover:underline"
            >
              {isRtl ? 'عرض الكل' : 'View All'}
            </Link>
          </div>
        </CardHeader>
        <CardBody>
          {coursesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : courses?.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <BookOpen size={40} className="mx-auto mb-2 opacity-50" />
              <p>{isRtl ? 'لا توجد مقررات حتى الآن' : 'No courses yet'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses?.map((course: any) => (
                <Link
                  key={course.id}
                  href={`/${locale}/teacher/courses/${course.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700 flex-shrink-0">
                    <BookOpen size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {isRtl ? (course.titleAr || course.title) : course.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {course._count?.enrollments || 0} {isRtl ? 'طالب' : 'students'}
                    </p>
                  </div>
                  <Badge variant={course.isPublished ? 'success' : 'default'}>
                    {course.isPublished ? (isRtl ? 'منشور' : 'Published') : (isRtl ? 'مسودة' : 'Draft')}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Pending Submissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {isRtl ? 'واجبات تنتظر التصحيح' : 'Pending Submissions to Grade'}
            </h3>
            {pending?.length > 0 && (
              <Badge variant="warning">{pending.length}</Badge>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {pendingLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : pending?.length === 0 ? (
            <div className="text-center py-8 text-green-600">
              <CheckCircle size={40} className="mx-auto mb-2" />
              <p className="font-medium">{isRtl ? 'أحسنت! لا توجد واجبات للتصحيح' : "Great! Nothing to grade"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending?.slice(0, 5).map((sub: any) => (
                <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl border border-amber-100 bg-amber-50">
                  <Avatar
                    name={`${sub.student?.profile?.firstName} ${sub.student?.profile?.lastName}`}
                    src={sub.student?.profile?.avatar}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {sub.student?.profile?.firstName} {sub.student?.profile?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{sub.assignment?.title}</p>
                  </div>
                  <Link
                    href={`/${locale}/teacher/assignments/grade/${sub.id}`}
                    className="text-xs bg-primary-900 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800"
                  >
                    {isRtl ? 'تصحيح' : 'Grade'}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
