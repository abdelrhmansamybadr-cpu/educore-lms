import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function StudentLibraryLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  return <DashboardLayout basePath={`/${locale}/student`}>{children}</DashboardLayout>
}
