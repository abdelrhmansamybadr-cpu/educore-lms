'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { Spinner } from '@/components/ui'
import { api } from '@/lib/api'

interface DashboardLayoutProps {
  children: React.ReactNode
  basePath: string
  pageTitle?: string
  pageTitleAr?: string
}

export function DashboardLayout({ children, basePath, pageTitle, pageTitleAr }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [recovering, setRecovering] = useState(false)
  const router = useRouter()
  const locale = useLocale()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasHydrated = useAuthStore((s) => s._hasHydrated)
  const setUser = useAuthStore((s) => s.setUser)

  // Fallback: if Zustand hasn't hydrated after 3s, force redirect to login
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 3000)
    return () => clearTimeout(t)
  }, [])

  // When hydrated but not authenticated, try cookie-based session recovery
  useEffect(() => {
    if (!hasHydrated && !timedOut) return
    if (isAuthenticated) return

    setRecovering(true)
    api
      .get('/users/me')
      .then((res) => {
        const user = res.data?.data || res.data
        if (user?.id) {
          // Restore session from cookie — mark as authenticated without a new token
          setUser(user)
        } else {
          router.replace(`/${locale}/auth/login`)
        }
      })
      .catch(() => {
        router.replace(`/${locale}/auth/login`)
      })
      .finally(() => {
        setRecovering(false)
      })
  }, [hasHydrated, timedOut, isAuthenticated])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [])

  // Show spinner while: Zustand not hydrated, or session recovery in progress
  if (!hasHydrated && !timedOut) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (recovering) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          basePath={basePath}
        />
      </div>

      {/* Sidebar — mobile */}
      <div
        className={cn(
          'fixed inset-y-0 start-0 z-50 lg:hidden transition-transform duration-300',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full',
        )}
      >
        <Sidebar collapsed={false} basePath={basePath} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          title={pageTitle}
          titleAr={pageTitleAr}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
