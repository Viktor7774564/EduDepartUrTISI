import api from '@/api/client'
import type { DisplayScheduleItem } from '@/views/schedule/scheduleOptions'

export interface DepartmentInfo {
  id: number
  shortName: string
  name: string
  label: string
}

export interface DepartmentConsultationsResponse {
  departmentId: number
  departmentName: string
  departmentLabel: string
  weeks: Record<string, DisplayScheduleItem[]>
}

export interface CreateConsultationPayload {
  departmentId: number
  subject: string
  consultationType: 'Консультация' | 'Онлайн-консультация'
  dayOfWeek: number
  startTime: string
  endTime: string
  weekStart: string
  room?: string
}

export interface UpdateConsultationPayload {
  subject?: string
  consultationType?: 'Консультация' | 'Онлайн-консультация'
  dayOfWeek?: number
  startTime?: string
  endTime?: string
  weekStart?: string
  room?: string
}

export async function fetchConsultationDepartments(): Promise<DepartmentInfo[]> {
  const response = await api.get<DepartmentInfo[]>('/schedules/consultations/departments')
  return response.data
}

export async function fetchDepartmentConsultations(
  departmentId: number,
): Promise<DepartmentConsultationsResponse> {
  const response = await api.get<DepartmentConsultationsResponse>(
    `/schedules/consultations/departments/${departmentId}`,
  )
  return response.data
}

export async function createConsultation(
  payload: CreateConsultationPayload,
): Promise<DisplayScheduleItem> {
  const response = await api.post<DisplayScheduleItem>(
    '/schedules/consultations',
    payload,
  )
  return response.data
}

export async function updateConsultation(
  id: number,
  payload: UpdateConsultationPayload,
): Promise<DisplayScheduleItem> {
  const response = await api.patch<DisplayScheduleItem>(
    `/schedules/consultations/${id}`,
    payload,
  )
  return response.data
}

export async function deleteConsultation(id: number): Promise<void> {
  await api.delete(`/schedules/consultations/${id}`)
}
