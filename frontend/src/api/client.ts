import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { getApiBaseUrl } from '@/config/api'
import {
  clearAuthSessionAndRedirect,
  isAccessTokenExpiringSoon,
  refreshAccessToken,
} from '@/api/authRefresh'

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  const token = localStorage.getItem('access_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((promise) => {
    if (error || !token) {
      promise.reject(error)
      return
    }

    promise.resolve(token)
  })

  failedQueue = []
}

function isAuthRequest(url: string | undefined): boolean {
  if (!url) {
    return false
  }

  return url.includes('/auth/login') || url.includes('/auth/refresh')
}

api.interceptors.response.use(
  async (response) => {
    if (
      !isAuthRequest(response.config.url) &&
      isAccessTokenExpiringSoon() &&
      localStorage.getItem('refresh_token')
    ) {
      await refreshAccessToken()
    }

    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthRequest(originalRequest.url)
    ) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const accessToken = await refreshAccessToken()

      if (!accessToken) {
        processQueue(error, null)
        await clearAuthSessionAndRedirect()
        return Promise.reject(error)
      }

      processQueue(null, accessToken)
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      await clearAuthSessionAndRedirect()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

let isRefreshing = false

export default api
