'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { useSchoolContext } from '@/stores/schoolContextStore'
import {
  LayoutDashboard, BookOpen, ClipboardList, Brain, Users, Settings,
  ChevronLeft, ChevronRight, GraduationCap, BarChart2, MessageSquare,
  Bell, DollarSign, Laptop, Ticket, Video, Calendar, Library, Heart,
  Trophy, CalendarDays, Bus, Shield, ShoppingCart, Package, Briefcase,
  Building2, Warehouse, MapPin, ArrowLeftRight, Truck, ClipboardCheck, UserCheck,
  Star, TrendingUp, Megaphone, FileText, Clock, Banknote,
  UserCog, Handshake, PieChart, Monitor, HelpCircle, AlertTriangle,
} from 'lucide-react'

interface NavItem {
  key: string
  label: string
  labelAr: string
  icon: React.ReactNode
  href: string
  badge?: number
  module?: string   // if set, hidden when school has this module disabled
  orgLevel?: boolean // if true, shows "Org" badge when in all-schools context
}

interface NavSection {
  key: string
  labelAr: string
  labelEn: string
  items: NavItem[]
}


const getNavSections = (_locale: string, basePath: string, userRole?: string): NavSection[] => {
  // Determine path segment: admin, teacher, student, parent, super-admin
  const pathRole = basePath.split('/').pop() || ''

  const msgPath = basePath.replace(/\/(admin|teacher|student|parent|super-admin)$/, '/messaging')

  // ── Role-specific sidebars for staff roles that land on /admin ─────────────
  if (pathRole === 'admin' && userRole && userRole !== 'SCHOOL_ADMIN' && userRole !== 'VICE_PRINCIPAL' && userRole !== 'ACADEMIC_DIRECTOR' && userRole !== 'DEPARTMENT_HEAD') {

    // Derive locale prefix from basePath (e.g. /ar/admin → /ar)
    const localePrefix = basePath.split('/').slice(0, 2).join('/')

    // Shared personal section available to all staff
    const personalSection: NavSection = {
      key: 'personal', labelAr: 'الشخصية', labelEn: 'Personal',
      items: [
        { key: 'dashboard',      label: 'Dashboard',             labelAr: 'لوحة التحكم',           icon: <LayoutDashboard size={18} />, href: `${basePath}/dashboard` },
        { key: 'my-profile',    label: 'My Profile',           labelAr: 'ملفي الشخصي',          icon: <Users size={18} />,           href: `${basePath}/hr?tab=profile` },
        { key: 'my-leaves',     label: 'My Leaves',            labelAr: 'إجازاتي',              icon: <Calendar size={18} />,        href: `${basePath}/hr?tab=leaves` },
        { key: 'announcements', label: 'Announcements',        labelAr: 'الإعلانات',            icon: <Megaphone size={18} />,       href: `${basePath}/hr?tab=announcements` },
        { key: 'my-purchases',  label: 'My Purchase Requests', labelAr: 'طلبات الشراء الخاصة بي', icon: <ShoppingCart size={18} />,  href: `${localePrefix}/my-purchases` },
        { key: 'store',         label: 'Store',                labelAr: 'المخزن',               icon: <Package size={18} />,         href: `${localePrefix}/company-store`, module: 'STORE' },
        { key: 'canteen-menu',  label: 'Canteen Menu',         labelAr: 'قائمة المقصف',         icon: <Brain size={18} />,           href: `${basePath}/canteen?tab=menu`, module: 'CANTEEN' },
        { key: 'canteen-orders',label: 'My Canteen Orders',    labelAr: 'طلباتي من المقصف',     icon: <ShoppingCart size={18} />,    href: `${basePath}/canteen?tab=myorders`, module: 'CANTEEN' },
        { key: 'messaging',     label: 'Messages',             labelAr: 'الرسائل',              icon: <MessageSquare size={18} />,   href: msgPath },
        { key: 'it-support',    label: 'IT Support',           labelAr: 'الدعم التقني',          icon: <HelpCircle size={18} />,      href: `${localePrefix}/admin/it-support` },
      ],
    }

    if (userRole === 'IT_ADMIN') return [
      personalSection,
      { key: 'it-overview', labelAr: 'نظرة عامة', labelEn: 'Overview',
        items: [
          { key: 'it-dash',    label: 'IT Dashboard',    labelAr: 'لوحة التحكم',    icon: <Monitor size={18} />,       href: `${basePath}/it/dashboard` },
        ] },
      { key: 'it-support', labelAr: 'الدعم الفني', labelEn: 'IT Support',
        items: [
          { key: 'it-tickets', label: 'Tickets',          labelAr: 'التذاكر',        icon: <Ticket size={18} />,        href: `${basePath}/it/tickets` },
          { key: 'devices',    label: 'Devices',          labelAr: 'الأجهزة',        icon: <Laptop size={18} />,        href: `${basePath}/devices` },
        ] },
      { key: 'it-assets', labelAr: 'الأصول', labelEn: 'Assets',
        items: [
          { key: 'assets',     label: 'Assets',           labelAr: 'إدارة الأصول',   icon: <Package size={18} />,       href: `${basePath}/it/assets` },
        ] },
      { key: 'it-analytics', labelAr: 'التحليلات', labelEn: 'Analytics',
        items: [
          { key: 'staff-analytics', label: 'Staff Analytics', labelAr: 'تحليلات الفريق', icon: <TrendingUp size={18} />, href: `${basePath}/it/staff-analytics` },
        ] },
    ]

    if (userRole === 'IT_MANAGER') return [
      personalSection,
      { key: 'it-overview', labelAr: 'نظرة عامة', labelEn: 'Overview',
        items: [
          { key: 'it-dash',    label: 'IT Dashboard',    labelAr: 'لوحة التحكم',    icon: <Monitor size={18} />,       href: `${basePath}/it/dashboard` },
        ] },
      { key: 'it-support', labelAr: 'الدعم الفني', labelEn: 'IT Support',
        items: [
          { key: 'it-tickets', label: 'Tickets',          labelAr: 'التذاكر',        icon: <Ticket size={18} />,        href: `${basePath}/it/tickets` },
          { key: 'devices',    label: 'Devices',          labelAr: 'الأجهزة',        icon: <Laptop size={18} />,        href: `${basePath}/devices` },
        ] },
      { key: 'it-assets', labelAr: 'الأصول', labelEn: 'Assets',
        items: [
          { key: 'assets',     label: 'Assets',           labelAr: 'إدارة الأصول',   icon: <Package size={18} />,       href: `${basePath}/it/assets` },
        ] },
      { key: 'it-analytics', labelAr: 'التحليلات', labelEn: 'Analytics',
        items: [
          { key: 'staff-analytics', label: 'Staff Analytics', labelAr: 'تحليلات الفريق', icon: <TrendingUp size={18} />, href: `${basePath}/it/staff-analytics` },
        ] },
    ]

    if (userRole === 'HR_MANAGER') return [
      { key: 'overview', labelAr: 'نظرة عامة', labelEn: 'Overview',
        items: [
          { key: 'hr-dash', label: 'Dashboard', labelAr: 'لوحة التحكم', icon: <LayoutDashboard size={18} />, href: `${basePath}/hr` },
        ] },
      { key: 'people', labelAr: 'الموظفون', labelEn: 'People',
        items: [
          { key: 'employees',   label: 'Employees',   labelAr: 'الموظفون',    icon: <Users size={18} />,        href: `${basePath}/hr/employees` },
          { key: 'departments', label: 'Departments', labelAr: 'الأقسام',     icon: <Building2 size={18} />,    href: `${basePath}/hr/departments` },
          { key: 'shifts',      label: 'Shifts',      labelAr: 'الشيفتات',    icon: <Clock size={18} />,        href: `${basePath}/hr/shifts` },
        ] },
      { key: 'time', labelAr: 'الوقت والإجازات', labelEn: 'Time & Leave',
        items: [
          { key: 'leaves',         label: 'Leave Requests',  labelAr: 'طلبات الإجازة',    icon: <Calendar size={18} />,     href: `${basePath}/hr/leaves` },
          { key: 'leave-analytics',label: 'Leave Analytics', labelAr: 'تحليلات الإجازات', icon: <PieChart size={18} />,     href: `${basePath}/hr/leave-analytics` },
          { key: 'attendance',     label: 'Attendance',      labelAr: 'الحضور والغياب',   icon: <ClipboardCheck size={18} />, href: `${basePath}/hr/attendance` },
        ] },
      { key: 'finance', labelAr: 'المالية', labelEn: 'Finance',
        items: [
          { key: 'payroll', label: 'Payroll', labelAr: 'كشف الرواتب', icon: <Banknote size={18} />, href: `${basePath}/hr/payroll` },
        ] },
      { key: 'hiring', labelAr: 'التوظيف', labelEn: 'Hiring',
        items: [
          { key: 'recruitment', label: 'Recruitment',  labelAr: 'التوظيف',    icon: <Handshake size={18} />,   href: `${basePath}/hr/recruitment` },
          { key: 'talent',      label: 'Talent Pool',  labelAr: 'بنك المواهب', icon: <Star size={18} />,        href: `${basePath}/hr/talent-pool` },
        ] },
      { key: 'performance', labelAr: 'الأداء', labelEn: 'Performance',
        items: [
          { key: 'reviews',  label: 'Performance Reviews', labelAr: 'تقييمات الأداء', icon: <TrendingUp size={18} />, href: `${basePath}/hr/reviews` },
          { key: 'documents',label: 'Employee Documents',  labelAr: 'وثائق الموظفين', icon: <FileText size={18} />,   href: `${basePath}/hr/documents` },
        ] },
      { key: 'comms', labelAr: 'التواصل', labelEn: 'Communication',
        items: [
          { key: 'hr-announcements', label: 'Announcements',  labelAr: 'الإعلانات',    icon: <Megaphone size={18} />,    href: `${basePath}/hr/announcements` },
          { key: 'messaging',        label: 'Messages',       labelAr: 'الرسائل',      icon: <MessageSquare size={18} />, href: msgPath },
          { key: 'it-support',       label: 'IT Support',     labelAr: 'الدعم التقني', icon: <HelpCircle size={18} />,   href: `${localePrefix}/admin/it-support` },
          { key: 'hr-complaints',    label: 'IT Complaints',  labelAr: 'شكاوي الدعم التقني', icon: <AlertTriangle size={18} />, href: `${basePath}/hr/complaints` },
        ] },
      { key: 'personal', labelAr: 'الشخصية', labelEn: 'Personal',
        items: [
          { key: 'my-hr',        label: 'My HR',               labelAr: 'شؤوني',                   icon: <UserCog size={18} />,     href: `${basePath}/hr` },
          { key: 'my-purchases', label: 'Purchase Requests',   labelAr: 'طلبات الشراء',            icon: <ShoppingCart size={18} />, href: `${localePrefix}/my-purchases` },
          { key: 'store',        label: 'Store',               labelAr: 'المخزن',                   icon: <Package size={18} />,     href: `${localePrefix}/company-store`, module: 'STORE' },
          { key: 'settings',     label: 'Settings',            labelAr: 'الإعدادات',               icon: <Settings size={18} />,    href: `${basePath}/settings` },
        ] },
    ]

    if (userRole === 'FINANCE_OFFICER') return [
      personalSection,
      { key: 'work', labelAr: 'المالية', labelEn: 'Finance',
        items: [
          { key: 'finance', label: 'Finance', labelAr: 'المالية', icon: <DollarSign size={18} />, href: `${basePath}/finance` },
        ] },
    ]

    if (userRole === 'LIBRARIAN') return [
      personalSection,
      { key: 'work', labelAr: 'المكتبة', labelEn: 'Library',
        items: [
          { key: 'lib-books', label: 'Books',    labelAr: 'الكتب',   icon: <Library size={18} />,     href: `${basePath}/library?tab=books` },
          { key: 'lib-loans', label: 'Loans',    labelAr: 'الإعارات', icon: <BookOpen size={18} />,   href: `${basePath}/library?tab=loans` },
        ] },
    ]

    if (userRole === 'NURSE') return [
      personalSection,
      { key: 'work', labelAr: 'الصحة', labelEn: 'Health',
        items: [
          { key: 'health', label: 'Health', labelAr: 'الصحة', icon: <Heart size={18} />, href: `${basePath}/health` },
        ] },
    ]

    if (userRole === 'TRANSPORT_MANAGER') return [
      personalSection,
      { key: 'work', labelAr: 'النقل', labelEn: 'Transport',
        items: [
          { key: 'transport', label: 'Transport', labelAr: 'النقل', icon: <Bus size={18} />, href: `${basePath}/transport` },
        ] },
    ]

    if (userRole === 'RECEPTIONIST') return [
      personalSection,
      { key: 'work', labelAr: 'الاستقبال', labelEn: 'Reception',
        items: [
          { key: 'receptionist', label: 'Reception', labelAr: 'الاستقبال', icon: <Bell size={18} />, href: `${basePath}/receptionist` },
        ] },
    ]

    if (userRole === 'ADMISSION_OFFICER') return [
      personalSection,
      { key: 'work', labelAr: 'القبول', labelEn: 'Admissions',
        items: [
          { key: 'admission', label: 'Admission', labelAr: 'القبول', icon: <GraduationCap size={18} />, href: `${basePath}/admission` },
        ] },
    ]

    if (userRole === 'CANTEEN_MANAGER') return [
      personalSection,
      { key: 'work', labelAr: 'المقصف', labelEn: 'Canteen',
        items: [
          { key: 'canteen-menu',   label: 'Menu Management', labelAr: 'إدارة القائمة', icon: <Brain size={18} />,        href: `${basePath}/canteen?tab=menu` },
          { key: 'canteen-orders', label: 'Orders',          labelAr: 'الطلبات',       icon: <ShoppingCart size={18} />, href: `${basePath}/canteen?tab=orders` },
        ] },
    ]

    if (userRole === 'STORE_MANAGER') return [
      { key: 'overview', labelAr: 'نظرة عامة', labelEn: 'Overview',
        items: [
          { key: 'store-dash', label: 'Dashboard', labelAr: 'لوحة التحكم', icon: <LayoutDashboard size={18} />, href: `${basePath}/store` },
        ] },
      { key: 'operations', labelAr: 'العمليات', labelEn: 'Operations',
        items: [
          { key: 'purchase-reviews', label: 'Purchase Reviews',  labelAr: 'مراجعة طلبات الشراء', icon: <ClipboardCheck size={18} />, href: `${basePath}/store/purchase-reviews` },
          { key: 'requests',         label: 'Employee Requests', labelAr: 'طلبات الموظفين',       icon: <Package size={18} />,        href: `${basePath}/store/requests` },
          { key: 'inventory',        label: 'Inventory',          labelAr: 'المخزون',               icon: <Warehouse size={18} />,      href: `${basePath}/store/inventory` },
          { key: 'locations',        label: 'Locations',          labelAr: 'المواقع',               icon: <MapPin size={18} />,         href: `${basePath}/store/locations` },
          { key: 'movements',    label: 'Stock Movements', labelAr: 'حركة المخزون',    icon: <ArrowLeftRight size={18} />, href: `${basePath}/store/movements` },
          { key: 'collections', label: 'Who Took What',  labelAr: 'من أخذ ماذا',    icon: <UserCheck size={18} />,      href: `${basePath}/store/collections` },
        ] },
      { key: 'procurement', labelAr: 'المشتريات', labelEn: 'Procurement',
        items: [
          { key: 'purchase-orders', label: 'Purchase Orders', labelAr: 'أوامر الشراء', icon: <ClipboardList size={18} />, href: `${basePath}/store/purchase-orders` },
        ] },
      { key: 'analytics', labelAr: 'التحليلات', labelEn: 'Analytics',
        items: [
          { key: 'reports', label: 'Reports', labelAr: 'التقارير', icon: <BarChart2 size={18} />, href: `${basePath}/store/reports` },
        ] },
      { key: 'personal', labelAr: 'الشخصية', labelEn: 'Personal',
        items: [
          { key: 'my-requests',  label: 'My Store Requests', labelAr: 'طلباتي من المخزن',       icon: <ShoppingCart size={18} />,  href: `${basePath}/store/my-requests` },
          { key: 'my-hr',        label: 'My HR',              labelAr: 'شؤوني الوظيفية',         icon: <Users size={18} />,         href: `${basePath}/hr` },
          { key: 'my-purchases', label: 'Purchase Requests',  labelAr: 'طلبات الشراء',           icon: <Briefcase size={18} />,     href: `${localePrefix}/my-purchases` },
          { key: 'canteen',      label: 'Canteen',             labelAr: 'المقصف',                 icon: <Brain size={18} />,         href: `${basePath}/canteen`, module: 'CANTEEN' },
          { key: 'messaging',    label: 'Messages',            labelAr: 'الرسائل',                icon: <MessageSquare size={18} />, href: msgPath },
          { key: 'it-support',   label: 'IT Support',          labelAr: 'الدعم التقني',            icon: <HelpCircle size={18} />,    href: `${localePrefix}/admin/it-support` },
          { key: 'settings',     label: 'Settings',            labelAr: 'الإعدادات',              icon: <Settings size={18} />,     href: `${basePath}/settings` },
        ] },
    ]

    if (userRole === 'SUPPORT_AGENT') return [
      personalSection,
      { key: 'work', labelAr: 'الدعم الفني', labelEn: 'Support',
        items: [
          { key: 'tickets', label: 'Support Tickets', labelAr: 'تذاكر الدعم', icon: <Ticket size={18} />, href: `${basePath}/tickets` },
        ] },
    ]

    if (userRole === 'IT_STAFF') return [
      personalSection,
      { key: 'work', labelAr: 'الدعم الفني', labelEn: 'IT Support',
        items: [
          { key: 'it-tickets', label: 'IT Tickets',   labelAr: 'تذاكر الدعم التقني', icon: <Ticket size={18} />, href: `${basePath}/it/tickets` },
          { key: 'it-assets',  label: 'IT Assets',    labelAr: 'أصول تقنية',          icon: <Monitor size={18} />, href: `${basePath}/it/assets` },
        ] },
    ]

    if (userRole === 'EVENT_COORDINATOR') return [
      personalSection,
      { key: 'work', labelAr: 'الفعاليات', labelEn: 'Events',
        items: [
          { key: 'events', label: 'Events', labelAr: 'الفعاليات', icon: <CalendarDays size={18} />, href: `${basePath}/events` },
        ] },
    ]

    if (userRole === 'MATRON') return [
      personalSection,
      { key: 'work', labelAr: 'السكن الداخلي', labelEn: 'Boarding',
        items: [
          { key: 'boarding', label: 'Boarding', labelAr: 'السكن الداخلي', icon: <Video size={18} />, href: `${basePath}/boarding` },
        ] },
    ]

    if (userRole === 'ACTIVITIES_COORDINATOR') return [
      personalSection,
      { key: 'work', labelAr: 'الأنشطة', labelEn: 'Activities',
        items: [
          { key: 'events',   label: 'Events',   labelAr: 'الفعاليات',  icon: <CalendarDays size={18} />, href: `${basePath}/events` },
          { key: 'tickets',  label: 'Support',  labelAr: 'الدعم',      icon: <Ticket size={18} />,      href: `${basePath}/tickets` },
        ] },
    ]

    if (userRole === 'REQUISITIONS_MANAGER') return [
      personalSection,
      { key: 'work', labelAr: 'المستلزمات', labelEn: 'Requisitions',
        items: [
          { key: 'requisitions', label: 'Requisitions', labelAr: 'طلبات التوريد', icon: <Package size={18} />,      href: `${basePath}/requisitions` },
          { key: 'suppliers',    label: 'Suppliers',     labelAr: 'الموردون',      icon: <Truck size={18} />,        href: `${basePath}/store/suppliers` },
        ] },
    ]

    // ── Finance Department Roles ───────────────────────────────────────────────
    const fp = `${basePath}/finance` // finance base path
    const financeFullNav: NavSection[] = [
      { key: 'finance-overview', labelAr: 'نظرة عامة', labelEn: 'Overview',
        items: [
          { key: 'fin-dash',        label: 'Finance Dashboard',   labelAr: 'لوحة المالية',        icon: <LayoutDashboard size={18} />, href: fp },
          { key: 'fin-invoices',    label: 'Invoices & Billing',  labelAr: 'الفواتير والرسوم',    icon: <FileText size={18} />,        href: `${fp}?tab=invoices` },
          { key: 'fin-fees',        label: 'Fee Structures',      labelAr: 'هياكل الرسوم',        icon: <BookOpen size={18} />,        href: `${fp}?tab=fees` },
          { key: 'fin-payments',    label: 'Payment History',     labelAr: 'سجل المدفوعات',      icon: <DollarSign size={18} />,      href: `${fp}?tab=payments` },
          { key: 'fin-procurement', label: 'Procurement',         labelAr: 'المستلزمات',          icon: <Package size={18} />,         href: `${fp}?tab=procurement` },
        ] },
      { key: 'finance-accounting', labelAr: 'المحاسبة', labelEn: 'Accounting',
        items: [
          { key: 'fin-accounts',  label: 'Chart of Accounts',   labelAr: 'دليل الحسابات',       icon: <PieChart size={18} />,        href: `${fp}?tab=accounts` },
          { key: 'fin-journal',   label: 'Journal Entries',     labelAr: 'القيود اليومية',      icon: <ClipboardList size={18} />,   href: `${fp}?tab=journal` },
          { key: 'fin-budget',    label: 'Budgets',             labelAr: 'الميزانيات',          icon: <TrendingUp size={18} />,      href: `${fp}?tab=budget` },
        ] },
      { key: 'finance-payroll', labelAr: 'الرواتب', labelEn: 'Payroll',
        items: [
          { key: 'fin-payroll',   label: 'Payroll Runs',        labelAr: 'دورات الرواتب',       icon: <Banknote size={18} />,        href: `${fp}?tab=payroll` },
          { key: 'fin-loans',     label: 'Staff Loans',         labelAr: 'سلف الموظفين',        icon: <Handshake size={18} />,       href: `${fp}?tab=loans` },
        ] },
      { key: 'finance-expenses', labelAr: 'المصروفات', labelEn: 'Expenses',
        items: [
          { key: 'fin-expenses',  label: 'Expense Claims',      labelAr: 'مطالبات المصروفات',   icon: <Briefcase size={18} />,       href: `${fp}?tab=expenses` },
          { key: 'fin-bank',      label: 'Bank Accounts',       labelAr: 'الحسابات البنكية',    icon: <Building2 size={18} />,       href: `${fp}?tab=bank` },
        ] },
      { key: 'finance-periods', labelAr: 'الفترات', labelEn: 'Periods & Structure',
        items: [
          { key: 'fin-fiscal-years',  label: 'Fiscal Years',  labelAr: 'السنوات المالية', icon: <Calendar size={18} />,  href: `${fp}?tab=fiscal-years` },
          { key: 'fin-cost-centers',  label: 'Cost Centers',  labelAr: 'مراكز التكلفة',   icon: <Building2 size={18} />, href: `${fp}?tab=cost-centers` },
        ] },
      { key: 'finance-reports', labelAr: 'التقارير', labelEn: 'Reports',
        items: [
          { key: 'fin-reports',   label: 'Financial Reports',   labelAr: 'التقارير المالية',    icon: <BarChart2 size={18} />,       href: `${fp}?tab=reports` },
        ] },
      { key: 'finance-personal', labelAr: 'الشخصية', labelEn: 'Personal',
        items: [
          { key: 'my-profile',    label: 'My Profile',          labelAr: 'ملفي الشخصي',          icon: <Users size={18} />,           href: `${basePath}/hr?tab=profile` },
          { key: 'my-leaves',     label: 'My Leaves',           labelAr: 'إجازاتي',              icon: <Calendar size={18} />,        href: `${basePath}/hr?tab=leaves` },
          { key: 'announcements', label: 'Announcements',       labelAr: 'الإعلانات',            icon: <Megaphone size={18} />,       href: `${basePath}/hr?tab=announcements` },
          { key: 'messaging',     label: 'Messages',            labelAr: 'الرسائل',              icon: <MessageSquare size={18} />,   href: msgPath },
          { key: 'it-support',    label: 'IT Support',          labelAr: 'الدعم التقني',         icon: <HelpCircle size={18} />,      href: `${localePrefix}/admin/it-support` },
        ] },
    ]

    if (userRole === 'CFO') return financeFullNav
    if (userRole === 'FINANCE_MANAGER') return financeFullNav
    if (userRole === 'AUDITOR') return financeFullNav

    if (userRole === 'SCHOOL_ACCOUNTANT') return [
      personalSection,
      { key: 'accounting', labelAr: 'المحاسبة', labelEn: 'Accounting',
        items: [
          { key: 'fin-dash',     label: 'Finance',           labelAr: 'المالية',           icon: <DollarSign size={18} />,     href: `${basePath}/finance` },
          { key: 'fin-accounts', label: 'Chart of Accounts', labelAr: 'دليل الحسابات',    icon: <PieChart size={18} />,       href: `${basePath}/finance?tab=accounts` },
          { key: 'fin-journal',  label: 'Journal Entries',   labelAr: 'القيود اليومية',   icon: <ClipboardList size={18} />,  href: `${basePath}/finance?tab=journal` },
          { key: 'fin-reports',  label: 'Reports',           labelAr: 'التقارير',         icon: <BarChart2 size={18} />,      href: `${basePath}/finance?tab=reports` },
        ] },
    ]

    if (userRole === 'CASHIER') return [
      personalSection,
      { key: 'cashier', labelAr: 'الصندوق', labelEn: 'Cashier',
        items: [
          { key: 'cashier-desk', label: 'Cashier',    labelAr: 'الصندوق',     icon: <Banknote size={18} />,  href: `${basePath}/finance/cashier` },
          { key: 'fin-invoices', label: 'Invoices',   labelAr: 'الفواتير',   icon: <FileText size={18} />,   href: `${basePath}/finance` },
        ] },
    ]

    if (userRole === 'PAYROLL_OFFICER') return [
      personalSection,
      { key: 'payroll', labelAr: 'الرواتب', labelEn: 'Payroll',
        items: [
          { key: 'fin-payroll', label: 'Payroll Runs', labelAr: 'دورات الرواتب',  icon: <Banknote size={18} />,  href: `${basePath}/finance?tab=payroll` },
          { key: 'fin-loans',   label: 'Staff Loans',  labelAr: 'سلف الموظفين',   icon: <Handshake size={18} />, href: `${basePath}/finance?tab=loans` },
        ] },
    ]

    if (userRole === 'PROCUREMENT_OFFICER') return [
      personalSection,
      { key: 'procurement', labelAr: 'المشتريات', labelEn: 'Procurement',
        items: [
          { key: 'fin-dash',      label: 'Finance',         labelAr: 'المالية',      icon: <DollarSign size={18} />,   href: `${basePath}/finance` },
          { key: 'store',         label: 'Store',           labelAr: 'المخزن',       icon: <Package size={18} />,      href: `${basePath}/store` },
          { key: 'purchase',      label: 'Purchase Orders', labelAr: 'أوامر الشراء', icon: <ShoppingCart size={18} />, href: `${basePath}/store/purchase-orders` },
          { key: 'suppliers',     label: 'Suppliers',       labelAr: 'الموردون',    icon: <Truck size={18} />,         href: `${basePath}/store/suppliers` },
          { key: 'fin-expenses',  label: 'Expenses',        labelAr: 'المصروفات',   icon: <Briefcase size={18} />,     href: `${basePath}/finance?tab=expenses` },
        ] },
    ]

    if (userRole === 'BRANCH_FINANCE_ADMIN') return [
      personalSection,
      { key: 'finance', labelAr: 'المالية', labelEn: 'Finance',
        items: [
          { key: 'fin-dash',     label: 'Finance',          labelAr: 'المالية',           icon: <DollarSign size={18} />,    href: `${basePath}/finance` },
          { key: 'fin-invoices', label: 'Invoices',         labelAr: 'الفواتير',          icon: <FileText size={18} />,      href: `${basePath}/finance?tab=invoices` },
          { key: 'fin-expenses', label: 'Expense Claims',   labelAr: 'مطالبات المصروفات', icon: <Briefcase size={18} />,     href: `${basePath}/finance?tab=expenses` },
          { key: 'fin-reports',  label: 'Reports',          labelAr: 'التقارير',          icon: <BarChart2 size={18} />,     href: `${basePath}/finance?tab=reports` },
        ] },
    ]
  }

  // Locale prefix for cross-role links (e.g. /ar or /en)
  const localePrefix = basePath.split('/').slice(0, 2).join('/')

  // Use pathRole for remaining cases
  const role = pathRole

  if (role === 'super-admin') {
    return [
      {
        key: 'main', labelAr: 'الرئيسية', labelEn: 'Main',
        items: [
          { key: 'dashboard', label: 'Dashboard', labelAr: 'لوحة التحكم', icon: <LayoutDashboard size={18} />, href: `${basePath}/dashboard` },
        ],
      },
      {
        key: 'organization', labelAr: 'المؤسسة', labelEn: 'Organization',
        items: [
          { key: 'schools',           label: 'Schools',           labelAr: 'المدارس',            icon: <Building2 size={18} />,    href: `${basePath}/schools` },
          { key: 'purchase-requests', label: 'Purchase Requests', labelAr: 'طلبات الشراء',        icon: <ShoppingCart size={18} />, href: `${basePath}/purchase-requests` },
          { key: 'requisitions',      label: 'Requisitions',      labelAr: 'طلبات التوريد',       icon: <Package size={18} />,      href: `${basePath}/requisitions` },
          { key: 'jobs',              label: 'Job Applications',  labelAr: 'طلبات التوظيف',       icon: <Briefcase size={18} />,    href: `${basePath}/jobs` },
        ],
      },
      {
        key: 'management', labelAr: 'الإدارة', labelEn: 'Management',
        items: [
          { key: 'employees', label: 'Employees',  labelAr: 'الموظفون',    icon: <Users size={18} />,    href: `${basePath}/employees` },
          { key: 'users',     label: 'All Users',  labelAr: 'المستخدمون', icon: <GraduationCap size={18} />, href: `${basePath}/users` },
          { key: 'settings',  label: 'Settings',   labelAr: 'الإعدادات',  icon: <Settings size={18} />, href: `${basePath}/settings` },
        ],
      },
    ]
  }

  if (role === 'counselor') {
    return [
      {
        key: 'main', labelAr: 'الرئيسية', labelEn: 'Main',
        items: [
          { key: 'dashboard', label: 'Dashboard', labelAr: 'لوحة التحكم', icon: <LayoutDashboard size={18} />, href: `${basePath}` },
        ],
      },
      {
        key: 'support', labelAr: 'دعم الطلاب', labelEn: 'Student Support',
        items: [
          { key: 'student-affairs', label: 'Student Affairs',       labelAr: 'شئون الطلاب',             icon: <Shield size={18} />,       href: basePath.replace('/counselor', '/admin') + '/student-affairs' },
          { key: 'my-purchases',    label: 'My Purchase Requests',  labelAr: 'طلبات الشراء الخاصة بي',  icon: <ShoppingCart size={18} />, href: `${localePrefix}/my-purchases` },
          { key: 'store',           label: 'Store',                 labelAr: 'المخزن',                  icon: <Package size={18} />,      href: `${localePrefix}/company-store`, module: 'STORE' },
          { key: 'messaging',       label: 'Messages',              labelAr: 'الرسائل',                 icon: <MessageSquare size={18} />, href: msgPath },
          { key: 'it-support',      label: 'IT Support',            labelAr: 'الدعم التقني',             icon: <HelpCircle size={18} />,   href: `${localePrefix}/admin/it-support` },
        ],
      },
    ]
  }

  if (role === 'admin') {
    return [
      {
        key: 'main', labelAr: 'الرئيسية', labelEn: 'Main',
        items: [
          { key: 'dashboard', label: 'Dashboard', labelAr: 'لوحة التحكم', icon: <LayoutDashboard size={18} />, href: `${basePath}/dashboard` },
        ],
      },
      {
        key: 'academic', labelAr: 'الأكاديمي', labelEn: 'Academic',
        items: [
          { key: 'courses', label: 'Courses', labelAr: 'المقررات', icon: <BookOpen size={18} />, href: `${basePath}/courses` },
          { key: 'assignments', label: 'Assignments', labelAr: 'الواجبات', icon: <ClipboardList size={18} />, href: `${basePath}/assignments` },
          { key: 'gradebook', label: 'Gradebook', labelAr: 'دفتر الدرجات', icon: <BarChart2 size={18} />, href: `${basePath}/gradebook` },
          { key: 'attendance', label: 'Attendance', labelAr: 'الحضور', icon: <Calendar size={18} />, href: `${basePath}/attendance` },
          { key: 'analytics', label: 'Analytics', labelAr: 'التحليلات', icon: <GraduationCap size={18} />, href: `${basePath}/analytics` },
        ],
      },
      {
        key: 'management', labelAr: 'الإدارة', labelEn: 'Management',
        items: [
          { key: 'users', label: 'Users', labelAr: 'المستخدمون', icon: <Users size={18} />, href: `${basePath}/users` },
          { key: 'finance', label: 'Finance', labelAr: 'المالية', icon: <DollarSign size={18} />, href: `${basePath}/finance`, module: 'FINANCE', orgLevel: true },
          { key: 'events', label: 'Events', labelAr: 'الفعاليات', icon: <CalendarDays size={18} />, href: `${basePath}/events`, module: 'EVENTS' },
          { key: 'library', label: 'Library', labelAr: 'المكتبة', icon: <Library size={18} />, href: `${basePath}/library`, module: 'LIBRARY' },
          { key: 'health', label: 'Health', labelAr: 'الصحة', icon: <Heart size={18} />, href: `${basePath}/health`, module: 'HEALTH' },
          { key: 'transport', label: 'Transport', labelAr: 'النقل', icon: <Bus size={18} />, href: `${basePath}/transport`, module: 'TRANSPORT' },
          { key: 'tickets', label: 'Support', labelAr: 'الدعم الفني', icon: <Ticket size={18} />, href: `${basePath}/tickets`, module: 'TICKETS' },
          { key: 'devices', label: 'Devices', labelAr: 'الأجهزة', icon: <Laptop size={18} />, href: `${basePath}/devices`, module: 'DEVICES' },
          { key: 'hr', label: 'HR', labelAr: 'الموارد البشرية', icon: <Users size={18} />, href: `${basePath}/hr`, module: 'HR', orgLevel: true },
          { key: 'canteen', label: 'Canteen', labelAr: 'المقصف', icon: <Brain size={18} />, href: `${basePath}/canteen`, module: 'CANTEEN' },
          { key: 'store', label: 'Store', labelAr: 'المخزن', icon: <Laptop size={18} />, href: `${basePath}/store`, module: 'STORE' },
          { key: 'admission', label: 'Admission', labelAr: 'القبول', icon: <GraduationCap size={18} />, href: `${basePath}/admission`, module: 'ADMISSION' },
          { key: 'receptionist', label: 'Reception', labelAr: 'الاستقبال', icon: <Bell size={18} />, href: `${basePath}/receptionist` },
          { key: 'boarding', label: 'Boarding', labelAr: 'السكن الداخلي', icon: <Video size={18} />, href: `${basePath}/boarding` },
          { key: 'student-affairs', label: 'Student Affairs', labelAr: 'شئون الطلاب', icon: <Shield size={18} />, href: `${basePath}/student-affairs` },
        ],
      },
      {
        key: 'communication', labelAr: 'التواصل', labelEn: 'Communication',
        items: [
          { key: 'my-purchases',  label: 'My Purchase Requests', labelAr: 'طلبات الشراء الخاصة بي', icon: <ShoppingCart size={18} />, href: `${localePrefix}/my-purchases` },
          { key: 'messaging',     label: 'Messages',             labelAr: 'الرسائل',                icon: <MessageSquare size={18} />, href: msgPath },
          { key: 'announcements', label: 'Announcements',        labelAr: 'الإعلانات',              icon: <Bell size={18} />,         href: `${basePath}/announcements` },
        ],
      },
      {
        key: 'settings', labelAr: 'الإعدادات', labelEn: 'Settings',
        items: [
          { key: 'settings', label: 'Settings', labelAr: 'الإعدادات', icon: <Settings size={18} />, href: `${basePath}/settings` },
        ],
      },
    ]
  }

  if (role === 'teacher') {
    return [
      {
        key: 'main', labelAr: 'الرئيسية', labelEn: 'Main',
        items: [
          { key: 'dashboard', label: 'Dashboard', labelAr: 'لوحة التحكم', icon: <LayoutDashboard size={18} />, href: `${basePath}/dashboard` },
        ],
      },
      {
        key: 'academic', labelAr: 'الأكاديمي', labelEn: 'Academic',
        items: [
          { key: 'courses', label: 'My Courses', labelAr: 'مقرراتي', icon: <BookOpen size={18} />, href: `${basePath}/courses` },
          { key: 'assignments', label: 'Assignments', labelAr: 'الواجبات', icon: <ClipboardList size={18} />, href: `${basePath}/assignments` },
          { key: 'quizzes', label: 'Quizzes', labelAr: 'الاختبارات', icon: <Brain size={18} />, href: `${basePath}/quizzes` },
          { key: 'gradebook', label: 'Gradebook', labelAr: 'دفتر الدرجات', icon: <BarChart2 size={18} />, href: `${basePath}/gradebook` },
          { key: 'attendance', label: 'Attendance', labelAr: 'الحضور', icon: <Calendar size={18} />, href: `${basePath}/attendance` },
          { key: 'live-classes', label: 'Live Classes', labelAr: 'الحصص المباشرة', icon: <Video size={18} />, href: `${basePath}/live-classes` },
        ],
      },
      {
        key: 'communication', labelAr: 'التواصل', labelEn: 'Communication',
        items: [
          { key: 'messaging', label: 'Messages', labelAr: 'الرسائل', icon: <MessageSquare size={18} />, href: msgPath },
          { key: 'announcements', label: 'Announcements', labelAr: 'الإعلانات', icon: <Bell size={18} />, href: `${basePath}/announcements` },
        ],
      },
      {
        key: 'company', labelAr: 'الشركة', labelEn: 'Company',
        items: [
          { key: 'my-purchases', label: 'My Purchase Requests', labelAr: 'طلبات الشراء الخاصة بي', icon: <ShoppingCart size={18} />, href: `${localePrefix}/my-purchases` },
          { key: 'store',        label: 'Store',                labelAr: 'المخزن',                  icon: <Package size={18} />,     href: `${localePrefix}/company-store`, module: 'STORE' },
          { key: 'it-support',   label: 'IT Support',           labelAr: 'الدعم التقني',            icon: <HelpCircle size={18} />,  href: `${localePrefix}/admin/it-support` },
        ],
      },
      {
        key: 'ai', labelAr: 'الذكاء الاصطناعي', labelEn: 'AI Tools',
        items: [
          { key: 'ai-lesson', label: 'AI Lesson Planner', labelAr: 'مخطط الدروس', icon: <GraduationCap size={18} />, href: `${basePath}/ai-planner` },
        ],
      },
    ]
  }

  if (role === 'student') {
    return [
      {
        key: 'main', labelAr: 'الرئيسية', labelEn: 'Main',
        items: [
          { key: 'dashboard', label: 'Dashboard', labelAr: 'لوحة التحكم', icon: <LayoutDashboard size={18} />, href: `${basePath}/dashboard` },
        ],
      },
      {
        key: 'academic', labelAr: 'الأكاديمي', labelEn: 'Academic',
        items: [
          { key: 'courses', label: 'My Courses', labelAr: 'مقرراتي', icon: <BookOpen size={18} />, href: `${basePath}/courses` },
          { key: 'assignments', label: 'Assignments', labelAr: 'الواجبات', icon: <ClipboardList size={18} />, href: `${basePath}/assignments` },
          { key: 'quizzes', label: 'Quizzes', labelAr: 'الاختبارات', icon: <Brain size={18} />, href: `${basePath}/quizzes` },
          { key: 'grades', label: 'My Grades', labelAr: 'درجاتي', icon: <BarChart2 size={18} />, href: `${basePath}/grades` },
          { key: 'attendance', label: 'Attendance', labelAr: 'حضوري', icon: <Calendar size={18} />, href: `${basePath}/attendance` },
          { key: 'live-classes', label: 'Live Classes', labelAr: 'الحصص المباشرة', icon: <Video size={18} />, href: `${basePath}/live-classes` },
        ],
      },
      {
        key: 'communication', labelAr: 'التواصل', labelEn: 'Communication',
        items: [
          { key: 'messaging', label: 'Messages', labelAr: 'الرسائل', icon: <MessageSquare size={18} />, href: msgPath },
        ],
      },
      {
        key: 'extras', labelAr: 'أكثر', labelEn: 'More',
        items: [
          { key: 'library',      label: 'Library',    labelAr: 'المكتبة',      icon: <Library size={18} />,    href: `${basePath}/library` },
          { key: 'gamification', label: 'Rewards',    labelAr: 'المكافآت',     icon: <Trophy size={18} />,     href: `${basePath}/gamification` },
          { key: 'it-support',   label: 'IT Support', labelAr: 'الدعم التقني', icon: <HelpCircle size={18} />, href: `${localePrefix}/admin/it-support` },
        ],
      },
      {
        key: 'ai', labelAr: 'الذكاء الاصطناعي', labelEn: 'AI Tools',
        items: [
          { key: 'ai-tutor', label: 'AI Tutor', labelAr: 'المدرس الذكي', icon: <GraduationCap size={18} />, href: `${basePath}/ai-tutor` },
        ],
      },
    ]
  }

  if (role === 'parent') {
    return [
      {
        key: 'main', labelAr: 'الرئيسية', labelEn: 'Main',
        items: [
          { key: 'dashboard', label: 'Dashboard', labelAr: 'لوحة التحكم', icon: <LayoutDashboard size={18} />, href: `${basePath}/dashboard` },
        ],
      },
      {
        key: 'children', labelAr: 'أبنائي', labelEn: 'My Children',
        items: [
          { key: 'children', label: 'Children', labelAr: 'أبنائي', icon: <Users size={18} />, href: `${basePath}/children` },
          { key: 'grades', label: 'Grades', labelAr: 'الدرجات', icon: <BarChart2 size={18} />, href: `${basePath}/grades` },
          { key: 'attendance', label: 'Attendance', labelAr: 'الحضور', icon: <Calendar size={18} />, href: `${basePath}/attendance` },
        ],
      },
      {
        key: 'finance', labelAr: 'المالية', labelEn: 'Finance',
        items: [
          { key: 'finance', label: 'Fees & Invoices', labelAr: 'الرسوم والفواتير', icon: <DollarSign size={18} />, href: `${basePath}/finance` },
        ],
      },
      {
        key: 'communication', labelAr: 'التواصل', labelEn: 'Communication',
        items: [
          { key: 'messaging',     label: 'Messages',      labelAr: 'الرسائل',      icon: <MessageSquare size={18} />, href: msgPath },
          { key: 'announcements', label: 'Announcements', labelAr: 'الإعلانات',    icon: <Bell size={18} />,          href: `${basePath}/announcements` },
          { key: 'it-support',    label: 'IT Support',    labelAr: 'الدعم التقني', icon: <HelpCircle size={18} />,    href: `${localePrefix}/admin/it-support` },
        ],
      },
    ]
  }

  // Fallback generic
  return [
    {
      key: 'main', labelAr: 'الرئيسية', labelEn: 'Main',
      items: [
        { key: 'dashboard', label: 'Dashboard', labelAr: 'لوحة التحكم', icon: <LayoutDashboard size={18} />, href: `${basePath}/dashboard` },
      ],
    },
  ]
}

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
  basePath: string  // e.g. /ar/admin or /ar/teacher
}

export function Sidebar({ collapsed = false, onToggle, basePath }: SidebarProps) {
  const locale = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const { selectedSchoolId, schools } = useSchoolContext()
  const isOrgContext = !selectedSchoolId && schools.length > 1
  const isRtl = locale === 'ar'
  const ChevronIcon = isRtl
    ? (collapsed ? ChevronLeft : ChevronRight)
    : (collapsed ? ChevronRight : ChevronLeft)

  // Fetch enabled modules for this school
  const [enabledModules, setEnabledModules] = React.useState<Set<string> | null>(null)
  React.useEffect(() => {
    if (!user?.schoolId) { setEnabledModules(null); return }
    const token = (() => {
      try {
        const stored = localStorage.getItem('educore-auth')
        if (stored) return JSON.parse(stored)?.state?.token ?? null
      } catch {}
      return sessionStorage.getItem('access_token')
    })()
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/my/modules`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error('modules fetch failed')
        return r.json()
      })
      .then((data) => {
        const enabled = new Set<string>(
          (Array.isArray(data) ? data : data?.data ?? [])
            .filter((m: any) => m.enabled)
            .map((m: any) => m.module)
        )
        setEnabledModules(enabled)
      })
      .catch(() => setEnabledModules(null))
  }, [user?.schoolId])

  const allSections = getNavSections(locale, basePath, user?.role as string | undefined)
  // Filter items by module — if module not in enabled set, hide it
  // null enabledModules = still loading or super admin — show all
  const sections = enabledModules === null
    ? allSections
    : allSections.map((section) => ({
        ...section,
        items: section.items.filter((item) => !item.module || enabledModules.has(item.module)),
      })).filter((section) => section.items.length > 0)

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-primary-900 text-white transition-all duration-300 relative',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-primary-700">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-primary-900 font-bold text-sm">E</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight">EduCore</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {sections.map((section) => (
          <div key={section.key} className="mb-4">
            {!collapsed && (
              <p className="px-4 text-[10px] font-semibold uppercase tracking-wider text-primary-400 mb-1">
                {isRtl ? section.labelAr : section.labelEn}
              </p>
            )}
            {section.items.map((item) => {
              const [itemPath, itemQuery] = item.href.split('?')
              const itemTab = itemQuery ? new URLSearchParams(itemQuery).get('tab') : null
              const currentTab = searchParams.get('tab')
              const isActive = itemTab
                ? pathname.startsWith(itemPath) && currentTab === itemTab
                : pathname.startsWith(itemPath) && !currentTab
              const showOrgBadge = item.orgLevel && isOrgContext
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  title={isRtl ? item.labelAr : item.label}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-primary-900'
                      : 'text-primary-200 hover:bg-primary-800 hover:text-white',
                    collapsed && 'justify-center px-0 mx-2',
                  )}
                >
                  {item.icon}
                  {!collapsed && (
                    <>
                      <span className="flex-1">{isRtl ? item.labelAr : item.label}</span>
                      {showOrgBadge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 leading-none shrink-0">
                          {isRtl ? 'مؤسسة' : 'ORG'}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User info */}
      {!collapsed && user && (
        <div className="p-4 border-t border-primary-700">
          <div className="flex items-center gap-3">
            <Avatar src={user.avatar} name={`${user.firstName} ${user.lastName}`} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {isRtl ? (user.firstNameAr || user.firstName) : user.firstName}
              </p>
              <p className="text-xs text-primary-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className={cn(
          'absolute -end-3 top-20 w-6 h-6 rounded-full bg-accent text-primary-900 flex items-center justify-center shadow-md',
          'hover:bg-accent/90 transition-colors',
        )}
      >
        <ChevronIcon size={12} />
      </button>
    </aside>
  )
}
