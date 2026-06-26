import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import api from '@/api/client'

const AUTH_STORAGE_KEY = 'edu-depart-auth-user'

export type UserRole = 'admin' | 'student' | 'teacher' | 'education_department'

export type AuthUser = {
  id: number
  login: string
  role: UserRole
  surname: string
  name: string
  patronymic: string
  photoUrl?: string | null
  group?: string
  direction?: string
  educationForm?: string
  course?: number
  position?: string
  department?: string
  departmentId?: number
  cabinet?: string
}

interface LoginResult {
  success: boolean
  message?: string
  user?: AuthUser
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<AuthUser | null>(null)
  const isAuthenticated = computed(() => currentUser.value !== null)

  const roleLabel = computed(() => {
    switch (currentUser.value?.role) {
      case 'admin': return 'Администратор'
      case 'student': return 'Студент'
      case 'teacher': return 'Преподаватель'
      case 'education_department': return 'Учебный отдел'
      default: return ''
    }
  })

  function setSession(user: AuthUser, accessToken: string, refreshToken?: string | null) {
    currentUser.value = user
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    localStorage.setItem('access_token', accessToken)

    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken)
    }
  }

  function clearSession() {
    currentUser.value = null
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  async function initializeAuth() {
    const accessToken = localStorage.getItem('access_token')

    if (!accessToken) {
      clearSession()
      return false
    }

    return validateSession()
  }

  async function validateSession(): Promise<boolean> {
    const accessToken = localStorage.getItem('access_token')

    if (!accessToken) {
      clearSession()
      return false
    }

    try {
      const response = await api.get<AuthUser>('/auth/me')
      currentUser.value = response.data
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.data))
      return true
    } catch {
      clearSession()

      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }

      return false
    }
  }

  async function login(loginInput: string, password: string): Promise<LoginResult> {
    try {
      const response = await api.post('/auth/login', {
        login: loginInput.trim(),
        password,
      })

      const { accessToken, refreshToken, user } = response.data

      if (!accessToken || !user) {
        return { success: false, message: 'Некорректный ответ сервера' }
      }

      setSession(user, accessToken, refreshToken)

      return { success: true, user }
    } catch (error: unknown) {
      if (!axios.isAxiosError(error)) {
        return { success: false, message: 'Не удалось выполнить вход' }
      }

      if (!error.response) {
        return {
          success: false,
          message: 'Сервер недоступен. Проверьте, что бэкенд запущен.',
        }
      }

      const data = error.response.data
      const message = typeof data === 'object' && data && 'message' in data
        ? String((data as { message?: unknown }).message ?? 'Неверный логин или пароль')
        : 'Неверный логин или пароль'

      return { success: false, message }
    }
  }

  async function logout() {
    try {
      await api.get('/auth/logout')
    } catch {
      // Даже если сервер недоступен, очищаем локальную сессию.
    } finally {
      clearSession()
    }
  }

  return {
    currentUser,
    isAuthenticated,
    roleLabel,
    setSession,
    clearSession,
    initializeAuth,
    validateSession,
    login,
    logout,
  }
})
