const DEFAULT_API_PORT = '3000'

const NGROK_HOST_SUFFIXES = [
  '.ngrok-free.dev',
  '.ngrok-free.app',
  '.ngrok.io',
  '.ngrok.app',
]

function shouldUseSameOriginApi(hostname: string): boolean {
  if (import.meta.env.VITE_USE_PROXY === 'true') {
    return true
  }

  return NGROK_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
}

export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim()

  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location

    if (shouldUseSameOriginApi(hostname)) {
      return origin
    }

    return `http://${hostname}:${DEFAULT_API_PORT}`
  }

  return `http://localhost:${DEFAULT_API_PORT}`
}

export function getSessionsSocketUrl(): string {
  return `${getApiBaseUrl()}/admin/sessions`
}

export function getPhotoUrl(photoUrl?: string | null): string | null {
  if (!photoUrl) {
    return null
  }

  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl
  }

  return `${getApiBaseUrl()}${photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`}`
}

export function getScheduleSocketUrl(): string{
  return `${getApiBaseUrl()}/schedules/live`
}

export function getNotificationsSocketUrl(): string {
  return `${getApiBaseUrl()}/notifications/live`
}