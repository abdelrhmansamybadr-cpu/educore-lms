'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Building2,
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
        { key: 'dashboard', label: 'Dashboard',  labelAr: 'لوحة التحكم',     icon: <LayoutDashboard size={18} />, href: `${basePath}/dashboard` },
        { key: 'my-hr',     label: 'My HR',      labelAr: 'شؤوني الوظيفية',  icon: <Users size={18} />,          href: `${basePath}/hr` },
        { key: 'store',     label: 'Store',      labelAr: 'المخزن',           icon: <Package size={18} />,        href: `${localePrefix}/company-store`, module: 'STORE' },
        { key: 'canteen',   label: 'Canteen',    labelAr: 'المقصف',           icon: <Brain size={18} />,          href: `${basePath}/canteen`, module: 'CANTEEN' },
        { key: 'messaging', label: 'Messages',   labelAr: 'الرسائل',          icon: <MessageSquare size={18} />,  href: msgPath },
      ],
    }

    if (userRole === 'IT_ADMIN') return [
      personalSection,
      { key: 'work', labelAr: 'العمل', labelEn: 'My Work',
        items: [
          { key: 'devices', label: 'Devices',    labelAr: 'الأجهزة',    icon: <Laptop size={18} />,  href: `${basePath}/devices` },
          { key: 'tickets', label: 'IT Support', labelAr: 'الدعم الفني', icon: <Ticket size={18} />,  href: `${basePath}/tickets` },
        ] },
    ]

    if (userRole === 'HR_MANAGER') return [
      { key: 'main', labelAr: 'الرئيسية', labelEn: 'Main',
        items: [
          { key: 'dashboard', label: 'Dashboard', labelAr: 'لوحة التحكم', icon: <LayoutDashboard size={18} />, href: `${basePath}/dashboard` },
        ] },
      { key: 'work', labelAr: 'الموارد البشرية', labelEn: 'HR Management',
        items: [
          { key: 'hr',        label: 'HR',        labelAr: 'الموارد البشرية', icon: <Users size={18} />,         href: `${basePath}/hr` },
          { key: 'users',     label: 'Staff',     labelAr: 'الموظفون',        icon: <GraduationCap size={18} />, href: `${basePath}/users` },
          { key: 'messaging', label: 'Messages',  labelAr: 'الرسائل',         icon: <MessageSquare size={18} />, href: msgPath },
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
          { key: 'library', label: 'Library', labelAr: 'المكتبة', icon: <Library size={18} />, href: `${basePath}/library` },
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
          { key: 'canteen', label: 'Canteen', labelAr: 'المقصف', icon: <Brain size={18} />, href: `${basePath}/canteen` },
        ] },
    ]

    if (userRole === 'STORE_MANAGER') return [
      personalSection,
      { key: 'work', labelAr: 'المخزن', labelEn: 'Store',
        items: [
          { key: 'store', label: 'Store', labelAr: 'المخزن', icon: <Laptop size={18} />, href: `${basePath}/store` },
        ] },
    ]

    if (userRole === 'SUPPORT_AGENT') return [
      personalSection,
      { key: 'work', labelAr: 'الدعم الفني', labelEn: 'Support',
        items: [
          { key: 'tickets', label: 'Support Tickets', labelAr: 'تذاكر الدعم', icon: <Ticket size={18} />, href: `${basePath}/tickets` },
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
          { key: 'requisitions', label: 'Requisitions', labelAr: 'طلبات التوريد', icon: <Package size={18} />, href: `${basePath}/requisitions` },
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
          { key: 'student-affairs', label: 'Student Affairs', labelAr: 'شئون الطلاب', icon: <Shield size={18} />, href: basePath.replace('/counselor', '/admin') + '/student-affairs' },
          { key: 'store', label: 'Store', labelAr: 'المخزن', icon: <Package size={18} />, href: `${localePrefix}/company-store`, module: 'STORE' },
          { key: 'messaging', label: 'Messages', labelAr: 'الرسائل', icon: <MessageSquare size={18} />, href: msgPath },
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
          { key: 'messaging', label: 'Messages', labelAr: 'الرسائل', icon: <MessageSquare size={18} />, href: msgPath },
          { key: 'announcements', label: 'Announcements', labelAr: 'الإعلانات', icon: <Bell size={18} />, href: `${basePath}/announcements` },
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
          { key: 'store', label: 'Store', labelAr: 'المخزن', icon: <Package size={18} />, href: `${localePrefix}/company-store`, module: 'STORE' },
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
          { key: 'library', label: 'Library', labelAr: 'المكتبة', icon: <Library size={18} />, href: `${basePath}/library` },
          { key: 'store', label: 'Store', labelAr: 'المخزن', icon: <Package size={18} />, href: `${localePrefix}/company-store`, module: 'STORE' },
          { key: 'gamification', label: 'Rewards', labelAr: 'المكافآت', icon: <Trophy size={18} />, href: `${basePath}/gamification` },
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
          { key: 'messaging', label: 'Messages', labelAr: 'الرسائل', icon: <MessageSquare size={18} />, href: msgPath },
          { key: 'announcements', label: 'Announcements', labelAr: 'الإعلانات', icon: <Bell size={18} />, href: `${basePath}/announcements` },
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
              const isActive = pathname.startsWith(item.href)
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
