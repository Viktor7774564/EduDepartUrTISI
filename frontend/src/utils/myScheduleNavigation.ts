import type { LocationQuery, RouteLocationRaw } from 'vue-router'
import type { AuthUser } from '@/stores/auth'
import { getGroupFaculty } from '@/views/schedule/scheduleOptions'

export function formatTeacherDisplayName(user: AuthUser): string {
  const nameInitial = user.name?.charAt(0) ?? ''
  const patronymicInitial = user.patronymic?.charAt(0) ?? ''

  return `${user.surname} ${nameInitial}.${patronymicInitial}.`.trim()
}

export function getMyScheduleRoute(user: AuthUser | null | undefined): RouteLocationRaw | null {
  if (!user) {
    return null
  }

  if (user.role === 'student') {
    const group = user.group?.trim()

    if (!group) {
      return { name: 'schedule-selection', params: { type: 'students' } }
    }

    return {
      name: 'schedule-view',
      params: { type: 'students' },
      query: {
        first: getGroupFaculty(group),
        second: group,
      },
    }
  }

  if (user.role === 'teacher') {
    return {
      name: 'schedule-view',
      params: { type: 'teachers' },
      query: {
        first: user.departmentId ? String(user.departmentId) : '',
        second: formatTeacherDisplayName(user),
      },
    }
  }

  return null
}

export function isMyScheduleActive(
  routeName: string | symbol | null | undefined,
  routeParams: Record<string, string | string[] | undefined>,
  routeQuery: LocationQuery,
  user: AuthUser | null | undefined,
): boolean {
  if (routeName !== 'schedule-view' || !user) {
    return false
  }

  const myRoute = getMyScheduleRoute(user)

  if (!myRoute || typeof myRoute !== 'object' || !('name' in myRoute) || myRoute.name !== 'schedule-view') {
    return false
  }

  if (routeParams.type !== myRoute.params?.type) {
    return false
  }

  const first = String(routeQuery.first ?? '')
  const second = String(routeQuery.second ?? '')
  const myFirst = String(myRoute.query?.first ?? '')
  const mySecond = String(myRoute.query?.second ?? '')

  return first === myFirst && second === mySecond
}
