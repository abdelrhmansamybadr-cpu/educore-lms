'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, Skeleton, ProgressBar } from '@/components/ui'
import { BookOpen, Search } from 'lucide-react'
import Link from 'next/link'

export default function StudentCoursesPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => api.get('/courses/my-courses').then((r) => r.data?.data || []),
  })

  const filtered = (enrollments || []).filter((e: any) => {
    const title = (e.course?.title || '') + (e.course?.titleAr || '')
    const matchSearch = !search || title.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'completed' && e.progress === 100) ||
      (filter === 'active' && e.progress < 100)
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'مقرراتي الدراسية' : 'My Courses'}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {isRtl ? `${enrollments?.length || 0} مقرر مسجل` : `${enrollments?.length || 0} enrolled courses`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRtl ? 'بحث في المقررات...' : 'Search courses...'}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'all' ? (isRtl ? 'الكل' : 'All') :
               f === 'active' ? (isRtl ? 'نشط' : 'Active') :
               (isRtl ? 'مكتمل' : 'Completed')}
            </button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-16 text-gray-400">
              <BookOpen size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">
                {search ? (isRtl ? 'لا توجد نتائج' : 'No results found') : (isRtl ? 'لم تسجل في أي مقرر بعد' : 'Not enrolled in any courses yet')}
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((enrollment: any) => {
            const course = enrollment.course
            const progress = Math.round(enrollment.progress || 0)
            const isCompleted = progress === 100
            return (
              <Link
                key={enrollment.id}
                href={`/${locale}/student/courses/${course?.id}`}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-primary-200 transition-all"
              >
                {/* Cover */}
                <div className="relative h-40 bg-gradient-to-br from-primary-100 to-primary-50">
                  {course?.coverImage ? (
                    <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={48} className="text-primary-300" />
                    </div>
                  )}
                  {isCompleted && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <div className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        {isRtl ? 'مكتمل ✓' : 'Completed ✓'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm group-hover:text-primary-700 transition-colors">
                    {isRtl ? (course?.titleAr || course?.title) : course?.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">{course?.subject?.name}</p>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{isRtl ? 'التقدم' : 'Progress'}</span>
                      <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-primary-700'}`}>
                        {progress}%
                      </span>
                    </div>
                    <ProgressBar value={progress} />
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {enrollment.lastAccessedAt
                        ? (isRtl ? 'آخر دخول: ' : 'Last accessed: ') +
                          new Date(enrollment.lastAccessedAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')
                        : (isRtl ? 'لم تبدأ بعد' : 'Not started yet')
                      }
                    </span>
                    <span className="text-primary-700 font-medium group-hover:underline">
                      {isRtl ? 'متابعة →' : 'Continue →'}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
