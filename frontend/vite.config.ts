import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type ProxyOptions } from 'vite'
import vue from '@vitejs/plugin-vue'

const BACKEND_URL = 'http://localhost:3000'

const backendProxy: ProxyOptions = {
  target: BACKEND_URL,
  changeOrigin: true,
  secure: false,
}

const backendWsProxy: ProxyOptions = {
  ...backendProxy,
  ws: true,
}

function shouldServeNotificationsPage(req: { method?: string; headers: { accept?: string }; url?: string }): boolean {
  if (req.method !== 'GET') {
    return false
  }

  const url = req.url ?? ''

  if (
    url.startsWith('/notifications/push')
    || url.startsWith('/notifications/read-all')
    || url.startsWith('/notifications/consultation-preferences')
    || /\/notifications\/\d+\/read(?:\?|$)/.test(url)
  ) {
    return false
  }

  const accept = req.headers.accept ?? ''

  return accept.includes('text/html')
}

const notificationsProxy: ProxyOptions = {
  ...backendWsProxy,
  bypass(req) {
    if (shouldServeNotificationsPage(req)) {
      return '/index.html'
    }

    return undefined
  },
}

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      '.ngrok-free.dev',
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok.app',
    ],
    proxy: {
      '/auth': backendProxy,
      '/admin': backendWsProxy,
      '/notifications': notificationsProxy,
      '/schedules': backendWsProxy,
      '/academic': backendProxy,
      '/education-department/schedules': backendProxy,
      '/uploads': backendProxy,
      '/socket.io': backendWsProxy,
    },
  },
})
