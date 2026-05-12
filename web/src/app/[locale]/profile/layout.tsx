import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function ProfileLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <DashboardLayout basePath={`/${locale}/profile`}>
      {children}
    </DashboardLayout>
  )
}
