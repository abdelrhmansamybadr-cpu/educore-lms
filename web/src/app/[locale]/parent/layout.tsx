import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function ParentLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <DashboardLayout basePath={`/${locale}/parent`}>
      {children}
    </DashboardLayout>
  )
}
