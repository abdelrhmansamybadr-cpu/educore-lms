'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useAuthStore } from '@/stores/authStore'

const ROLE_DASHBOARD: Record<string, string> = {
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
  STAFF: '/admin/dashboard',
  ACCOUNTANT: '/admin/dashboard',
  LIBRARIAN: '/admin/dashboard',
  COUNSELOR: '/teacher/dashboard',
}

export default function DashboardRedirectPage() {
  const router = useRouter()
  const locale = useLocale()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    const path = (user?.role && ROLE_DASHBOARD[user.role]) || '/auth/login'
    router.replace(`/${locale}${path}`)
  }, [user, locale, router])

  return null
}
