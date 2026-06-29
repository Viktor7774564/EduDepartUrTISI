import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Socket } from 'socket.io-client'

import {
    fetchNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    type NotificationItem,
} from '@/api/notifications'
import { connectNotificationsSocket } from '@/api/notificationsSocket'

export const useNotificationsStore = defineStore('notifications', () => {
    const notifications = ref<NotificationItem[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    let socket: Socket | null = null

    const unreadCount = computed(() =>
        notifications.value.filter((notification) => !notification.isRead).length,
    )

    async function loadNotifications() {
        isLoading.value = true
        error.value = null

        try {
            notifications.value = await fetchNotifications()
        } catch {
            error.value = 'Не удалось загрузить уведомления'
        } finally {
            isLoading.value = false
        }
    }

    function connectLiveUpdates(accessToken: string) {
        disconnectLiveUpdates()

        socket = connectNotificationsSocket(accessToken, {
            onConnected: () => {
                void loadNotifications()
            },
            onCreated: (notification) => {
                notifications.value = [
                    notification,
                    ...notifications.value.filter((item) => item.id !== notification.id),
                ]
            },
            onConnectError: (err) => {
                console.warn('Не удалось подключиться к live-уведомлениям', err)
                error.value = 'Не удалось подключиться к live-уведомлениям'
            },
        })
    }

    function disconnectLiveUpdates() {
        socket?.removeAllListeners()
        socket?.disconnect()
        socket = null
    }

    async function markAsRead(id: number) {
        await markNotificationAsRead(id)

        notifications.value = notifications.value.map((notification) =>
            notification.id === id
                ? { ...notification, isRead: true }
                : notification,
        )
    }

    async function markAllAsRead() {
        await markAllNotificationsAsRead()

        notifications.value = notifications.value.map((notification) => ({
            ...notification,
            isRead: true,
        }))
    }

    return {
        notifications,
        unreadCount,
        isLoading,
        error,
        loadNotifications,
        connectLiveUpdates,
        disconnectLiveUpdates,
        markAsRead,
        markAllAsRead,
    }
})