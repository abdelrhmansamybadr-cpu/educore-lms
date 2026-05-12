import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function StudentLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <DashboardLayout basePath={`/${locale}/student`}>
      {children}
    </DashboardLayout>
  )
}
