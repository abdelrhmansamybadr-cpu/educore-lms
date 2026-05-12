'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, Badge, Skeleton } from '@/components/ui'
import { Plus, BookOpen, Users, Eye, EyeOff, Trash2, Search } from 'lucide-react'
import Link from 'next/link'

export default function TeacherCoursesPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-courses-list', search],
    queryFn: () => api.get('/courses', { params: { search, limit: 50 } }).then((r) => r.data?.data || []),
  })

  const togglePublish = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api.patch(`/courses/${id}`, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-courses-list'] }),
  })

  const deleteCourse = useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-courses-list'] }),
  })

  const courses = data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isRtl ? 'مقرراتي الدراسية' : 'My Courses'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isRtl ? `${courses.length} مقرر` : `${courses.length} courses`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-800 transition-colors"
        >
          <Plus size={16} />
          {isRtl ? 'إنشاء مقرر' : 'Create Course'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isRtl ? 'بحث في المقررات...' : 'Search courses...'}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-16 text-gray-400">
              <BookOpen size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">{isRtl ? 'لا توجد مقررات بعد' : 'No courses yet'}</p>
              <p className="text-sm mb-6">{isRtl ? 'ابدأ بإنشاء أول مقرر دراسي لك' : 'Start by creating your first course'}</p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 bg-primary-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-800"
              >
                <Plus size={16} />
                {isRtl ? 'إنشاء مقرر' : 'Create Course'}
              </button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course: any) => (
            <div key={course.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Cover */}
              <div className="relative h-36 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                {course.coverImage ? (
                  <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen size={48} className="text-primary-300" />
                )}
                <div className="absolute top-3 right-3">
                  <Badge variant={course.isPublished ? 'success' : 'default'} className="text-xs">
                    {course.isPublished ? (isRtl ? 'منشور' : 'Published') : (isRtl ? 'مسودة' : 'Draft')}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
                  {isRtl ? (course.titleAr || course.title) : course.title}
                </h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                  {course.description || (isRtl ? 'لا يوجد وصف' : 'No description')}
                </p>

                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {course._count?.enrollments || 0} {isRtl ? 'طالب' : 'students'}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} />
                    {course._count?.sections || 0} {isRtl ? 'وحدة' : 'sections'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/${locale}/teacher/courses/${course.id}`}
                    className="flex-1 text-center bg-primary-900 text-white py-2 rounded-xl text-xs font-medium hover:bg-primary-800 transition-colors"
                  >
                    {isRtl ? 'إدارة المقرر' : 'Manage'}
                  </Link>
                  <button
                    onClick={() => togglePublish.mutate({ id: course.id, isPublished: !course.isPublished })}
                    className="p-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                    title={course.isPublished ? (isRtl ? 'إلغاء النشر' : 'Unpublish') : (isRtl ? 'نشر' : 'Publish')}
                  >
                    {course.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(isRtl ? 'هل تريد حذف هذا المقرر؟' : 'Delete this course?')) {
                        deleteCourse.mutate(course.id)
                      }
                    }}
                    className="p-2 border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateCourseModal
          isRtl={isRtl}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false)
            queryClient.invalidateQueries({ queryKey: ['teacher-courses-list'] })
          }}
        />
      )}
    </div>
  )
}

function CreateCourseModal({ isRtl, onClose, onSuccess }: {
  isRtl: boolean; onClose: () => void; onSuccess: () => void
}) {
  const [form, setForm] = useState({
    title: '', titleAr: '', description: '', descriptionAr: '',
    gradeLevel: '', subjectId: '', language: 'BILINGUAL',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/courses/subjects').then((r) => r.data?.data || []),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/courses', form)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || (isRtl ? 'حدث خطأ' : 'An error occurred'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isRtl ? 'إنشاء مقرر جديد' : 'Create New Course'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {isRtl ? 'اسم المقرر (إنجليزي)' : 'Course Title (EN)'} *
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
              placeholder="e.g. Introduction to Mathematics"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {isRtl ? 'اسم المقرر (عربي)' : 'Course Title (AR)'}
            </label>
            <input
              value={form.titleAr}
              onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))}
              dir="rtl"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
              placeholder="مثال: مقدمة في الرياضيات"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {isRtl ? 'الوصف' : 'Description'}
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {isRtl ? 'المرحلة الدراسية' : 'Grade Level'}
              </label>
              <input
                value={form.gradeLevel}
                onChange={(e) => setForm((f) => ({ ...f, gradeLevel: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
                placeholder={isRtl ? 'مثال: الصف الأول' : 'e.g. Grade 1'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {isRtl ? 'اللغة' : 'Language'}
              </label>
              <select
                value={form.language}
                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500"
              >
                <option value="ARABIC">{isRtl ? 'عربي' : 'Arabic'}</option>
                <option value="ENGLISH">{isRtl ? 'إنجليزي' : 'English'}</option>
                <option value="BILINGUAL">{isRtl ? 'ثنائي اللغة' : 'Bilingual'}</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-primary-900 text-white rounded-xl text-sm font-medium hover:bg-primary-800 disabled:opacity-60">
              {loading ? (isRtl ? 'جارٍ الإنشاء...' : 'Creating...') : (isRtl ? 'إنشاء المقرر' : 'Create Course')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
