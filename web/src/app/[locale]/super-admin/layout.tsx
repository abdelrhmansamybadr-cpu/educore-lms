import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function SuperAdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <DashboardLayout basePath={`/${locale}/super-admin`}>
      {children}
    </DashboardLayout>
  )
}
