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

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

void useAuthStore(pinia).initializeAuth().finally(() => {
  app.mount('#app')
})
