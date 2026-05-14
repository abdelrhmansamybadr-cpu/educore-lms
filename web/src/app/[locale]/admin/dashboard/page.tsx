'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { apiClient } from '@/lib/api-client'
import { useLocale } from 'next-intl'
import { useAuthStore } from '@/stores/authStore'
import { StatsCard, Card, CardHeader, CardBody, Badge, Skeleton } from '@/components/ui'
import {
  Users, BookOpen, DollarSign, Ticket, ChefHat, Clock,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

const mockAttendanceData = [
  { day: 'Sun', present: 85 }, { day: 'Mon', present: 92 },
  { day: 'Tue', present: 78 }, { day: 'Wed', present: 88 },
  { day: 'Thu', present: 95 },
]

// ─── Role → Dashboard config ──────────────────────────────────────────────────
function useRoleDashboardConfig(role: string, locale: string) {
  const base = `/${locale}/admin`

  const configs: Record<string, { title: string; subtitle: string; statsKey: string; actions: { label: string; href: string; color: string }[] }> = {
    IT_ADMIN: {
      title: 'IT Dashboard', subtitle: 'Device management and technical support overview',
      statsKey: 'it',
      actions: [
        { label: 'IT Dashboard', href: `${base}/it/dashboard`, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
        { label: 'IT Tickets', href: `${base}/it/tickets`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'IT Assets', href: `${base}/it/assets`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'My HR', href: `${base}/hr`, color: 'bg-green-50 text-green-700 border-green-200' },
      ],
    },
    IT_MANAGER: {
      title: 'IT Manager Dashboard', subtitle: 'IT management and team oversight',
      statsKey: 'it',
      actions: [
        { label: 'IT Dashboard', href: `${base}/it/dashboard`, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
        { label: 'IT Tickets', href: `${base}/it/tickets`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'IT Assets', href: `${base}/it/assets`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'My HR', href: `${base}/hr`, color: 'bg-green-50 text-green-700 border-green-200' },
      ],
    },
    IT_STAFF: {
      title: 'IT Staff Dashboard', subtitle: 'Your assigned tickets and IT tasks',
      statsKey: 'it',
      actions: [
        { label: 'My Tickets', href: `${base}/tickets`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'IT Assets', href: `${base}/it/assets`, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
        { label: 'My HR', href: `${base}/hr`, color: 'bg-green-50 text-green-700 border-green-200' },
        { label: 'Canteen', href: `${base}/canteen`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
      ],
    },
    HR_MANAGER: {
      title: 'HR Dashboard', subtitle: 'Staff management and HR operations overview',
      statsKey: 'hr',
      actions: [
        { label: 'Add Staff', href: `${base}/hr`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'Review Leaves', href: `${base}/hr`, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
        { label: 'View Contracts', href: `${base}/hr`, color: 'bg-green-50 text-green-700 border-green-200' },
        { label: 'Canteen', href: `${base}/canteen`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
      ],
    },
    FINANCE_OFFICER: {
      title: 'Finance Dashboard', subtitle: 'Financial operations and invoicing overview',
      statsKey: 'finance',
      actions: [
        { label: 'Create Invoice', href: `${base}/finance`, color: 'bg-green-50 text-green-700 border-green-200' },
        { label: 'View Finance', href: `${base}/finance`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'My HR', href: `${base}/hr`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'Canteen', href: `${base}/canteen`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
      ],
    },
    CFO: {
      title: 'CFO Dashboard', subtitle: 'Enterprise financial overview and executive reporting',
      statsKey: 'finance',
      actions: [
        { label: 'Finance', href: `${base}/finance`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { label: 'Reports', href: `${base}/finance`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'Payroll', href: `${base}/finance`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'Budgets', href: `${base}/finance`, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      ],
    },
    FINANCE_MANAGER: {
      title: 'Finance Manager Dashboard', subtitle: 'Full financial management and team oversight',
      statsKey: 'finance',
      actions: [
        { label: 'Finance', href: `${base}/finance`, color: 'bg-green-50 text-green-700 border-green-200' },
        { label: 'Payroll', href: `${base}/finance`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'Expenses', href: `${base}/finance`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
        { label: 'Reports', href: `${base}/finance`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
      ],
    },
    SCHOOL_ACCOUNTANT: {
      title: 'Accountant Dashboard', subtitle: 'Accounting, journal entries and financial records',
      statsKey: 'finance',
      actions: [
        { label: 'Finance', href: `${base}/finance`, color: 'bg-teal-50 text-teal-700 border-teal-200' },
        { label: 'Journal Entries', href: `${base}/finance`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'Trial Balance', href: `${base}/finance`, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      ],
    },
    CASHIER: {
      title: 'Cashier Dashboard', subtitle: 'Fast payment processing and receipt management',
      statsKey: 'finance',
      actions: [
        { label: 'Cashier', href: `${base}/finance/cashier`, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
        { label: 'Invoices', href: `${base}/finance`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
      ],
    },
    PAYROLL_OFFICER: {
      title: 'Payroll Dashboard', subtitle: 'Payroll runs, payslips and staff loan management',
      statsKey: 'finance',
      actions: [
        { label: 'Payroll', href: `${base}/finance`, color: 'bg-lime-50 text-lime-700 border-lime-200' },
        { label: 'Staff Loans', href: `${base}/finance`, color: 'bg-green-50 text-green-700 border-green-200' },
      ],
    },
    PROCUREMENT_OFFICER: {
      title: 'Procurement Dashboard', subtitle: 'Purchase orders, vendors and expense management',
      statsKey: 'finance',
      actions: [
        { label: 'Finance', href: `${base}/finance`, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
        { label: 'Store', href: `${base}/store`, color: 'bg-gray-50 text-gray-700 border-gray-200' },
        { label: 'Purchase Orders', href: `${base}/store/purchase-orders`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'Suppliers', href: `${base}/store/suppliers`, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      ],
    },
    AUDITOR: {
      title: 'Auditor Dashboard', subtitle: 'Financial audit, trial balance and compliance',
      statsKey: 'finance',
      actions: [
        { label: 'Finance', href: `${base}/finance`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
        { label: 'Journal Entries', href: `${base}/finance`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'Reports', href: `${base}/finance`, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      ],
    },
    BRANCH_FINANCE_ADMIN: {
      title: 'Branch Finance Dashboard', subtitle: 'Branch-level financial management',
      statsKey: 'finance',
      actions: [
        { label: 'Finance', href: `${base}/finance`, color: 'bg-amber-50 text-amber-700 border-amber-200' },
        { label: 'Invoices', href: `${base}/finance`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'Expenses', href: `${base}/finance`, color: 'bg-red-50 text-red-700 border-red-200' },
        { label: 'Reports', href: `${base}/finance`, color: 'bg-green-50 text-green-700 border-green-200' },
      ],
    },
    LIBRARIAN: {
      title: 'Library Dashboard', subtitle: 'Books, loans and library activity',
      statsKey: 'library',
      actions: [
        { label: 'Manage Books', href: `${base}/library`, color: 'bg-amber-50 text-amber-700 border-amber-200' },
        { label: 'View Loans', href: `${base}/library`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'My HR', href: `${base}/hr`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'Canteen', href: `${base}/canteen`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
      ],
    },
    NURSE: {
      title: 'Health Dashboard', subtitle: 'Student health visits and medical records',
      statsKey: 'health',
      actions: [
        { label: 'Health Records', href: `${base}/health`, color: 'bg-pink-50 text-pink-700 border-pink-200' },
        { label: 'Log Visit', href: `${base}/health`, color: 'bg-red-50 text-red-700 border-red-200' },
        { label: 'My HR', href: `${base}/hr`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'Canteen', href: `${base}/canteen`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
      ],
    },
    TRANSPORT_MANAGER: {
      title: 'Transport Dashboard', subtitle: 'Routes, drivers and student assignments',
      statsKey: 'transport',
      actions: [
        { label: 'Manage Routes', href: `${base}/transport`, color: 'bg-sky-50 text-sky-700 border-sky-200' },
        { label: 'Assignments', href: `${base}/transport`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'My HR', href: `${base}/hr`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'Canteen', href: `${base}/canteen`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
      ],
    },
    CANTEEN_MANAGER: {
      title: 'Canteen Dashboard', subtitle: 'Menu, orders and daily revenue',
      statsKey: 'canteen',
      actions: [
        { label: 'Manage Menu', href: `${base}/canteen`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
        { label: 'View Orders', href: `${base}/canteen`, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
        { label: 'My HR', href: `${base}/hr`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'Order Food', href: `${base}/canteen`, color: 'bg-green-50 text-green-700 border-green-200' },
      ],
    },
    STORE_MANAGER: {
      title: 'Store Dashboard', subtitle: 'Inventory and stock management',
      statsKey: 'store',
      actions: [
        { label: 'Manage Items', href: `${base}/store`, color: 'bg-gray-50 text-gray-700 border-gray-200' },
        { label: 'Stock Movements', href: `${base}/store`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'My HR', href: `${base}/hr`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'Canteen', href: `${base}/canteen`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
      ],
    },
    RECEPTIONIST: {
      title: 'Reception Dashboard', subtitle: 'Visitor log and front desk overview',
      statsKey: 'receptionist',
      actions: [
        { label: 'Log Visitor', href: `${base}/receptionist`, color: 'bg-lime-50 text-lime-700 border-lime-200' },
        { label: 'Visitor Log', href: `${base}/receptionist`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'My HR', href: `${base}/hr`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'Canteen', href: `${base}/canteen`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
      ],
    },
    ADMISSION_OFFICER: {
      title: 'Admissions Dashboard', subtitle: 'Application pipeline and enrollment overview',
      statsKey: 'admission',
      actions: [
        { label: 'Applications', href: `${base}/admission`, color: 'bg-violet-50 text-violet-700 border-violet-200' },
        { label: 'Enroll Student', href: `${base}/admission`, color: 'bg-green-50 text-green-700 border-green-200' },
        { label: 'My HR', href: `${base}/hr`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'Canteen', href: `${base}/canteen`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
      ],
    },
    EVENT_COORDINATOR: {
      title: 'Events Dashboard', subtitle: 'School events and activity calendar',
      statsKey: 'events',
      actions: [
        { label: 'Create Event', href: `${base}/events`, color: 'bg-teal-50 text-teal-700 border-teal-200' },
        { label: 'All Events', href: `${base}/events`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'My HR', href: `${base}/hr`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'Canteen', href: `${base}/canteen`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
      ],
    },
    SUPPORT_AGENT: {
      title: 'Support Dashboard', subtitle: 'IT and help desk tickets overview',
      statsKey: 'tickets',
      actions: [
        { label: 'Open Tickets', href: `${base}/tickets`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'My Tickets', href: `${base}/tickets`, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
        { label: 'My HR', href: `${base}/hr`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'Canteen', href: `${base}/canteen`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
      ],
    },
    MATRON: {
      title: 'Boarding Dashboard', subtitle: 'Dormitory rooms and student occupants',
      statsKey: 'boarding',
      actions: [
        { label: 'Rooms', href: `${base}/boarding`, color: 'bg-slate-50 text-slate-700 border-slate-200' },
        { label: 'Occupants', href: `${base}/boarding`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'My HR', href: `${base}/hr`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'Canteen', href: `${base}/canteen`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
      ],
    },
    REQUISITIONS_MANAGER: {
      title: 'Requisitions Dashboard', subtitle: 'Procurement, pricing and purchase tracking',
      statsKey: 'requisitions',
      actions: [
        { label: 'Price Requests', href: `${base}/requisitions`, color: 'bg-amber-50 text-amber-700 border-amber-200' },
        { label: 'Mark Items Arrived', href: `${base}/requisitions`, color: 'bg-green-50 text-green-700 border-green-200' },
        { label: 'My HR', href: `${base}/hr`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'Canteen', href: `${base}/canteen`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
      ],
    },
  }

  return configs[role] ?? null
}

// ─── Role-specific stat cards ─────────────────────────────────────────────────
function RoleStatCards({ statsKey }: { statsKey: string }) {
  const { data: d } = useQuery({
    queryKey: [`role-stats-${statsKey}`],
    queryFn: async () => {
      try {
        if (statsKey === 'it') {
          const [dev, tix] = await Promise.allSettled([
            apiClient.get('/devices/stats'),
            apiClient.get('/tickets/stats'),
          ])
          return {
            a: { label: 'Total Devices', value: dev.status === 'fulfilled' ? dev.value.data?.data?.total ?? dev.value.data?.total ?? 0 : 0, icon: '💻', color: 'text-indigo-600' },
            b: { label: 'Available', value: dev.status === 'fulfilled' ? dev.value.data?.data?.available ?? dev.value.data?.available ?? 0 : 0, icon: '✅', color: 'text-green-600' },
            c: { label: 'Open Tickets', value: tix.status === 'fulfilled' ? tix.value.data?.data?.open ?? 0 : 0, icon: '🎫', color: 'text-blue-600' },
            d: { label: 'Urgent', value: tix.status === 'fulfilled' ? tix.value.data?.data?.urgent ?? 0 : 0, icon: '🚨', color: 'text-red-600' },
          }
        }
        if (statsKey === 'hr') {
          const res = await apiClient.get('/hr/stats')
          const s = res.data?.data ?? res.data ?? {}
          return {
            a: { label: 'Total Staff', value: s.totalStaff ?? 0, icon: '👥', color: 'text-purple-600' },
            b: { label: 'On Leave', value: s.onLeave ?? 0, icon: '🌴', color: 'text-yellow-600' },
            c: { label: 'Pending Leave', value: s.pendingLeaves ?? 0, icon: '⏳', color: 'text-orange-600' },
            d: { label: 'Contracts', value: s.activeContracts ?? 0, icon: '📄', color: 'text-green-600' },
          }
        }
        if (statsKey === 'canteen') {
          const res = await apiClient.get('/canteen/stats')
          const s = res.data?.data ?? res.data ?? {}
          return {
            a: { label: 'Menu Items', value: s.totalItems ?? 0, icon: '🍽️', color: 'text-orange-600' },
            b: { label: "Today's Orders", value: s.todayOrders ?? 0, icon: '📦', color: 'text-blue-600' },
            c: { label: 'Pending', value: s.pendingOrders ?? 0, icon: '⏳', color: 'text-yellow-600' },
            d: { label: "Revenue", value: `$${(s.todayRevenue ?? 0).toFixed(0)}`, icon: '💰', color: 'text-green-600' },
          }
        }
        if (statsKey === 'finance') {
          const res = await api.get('/finance/summary')
          const s = res.data?.data ?? {}
          return {
            a: { label: 'Total Invoiced', value: `$${(s.totalAmount ?? 0).toFixed(0)}`, icon: '📋', color: 'text-blue-600' },
            b: { label: 'Collected', value: `$${(s.totalPaid ?? 0).toFixed(0)}`, icon: '✅', color: 'text-green-600' },
            c: { label: 'Pending', value: `$${(s.totalPending ?? 0).toFixed(0)}`, icon: '⏳', color: 'text-yellow-600' },
            d: { label: 'Overdue', value: `$${(s.totalOverdue ?? 0).toFixed(0)}`, icon: '🚨', color: 'text-red-600' },
          }
        }
        if (statsKey === 'library') {
          const [books, loans] = await Promise.allSettled([
            api.get('/library/books?limit=1'),
            api.get('/library/loans'),
          ])
          const bookTotal = books.status === 'fulfilled' ? books.value.data?.meta?.total ?? 0 : 0
          const loanList = loans.status === 'fulfilled' ? (loans.value.data?.data ?? []) : []
          return {
            a: { label: 'Total Books', value: bookTotal, icon: '📚', color: 'text-amber-600' },
            b: { label: 'Active Loans', value: loanList.filter((l: any) => !l.returnedAt).length, icon: '📖', color: 'text-blue-600' },
            c: { label: 'Overdue', value: loanList.filter((l: any) => !l.returnedAt && new Date(l.dueDate) < new Date()).length, icon: '⚠️', color: 'text-red-600' },
            d: { label: 'Returned Today', value: loanList.filter((l: any) => l.returnedAt && new Date(l.returnedAt).toDateString() === new Date().toDateString()).length, icon: '↩️', color: 'text-green-600' },
          }
        }
        if (statsKey === 'admission') {
          const res = await apiClient.get('/admission/stats')
          const s = res.data?.data ?? res.data ?? {}
          return {
            a: { label: 'Total Applications', value: s.total ?? 0, icon: '📝', color: 'text-violet-600' },
            b: { label: 'Under Review', value: s.underReview ?? 0, icon: '🔍', color: 'text-blue-600' },
            c: { label: 'Accepted', value: s.accepted ?? 0, icon: '✅', color: 'text-green-600' },
            d: { label: 'Enrolled', value: s.enrolled ?? 0, icon: '🎓', color: 'text-teal-600' },
          }
        }
        if (statsKey === 'tickets') {
          const res = await api.get('/tickets/stats')
          const s = res.data?.data ?? {}
          return {
            a: { label: 'Open', value: s.open ?? 0, icon: '🎫', color: 'text-blue-600' },
            b: { label: 'In Progress', value: s.inProgress ?? 0, icon: '🔧', color: 'text-yellow-600' },
            c: { label: 'Resolved', value: s.resolved ?? 0, icon: '✅', color: 'text-green-600' },
            d: { label: 'Urgent', value: s.urgent ?? 0, icon: '🚨', color: 'text-red-600' },
          }
        }
        if (statsKey === 'requisitions') {
          const res = await apiClient.get('/requisitions?limit=200')
          const payload = res.data
          const list: any[] = Array.isArray(payload) ? payload : payload?.data ?? []
          return {
            a: { label: 'Pending Pricing', value: list.filter((r: any) => r.status === 'PENDING').length, icon: '📋', color: 'text-amber-600' },
            b: { label: 'Awaiting Approval', value: list.filter((r: any) => r.status === 'PRICED').length, icon: '⏳', color: 'text-blue-600' },
            c: { label: 'Ready to Purchase', value: list.filter((r: any) => r.status === 'FINANCE_RELEASED').length, icon: '🛒', color: 'text-green-600' },
            d: { label: 'Completed', value: list.filter((r: any) => r.status === 'COMPLETED').length, icon: '✅', color: 'text-teal-600' },
          }
        }
        return null
      } catch { return null }
    },
  })

  if (!d) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Object.values(d).map((stat: any) => (
        <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-2xl">{stat.icon}</div>
          <div>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Generic full admin dashboard ─────────────────────────────────────────────
function FullAdminDashboard({ locale, isRtl }: { locale: string; isRtl: boolean }) {
  const { data: stats, isLoading } = useQuery({
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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />) : (
          <>
            <StatsCard title={isRtl ? 'إجمالي المستخدمين' : 'Total Users'} value={stats?.users?.toLocaleString() || '0'} icon={<Users size={22} />} change="+12 this week" changeType="up" />
            <StatsCard title={isRtl ? 'المقررات الدراسية' : 'Active Courses'} value={stats?.courses?.toLocaleString() || '0'} icon={<BookOpen size={22} />} />
            <StatsCard title={isRtl ? 'الإيرادات المحصلة' : 'Revenue Collected'}
              value={stats?.finance ? formatCurrency(stats.finance.totalPaid, 'EGP', locale === 'ar' ? 'ar-EG' : 'en-US') : '—'}
              icon={<DollarSign size={22} />} change="of total invoiced" changeType="neutral" />
            <StatsCard title={isRtl ? 'تذاكر مفتوحة' : 'Open Tickets'} value={stats?.tickets?.open || 0} icon={<Ticket size={22} />} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{isRtl ? 'نسبة الحضور هذا الأسبوع' : 'Attendance Rate This Week'}</h3>
              <Badge variant="success">{isRtl ? 'هذا الأسبوع' : 'This Week'}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mockAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} />
                <Bar dataKey="present" fill="#2DD4BF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">{isRtl ? 'الإجراءات السريعة' : 'Quick Actions'}</h3></CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Add User', href: `/${locale}/admin/users/new`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                { label: 'Create Course', href: `/${locale}/admin/courses/new`, color: 'bg-green-50 text-green-700 border-green-200' },
                { label: 'Create Invoice', href: `/${locale}/admin/finance/new`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
                { label: 'Announcement', href: `/${locale}/admin/announcements/new`, color: 'bg-orange-50 text-orange-700 border-orange-200' },
                { label: 'Attendance Report', href: `/${locale}/admin/attendance`, color: 'bg-teal-50 text-teal-700 border-teal-200' },
                { label: 'School Settings', href: `/${locale}/admin/settings`, color: 'bg-gray-50 text-gray-700 border-gray-200' },
              ].map((a) => (
                <Link key={a.label} href={a.href} className={`p-3 rounded-xl border text-sm font-medium text-center hover:opacity-80 transition-opacity ${a.color}`}>{a.label}</Link>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  )
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const user = useAuthStore((s) => s.user)
  const role = user?.role ?? ''

  const config = useRoleDashboardConfig(role, locale)

  // Staff role-specific dashboard
  if (config) {
    return (
      <div className="space-y-6">
        {/* Header with greeting */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
            {(user as any)?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-sm text-gray-500">{config.subtitle}</p>
          </div>
          <div className="ms-auto text-right">
            <p className="text-xs text-gray-400">Logged in as</p>
            <p className="text-sm font-semibold text-gray-700">{(user as any)?.firstName} {(user as any)?.lastName}</p>
            <p className="text-xs text-gray-400">{role.replace(/_/g, ' ')}</p>
          </div>
        </div>

        {/* Role-specific stats */}
        <RoleStatCards statsKey={config.statsKey} />

        {/* Quick actions */}
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">Quick Actions</h3></CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {config.actions.map((a) => (
                <Link key={a.label} href={a.href}
                  className={`p-4 rounded-xl border text-sm font-medium text-center hover:opacity-80 transition-opacity ${a.color}`}>
                  {a.label}
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Personal reminders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><h3 className="font-semibold text-gray-900 flex items-center gap-2"><Clock size={16} /> My Pending Leave</h3></CardHeader>
            <CardBody>
              <PendingLeaveWidget />
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h3 className="font-semibold text-gray-900 flex items-center gap-2"><ChefHat size={16} /> Today's Canteen</h3></CardHeader>
            <CardBody>
              <CanteenPreviewWidget />
            </CardBody>
          </Card>
        </div>
      </div>
    )
  }

  // Full admin dashboard (SCHOOL_ADMIN, VICE_PRINCIPAL, ACADEMIC_DIRECTOR, DEPARTMENT_HEAD)
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{isRtl ? 'لوحة التحكم' : 'Admin Dashboard'}</h2>
        <p className="text-sm text-gray-500 mt-1">{isRtl ? 'مرحباً بك في نظام EduCore' : 'Welcome to EduCore School Management'}</p>
      </div>
      <FullAdminDashboard locale={locale} isRtl={isRtl} />
    </div>
  )
}

// ─── Small widgets ────────────────────────────────────────────────────────────
function PendingLeaveWidget() {
  const { data } = useQuery({
    queryKey: ['my-leave-widget'],
    queryFn: () => apiClient.get('/hr/leaves?mine=true').then((r) => r.data?.data ?? r.data ?? []).catch(() => []),
  })
  const pending = (Array.isArray(data) ? data : []).filter((l: any) => l.status === 'PENDING')
  if (pending.length === 0) return <p className="text-sm text-gray-400 py-2">No pending leave requests</p>
  return (
    <div className="space-y-2">
      {pending.slice(0, 3).map((l: any) => (
        <div key={l.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-yellow-50">
          <span className="text-gray-700">{l.type} · {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}</span>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">PENDING</span>
        </div>
      ))}
    </div>
  )
}

function CanteenPreviewWidget() {
  const { data } = useQuery({
    queryKey: ['canteen-preview'],
    queryFn: () => apiClient.get('/canteen/items').then((r) => (r.data?.data ?? r.data ?? []).filter((i: any) => i.isAvailable).slice(0, 3)).catch(() => []),
  })
  const items: any[] = Array.isArray(data) ? data : []
  if (items.length === 0) return <p className="text-sm text-gray-400 py-2">No items available today</p>
  return (
    <div className="space-y-2">
      {items.map((item: any) => (
        <div key={item.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-orange-50">
          <span className="text-gray-700">{item.name}</span>
          <span className="font-semibold text-green-600">${item.price?.toFixed(2)}</span>
        </div>
      ))}
      <Link href="" className="text-xs text-orange-600 hover:underline">View full menu →</Link>
    </div>
  )
}
