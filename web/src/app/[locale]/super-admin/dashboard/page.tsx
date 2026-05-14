'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardBody, Skeleton } from '@/components/ui'
import {
  Building2, Users, GraduationCap, ShoppingCart, Package,
  Briefcase, Star, CreditCard, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

function StatCard({ icon: Icon, label, value, sub, color, href }: {
  icon: any; label: string; value: any; sub?: string; color: string; href?: string
}) {
  const inner = (
    <Card className="hover:shadow-md transition-shadow">
      <CardBody className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${color}`}>
            <Icon size={22} />
          </div>
        </div>
      </CardBody>
    </Card>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

function statusBadge(status: string, isRtl: boolean) {
  const map: Record<string, { label: string; labelAr: string; cls: string }> = {
    PENDING:             { label: 'Pending',     labelAr: 'في الانتظار',   cls: 'bg-yellow-100 text-yellow-700' },
    APPROVED:            { label: 'Approved',    labelAr: 'موافق عليه',    cls: 'bg-green-100 text-green-700' },
    REJECTED:            { label: 'Rejected',    labelAr: 'مرفوض',         cls: 'bg-red-100 text-red-700' },
    IN_PROGRESS:         { label: 'In Progress', labelAr: 'قيد التنفيذ',   cls: 'bg-blue-100 text-blue-700' },
    COMPLETED:           { label: 'Completed',   labelAr: 'مكتمل',         cls: 'bg-teal-100 text-teal-700' },
    RECEIVED:            { label: 'Received',    labelAr: 'مستلم',         cls: 'bg-gray-100 text-gray-700' },
    SCREENING:           { label: 'Screening',   labelAr: 'مراجعة أولية',  cls: 'bg-purple-100 text-purple-700' },
    SHORTLISTED:         { label: 'Shortlisted', labelAr: 'مدرج',          cls: 'bg-indigo-100 text-indigo-700' },
    INTERVIEW_SCHEDULED: { label: 'Interview',   labelAr: 'مقابلة',        cls: 'bg-orange-100 text-orange-700' },
    HIRED:               { label: 'Hired',       labelAr: 'تم التوظيف',   cls: 'bg-green-100 text-green-700' },
  }
  const s = map[status]
  if (!s) return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{status}</span>
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${s.cls}`}>{isRtl ? s.labelAr : s.label}</span>
}

function planBadge(plan?: string) {
  const map: Record<string, string> = { STARTER: 'bg-gray-100 text-gray-700', PROFESSIONAL: 'bg-blue-100 text-blue-700', ENTERPRISE: 'bg-purple-100 text-purple-700' }
  return <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${map[plan ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>{plan ?? '—'}</span>
}

export default function OwnerDashboardPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const user = useAuthStore((s) => s.user) as any

  const { data, isLoading } = useQuery({
    queryKey: ['owner-overview'],
    queryFn: () => api.get('/owner/overview').then((r) => r.data?.data ?? r.data),
  })

  const org = data?.organization
  const stats = data?.stats
  const schools: any[] = data?.schools ?? []
  const recentPurchases: any[] = data?.recentPurchases ?? []
  const recentJobApps: any[] = data?.recentJobApps ?? []

  const ownerName = user?.profile ? `${user.profile.firstName}` : user?.email?.split('@')[0] ?? ''

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-2xl font-bold text-gray-900 ${isRtl ? 'font-arabic' : ''}`}>
            {isRtl ? `مرحباً، ${ownerName} 👋` : `Welcome back, ${ownerName} 👋`}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isLoading ? '...' : (isRtl ? `لوحة تحكم مؤسسة ${org?.name ?? ''}` : `${org?.name ?? ''} — Company Dashboard`)}
          </p>
        </div>
        {!isLoading && stats?.subscription && (
          <div className="flex items-center gap-3 flex-wrap">
            {planBadge(stats.subscription.plan)}
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              stats.subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
              stats.subscription.status === 'TRIALING' ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {stats.subscription.status}
            </span>
            {stats.subscription.currentPeriodEnd && (
              <span className="text-xs text-gray-400">
                {isRtl ? 'ينتهي' : 'Expires'} {format(new Date(stats.subscription.currentPeriodEnd), 'dd MMM yyyy')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Building2}    label={isRtl ? 'المدارس' : 'Schools'}                value={stats?.totalSchools}          color="bg-blue-50 text-blue-600"    href={`/${locale}/super-admin/schools`} />
          <StatCard icon={GraduationCap} label={isRtl ? 'الطلاب' : 'Students'}              value={stats?.totalStudents}         color="bg-teal-50 text-teal-600" />
          <StatCard icon={Users}         label={isRtl ? 'الموظفون' : 'Staff Members'}        value={stats?.totalStaff}            color="bg-purple-50 text-purple-600" />
          <StatCard icon={CreditCard}    label={isRtl ? 'الميزانية المعتمدة' : 'Approved Budget'} value={`$${(stats?.approvedBudget ?? 0).toLocaleString()}`} color="bg-green-50 text-green-600" />
          <StatCard icon={ShoppingCart}  label={isRtl ? 'طلبات شراء معلقة' : 'Pending Purchases'}       value={stats?.pendingPurchases}      sub={isRtl ? 'تنتظر الموافقة' : 'Awaiting approval'} color="bg-orange-50 text-orange-600" href={`/${locale}/super-admin/purchase-requests`} />
          <StatCard icon={Package}       label={isRtl ? 'طلبات توريد معلقة' : 'Pending Requisitions'}   value={stats?.pendingRequisitions}   sub={isRtl ? 'تنتظر الموافقة' : 'Awaiting approval'} color="bg-amber-50 text-amber-600"  href={`/${locale}/super-admin/requisitions`} />
          <StatCard icon={Briefcase}     label={isRtl ? 'طلبات توظيف' : 'Open Job Applications'}         value={stats?.openJobApps}          sub={isRtl ? 'في خط الإدخال' : 'In pipeline'}      color="bg-indigo-50 text-indigo-600" href={`/${locale}/super-admin/jobs`} />
          <StatCard icon={Star}          label={isRtl ? 'حد الطلاب' : 'Student Limit'}                   value={stats?.subscription?.maxStudents ?? '∞'} sub={isRtl ? `${stats?.totalStudents ?? 0} مسجل` : `${stats?.totalStudents ?? 0} enrolled`} color="bg-rose-50 text-rose-600" />
        </div>
      )}

      {/* Schools + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-base font-semibold text-gray-900 ${isRtl ? 'font-arabic' : ''}`}>{isRtl ? 'المدارس' : 'Your Schools'}</h2>
            <Link href={`/${locale}/super-admin/schools`} className="text-xs text-primary-600 hover:underline flex items-center gap-1">{isRtl ? 'عرض الكل' : 'View all'} <ChevronRight size={14} /></Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : schools.length === 0 ? (
            <Card><CardBody className="p-6 text-center text-gray-400 text-sm">{isRtl ? 'لا توجد مدارس بعد' : 'No schools yet'}</CardBody></Card>
          ) : (
            <div className="space-y-3">
              {schools.map((school) => (
                <Card key={school.id} className="hover:shadow-sm transition-shadow">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                        {school.name?.[0] ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{school.name}</p>
                        <p className="text-xs text-gray-400">{school.curriculumType} · {school._count?.users ?? 0} {isRtl ? 'مستخدم' : 'users'}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${school.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {school.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'غير نشط' : 'Inactive')}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className={`text-base font-semibold text-gray-900 ${isRtl ? 'font-arabic' : ''}`}>{isRtl ? 'إجراءات سريعة' : 'Quick Actions'}</h2>
          {[
            { href: `/${locale}/super-admin/purchase-requests`, icon: ShoppingCart, label: isRtl ? 'طلبات الشراء' : 'Purchase Requests', badge: stats?.pendingPurchases, color: 'text-orange-600 bg-orange-50' },
            { href: `/${locale}/super-admin/requisitions`,       icon: Package,      label: isRtl ? 'طلبات التوريد' : 'Requisitions',       badge: stats?.pendingRequisitions, color: 'text-amber-600 bg-amber-50' },
            { href: `/${locale}/super-admin/jobs`,               icon: Briefcase,    label: isRtl ? 'طلبات التوظيف' : 'Job Applications',   badge: stats?.openJobApps, color: 'text-indigo-600 bg-indigo-50' },
            { href: `/${locale}/super-admin/schools`,            icon: Building2,    label: isRtl ? 'إدارة المدارس' : 'Manage Schools',      badge: null, color: 'text-blue-600 bg-blue-50' },
            { href: `/${locale}/super-admin/settings`,           icon: Star,         label: isRtl ? 'إعدادات المنظمة' : 'Org Settings',      badge: null, color: 'text-purple-600 bg-purple-50' },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-md hover:border-primary-200 transition-all cursor-pointer mb-2">
                <CardBody className="p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <item.icon size={18} />
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-800">{item.label}</span>
                  {item.badge ? (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{item.badge}</span>
                  ) : (
                    <ChevronRight size={16} className="text-gray-300" />
                  )}
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-base font-semibold text-gray-900 ${isRtl ? 'font-arabic' : ''}`}>{isRtl ? 'أحدث طلبات الشراء' : 'Recent Purchase Requests'}</h2>
            <Link href={`/${locale}/super-admin/purchase-requests`} className="text-xs text-primary-600 hover:underline flex items-center gap-1">{isRtl ? 'عرض الكل' : 'View all'} <ChevronRight size={14} /></Link>
          </div>
          {isLoading ? <Skeleton className="h-48 rounded-xl" /> : recentPurchases.length === 0 ? (
            <Card><CardBody className="p-6 text-center text-gray-400 text-sm">{isRtl ? 'لا توجد طلبات بعد' : 'No purchase requests yet'}</CardBody></Card>
          ) : (
            <Card>
              <CardBody className="p-0 divide-y divide-gray-50">
                {recentPurchases.map((pr) => (
                  <div key={pr.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                      <ShoppingCart size={15} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{pr.title}</p>
                      <p className="text-xs text-gray-400">{pr.school?.name ?? 'HQ'} · {pr.currency} {pr.estimatedCost?.toLocaleString()}</p>
                    </div>
                    {statusBadge(pr.status, isRtl)}
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-base font-semibold text-gray-900 ${isRtl ? 'font-arabic' : ''}`}>{isRtl ? 'أحدث طلبات التوظيف' : 'Recent Job Applications'}</h2>
            <Link href={`/${locale}/super-admin/jobs`} className="text-xs text-primary-600 hover:underline flex items-center gap-1">{isRtl ? 'عرض الكل' : 'View all'} <ChevronRight size={14} /></Link>
          </div>
          {isLoading ? <Skeleton className="h-48 rounded-xl" /> : recentJobApps.length === 0 ? (
            <Card><CardBody className="p-6 text-center text-gray-400 text-sm">{isRtl ? 'لا توجد طلبات توظيف بعد' : 'No job applications yet'}</CardBody></Card>
          ) : (
            <Card>
              <CardBody className="p-0 divide-y divide-gray-50">
                {recentJobApps.map((app) => (
                  <div key={app.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                      {app.fullName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{app.fullName}</p>
                      <p className="text-xs text-gray-400">{app.position}{app.department ? ` · ${app.department}` : ''}</p>
                    </div>
                    {statusBadge(app.status, isRtl)}
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
