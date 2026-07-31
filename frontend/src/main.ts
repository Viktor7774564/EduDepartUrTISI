import { bootstrapTheme, useThemeStore } from '@/stores/theme'

bootstrapTheme()
import './assets/main.css'
import './assets/styles/common.css'
import './assets/styles/home.css'
import './assets/styles/login.css'
import './assets/styles/profile.css'
import './assets/styles/admin.css'
import './assets/styles/not-found.css'
import './assets/styles/schedule.css'
import './assets/styles/notifications.css'
import './assets/styles/settings.css'
import './assets/styles/confirm-dialog.css'

import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'
import { warmOwnPersonalScheduleCache } from '@/utils/personalScheduleCache'



const app = createApp(App)
const pinia = createPinia()
const authStore = useAuthStore(pinia)

function registerServiceWorker() {
  // DEV-HTTPS-START: удалить проверку VITE_ENABLE_SW перед продакшеном.
  // В проде service worker должен включаться только через import.meta.env.PROD.
  const shouldRegisterServiceWorker = import.meta.env.PROD || import.meta.env.VITE_ENABLE_SW === 'true'
  // DEV-HTTPS-END

  if (!shouldRegisterServiceWorker || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Не удалось зарегистрировать service worker', error)
    })
  })
}

function setupPersonalScheduleWarmup() {
  const warmPersonalSchedule = () => {
    void warmOwnPersonalScheduleCache(authStore.currentUser)
  }

  watch(
    () => authStore.currentUser,
    () => {
      warmPersonalSchedule()
    },
    { immediate: true },
  )

  if (typeof window !== 'undefined') {
    window.addEventListener('online', warmPersonalSchedule)
  }
}

app.use(pinia)
app.use(router)

registerServiceWorker()

void authStore.initializeAuth().finally(() => {
  setupPersonalScheduleWarmup()
  useThemeStore(pinia).initializeTheme()
  app.mount('#app')
})


