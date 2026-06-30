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
      '/notifications': backendWsProxy,
      '/schedules': backendWsProxy,
      '/academic': backendProxy,
      '/education-department': backendProxy,
      '/uploads': backendProxy,
      '/socket.io': backendWsProxy,
    },
  },
})
