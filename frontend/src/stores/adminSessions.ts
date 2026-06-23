import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Socket } from 'socket.io-client'

import {
  fetchAdminSessions,
  revokeAdminSession,
  type AdminSession,
} from '@/api/admin'
import { connectSessionsSocket } from '@/api/sessionsSocket'

export const useAdminSessionsStore = defineStore('adminSessions', () => {
  const sessions = ref<AdminSession[]>([])
  const isLoading = ref(false)
  const isLiveConnected = ref(false)
  const error = ref<string | null>(null)

  let socket: Socket | null = null

  function upsertSession(session: AdminSession) {
    sessions.value = [
      session,
      ...sessions.value.filter((item) => item.id !== session.id),
    ]
  }

  function removeSession(id: number) {
    sessions.value = sessions.value.filter((session) => session.id !== id)
  }

  async function loadSessions() {
    isLoading.value = true
    error.value = null

    try {
      sessions.value = await fetchAdminSessions()
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Не удалось загрузить сессии'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function connectLiveUpdates(accessToken: string) {
    disconnectLiveUpdates()

    isLoading.value = true
    error.value = null

    socket = connectSessionsSocket(accessToken, {
      onSync: (list) => {
        sessions.value = list
        isLoading.value = false
        isLiveConnected.value = true
        error.value = null
      },
      onCreated: (session) => {
        upsertSession(session)
      },
      onRemoved: ({ id }) => {
        removeSession(id)
      },
      onConnectError: () => {
        isLiveConnected.value = false
        isLoading.value = false
        error.value = 'Не удалось подключиться к live-обновлениям сессий'
      },
    })

    socket.on('disconnect', () => {
      isLiveConnected.value = false
    })
  }

  function disconnectLiveUpdates() {
    socket?.removeAllListeners()
    socket?.disconnect()
    socket = null
    isLiveConnected.value = false
  }

  async function revokeSession(id: number) {
    await revokeAdminSession(id)
    removeSession(id)
  }

  return {
    sessions,
    isLoading,
    isLiveConnected,
    error,
    loadSessions,
    connectLiveUpdates,
    disconnectLiveUpdates,
    revokeSession,
  }
})
