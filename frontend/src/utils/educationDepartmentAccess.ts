import type { AuthUser } from '@/stores/auth'

const EDUCATION_DEPARTMENT_NAME = 'учебный отдел'

function normalizeDepartmentName(name?: string | null): string {
  return name?.trim().toLowerCase().replace(/\s+/g, ' ') ?? ''
}

export function isEducationDepartmentName(name?: string | null): boolean {
  return normalizeDepartmentName(name).includes(EDUCATION_DEPARTMENT_NAME)
}

export function hasScheduleManageAccess(user: AuthUser | null | undefined): boolean {
  if (!user) {
    return false
  }

  if (user.canManageSchedule !== undefined) {
    return user.canManageSchedule
  }

  if (user.role !== 'employee') {
    return false
  }

  return isEducationDepartmentName(user.department)
}
