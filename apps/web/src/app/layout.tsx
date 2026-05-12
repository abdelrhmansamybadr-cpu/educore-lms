import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | EduCore LMS',
    default: 'EduCore LMS',
  },
  description: 'The most complete school management system for the Arab world and beyond.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
