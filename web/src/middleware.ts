import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from '@educore/i18n'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

// Routes that require authentication
const protectedRoutes = ['/admin', '/teacher', '/student', '/parent', '/super-admin']
// Routes that should redirect if already authenticated
const authRoutes = ['/auth/login', '/auth/register']

const ROLE_DASHBOARD: Record<string, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  DEVELOPER: '/super-admin/dashboard',
  SCHOOL_ADMIN: '/admin/dashboard',
  VICE_PRINCIPAL: '/admin/dashboard',
  ACADEMIC_DIRECTOR: '/admin/dashboard',
  DEPARTMENT_HEAD: '/teacher/dashboard',
  TEACHER: '/teacher/dashboard',
  SUB_TEACHER: '/teacher/dashboard',
  STUDENT: '/student/dashboard',
  PARENT: '/parent/dashboard',
  STAFF: '/admin/dashboard',
  ACCOUNTANT: '/admin/dashboard',
  LIBRARIAN: '/admin/dashboard',
  COUNSELOR: '/teacher/dashboard',
}

function decodeJwtRole(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return decoded?.role || null
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value

  // Strip locale prefix to check route type
  const pathnameWithoutLocale = pathname.replace(/^\/(ar|en)/, '')

  // Get locale from path (fallback to default)
  const localeMatch = pathname.match(/^\/(ar|en)/)
  const locale = localeMatch ? localeMatch[1] : defaultLocale

  // Redirect unauthenticated users away from protected routes
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route),
  )
  if (isProtectedRoute && !token) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages to their role dashboard
  const isAuthRoute = authRoutes.some((route) => pathnameWithoutLocale.startsWith(route))
  if (isAuthRoute && token) {
    const role = decodeJwtRole(token)
    const dashboardPath = (role && ROLE_DASHBOARD[role]) || '/student/dashboard'
    return NextResponse.redirect(new URL(`/${locale}${dashboardPath}`, request.url))
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
