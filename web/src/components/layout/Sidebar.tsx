'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import {
  LayoutDashboard, BookOpen, ClipboardList, Brain, Users, Settings,
  ChevronLeft, ChevronRight, GraduationCap, BarChart2, MessageSquare,
  Bell, DollarSign, Laptop, Ticket, Video, Calendar, Library, Heart,
  Trophy, CalendarDays, Bus,
} from 'lucide-react'

interface NavItem {
  key: string
  label: string
  labelAr: string
  icon: React.ReactNode
  href: string
  badge?: number
}

interface NavSection {
  key: string
  labelAr: string
  labelEn: string
  items: NavItem[]
}

const getNavSections = (_locale: string, basePath: string): NavSection[] => {
  // Determine role from basePath: /ar/admin, /ar/teacher, /ar/student, /ar/parent
  const role = basePath.split('/').pop() || ''

  const msgPath = basePath.replace(/\/(admin|teacher|student|parent|super-admin)$/, '/messaging')

  if (role === 'super-admin') {
    return [
      {
        key: 'main', labelAr: 'الرئيسية', labelEn: 'Main',
        items: [
          { key: 'dashboard', label: 'Dashboard', labelAr: 'لوحة التحكم', icon: <LayoutDashboard size={18} />, href: `${basePath}/dashboard` },
        ],
      },
      {
        key: 'platform', labelAr: 'المنصة', labelEn: 'Platform',
        items: [
          { key: 'schools', label: 'Schools', labelAr: 'المدارس', icon: <GraduationCap size={18} />, href: `${basePath}/schools` },
          { key: 'users', label: 'All Users', labelAr: 'جميع المستخدمين', icon: <Users size={18} />, href: `${basePath}/users` },
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
          { key: 'finance', label: 'Finance', labelAr: 'المالية', icon: <DollarSign size={18} />, href: `${basePath}/finance` },
          { key: 'events', label: 'Events', labelAr: 'الفعاليات', icon: <CalendarDays size={18} />, href: `${basePath}/events` },
          { key: 'library', label: 'Library', labelAr: 'المكتبة', icon: <Library size={18} />, href: `${basePath}/library` },
          { key: 'health', label: 'Health', labelAr: 'الصحة', icon: <Heart size={18} />, href: `${basePath}/health` },
          { key: 'transport', label: 'Transport', labelAr: 'النقل', icon: <Bus size={18} />, href: `${basePath}/transport` },
          { key: 'tickets', label: 'Support', labelAr: 'الدعم الفني', icon: <Ticket size={18} />, href: `${basePath}/tickets` },
          { key: 'devices', label: 'Devices', labelAr: 'الأجهزة', icon: <Laptop size={18} />, href: `${basePath}/devices` },
          { key: 'hr', label: 'HR', labelAr: 'الموارد البشرية', icon: <Users size={18} />, href: `${basePath}/hr` },
          { key: 'canteen', label: 'Canteen', labelAr: 'المقصف', icon: <Brain size={18} />, href: `${basePath}/canteen` },
          { key: 'store', label: 'Store', labelAr: 'المخزن', icon: <Laptop size={18} />, href: `${basePath}/store` },
          { key: 'admission', label: 'Admission', labelAr: 'القبول', icon: <GraduationCap size={18} />, href: `${basePath}/admission` },
          { key: 'receptionist', label: 'Reception', labelAr: 'الاستقبال', icon: <Bell size={18} />, href: `${basePath}/receptionist` },
          { key: 'boarding', label: 'Boarding', labelAr: 'السكن الداخلي', icon: <Video size={18} />, href: `${basePath}/boarding` },
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
  const isRtl = locale === 'ar'
  const ChevronIcon = isRtl
    ? (collapsed ? ChevronLeft : ChevronRight)
    : (collapsed ? ChevronRight : ChevronLeft)

  const sections = getNavSections(locale, basePath)

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
                  {!collapsed && <span>{isRtl ? item.labelAr : item.label}</span>}
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
