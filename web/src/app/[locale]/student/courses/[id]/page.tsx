'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { useParams } from 'next/navigation'
import { Skeleton, ProgressBar } from '@/components/ui'
import {
  ChevronDown, ChevronRight, CheckCircle, Play,
  FileText, HelpCircle, Video, BookOpen, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

export default function StudentCourseViewerPage() {
  const { id } = useParams<{ id: string }>()
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const queryClient = useQueryClient()

  const [activeLesson, setActiveLesson] = useState<any>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const { data: course, isLoading } = useQuery({
    queryKey: ['student-course', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data?.data as any),
    onSuccess: (data: any) => {
      // Auto-expand first section
      if (data?.sections?.[0]) {
        setExpandedSections(new Set([data.sections[0].id]))
        setActiveLesson(data.sections[0].lessons?.[0] || null)
      }
    },
  } as any)

  const { data: progress } = useQuery({
    queryKey: ['course-progress', id],
    queryFn: () => api.get(`/courses/${id}/my-progress`).then((r) => r.data?.data),
  })

  const markComplete = useMutation({
    mutationFn: (lessonId: string) =>
      api.patch(`/courses/lessons/${lessonId}/progress`, { isCompleted: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-progress', id] })
      queryClient.invalidateQueries({ queryKey: ['my-courses'] })
    },
  })

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  const lessonIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video size={14} />
      case 'PDF': return <FileText size={14} />
      case 'QUIZ': return <HelpCircle size={14} />
      default: return <BookOpen size={14} />
    }
  }

  const isLessonCompleted = (lessonId: string) => {
    return progress?.completedLessons?.includes(lessonId)
  }

  if (isLoading) {
    return (
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!course) return null

  const courseData = course as any
  const totalLessons = courseData.sections?.reduce((sum: number, s: any) => sum + (s.lessons?.length || 0), 0) || 0
  const completedCount = progress?.completedLessons?.length || 0
  const overallProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-full">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-4">
        {/* Back */}
        <Link href={`/${locale}/student/courses`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} />
          {isRtl ? 'العودة للمقررات' : 'Back to Courses'}
        </Link>

        {/* Lesson Viewer */}
        {activeLesson ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Video / Content Area */}
            {activeLesson.contentType === 'VIDEO' && activeLesson.videoUrl ? (
              <div className="aspect-video bg-gray-900">
                <video
                  src={activeLesson.videoUrl}
                  controls
                  className="w-full h-full"
                  onEnded={() => {
                    if (!isLessonCompleted(activeLesson.id)) {
                      markComplete.mutate(activeLesson.id)
                    }
                  }}
                />
              </div>
            ) : activeLesson.contentType === 'VIDEO' ? (
              <div className="aspect-video bg-gray-900 flex items-center justify-center text-white">
                <div className="text-center">
                  <Play size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm opacity-60">{isRtl ? 'الفيديو غير متاح' : 'Video not available'}</p>
                </div>
              </div>
            ) : activeLesson.contentType === 'PDF' && activeLesson.fileUrl ? (
              <div className="h-96">
                <iframe src={activeLesson.fileUrl} className="w-full h-full" />
              </div>
            ) : (
              <div className="p-8 bg-gray-50 min-h-48 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  {lessonIcon(activeLesson.contentType)}
                  <p className="mt-2 text-sm">{isRtl ? 'المحتوى غير متاح حالياً' : 'Content not available yet'}</p>
                </div>
              </div>
            )}

            {/* Lesson Info */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {isRtl ? (activeLesson.titleAr || activeLesson.title) : activeLesson.title}
                  </h2>
                  {activeLesson.estimatedMinutes > 0 && (
                    <p className="text-sm text-gray-500">{activeLesson.estimatedMinutes} {isRtl ? 'دقيقة' : 'minutes'}</p>
                  )}
                </div>
                {isLessonCompleted(activeLesson.id) ? (
                  <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                    <CheckCircle size={18} />
                    {isRtl ? 'مكتمل' : 'Completed'}
                  </div>
                ) : (
                  <button
                    onClick={() => markComplete.mutate(activeLesson.id)}
                    disabled={markComplete.isPending}
                    className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-60"
                  >
                    <CheckCircle size={16} />
                    {isRtl ? 'تم الإنهاء' : 'Mark Complete'}
                  </button>
                )}
              </div>

              {activeLesson.content && (
                <div className="mt-4 prose prose-sm max-w-none text-gray-700" dir={isRtl ? 'rtl' : 'ltr'}>
                  <p>{activeLesson.content}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
            <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
            <p>{isRtl ? 'اختر درساً من القائمة' : 'Select a lesson from the sidebar'}</p>
          </div>
        )}
      </div>

      {/* Sidebar: Course Outline */}
      <div className="space-y-4">
        {/* Progress */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {isRtl ? 'تقدمك في المقرر' : 'Your Progress'}
          </p>
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{completedCount} / {totalLessons} {isRtl ? 'درس' : 'lessons'}</span>
            <span className="font-medium text-primary-700">{overallProgress}%</span>
          </div>
          <ProgressBar value={overallProgress} />
        </div>

        {/* Course Outline */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900 text-sm">
              {isRtl ? 'محتوى المقرر' : 'Course Content'}
            </p>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {courseData.sections?.map((section: any, sIdx: number) => (
              <div key={section.id} className="border-b border-gray-50 last:border-0">
                {/* Section */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  {expandedSections.has(section.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {isRtl ? `${sIdx + 1}. ${section.titleAr || section.title}` : `${sIdx + 1}. ${section.title}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {section.lessons?.length || 0} {isRtl ? 'درس' : 'lessons'}
                    </p>
                  </div>
                </button>

                {/* Lessons */}
                {expandedSections.has(section.id) && section.lessons?.map((lesson: any, lIdx: number) => {
                  const completed = isLessonCompleted(lesson.id)
                  const isActive = activeLesson?.id === lesson.id
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className={`w-full flex items-center gap-3 pl-10 pr-4 py-2.5 text-left transition-colors ${
                        isActive
                          ? 'bg-primary-50 border-r-2 border-primary-700'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`flex-shrink-0 ${completed ? 'text-green-500' : isActive ? 'text-primary-700' : 'text-gray-400'}`}>
                        {completed ? <CheckCircle size={14} /> : lessonIcon(lesson.contentType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs truncate ${isActive ? 'text-primary-700 font-medium' : 'text-gray-700'}`}>
                          {lIdx + 1}. {isRtl ? (lesson.titleAr || lesson.title) : lesson.title}
                        </p>
                        {lesson.estimatedMinutes > 0 && (
                          <p className="text-xs text-gray-400">{lesson.estimatedMinutes}m</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
