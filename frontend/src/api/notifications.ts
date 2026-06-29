import api from '@/api/client'

export type NotificationItem = {
    id: number
    userId: number
    type: 'schedule'
    title: string
    message: string
    payload: Record<string, unknown> | null
    isRead: boolean
    createdAt: string
}

export function fetchNotifications(): Promise<NotificationItem[]> {
    return api.get<NotificationItem[]>('/notifications').then((response) => response.data)
}

export function markNotificationAsRead(id: number): Promise<void> {
    return api.patch(`/notifications/${id}/read`).then(() => undefined)
}

export function markAllNotificationsAsRead(): Promise<void> {
    return api.patch('/notifications/read-all').then(() => undefined)
}