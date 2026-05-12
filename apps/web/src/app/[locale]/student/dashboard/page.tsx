'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardHeader, CardBody, ProgressBar, Skeleton } from '@/components/ui'
import { BookOpen, ClipboardList, Brain, Star, Zap } from 'lucide-react'
import Link from 'next/link'

export default function StudentDashboardPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const user = useAuthStore((s) => s.user)

  const { data: myCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => api.get('/courses/my-courses').then((r) => r.data?.data || []),
  })

  const { data: myGrades } = useQuery({
    queryKey: ['my-grades'],
    queryFn: () => api.get('/gradebook/my-grades').then((r) => {
      const d = r.data?.data
      return Array.isArray(d) ? d : (d?.grades || [])
    }),
  })

  const { data: attendance } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => api.get('/attendance/my').then((r) => r.data?.data?.stats),
  })

  const greeting = isRtl
    ? `أهلاً، ${user?.firstNameAr || user?.firstName || 'طالب'} 🌟`
    : `Hello, ${user?.firstName || 'Student'} 🌟`

  const avgGrade = myGrades?.length > 0
    ? Math.round(myGrades.reduce((sum: number, g: any) => sum + (g.percentage || 0), 0) / myGrades.length)
    : null

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-accent/20 to-primary-900/10 rounded-2xl p-6 border border-accent/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{greeting}</h2>
            <p className="text-gray-500 text-sm">
              {isRtl
                ? `لديك ${myCourses?.length || 0} مقرر مسجل. استمر في التعلم! 💪`
                : `You have ${myCourses?.length || 0} enrolled courses. Keep learning! 💪`
              }
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-900">{avgGrade ?? '—'}{avgGrade !== null && '%'}</p>
              <p className="text-xs text-gray-500">{isRtl ? 'متوسط الدرجات' : 'Avg. Grade'}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{attendance?.percentage ?? '—'}{attendance && '%'}</p>
              <p className="text-xs text-gray-500">{isRtl ? 'نسبة الحضور' : 'Attendance'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: isRtl ? 'مقرراتي' : 'My Courses', value: myCourses?.length || 0, icon: <BookOpen size={18} />, color: 'text-blue-600 bg-blue-50' },
          { label: isRtl ? 'الواجبات' : 'Assignments', value: '—', icon: <ClipboardList size={18} />, color: 'text-purple-600 bg-purple-50' },
          { label: isRtl ? 'الاختبارات' : 'Quizzes', value: '—', icon: <Brain size={18} />, color: 'text-orange-600 bg-orange-50' },
          { label: isRtl ? 'متوسط الدرجات' : 'Avg. Grade', value: avgGrade ? `${avgGrade}%` : '—', icon: <Star size={18} />, color: 'text-yellow-600 bg-yellow-50' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* My Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {isRtl ? 'مقرراتي الدراسية' : 'My Enrolled Courses'}
            </h3>
            <Link href={`/${locale}/student/courses`} className="text-sm text-primary-700 hover:underline">
              {isRtl ? 'عرض الكل' : 'View All'}
            </Link>
          </div>
        </CardHeader>
        <CardBody>
          {coursesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : myCourses?.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <BookOpen size={48} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium">{isRtl ? 'لم تسجل في أي مقرر بعد' : 'Not enrolled in any course yet'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myCourses?.slice(0, 4).map((enrollment: any) => (
                <Link
                  key={enrollment.id}
                  href={`/${locale}/student/courses/${enrollment.courseId}`}
                  className="block p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {enrollment.course?.coverImage ? (
                      <img
                        src={enrollment.course.coverImage}
                        alt={enrollment.course.title}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={24} className="text-primary-700" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {isRtl
                          ? (enrollment.course?.titleAr || enrollment.course?.title)
                          : enrollment.course?.title
                        }
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        {enrollment.course?.subject?.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={enrollment.progress} className="flex-1" />
                        <span className="text-xs font-medium text-gray-600 flex-shrink-0">
                          {Math.round(enrollment.progress)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* AI Tutor CTA */}
      <Card className="bg-gradient-to-r from-primary-900 to-primary-700 border-0 text-white">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={18} className="text-accent" />
                <span className="text-accent font-semibold text-sm">{isRtl ? 'مدعوم بالذكاء الاصطناعي' : 'AI Powered'}</span>
              </div>
              <h3 className="text-xl font-bold mb-1">
                {isRtl ? 'تحدث مع المدرس الذكي' : 'Chat with AI Tutor'}
              </h3>
              <p className="text-primary-200 text-sm">
                {isRtl
                  ? 'احصل على مساعدة فورية في أي مادة بالعربية أو الإنجليزية'
                  : 'Get instant help in any subject in Arabic or English'
                }
              </p>
            </div>
            <Link
              href={`/${locale}/student/ai-tutor`}
              className="bg-accent text-primary-900 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-accent/90 flex-shrink-0"
            >
              {isRtl ? 'ابدأ الآن' : 'Start Now'}
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
