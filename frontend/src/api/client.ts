import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
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
            useAuthStore().clearSession()
        }

        return Promise.reject(error)
    }
)

export default api
