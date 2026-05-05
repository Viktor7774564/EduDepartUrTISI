import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { mockUsers, type MockUser } from '@/mocks/users'

const AUTH_STORAGE_KEY = 'edu-depart-auth-user'

export type AuthUser = Omit<MockUser, 'password'>

interface LoginResult {
  success: boolean
  message?: string
}

function sanitizeUser(user: MockUser): AuthUser {
  const { password: _password, ...safeUser } = user
  return safeUser
}

function readStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as AuthUser
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<AuthUser | null>(readStoredUser())

  const isAuthenticated = computed(() => currentUser.value !== null)
  const roleLabel = computed(() => {
    if (currentUser.value?.role === 'admin') {
      return 'Администратор'
    }

    if (currentUser.value?.role === 'student') {
      return 'Студент'
    }

    return ''
  })

  function persistUser(user: AuthUser | null) {
    if (typeof window === 'undefined') {
      return
    }

    if (user) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      return
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  function login(login: string, password: string): LoginResult {
    const normalizedLogin = login.trim()

    const user = mockUsers.find(
      (item) => item.login === normalizedLogin && item.password === password,
    )

    if (!user) {
      return {
        success: false,
        message: 'Неверный логин или пароль.',
      }
    }

    const safeUser = sanitizeUser(user)
    currentUser.value = safeUser
    persistUser(safeUser)

    return { success: true }
  }

  function logout() {
    currentUser.value = null
    persistUser(null)
  }

  return {
    currentUser,
    isAuthenticated,
    roleLabel,
    login,
    logout,
  }
})
