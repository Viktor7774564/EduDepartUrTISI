import { io, type Socket } from 'socket.io-client'

import { getNotificationsSocketUrl } from '@/config/api'
import type { NotificationItem } from '@/api/notifications'

export type NotificationsSocketHandlers = {
    onConnected?: () => void
    onCreated: (notification: NotificationItem) => void
    onConnectError?: (error: Error) => void
}

export function connectNotificationsSocket(
    token: string,
    handlers: NotificationsSocketHandlers,
): Socket {
    const socket = io(getNotificationsSocketUrl(), {
        auth: { token },
        transports: ['websocket'],
    })

    socket.on('notification:created', handlers.onCreated)

    if (handlers.onConnected) {
        socket.on('connect', handlers.onConnected)
    }

    if (handlers.onConnectError) {
        socket.on('connect_error', handlers.onConnectError)
    }

    return socket
}