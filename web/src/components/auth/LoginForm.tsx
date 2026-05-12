'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type LoginFormData = z.infer<typeof loginSchema>

// Role → dashboard route mapping
const roleDashboard: Record<string, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  DEVELOPER: '/super-admin/dashboard',
  SCHOOL_ADMIN: '/admin/dashboard',
  VICE_PRINCIPAL: '/admin/dashboard',
  ACADEMIC_DIRECTOR: '/admin/dashboard',
  DEPARTMENT_HEAD: '/teacher/dashboard',
  TEACHER: '/teacher/dashboard',
  SUB_TEACHER: '/teacher/dashboard',
  STUDENT: '/student/dashboard',
  PARENT: '/parent/dashboard',
  FINANCE_OFFICER: '/admin/finance',
  HR_MANAGER: '/admin/hr',
  IT_ADMIN: '/admin/devices',
  LIBRARIAN: '/admin/library',
  NURSE: '/admin/health',
  COUNSELOR: '/teacher/dashboard',
  TRANSPORT_MANAGER: '/admin/transport',
  RECEPTIONIST: '/admin/reception',
  ADMISSION_OFFICER: '/admin/admission',
  CANTEEN_MANAGER: '/admin/canteen',
  STORE_MANAGER: '/admin/store',
  SUPPORT_AGENT: '/admin/tickets',
  MATRON: '/admin/matron',
  EVENT_COORDINATOR: '/admin/events',
  ACTIVITIES_COORDINATOR: '/admin/activities',
}

export function LoginForm() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const res = await api.post('/auth/login', data)
      const { accessToken, user: rawUser } = res.data.data

      // Flatten profile into user for convenient access in the store
      const user = {
        ...rawUser,
        firstName: rawUser.profile?.firstName,
        firstNameAr: rawUser.profile?.firstNameAr,
        lastName: rawUser.profile?.lastName,
        lastNameAr: rawUser.profile?.lastNameAr,
        avatar: rawUser.profile?.avatar,
        phone: rawUser.profile?.phone,
      }

      setAuth(user, accessToken)

      // Set cookie so middleware can verify auth server-side
      document.cookie = `access_token=${accessToken};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`

      const dashboardPath = roleDashboard[user.role] || '/student/dashboard'
      router.push(`/${locale}${dashboardPath}`)
    } catch (err: any) {
      const msg = err.response?.data?.message || t('invalidCredentials')
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t('welcomeBack')}</h2>
        <p className="text-muted-foreground mt-1">{t('signInToContinue')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">{t('email')}</label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground
                       focus:outline-none focus:ring-2 focus:ring-ring transition-colors
                       placeholder:text-muted-foreground"
            placeholder="name@school.com"
          />
          {errors.email && (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">{t('password')}</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground
                         focus:outline-none focus:ring-2 focus:ring-ring transition-colors pe-10
                         placeholder:text-muted-foreground"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 end-0 px-3 flex items-center text-muted-foreground
                         hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-destructive text-xs">{errors.password.message}</p>
          )}
        </div>

        {/* Forgot password */}
        <div className="flex justify-end">
          <a
            href={`/${locale}/auth/forgot-password`}
            className="text-sm text-primary-900 hover:underline"
          >
            {t('forgotPassword')}
          </a>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-primary-900 text-white rounded-lg font-medium
                     hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-ring
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 size={16} className="animate-spin" />}
          {t('login')}
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      {/* Social Login */}
      <div className="space-y-3">
        <button
          type="button"
          className="w-full py-2.5 px-4 border border-input rounded-lg font-medium text-foreground
                     hover:bg-muted transition-colors flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {t('loginWithGoogle')}
        </button>

        <button
          type="button"
          className="w-full py-2.5 px-4 border border-input rounded-lg font-medium text-foreground
                     hover:bg-muted transition-colors flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0078D4">
            <path d="M11.5 2C6.26 2 2 6.26 2 11.5S6.26 21 11.5 21 21 16.74 21 11.5 16.74 2 11.5 2zm-1 14H8V10h2.5v6zm0-7.5H8V7h2.5v1.5zM16 16h-2.5v-3c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v3H8v-6h2.5v.75c.46-.57 1.15-.75 2-.75 1.52 0 2.5 1.12 2.5 2.75V16z" />
          </svg>
          {t('loginWithMicrosoft')}
        </button>
      </div>
    </div>
  )
}
