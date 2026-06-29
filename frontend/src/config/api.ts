const DEFAULT_API_PORT = '3000'

export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim()

  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:${DEFAULT_API_PORT}`
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