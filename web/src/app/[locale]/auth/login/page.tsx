import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth')
  return { title: t('login') }
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-900 flex-col justify-between p-12">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <span className="text-primary-900 font-bold text-lg">E</span>
            </div>
            <span className="text-white text-xl font-bold">EduCore</span>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white leading-tight">
            The Complete School Management Platform
          </h1>
          <p className="text-blue-200 text-lg">
            منصة إدارة المدرسة المتكاملة للمدارس الوطنية والدولية
          </p>
        </div>

        <div className="flex gap-4 text-blue-300 text-sm">
          <span>🏫 Multi-School</span>
          <span>🌍 Arabic & English</span>
          <span>🤖 AI-Powered</span>
        </div>
      </div>

      {/* Right side — Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-primary-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-primary-900 text-xl font-bold">EduCore</span>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
