import api from '@/api/client'
import type { AuthUser, UserRole } from '@/stores/auth'

export type AdminUser = AuthUser & {
  isActive: boolean
}

export type AdminSession = {
  id: number
  userId: number
  login: string
  fullName: string
  role: UserRole
  createdAt: string
}

export type CreateUserPayload = {
  login: string
  password: string
  role: UserRole
  surname: string
  name: string
  patronymic?: string
  group?: string
  direction?: string
  educationForm?: string
  course?: number
  department?: string
  position?: string
  cabinet?: string
}

export type UpdateUserPayload = {
  login: string
  password?: string
  role: UserRole
  surname: string
  name: string
  patronymic?: string
  isActive?: boolean
  removePhoto?: boolean
  group?: string
  direction?: string
  educationForm?: string
  course?: number
  department?: string
  position?: string
  cabinet?: string
}

type UserFormPayload = CreateUserPayload | UpdateUserPayload

function appendIfDefined(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null || value === '') {
    return
  }

  formData.append(key, String(value))
}

function buildUserFormData(payload: UserFormPayload, photo?: File | null): FormData {
  const formData = new FormData()

  appendIfDefined(formData, 'login', payload.login)
  appendIfDefined(formData, 'role', payload.role)
  appendIfDefined(formData, 'surname', payload.surname)
  appendIfDefined(formData, 'name', payload.name)
  appendIfDefined(formData, 'patronymic', payload.patronymic)
  appendIfDefined(formData, 'group', payload.group)
  appendIfDefined(formData, 'direction', payload.direction)
  appendIfDefined(formData, 'educationForm', payload.educationForm)
  appendIfDefined(formData, 'course', payload.course)
  appendIfDefined(formData, 'department', payload.department)
  appendIfDefined(formData, 'position', payload.position)
  appendIfDefined(formData, 'cabinet', payload.cabinet)

  if ('password' in payload && payload.password) {
    appendIfDefined(formData, 'password', payload.password)
  }

  if ('isActive' in payload && payload.isActive !== undefined) {
    appendIfDefined(formData, 'isActive', payload.isActive)
  }

  if ('removePhoto' in payload && payload.removePhoto) {
    formData.append('removePhoto', 'true')
  }

  if (photo) {
    formData.append('photo', photo)
  }

  return formData
}

export async function fetchAdminUser(id: number): Promise<AdminUser> {
  const response = await api.get<AdminUser>(`/admin/users/${id}`)
  return response.data
}

export async function updateAdminUser(
    id: number,
    payload: UpdateUserPayload,
    photo?: File | null,
): Promise<AdminUser> {
  const formData = buildUserFormData(payload, photo)
  const response = await api.patch<AdminUser>(`/admin/users/${id}`, formData)
  return response.data
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const response = await api.get<AdminUser[]>('/admin/users')
  return response.data
}

export async function createAdminUser(
    payload: CreateUserPayload,
    photo?: File | null,
): Promise<AdminUser> {
  const formData = buildUserFormData(payload, photo)
  const response = await api.post<AdminUser>('/admin/users', formData)
  return response.data
}

export async function deleteAdminUser(id: number): Promise<void> {
  await api.delete(`/admin/users/${id}`)
}

export async function fetchAdminSessions(): Promise<AdminSession[]> {
  const response = await api.get<AdminSession[]>('/admin/sessions')
  return response.data
}

export async function revokeAdminSession(id: number): Promise<void> {
  await api.delete(`/admin/sessions/${id}`)
}
