import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api/client'

const AUTH_STORAGE_KEY = 'edu-depart-auth-user'

export type AuthUser = {
  id: number
  login: string
  role: 'admin' | 'student' | 'teacher' | 'education_department'
  // можно добавить fullName, email и другие поля позже
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

  function loadStoredUser() {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      try {
        currentUser.value = JSON.parse(stored)
      } catch (e) {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
  }

  async function login(loginInput: string, password: string): Promise<LoginResult> {
    try {
      const response = await api.post('/auth/login', {
        login: loginInput.trim(),
        password,
      })

      const { accessToken, refreshToken, user } = response.data

      localStorage.setItem('access_token', accessToken)
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken)

      currentUser.value = user
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))

      return { success: true, user }
    } catch (error: any) {
      const message = error.response?.data?.message ||
          error.response?.data ||
          'Неверный логин или пароль'
      return { success: false, message }
    }
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  // Загружаем пользователя при инициализации
  loadStoredUser()

  return {
    currentUser,
    isAuthenticated,
    roleLabel,
    login,
    logout,
  }
})