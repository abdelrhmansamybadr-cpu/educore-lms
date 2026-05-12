'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, Badge, Skeleton } from '@/components/ui'
import { BookOpen, Plus, Search, Users, Eye, EyeOff, Trash2 } from 'lucide-react'

export default function AdminCoursesPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', titleAr: '', description: '', subjectId: '' })

  const { data: courses, isLoading } = useQuery({
    queryKey: ['admin-courses', search],
    queryFn: () => api.get('/courses', { params: { search: search || undefined, limit: 100 } }).then(r => r.data?.data || []),
  })

  const createCourse = useMutation({
    mutationFn: (data: any) => api.post('/courses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] })
      setShowCreate(false)
      setForm({ title: '', titleAr: '', description: '', subjectId: '' })
    },
  })

  const togglePublish = useMutation({
    mutationFn: (id: string) => api.patch(`/courses/${id}/publish`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-courses'] }),
  })

  const deleteCourse = useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-courses'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'إدارة المقررات' : 'Course Management'}</h1>
          <p className="text-gray-500 text-sm">{isRtl ? 'جميع المقررات الدراسية' : 'All courses in the school'}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800"
        >
          <Plus size={16} />
          {isRtl ? 'مقرر جديد' : 'New Course'}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={isRtl ? 'بحث...' : 'Search courses...'}
          className="w-full ps-9 pe-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
        />
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">{isRtl ? 'إنشاء مقرر جديد' : 'Create New Course'}</h3>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder={isRtl ? 'اسم المقرر (إنجليزي)' : 'Course title (English)'}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500"
            />
            <input
              value={form.titleAr}
              onChange={e => setForm(f => ({ ...f, titleAr: e.target.value }))}
              placeholder="اسم المقرر (عربي)"
              dir="rtl"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500"
            />
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder={isRtl ? 'وصف المقرر' : 'Description'}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => createCourse.mutate({ title: form.title, titleAr: form.titleAr, description: form.description })}
                disabled={!form.title || createCourse.isPending}
                className="flex-1 py-2.5 bg-primary-900 text-white rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-50"
              >
                {createCourse.isPending ? '...' : (isRtl ? 'إنشاء' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Courses Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : courses?.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-16 text-gray-400">
              <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
              <p>{isRtl ? 'لا توجد مقررات' : 'No courses yet'}</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses?.map((course: any) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardBody>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {isRtl ? (course.titleAr || course.title) : course.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{course.subject?.name || '—'}</p>
                  </div>
                  <Badge variant={course.isPublished ? 'success' : 'default'} className="text-xs flex-shrink-0">
                    {course.isPublished ? (isRtl ? 'منشور' : 'Published') : (isRtl ? 'مسودة' : 'Draft')}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4">{course.description || '—'}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><Users size={12} />{course._count?.enrollments || 0} {isRtl ? 'طالب' : 'students'}</span>
                  <span>{course._count?.sections || 0} {isRtl ? 'وحدات' : 'sections'}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => togglePublish.mutate(course.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-xl text-xs hover:bg-gray-50"
                  >
                    {course.isPublished ? <EyeOff size={12} /> : <Eye size={12} />}
                    {course.isPublished ? (isRtl ? 'إلغاء النشر' : 'Unpublish') : (isRtl ? 'نشر' : 'Publish')}
                  </button>
                  <button
                    onClick={() => { if (confirm(isRtl ? 'حذف المقرر؟' : 'Delete this course?')) deleteCourse.mutate(course.id) }}
                    className="p-2 border border-red-200 text-red-500 rounded-xl hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
