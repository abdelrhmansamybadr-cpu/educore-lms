import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  timeout: 15000, // 15s — prevents requests from hanging forever
  headers: { 'Content-Type': 'application/json' },
})

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('educore-auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed?.state?.token) return parsed.state.token
    }
  } catch {}
  return sessionStorage.getItem('access_token')
}

function getSchoolSlug(): string {
  if (typeof window === 'undefined') return 'demo'
  try {
    const stored = localStorage.getItem('educore-auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed?.state?.user?.school?.slug) return parsed.state.user.school.slug
    }
  } catch {}
  return 'demo'
}

/** Returns the currently selected schoolId from the school-context store (null = org/all-schools) */
function getSelectedSchoolId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('educore-school-context')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed?.state?.selectedSchoolId ?? null
    }
  } catch {}
  return null
}

// Finance-page school scope override — set by the Finance page when it mounts/changes school
let _financeSchoolOverride: string | null = null
export function setFinanceSchoolScope(id: string | null) { _financeSchoolOverride = id }

// Request interceptor — attach token + school slug + selected school context
api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['x-school-slug'] = getSchoolSlug()
  // Finance page overrides the school context for its own calls; fallback to global school context
  const schoolId = _financeSchoolOverride ?? getSelectedSchoolId()
  if (schoolId) config.headers['x-school-id'] = schoolId
  return config
})

// Response interceptor — handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const { data } = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true, timeout: 10000 },
        )
        const newToken = data?.data?.accessToken ?? data?.accessToken
        if (newToken) {
          try {
            const stored = localStorage.getItem('educore-auth')
            if (stored) {
              const parsed = JSON.parse(stored)
              parsed.state.token = newToken
              localStorage.setItem('educore-auth', JSON.stringify(parsed))
            }
          } catch {}
          sessionStorage.setItem('access_token', newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }
      } catch {
        // Refresh failed — clear auth and redirect to login
        localStorage.removeItem('educore-auth')
        sessionStorage.removeItem('access_token')
      }
      // Always reject after 401 handling so promises don't hang
      return Promise.reject(error)
    }

    return Promise.reject(error)
  },
)

/**
 * Extracts a human-readable error message from an Axios error.
 * Usage in onError callbacks: `onError: (err) => toast.error(getApiError(err))`
 */
// Alias so pages can import either `api` or `apiClient` from this module
export { api as apiClient }

export function getApiError(error: any, fallback = 'Something went wrong. Please try again.'): string {
  const msg = error?.response?.data?.message
  if (!msg) return fallback
  if (Array.isArray(msg)) return msg.join(' ')
  return msg
}
