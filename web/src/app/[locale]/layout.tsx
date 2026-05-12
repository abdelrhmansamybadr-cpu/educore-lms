import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, localeDir, type Locale } from '@educore/i18n'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { HtmlAttributes } from '@/components/providers/HtmlAttributes'
import { Toaster } from 'react-hot-toast'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params: { locale } }: LocaleLayoutProps) {
  if (!locales.includes(locale as Locale)) notFound()

  const messages = await getMessages()
  const dir = localeDir[locale as Locale]

  return (
    <NextIntlClientProvider messages={messages}>
      <QueryProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <HtmlAttributes lang={locale} dir={dir} />
          {children}
          <Toaster
            position={dir === 'rtl' ? 'bottom-left' : 'bottom-right'}
            toastOptions={{
              style: {
                fontFamily: dir === 'rtl' ? 'Cairo, sans-serif' : 'Inter, sans-serif',
                direction: dir,
              },
            }}
          />
        </ThemeProvider>
      </QueryProvider>
    </NextIntlClientProvider>
  )
}
