'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from 'next-intl'
import { StatsCard, Card, CardHeader, CardBody, Badge, Avatar, Skeleton } from '@/components/ui'
import { Users, BookOpen, DollarSign, Ticket } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

const mockAttendanceData = [
  { day: 'الأحد', present: 85 }, { day: 'الاثنين', present: 92 },
  { day: 'الثلاثاء', present: 78 }, { day: 'الأربعاء', present: 88 },
  { day: 'الخميس', present: 95 },
]

export default function AdminDashboardPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [users, courses, finance, tickets] = await Promise.allSettled([
        api.get('/users?limit=1'),
        api.get('/courses?limit=1'),
        api.get('/finance/summary'),
        api.get('/tickets/stats'),
      ])
      return {
        users: users.status === 'fulfilled' ? users.value.data?.meta?.total || 0 : 0,
        courses: courses.status === 'fulfilled' ? courses.value.data?.meta?.total || 0 : 0,
        finance: finance.status === 'fulfilled' ? finance.value.data?.data : null,
        tickets: tickets.status === 'fulfilled' ? tickets.value.data?.data : null,
      }
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isRtl ? 'لوحة التحكم' : 'Admin Dashboard'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isRtl ? 'مرحباً بك في نظام EduCore لإدارة المدرسة' : 'Welcome to EduCore School Management'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatsCard
              title={isRtl ? 'إجمالي المستخدمين' : 'Total Users'}
              value={stats?.users?.toLocaleString() || '0'}
              icon={<Users size={22} />}
              change={isRtl ? '+12 هذا الأسبوع' : '+12 this week'}
              changeType="up"
            />
            <StatsCard
              title={isRtl ? 'المقررات الدراسية' : 'Active Courses'}
              value={stats?.courses?.toLocaleString() || '0'}
              icon={<BookOpen size={22} />}
            />
            <StatsCard
              title={isRtl ? 'الإيرادات المحصلة' : 'Revenue Collected'}
              value={stats?.finance
                ? formatCurrency(stats.finance.totalPaid, 'EGP', locale === 'ar' ? 'ar-EG' : 'en-US')
                : '—'
              }
              icon={<DollarSign size={22} />}
              change={isRtl ? 'من إجمالي الفواتير' : 'of total invoiced'}
              changeType="neutral"
            />
            <StatsCard
              title={isRtl ? 'تذاكر الدعم المفتوحة' : 'Open Tickets'}
              value={stats?.tickets?.open || 0}
              icon={<Ticket size={22} />}
              change={stats?.tickets?.urgent ? `${stats.tickets.urgent} ${isRtl ? 'عاجلة' : 'urgent'}` : undefined}
              changeType={stats?.tickets?.urgent > 0 ? 'down' : 'neutral'}
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {isRtl ? 'نسبة الحضور هذا الأسبوع' : 'Attendance Rate This Week'}
              </h3>
              <Badge variant="success">{isRtl ? 'هذا الأسبوع' : 'This Week'}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mockAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v}%`, isRtl ? 'نسبة الحضور' : 'Attendance']} />
                <Bar dataKey="present" fill="#2DD4BF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">
              {isRtl ? 'الإجراءات السريعة' : 'Quick Actions'}
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: isRtl ? 'إضافة مستخدم' : 'Add User', href: `/${locale}/admin/users/new`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                { label: isRtl ? 'إنشاء مقرر' : 'Create Course', href: `/${locale}/admin/courses/new`, color: 'bg-green-50 text-green-700 border-green-200' },
                { label: isRtl ? 'إنشاء فاتورة' : 'Create Invoice', href: `/${locale}/admin/finance/new`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
                { label: isRtl ? 'إعلان جديد' : 'New Announcement', href: `/${locale}/admin/announcements/new`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
                { label: isRtl ? 'تقرير الحضور' : 'Attendance Report', href: `/${locale}/admin/attendance`, color: 'bg-teal-50 text-teal-700 border-teal-200' },
                { label: isRtl ? 'إعدادات المدرسة' : 'School Settings', href: `/${locale}/admin/settings`, color: 'bg-gray-50 text-gray-700 border-gray-200' },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className={`p-3 rounded-xl border text-sm font-medium text-center transition-colors hover:opacity-80 ${action.color}`}
                >
                  {action.label}
                </a>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">
            {isRtl ? 'آخر النشاطات' : 'Recent Activity'}
          </h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {[
              { name: isRtl ? 'أحمد محمد' : 'Ahmed Mohamed', action: isRtl ? 'سجل دخول' : 'logged in', time: '2m ago', type: 'user' },
              { name: isRtl ? 'فاطمة علي' : 'Fatima Ali', action: isRtl ? 'سلّم واجبًا' : 'submitted assignment', time: '5m ago', type: 'assignment' },
              { name: isRtl ? 'محمد السيد' : 'Mohamed El-Sayed', action: isRtl ? 'فتح تذكرة دعم' : 'opened support ticket', time: '12m ago', type: 'ticket' },
              { name: isRtl ? 'سارة أحمد' : 'Sarah Ahmed', action: isRtl ? 'أكملت اختبارًا' : 'completed quiz', time: '20m ago', type: 'quiz' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-3">
                <Avatar name={activity.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.name}</span>{' '}
                    <span className="text-gray-500">{activity.action}</span>
                  </p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
