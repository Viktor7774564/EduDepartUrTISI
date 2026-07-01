import api from '@/api/client'

export type NotificationItem = {
    id: number
    userId: number
    type: 'schedule' | 'consultation'
    title: string
    message: string
    payload: Record<string, unknown> | null
    isRead: boolean
    createdAt: string
}

export type ConsultationNotificationPreference = {
    enabled: boolean
    allTeachers: boolean
    teacherIds: number[]
}

export type ConsultationTeacherOption = {
    id: number
    name: string
    departmentId: number
    departmentLabel: string
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

export function fetchConsultationNotificationPreferences(): Promise<ConsultationNotificationPreference> {
    return api
        .get<ConsultationNotificationPreference>('/notifications/consultation-preferences')
        .then((response) => response.data)
}

export function updateConsultationNotificationPreferences(
    payload: ConsultationNotificationPreference,
): Promise<ConsultationNotificationPreference> {
    return api
        .put<ConsultationNotificationPreference>(
            '/notifications/consultation-preferences',
            payload,
        )
        .then((response) => response.data)
}

export function fetchConsultationNotificationTeachers(): Promise<ConsultationTeacherOption[]> {
    return api
        .get<ConsultationTeacherOption[]>('/notifications/consultation-preferences/teachers')
        .then((response) => response.data)
}