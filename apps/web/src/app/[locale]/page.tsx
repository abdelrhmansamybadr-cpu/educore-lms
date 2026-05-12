import { redirect } from 'next/navigation'

// Root page redirects to the dashboard (auth middleware handles unauthenticated)
export default function HomePage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/auth/login`)
}
