'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Skeleton, Avatar } from '@/components/ui'
import { ArrowLeft, BarChart2, Calendar, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function ChildDetailPage({ params }: { params: { studentId: string } }) {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const { studentId } = params

  const { data: child, isLoading } = useQuery({
    queryKey: ['child-detail', studentId],
    queryFn: () => api.get(`/parent/children/${studentId}`).then(r => r.data?.data),
  })

  const { data: grades } = useQuery({
    queryKey: ['child-grades', studentId],
    queryFn: () => api.get(`/gradebook/student/${studentId}`).then(r => {
      const d = r.data?.data
      return Array.isArray(d) ? d : (d?.grades || d?.data || [])
    }),
  })

  const { data: attendance } = useQuery({
    queryKey: ['child-attendance', studentId],
    queryFn: () => api.get(`/attendance/student/${studentId}`).then(r => {
      const d = r.data?.data
      return Array.isArray(d) ? d : (d?.records || d?.data || [])
    }),
  })

  const profile = child?.profile
  const attRecords = Array.isArray(attendance) ? attendance : []
  const present = attRecords.filter((r: any) => r.status === 'PRESENT' || r.status === 'LATE').length
  const attPct = attRecords.length > 0 ? Math.round((present / attRecords.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/parent/children`} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} className={isRtl ? 'rotate-180' : ''} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'تفاصيل الطالب' : 'Student Details'}</h1>
          <p className="text-gray-500 text-sm">{isRtl ? 'متابعة شاملة' : 'Comprehensive overview'}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : (
        <>
          {/* Profile Card */}
          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <Avatar name={`${profile?.firstName} ${profile?.lastName}`} src={profile?.avatar} size="xl" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {isRtl && profile?.firstNameAr
                      ? `${profile.firstNameAr} ${profile.lastNameAr || ''}`
                      : `${profile?.firstName || ''} ${profile?.lastName || ''}`}
                  </h2>
                  <p className="text-gray-500 text-sm">{child?.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="default">{child?.grade || (isRtl ? 'الصف غير محدد' : 'N/A')}</Badge>
                    <Badge variant={child?.isActive ? 'success' : 'danger'}>{child?.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'غير نشط' : 'Inactive')}</Badge>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-2xl p-4 text-center">
              <BarChart2 size={24} className="text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-700">{grades?.length || 0}</p>
              <p className="text-xs text-gray-500">{isRtl ? 'تقييمات' : 'Grades'}</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-4 text-center">
              <Calendar size={24} className="text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">{attPct}%</p>
              <p className="text-xs text-gray-500">{isRtl ? 'الحضور' : 'Attendance'}</p>
            </div>
            <div className="bg-purple-50 rounded-2xl p-4 text-center">
              <BookOpen size={24} className="text-purple-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple-700">{child?._count?.enrollments || 0}</p>
              <p className="text-xs text-gray-500">{isRtl ? 'مقررات' : 'Courses'}</p>
            </div>
          </div>

          {/* Recent Grades */}
          <Card>
            <CardHeader><h3 className="font-semibold text-gray-900">{isRtl ? 'آخر الدرجات' : 'Recent Grades'}</h3></CardHeader>
            <CardBody>
              {!grades?.length ? (
                <p className="text-sm text-gray-400 text-center py-6">{isRtl ? 'لا توجد درجات' : 'No grades yet'}</p>
              ) : (
                <div className="space-y-2">
                  {grades.slice(0, 8).map((g: any) => (
                    <div key={g.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{g.title || g.type}</p>
                        <p className="text-xs text-gray-400">{g.course?.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{g.points}/{g.maxPoints}</p>
                        <p className="text-xs text-gray-400">{Math.round(g.percentage || 0)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Recent Attendance */}
          <Card>
            <CardHeader><h3 className="font-semibold text-gray-900">{isRtl ? 'آخر سجلات الحضور' : 'Recent Attendance'}</h3></CardHeader>
            <CardBody>
              {!attRecords.length ? (
                <p className="text-sm text-gray-400 text-center py-6">{isRtl ? 'لا يوجد سجل حضور' : 'No attendance records'}</p>
              ) : (
                <div className="space-y-2">
                  {attRecords.slice(0, 8).map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <p className="text-sm text-gray-700">{r.date ? new Date(r.date).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : '—'}</p>
                      <Badge variant={r.status === 'PRESENT' ? 'success' : r.status === 'ABSENT' ? 'danger' : 'warning'} className="text-xs">
                        {r.status === 'PRESENT' ? (isRtl ? 'حاضر' : 'Present') : r.status === 'ABSENT' ? (isRtl ? 'غائب' : 'Absent') : (isRtl ? 'متأخر' : 'Late')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  )
}
