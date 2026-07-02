import api from '@/api/client'

export interface TeacherDepartmentInfo {
  id: number
  shortName: string
  name: string
  label: string
}

export interface StaffDepartmentInfo {
  id: number
  name: string
}

export async function fetchTeacherDepartments(): Promise<TeacherDepartmentInfo[]> {
  const response = await api.get<TeacherDepartmentInfo[]>('/academic/departments/teachers')
  return response.data
}

export async function fetchStaffDepartments(): Promise<StaffDepartmentInfo[]> {
  const response = await api.get<StaffDepartmentInfo[]>('/admin/academic/departments/staff')
  return response.data
}
