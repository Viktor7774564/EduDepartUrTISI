import api from '@/api/client'
import type { AuthUser } from '@/stores/auth'

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
  logoutAllDevices?: boolean
}

export type ChangePasswordResponse = {
  success: true
  loggedOutAllDevices: boolean
  accessToken?: string
  refreshToken?: string
  user?: AuthUser
}

export type UserSession = {
  id: number
  createdAt: string
  isCurrent: boolean
}

export type RevokeUserSessionResponse = {
  success: true
  currentSessionRevoked: boolean
}

export async function changePassword(payload: ChangePasswordPayload) {
  const response = await api.patch<ChangePasswordResponse>(
    '/auth/password',
    payload,
  )

  return response.data
}

export async function fetchUserSessions(): Promise<UserSession[]> {
  const response = await api.get<UserSession[]>('/auth/sessions')
  return response.data
}

export async function revokeUserSession(id: number): Promise<RevokeUserSessionResponse> {
  const response = await api.delete<RevokeUserSessionResponse>(`/auth/sessions/${id}`)
  return response.data
}
