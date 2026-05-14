'use client'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/stores/authStore'
import { useLocale } from 'next-intl'

const ROLE_BASE: Record<string, string> = {
  SCHOOL_ADMIN: 'admin', VICE_PRINCIPAL: 'admin', ACADEMIC_DIRECTOR: 'admin',
  DEPARTMENT_HEAD: 'admin', SUPER_ADMIN: 'super-admin', DEVELOPER: 'super-admin',
  TEACHER: 'teacher', SUB_TEACHER: 'teacher', STUDENT: 'student', PARENT: 'parent',
  COUNSELOR: 'counselor',
  // Staff roles
  IT_ADMIN: 'admin', IT_MANAGER: 'admin', IT_STAFF: 'admin', HR_MANAGER: 'admin', FINANCE_OFFICER: 'admin',
  STORE_MANAGER: 'admin', CANTEEN_MANAGER: 'admin', TRANSPORT_MANAGER: 'admin',
  RECEPTIONIST: 'admin', ADMISSION_OFFICER: 'admin', NURSE: 'admin',
  MATRON: 'admin', EVENT_COORDINATOR: 'admin', SUPPORT_AGENT: 'admin',
  ACTIVITIES_COORDINATOR: 'admin', REQUISITIONS_MANAGER: 'admin', LIBRARIAN: 'admin',
}

export default function MyPurchasesLayout({ children }: { children: React.ReactNode }) {
  const locale = useLocale()
  const user = useAuthStore((s) => s.user)
  const section = ROLE_BASE[user?.role ?? ''] ?? 'admin'
  return <DashboardLayout basePath={`/${locale}/${section}`}>{children}</DashboardLayout>
}
