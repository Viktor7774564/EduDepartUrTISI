import api from '@/api/client'
import type { DisplayScheduleItem } from '@/views/schedule/scheduleOptions'

export interface CreateScheduleItemPayload {
  groupName: string
  weekStart: string
  dayOfWeek: number
  startTime: string
  endTime: string
  subject: string
  lessonType: string
  teacherName?: string
  room?: string
  subgroup?: number
  comment?: string
}

export interface UpdateScheduleItemPayload {
  subject?: string
  lessonType?: string
  teacherName?: string
  room?: string
  dayOfWeek?: number
  startTime?: string
  endTime?: string
  weekStart?: string
  subgroup?: number | null
  comment?: string
}

export async function createScheduleItem(
  payload: CreateScheduleItemPayload,
): Promise<DisplayScheduleItem> {
  const response = await api.post<DisplayScheduleItem>(
    '/education-department/schedules/items',
    payload,
  )
  return response.data
}

export async function updateScheduleItem(
  id: number,
  payload: UpdateScheduleItemPayload,
): Promise<DisplayScheduleItem> {
  const response = await api.patch<DisplayScheduleItem>(
    `/education-department/schedules/items/${id}`,
    payload,
  )
  return response.data
}

export async function disableScheduleItem(id: number): Promise<void> {
  await api.patch(`/education-department/schedules/items/${id}/disable`)
}

export async function deleteScheduleItem(id: number): Promise<void> {
  await api.delete(`/education-department/schedules/items/${id}`)
}
