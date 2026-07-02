import type { AuthUser } from '@/stores/auth'

export function canManageConsultations(
  user: AuthUser | null | undefined,
  departmentId?: number | string | null,
): boolean {
  if (!user?.departmentId || departmentId === undefined || departmentId === null || departmentId === '') {
    return false
  }

  if (user.role !== 'teacher' && user.role !== 'employee') {
    return false
  }

  return user.departmentId === Number(departmentId)
}
