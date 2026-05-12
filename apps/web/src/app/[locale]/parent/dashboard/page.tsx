'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardHeader, CardBody, Badge, Skeleton, Avatar } from '@/components/ui'
import { Users, DollarSign, Bell } from 'lucide-react'
import Link from 'next/link'

export default function ParentDashboardPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const user = useAuthStore((s) => s.user)

  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ['my-children'],
    queryFn: () => api.get('/parent/children').then((r) => r.data?.data || []),
  })

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['parent-invoices'],
    queryFn: () => api.get('/parent/invoices').then((r) => (r.data?.data || []).filter((i: any) => i.status === 'UNPAID' || i.status === 'PARTIAL' || i.status === 'OVERDUE')),
  })

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/messaging/announcements').then((r) => r.data?.data || []),
  })

  const greeting = isRtl
    ? `مرحباً، ${user?.firstNameAr || user?.firstName || 'ولي الأمر'} 👋`
    : `Hello, ${user?.firstName || 'Parent'} 👋`

  const totalUnpaid = invoices?.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">{greeting}</h2>
        <p className="text-emerald-100 text-sm">
          {isRtl
            ? `لديك ${children?.length || 0} ${children?.length === 1 ? 'طالب' : 'طلاب'} مسجلون`
            : `You have ${children?.length || 0} registered ${children?.length === 1 ? 'student' : 'students'}`
          }
        </p>
        <div className="flex gap-4 mt-4">
          <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-bold">{children?.length || 0}</p>
            <p className="text-xs text-emerald-100">{isRtl ? 'أبنائي' : 'Children'}</p>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-bold">{invoices?.length || 0}</p>
            <p className="text-xs text-emerald-100">{isRtl ? 'فواتير مستحقة' : 'Unpaid Bills'}</p>
          </div>
          {totalUnpaid > 0 && (
            <div className="bg-red-500/30 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{totalUnpaid.toLocaleString()}</p>
              <p className="text-xs text-emerald-100">{isRtl ? 'ريال مستحق' : 'SAR Due'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Children Cards */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">
          {isRtl ? 'متابعة الأبناء' : 'My Children'}
        </h3>
        {childrenLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : children?.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-10 text-gray-400">
                <Users size={48} className="mx-auto mb-3 opacity-40" />
                <p>{isRtl ? 'لا يوجد أبناء مرتبطون بحسابك' : 'No children linked to your account'}</p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {children?.map((link: any) => {
              const student = link.student
              const profile = student?.profile
              return (
                <Card key={link.id} className="hover:shadow-md transition-shadow">
                  <CardBody>
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar
                        name={`${profile?.firstName} ${profile?.lastName}`}
                        src={profile?.avatar}
                        size="lg"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {isRtl
                            ? (profile?.firstNameAr
                              ? `${profile.firstNameAr} ${profile.lastNameAr || ''}`
                              : `${profile?.firstName} ${profile?.lastName || ''}`)
                            : `${profile?.firstName} ${profile?.lastName || ''}`
                          }
                        </p>
                        <p className="text-sm text-gray-500">{student?.grade || (isRtl ? 'الصف غير محدد' : 'Grade N/A')}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="default" className="text-xs">
                            {student?._count?.enrollments || 0} {isRtl ? 'مقررات' : 'courses'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-blue-700">
                          {link.avgGrade ? `${link.avgGrade}%` : '—'}
                        </p>
                        <p className="text-xs text-gray-500">{isRtl ? 'المعدل' : 'Avg'}</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-green-700">
                          {link.attendance ? `${link.attendance}%` : '—'}
                        </p>
                        <p className="text-xs text-gray-500">{isRtl ? 'الحضور' : 'Attend.'}</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-purple-700">
                          {link.pendingAssignments ?? '—'}
                        </p>
                        <p className="text-xs text-gray-500">{isRtl ? 'واجبات' : 'Tasks'}</p>
                      </div>
                    </div>

                    <Link
                      href={`/${locale}/parent/children/${student?.id}`}
                      className="block w-full text-center bg-emerald-700 text-white py-2 rounded-xl text-sm font-medium hover:bg-emerald-800 transition-colors"
                    >
                      {isRtl ? 'عرض التفاصيل' : 'View Details'}
                    </Link>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Unpaid Invoices */}
      {(invoices?.length > 0 || invoicesLoading) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-red-500" />
                <h3 className="font-semibold text-gray-900">
                  {isRtl ? 'الفواتير المستحقة' : 'Unpaid Invoices'}
                </h3>
              </div>
              <Link href={`/${locale}/parent/finance`} className="text-sm text-primary-700 hover:underline">
                {isRtl ? 'عرض الكل' : 'View All'}
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            {invoicesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {invoices?.slice(0, 3).map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-red-100 bg-red-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.description || (isRtl ? 'رسوم دراسية' : 'School Fees')}</p>
                      <p className="text-xs text-gray-500">
                        {isRtl ? 'تاريخ الاستحقاق: ' : 'Due: '}
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{inv.total?.toLocaleString()} {isRtl ? 'ر.س' : 'SAR'}</p>
                      <Link
                        href={`/${locale}/parent/finance/pay/${inv.id}`}
                        className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 inline-block mt-1"
                      >
                        {isRtl ? 'ادفع الآن' : 'Pay Now'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Announcements */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-primary-700" />
            <h3 className="font-semibold text-gray-900">
              {isRtl ? 'إعلانات المدرسة' : 'School Announcements'}
            </h3>
          </div>
        </CardHeader>
        <CardBody>
          {!announcements || announcements.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Bell size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">{isRtl ? 'لا توجد إعلانات جديدة' : 'No new announcements'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 5).map((ann: any) => (
                <div key={ann.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                  <p className="text-sm font-medium text-gray-900 mb-1">{ann.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{ann.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
