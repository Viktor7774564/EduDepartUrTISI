import api from '@/api/client'
import type { DisplayScheduleItem } from '@/views/schedule/scheduleOptions'

export interface ScheduleGroupInfo {
  groupName: string
  facultyName: string | null
}

export interface GroupScheduleResponse {
  groupName: string
  weeks: Record<string, DisplayScheduleItem[]>
}

export interface TeacherScheduleResponse {
  teacherName: string
  weeks: Record<string, DisplayScheduleItem[]>
}

export interface RoomScheduleResponse {
  room: string
  weeks: Record<string, DisplayScheduleItem[]>
}

export async function fetchScheduleGroups(): Promise<ScheduleGroupInfo[]> {
  const response = await api.get<ScheduleGroupInfo[]>('/schedules/groups')
  return response.data
}

export async function fetchGroupSchedule(groupName: string): Promise<GroupScheduleResponse> {
  const response = await api.get<GroupScheduleResponse>(
    `/schedules/groups/${encodeURIComponent(groupName)}`,
  )
  return response.data
}

export async function fetchScheduleTeachers(): Promise<string[]> {
  const response = await api.get<string[]>('/schedules/teachers')
  return response.data
}

export async function fetchTeacherSchedule(teacherName: string): Promise<TeacherScheduleResponse> {
  const response = await api.get<TeacherScheduleResponse>(
    `/schedules/teachers/${encodeURIComponent(teacherName)}`,
  )
  return response.data
}

export async function fetchScheduleBuildings(): Promise<string[]> {
  const response = await api.get<string[]>('/schedules/buildings')
  return response.data
}

export async function fetchScheduleRooms(building?: string): Promise<string[]> {
  const response = await api.get<string[]>('/schedules/rooms', {
    params: building ? { building } : undefined,
  })
  return response.data
}

export async function fetchRoomSchedule(roomName: string): Promise<RoomScheduleResponse> {
  const response = await api.get<RoomScheduleResponse>(
    `/schedules/rooms/${encodeURIComponent(roomName)}`,
  )
  return response.data
}
