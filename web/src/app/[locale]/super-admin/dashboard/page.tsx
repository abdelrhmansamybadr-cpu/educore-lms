'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { Card, CardHeader, CardBody, Badge, Skeleton, StatsCard } from '@/components/ui'
import { Building2, Users, GraduationCap, DollarSign, Server } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import Link from 'next/link'

const COLORS = ['#1E3A5F', '#2DD4BF', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export default function SuperAdminDashboardPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const { data: stats, isLoading } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: () => api.get('/super-admin/stats').then((r) => r.data?.data),
  })

  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ['super-admin-schools-recent'],
    queryFn: () => api.get('/super-admin/schools?limit=5&page=1').then((r) => r.data?.data?.data || []),
  })

  const chartData = stats?.monthlySchools || [
    { month: 'Jan', schools: 2 }, { month: 'Feb', schools: 3 }, { month: 'Mar', schools: 5 },
    { month: 'Apr', schools: 4 }, { month: 'May', schools: 7 }, { month: 'Jun', schools: 6 },
  ]

  const planData = stats?.planDistribution || [
    { name: 'Starter', value: 12 }, { name: 'Professional', value: 8 }, { name: 'Enterprise', value: 3 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold text-gray-900 ${isRtl ? 'font-arabic' : ''}`}>
          {isRtl ? 'لوحة التحكم الرئيسية' : 'Platform Dashboard'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isRtl ? 'نظرة عامة على المنصة بأكملها' : 'Overview of the entire EduCore platform'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatsCard
              title={isRtl ? 'إجمالي المدارس' : 'Total Schools'}
              value={stats?.totalSchools ?? 0}
              icon={<Building2 size={22} />}
              change={isRtl ? '+2 هذا الشهر' : '+2 this month'}
              changeType="up"
            />
            <StatsCard
              title={isRtl ? 'إجمالي المستخدمين' : 'Total Users'}
              value={(stats?.totalUsers ?? 0).toLocaleString()}
              icon={<Users size={22} />}
              change={isRtl ? '+124 هذا الأسبوع' : '+124 this week'}
              changeType="up"
            />
            <StatsCard
              title={isRtl ? 'الطلاب النشطون' : 'Active Students'}
              value={(stats?.totalStudents ?? 0).toLocaleString()}
              icon={<GraduationCap size={22} />}
              change={isRtl ? '92% معدل النشاط' : '92% activity rate'}
              changeType="neutral"
            />
            <StatsCard
              title={isRtl ? 'الإيرادات الشهرية' : 'Monthly Revenue (MRR)'}
              value={`$${(stats?.mrr ?? 0).toLocaleString()}`}
              icon={<DollarSign size={22} />}
              change={isRtl ? '+18% عن الشهر الماضي' : '+18% vs last month'}
              changeType="up"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Schools Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className={`font-semibold text-gray-900 ${isRtl ? 'font-arabic' : ''}`}>
                {isRtl ? 'مدارس جديدة شهرياً' : 'New Schools Monthly'}
              </h2>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="schools" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <h2 className={`font-semibold text-gray-900 ${isRtl ? 'font-arabic' : ''}`}>
              {isRtl ? 'توزيع الباقات' : 'Plan Distribution'}
            </h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={planData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label>
                  {planData.map((_: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* System Health + Recent Schools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server size={16} className="text-gray-400" />
              <h2 className={`font-semibold text-gray-900 ${isRtl ? 'font-arabic' : ''}`}>
                {isRtl ? 'حالة النظام' : 'System Health'}
              </h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {[
              { label: isRtl ? 'واجهة API' : 'API Server', status: 'operational' },
              { label: isRtl ? 'قاعدة البيانات' : 'Database', status: 'operational' },
              { label: 'Redis Cache', status: 'operational' },
              { label: isRtl ? 'التخزين S3' : 'S3 Storage', status: 'operational' },
              { label: isRtl ? 'الإشعارات' : 'Notifications', status: 'operational' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.label}</span>
                <Badge variant="success">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block me-1" />
                  {isRtl ? 'يعمل' : 'Operational'}
                </Badge>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Recent Schools */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className={`font-semibold text-gray-900 ${isRtl ? 'font-arabic' : ''}`}>
                  {isRtl ? 'أحدث المدارس' : 'Recent Schools'}
                </h2>
                <Link href={`/${locale}/super-admin/schools`} className="text-sm text-primary-900 hover:underline">
                  {isRtl ? 'عرض الكل' : 'View all'}
                </Link>
              </div>
            </CardHeader>
            <CardBody>
              {schoolsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : schools?.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">
                  {isRtl ? 'لا توجد مدارس بعد' : 'No schools yet'}
                </p>
              ) : (
                <div className="space-y-3">
                  {(schools || []).map((school: any) => (
                    <div key={school.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                          {school.logo ? (
                            <img src={school.logo} alt="" className="w-8 h-8 rounded-lg object-contain" />
                          ) : (
                            <Building2 size={16} className="text-primary-900" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {isRtl ? school.nameAr || school.name : school.name}
                          </p>
                          <p className="text-xs text-gray-400">{school.country} · {school.curriculumType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={school.isActive ? 'success' : 'danger'}>
                          {school.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'غير نشط' : 'Inactive')}
                        </Badge>
                        <Link
                          href={`/${locale}/super-admin/schools/${school.id}`}
                          className="text-xs text-primary-900 hover:underline"
                        >
                          {isRtl ? 'تفاصيل' : 'Details'}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
