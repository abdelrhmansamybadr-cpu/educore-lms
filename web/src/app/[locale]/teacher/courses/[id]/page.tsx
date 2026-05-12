'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardBody, Badge, Skeleton } from '@/components/ui'
import {
  ChevronDown, ChevronRight, Plus, GripVertical, Trash2,
  Video, FileText, HelpCircle, Edit, Eye, Users, BookOpen, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

export default function CourseBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [addSectionOpen, setAddSectionOpen] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [addLessonSection, setAddLessonSection] = useState<string | null>(null)
  const [newLesson, setNewLesson] = useState({ title: '', contentType: 'VIDEO', estimatedMinutes: 0 })

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-builder', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data?.data),
  })

  const addSection = useMutation({
    mutationFn: (title: string) => api.post(`/courses/${id}/sections`, { title, titleAr: title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-builder', id] })
      setNewSectionTitle('')
      setAddSectionOpen(false)
    },
  })

  const deleteSection = useMutation({
    mutationFn: (sectionId: string) => api.delete(`/courses/${id}/sections/${sectionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['course-builder', id] }),
  })

  const addLesson = useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: string; data: any }) =>
      api.post(`/courses/${id}/sections/${sectionId}/lessons`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-builder', id] })
      setAddLessonSection(null)
      setNewLesson({ title: '', contentType: 'VIDEO', estimatedMinutes: 0 })
    },
  })

  const deleteLesson = useMutation({
    mutationFn: ({ sectionId, lessonId }: { sectionId: string; lessonId: string }) =>
      api.delete(`/courses/${id}/sections/${sectionId}/lessons/${lessonId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['course-builder', id] }),
  })

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  const lessonTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'VIDEO': return <Video size={14} className="text-blue-500" />
      case 'PDF': return <FileText size={14} className="text-red-500" />
      case 'QUIZ': return <HelpCircle size={14} className="text-purple-500" />
      default: return <FileText size={14} className="text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!course) return null

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Link href={`/${locale}/teacher/courses`} className="mt-1 p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              {isRtl ? (course.titleAr || course.title) : course.title}
            </h1>
            <Badge variant={course.isPublished ? 'success' : 'default'}>
              {course.isPublished ? (isRtl ? 'منشور' : 'Published') : (isRtl ? 'مسودة' : 'Draft')}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              {course._count?.enrollments || 0} {isRtl ? 'طالب' : 'students'}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen size={14} />
              {course.sections?.length || 0} {isRtl ? 'وحدة' : 'sections'}
            </span>
          </div>
        </div>
        <Link
          href={`/${locale}/student/courses/${id}`}
          target="_blank"
          className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm hover:bg-gray-50"
        >
          <Eye size={14} />
          {isRtl ? 'معاينة' : 'Preview'}
        </Link>
      </div>

      {/* Course Content Builder */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">{isRtl ? 'محتوى المقرر' : 'Course Content'}</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {course.sections?.map((section: any, sIdx: number) => (
              <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Section Header */}
                <div
                  className="flex items-center gap-3 p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <GripVertical size={16} className="text-gray-300 cursor-grab" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {isRtl ? `الوحدة ${sIdx + 1}: ${section.titleAr || section.title}` : `Section ${sIdx + 1}: ${section.title}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {section.lessons?.length || 0} {isRtl ? 'درس' : 'lessons'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(isRtl ? 'حذف الوحدة؟' : 'Delete section?')) {
                          deleteSection.mutate(section.id)
                        }
                      }}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    {expandedSections.has(section.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </div>

                {/* Lessons */}
                {expandedSections.has(section.id) && (
                  <div className="divide-y divide-gray-100">
                    {section.lessons?.map((lesson: any, lIdx: number) => (
                      <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                        <GripVertical size={14} className="text-gray-300 cursor-grab" />
                        {lessonTypeIcon(lesson.contentType)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate">
                            {lIdx + 1}. {isRtl ? (lesson.titleAr || lesson.title) : lesson.title}
                          </p>
                          {lesson.estimatedMinutes > 0 && (
                            <p className="text-xs text-gray-400">{lesson.estimatedMinutes} {isRtl ? 'دقيقة' : 'min'}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button className="p-1 text-gray-400 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors">
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => deleteLesson.mutate({ sectionId: section.id, lessonId: lesson.id })}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Lesson */}
                    {addLessonSection === section.id ? (
                      <div className="px-4 py-3 bg-blue-50">
                        <div className="flex gap-2 mb-2">
                          <input
                            autoFocus
                            value={newLesson.title}
                            onChange={(e) => setNewLesson((l) => ({ ...l, title: e.target.value }))}
                            placeholder={isRtl ? 'عنوان الدرس' : 'Lesson title'}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-500"
                          />
                          <select
                            value={newLesson.contentType}
                            onChange={(e) => setNewLesson((l) => ({ ...l, contentType: e.target.value }))}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"
                          >
                            <option value="VIDEO">Video</option>
                            <option value="PDF">PDF</option>
                            <option value="TEXT">Text</option>
                            <option value="QUIZ">Quiz</option>
                            <option value="LIVE">Live</option>
                          </select>
                          <input
                            type="number"
                            value={newLesson.estimatedMinutes || ''}
                            onChange={(e) => setNewLesson((l) => ({ ...l, estimatedMinutes: Number(e.target.value) }))}
                            placeholder={isRtl ? 'دقائق' : 'min'}
                            className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => addLesson.mutate({ sectionId: section.id, data: newLesson })}
                            disabled={!newLesson.title || addLesson.isPending}
                            className="text-xs bg-primary-900 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                          >
                            {isRtl ? 'إضافة' : 'Add'}
                          </button>
                          <button
                            onClick={() => setAddLessonSection(null)}
                            className="text-xs text-gray-500 px-3 py-1.5"
                          >
                            {isRtl ? 'إلغاء' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddLessonSection(section.id)}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                      >
                        <Plus size={14} />
                        {isRtl ? 'إضافة درس' : 'Add Lesson'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add Section */}
            {addSectionOpen ? (
              <div className="border-2 border-dashed border-primary-200 rounded-xl p-4 bg-primary-50">
                <input
                  autoFocus
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newSectionTitle) addSection.mutate(newSectionTitle) }}
                  placeholder={isRtl ? 'عنوان الوحدة الجديدة' : 'New section title'}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => newSectionTitle && addSection.mutate(newSectionTitle)}
                    disabled={!newSectionTitle || addSection.isPending}
                    className="text-sm bg-primary-900 text-white px-4 py-2 rounded-xl disabled:opacity-50"
                  >
                    {isRtl ? 'إضافة الوحدة' : 'Add Section'}
                  </button>
                  <button onClick={() => setAddSectionOpen(false)} className="text-sm text-gray-500 px-4 py-2">
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddSectionOpen(true)}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm text-gray-500 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                {isRtl ? 'إضافة وحدة جديدة' : 'Add New Section'}
              </button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
