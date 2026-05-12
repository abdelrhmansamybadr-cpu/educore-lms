import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function NotificationsLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <DashboardLayout basePath={`/${locale}/notifications`}>
      {children}
    </DashboardLayout>
  )
}
