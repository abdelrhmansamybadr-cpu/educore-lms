import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function CounselorLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <DashboardLayout basePath={`/${locale}/counselor`}>
      {children}
    </DashboardLayout>
  )
}
