'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardBody, Badge, Skeleton, Avatar } from '@/components/ui'
import { Users } from 'lucide-react'
import Link from 'next/link'

export default function ParentChildrenPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const { data: children, isLoading } = useQuery({
    queryKey: ['my-children'],
    queryFn: () => api.get('/parent/children').then(r => r.data?.data || []),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'أبنائي' : 'My Children'}</h1>
        <p className="text-gray-500 text-sm">{isRtl ? 'متابعة شاملة لأبنائك المسجلين' : 'Comprehensive view of your registered children'}</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>
      ) : children?.length === 0 ? (
        <Card><CardBody>
          <div className="text-center py-16 text-gray-400">
            <Users size={48} className="mx-auto mb-3 opacity-30" />
            <p>{isRtl ? 'لا يوجد أبناء مرتبطون بحسابك' : 'No children linked to your account'}</p>
            <p className="text-xs mt-2">{isRtl ? 'تواصل مع إدارة المدرسة لربط حسابات أبنائك' : 'Contact school administration to link your children'}</p>
          </div>
        </CardBody></Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {children?.map((link: any) => {
            const student = link.student
            const profile = student?.profile
            return (
              <Card key={link.id} className="hover:shadow-md transition-shadow">
                <CardBody>
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-5">
                    <Avatar name={`${profile?.firstName} ${profile?.lastName}`} src={profile?.avatar} size="lg" />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">
                        {isRtl && profile?.firstNameAr
                          ? `${profile.firstNameAr} ${profile.lastNameAr || ''}`
                          : `${profile?.firstName || ''} ${profile?.lastName || ''}`}
                      </h3>
                      <p className="text-sm text-gray-500">{student?.email}</p>
                      <Badge variant="default" className="text-xs mt-1">{student?.grade || (isRtl ? 'الصف غير محدد' : 'Grade N/A')}</Badge>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-blue-700">{link.avgGrade ? `${link.avgGrade}%` : '—'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{isRtl ? 'المعدل' : 'Average'}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-green-700">{link.attendance ? `${link.attendance}%` : '—'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{isRtl ? 'الحضور' : 'Attend.'}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-purple-700">{student?._count?.enrollments || 0}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{isRtl ? 'مقررات' : 'Courses'}</p>
                    </div>
                  </div>

                  {/* Enrolled Courses */}
                  {student?.enrollments?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">{isRtl ? 'المقررات المسجل بها:' : 'Enrolled in:'}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {student.enrollments.slice(0, 4).map((enr: any) => (
                          <span key={enr.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                            {isRtl ? (enr.course?.titleAr || enr.course?.title) : enr.course?.title}
                          </span>
                        ))}
                        {student.enrollments.length > 4 && <span className="text-xs text-gray-400">+{student.enrollments.length - 4}</span>}
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/${locale}/parent/children/${student?.id}`}
                    className="block w-full text-center bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-800 transition-colors"
                  >
                    {isRtl ? 'عرض التفاصيل الكاملة' : 'View Full Details'}
                  </Link>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
