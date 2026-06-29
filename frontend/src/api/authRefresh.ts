import axios from 'axios'

import { getApiBaseUrl } from '@/config/api'
import type { AuthUser } from '@/stores/auth'

const AUTH_STORAGE_KEY = 'edu-depart-auth-user'

type RefreshResponse = {
  accessToken: string
  refreshToken?: string
  user: AuthUser
}

let refreshPromise: Promise<string | null> | null = null

function decodeTokenPayload(token: string): { exp?: number } | null {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) {
      return null
    }

    return JSON.parse(atob(payloadPart)) as { exp?: number }
  } catch {
    return null
  }
}

export function isAccessTokenExpiringSoon(thresholdMs = 5 * 60 * 1000): boolean {
  const accessToken = localStorage.getItem('access_token')
  if (!accessToken) {
    return false
  }

  const payload = decodeTokenPayload(accessToken)
  if (!payload?.exp) {
    return false
  }

  return payload.exp * 1000 - Date.now() < thresholdMs
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      return null
    }

    try {
      const response = await axios.post<RefreshResponse>(
        `${getApiBaseUrl()}/auth/refresh`,
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        },
      )

      const { accessToken, refreshToken: nextRefreshToken, user } = response.data

      if (!accessToken || !user) {
        return null
      }

      localStorage.setItem('access_token', accessToken)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))

      if (nextRefreshToken) {
        localStorage.setItem('refresh_token', nextRefreshToken)
      }

      const { useAuthStore } = await import('@/stores/auth')
      useAuthStore().setSession(user, accessToken, nextRefreshToken ?? refreshToken)

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:token-refreshed', {
          detail: { accessToken },
        }))
      }

      return accessToken
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function clearAuthSessionAndRedirect(): Promise<void> {
  const { useAuthStore } = await import('@/stores/auth')
  useAuthStore().clearSession()

  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.assign('/login')
  }
}
