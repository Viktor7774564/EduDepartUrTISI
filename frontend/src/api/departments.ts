import api from '@/api/client'

export interface TeacherDepartmentInfo {
  id: number
  shortName: string
  name: string
  label: string
}

export async function fetchTeacherDepartments(): Promise<TeacherDepartmentInfo[]> {
  const response = await api.get<TeacherDepartmentInfo[]>('/academic/departments/teachers')
  return response.data
}
