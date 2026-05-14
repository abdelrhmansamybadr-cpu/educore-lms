'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Bell, Search, Menu, LogOut, Settings, User, ChevronDown } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { SchoolSwitcher } from './SchoolSwitcher'

interface TopbarProps {
  onMenuToggle?: () => void
  title?: string
  titleAr?: string
}

export function Topbar({ onMenuToggle, title, titleAr }: TopbarProps) {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const router = useRouter()
  const pathname = usePathname()
  const { user, clearAuth } = useAuthStore()

  // Derive settings path from current URL segment
  const pathSegment = pathname.split('/').find((s) =>
    ['super-admin', 'admin', 'teacher', 'student', 'parent'].includes(s)
  ) || 'admin'
  const settingsPath = `/${locale}/${pathSegment}/settings`
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => api.get('/notifications').then((r) => r.data?.data || []),
    refetchInterval: 30000,
    enabled: !!user,
  })
  const unreadCount = Array.isArray(notifData) ? notifData.filter((n: any) => !n.isRead).length : 0

  async function handleLogout() {
    try { await api.post('/auth/logout') } catch {}
    clearAuth()
    // Clear auth cookie so middleware stops treating user as authenticated
    document.cookie = 'access_token=;path=/;max-age=0'
    router.push(`/${locale}/auth/login`)
  }

  const displayName = isRtl
    ? `${user?.firstNameAr || user?.firstName || ''} ${user?.lastNameAr || user?.lastName || ''}`
    : `${user?.firstName || ''} ${user?.lastName || ''}`

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 gap-4 sticky top-0 z-30">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        {(title || titleAr) && (
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {isRtl ? titleAr : title}
          </h1>
        )}
      </div>

      {/* School context switcher — only visible when org has multiple schools */}
      <SchoolSwitcher />

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 w-64 border border-gray-200">
        <Search size={16} className="text-gray-400 flex-shrink-0" />
        <input
          placeholder={isRtl ? 'بحث...' : 'Search...'}
          className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full"
        />
      </div>

      {/* Notifications */}
      <Link href={`/${locale}/notifications`} className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 end-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Avatar src={user?.avatar} name={displayName.trim()} size="sm" />
          <div className="hidden md:block text-start">
            <p className="text-sm font-medium text-gray-900 leading-none">{displayName.trim()}</p>
            <p className="text-xs text-gray-500 mt-0.5">{user?.role}</p>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {dropdownOpen && (
          <div className={cn(
            'absolute top-full mt-1 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50',
            isRtl ? 'left-0' : 'right-0',
          )}>
            <Link
              href={`/${locale}/profile`}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setDropdownOpen(false)}
            >
              <User size={15} />
              {isRtl ? 'الملف الشخصي' : 'Profile'}
            </Link>
            <Link
              href={settingsPath}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setDropdownOpen(false)}
            >
              <Settings size={15} />
              {isRtl ? 'الإعدادات' : 'Settings'}
            </Link>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full"
            >
              <LogOut size={15} />
              {isRtl ? 'تسجيل الخروج' : 'Sign Out'}
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
