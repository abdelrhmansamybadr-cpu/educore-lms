import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function AdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <DashboardLayout basePath={`/${locale}/admin`}>
      {children}
    </DashboardLayout>
  )
}
