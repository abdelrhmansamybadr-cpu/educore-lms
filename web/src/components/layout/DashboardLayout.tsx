'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { Spinner } from '@/components/ui'
import { api } from '@/lib/api'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'

interface DashboardLayoutProps {
  children: React.ReactNode
  basePath: string
  pageTitle?: string
  pageTitleAr?: string
}

function ForceChangePasswordModal({ onSuccess }: { onSuccess: () => void }) {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error(isRtl ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(isRtl ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await api.patch('/auth/set-first-password', { newPassword })
      toast.success(isRtl ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully')
      onSuccess()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg.join(' ') : msg || (isRtl ? 'فشل تغيير كلمة المرور' : 'Failed to change password'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <KeyRound size={20} className="text-amber-600" />
            </div>
            <h2 className={`text-lg font-bold text-gray-900 ${isRtl ? 'font-arabic' : ''}`}>
              {isRtl ? 'تغيير كلمة المرور المؤقتة' : 'Change Temporary Password'}
            </h2>
          </div>
          <p className={`text-sm text-gray-500 ${isRtl ? 'font-arabic' : ''}`}>
            {isRtl
              ? 'تم إنشاء هذا الحساب بكلمة مرور مؤقتة. يجب عليك تغييرها الآن قبل المتابعة.'
              : 'This account was created with a temporary password. You must change it now before continuing.'}
          </p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-xs font-medium text-gray-600 mb-1 ${isRtl ? 'font-arabic' : ''}`}>
              {isRtl ? 'كلمة المرور الجديدة' : 'New Password'}
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary-500"
                placeholder={isRtl ? 'كلمة مرور قوية...' : 'Strong password...'}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-medium text-gray-600 mb-1 ${isRtl ? 'font-arabic' : ''}`}>
              {isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'}
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary-500"
                placeholder={isRtl ? 'أعد كتابة كلمة المرور...' : 'Re-enter password...'}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {newPassword && newPassword.length < 8 && (
            <p className="text-xs text-red-500">
              {isRtl ? 'يجب أن تكون كلمة المرور 8 أحرف على الأقل' : 'Password must be at least 8 characters'}
            </p>
          )}
        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading
              ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...')
              : (isRtl ? 'تغيير كلمة المرور والمتابعة' : 'Change Password & Continue')}
          </button>
        </div>
      </div>
    </div>
  )
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
  const user = useAuthStore((s) => s.user)
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
        const u = res.data?.data || res.data
        if (u?.id) {
          setUser(u)
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

  const mustChangePassword = (user as any)?.mustChangePassword === true

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Force password change overlay — blocks everything underneath */}
      {mustChangePassword && (
        <ForceChangePasswordModal
          onSuccess={() => {
            // Clear the flag in the store
            if (user) setUser({ ...user, mustChangePassword: false } as any)
          }}
        />
      )}

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <div className="hidden lg:flex flex-shrink-0">
        <Suspense>
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            basePath={basePath}
          />
        </Suspense>
      </div>

      {/* Sidebar — mobile */}
      <div
        className={cn(
          'fixed inset-y-0 start-0 z-50 lg:hidden transition-transform duration-300',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full',
        )}
      >
        <Suspense><Sidebar collapsed={false} basePath={basePath} /></Suspense>
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
