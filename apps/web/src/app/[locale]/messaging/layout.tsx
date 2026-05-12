import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function MessagingLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <DashboardLayout basePath={`/${locale}/messaging`}>
      {children}
    </DashboardLayout>
  )
}
