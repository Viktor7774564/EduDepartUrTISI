import api from '@/api/client'
import type { DisplayScheduleItem } from '@/views/schedule/scheduleOptions'
import axios from 'axios'

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

export async function updatePreholidayDay(
  date: string,
  isPreholiday: boolean,
): Promise<string[]> {
  const response = await api.patch<string[]>(
    '/education-department/schedules/preholiday-days',
    { date, isPreholiday },
  )

  return response.data
}

export function getScheduleAdminErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'Не удалось выполнить операцию'
  }

  const data = error.response?.data

  if (data && typeof data === 'object') {
    const payload = data as {
      message?: unknown
      errors?: string[]
    }

    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      return payload.errors.join('\n')
    }

    if (
      payload.message
      && typeof payload.message === 'object'
      && !Array.isArray(payload.message)
    ) {
      const nested = payload.message as {
        message?: unknown
        errors?: string[]
      }

      if (Array.isArray(nested.errors) && nested.errors.length > 0) {
        return nested.errors.join('\n')
      }

      if (typeof nested.message === 'string') {
        return nested.message
      }
    }

    if (typeof payload.message === 'string') {
      return payload.message
    }
  }

  return 'Не удалось выполнить операцию'
}
