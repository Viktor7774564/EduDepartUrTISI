import './assets/main.css'
import './assets/styles/common.css'
import './assets/styles/home.css'
import './assets/styles/login.css'
import './assets/styles/profile.css'
import './assets/styles/admin.css'
import './assets/styles/not-found.css'
import './assets/styles/schedule.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
