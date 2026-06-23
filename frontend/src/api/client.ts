import axios from 'axios'
import { getApiBaseUrl } from '@/config/api'

const api = axios.create({
    baseURL: getApiBaseUrl(),
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    if (config.data instanceof FormData) {
        delete config.headers['Content-Type']
    } else if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json'
    }

    return config
})

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const requestUrl = error.config?.url ?? ''
        const isAuthRequest = requestUrl.includes('/auth/login')

        if (error.response?.status === 401 && !isAuthRequest) {
            const { useAuthStore } = await import('@/stores/auth')
            const authStore = useAuthStore()
            authStore.clearSession()

            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                window.location.assign('/login')
            }
        }

        return Promise.reject(error)
    }
)

export default api
