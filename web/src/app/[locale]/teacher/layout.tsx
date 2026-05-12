import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function TeacherLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <DashboardLayout basePath={`/${locale}/teacher`}>
      {children}
    </DashboardLayout>
  )
}
