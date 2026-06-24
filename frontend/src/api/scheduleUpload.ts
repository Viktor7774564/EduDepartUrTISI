import api from '@/api/client'
import { getApiBaseUrl } from '@/config/api'

export type ScheduleUploadType = 'student' | 'teacher' | 'auditory' | 'consultation'
export type ScheduleParseStatus = 'success' | 'failed'

export interface ScheduleUploadItem {
  id: number
  scheduleType: ScheduleUploadType
  originalFileName: string
  fileUrl: string
  mimeType: string
  fileSize: number
  groupName: string | null
  facultyName: string | null
  parseStatus: ScheduleParseStatus
  parseErrors: string[] | null
  parseWarnings: string[] | null
  lessonsCount: number
  periodStart: string | null
  periodEnd: string | null
  uploadedAt: string
  uploadedBy: {
    id: number
    surname: string
    name: string
    patronymic: string
  }
}

export const scheduleUploadTypeOptions = [
  { value: 'student' as const, label: 'Расписание студентов' },
  { value: 'teacher' as const, label: 'Расписание преподавателей' },
  { value: 'auditory' as const, label: 'Расписание аудиторий' },
  { value: 'consultation' as const, label: 'Расписание консультаций' },
]

export function getScheduleUploadTypeLabel(type: ScheduleUploadType): string {
  return scheduleUploadTypeOptions.find((item) => item.value === type)?.label ?? type
}

export function getScheduleFileUrl(fileUrl: string): string {
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl
  }

  return `${getApiBaseUrl()}${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} Б`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} КБ`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

export async function fetchScheduleUploads(): Promise<ScheduleUploadItem[]> {
  const response = await api.get<ScheduleUploadItem[]>('/education-department/schedules')
  return response.data
}

export async function uploadScheduleFile(
  facultyName: string,
  groupName: string,
  file: File,
): Promise<ScheduleUploadItem> {
  const formData = new FormData()
  formData.append('scheduleType', 'student')
  formData.append('facultyName', facultyName)
  formData.append('groupName', groupName)
  formData.append('file', file)

  const response = await api.post<ScheduleUploadItem>(
    '/education-department/schedules/upload',
    formData,
  )

  return response.data
}

export async function deleteScheduleUpload(id: number): Promise<void> {
  await api.delete(`/education-department/schedules/${id}`)
}
