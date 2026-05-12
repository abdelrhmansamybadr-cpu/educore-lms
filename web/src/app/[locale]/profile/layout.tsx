'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/stores/authStore'
import { useLocale } from 'next-intl'

const ROLE_BASE: Record<string, string> = {
  SCHOOL_ADMIN: 'admin',
  VICE_PRINCIPAL: 'admin',
  ACADEMIC_DIRECTOR: 'admin',
  DEPARTMENT_HEAD: 'admin',
  SUPER_ADMIN: 'super-admin',
  DEVELOPER: 'super-admin',
  TEACHER: 'teacher',
  SUB_TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent',
  COUNSELOR: 'counselor',
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const locale = useLocale()
  const user = useAuthStore((s) => s.user)
  const role = user?.role ?? 'admin'
  const section = ROLE_BASE[role] ?? 'admin'

  return (
    <DashboardLayout basePath={`/${locale}/${section}`}>
      {children}
    </DashboardLayout>
  )
}
