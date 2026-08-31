import {
  fetchGroupSchedule,
  fetchTeacherSchedule,
  type GroupScheduleResponse,
  type TeacherScheduleResponse,
} from '@/api/schedule'
import type { AuthUser } from '@/stores/auth'
import type { DisplayScheduleItem, ScheduleKind, SchedulePeriodMeta } from '@/views/schedule/scheduleOptions'
import { getMyScheduleRoute } from '@/utils/myScheduleNavigation'

const PERSONAL_SCHEDULE_CACHE_PREFIX = 'edu-depart-personal-schedule-cache:v1'

type PersonalScheduleType = Extract<ScheduleKind, 'students' | 'teachers'>

export type PersonalScheduleCacheRecord = {
  type: PersonalScheduleType
  second: string
  weeks: Record<string, DisplayScheduleItem[]>
  meta: SchedulePeriodMeta
  cachedAt: string
}

type PersonalScheduleDescriptor = {
  type: PersonalScheduleType
  second: string
  storageKey: string
}

function getPersonalScheduleDescriptor(user: AuthUser | null | undefined): PersonalScheduleDescriptor | null {
  if (!user) {
    return null
  }

  const route = getMyScheduleRoute(user)

  if (
    !route
    || typeof route !== 'object'
    || !('name' in route)
    || route.name !== 'schedule-view'
    || !route.params
    || !route.query
  ) {
    return null
  }

  const type = route.params.type

  if (type !== 'students' && type !== 'teachers') {
    return null
  }

  const second = String(route.query.second ?? '').trim()

  if (!second) {
    return null
  }

  return {
    type,
    second,
    storageKey: `${PERSONAL_SCHEDULE_CACHE_PREFIX}:${type}:${encodeURIComponent(second)}`,
  }
}

function createMeta(meta?: Partial<SchedulePeriodMeta> | null): SchedulePeriodMeta {
  return {
    academicYearLabel: meta?.academicYearLabel ?? null,
    periodStart: meta?.periodStart ?? null,
    periodEnd: meta?.periodEnd ?? null,
    periodLabel: meta?.periodLabel ?? null,
  }
}

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function writeRecord(storageKey: string, record: PersonalScheduleCacheRecord): void {
  if (!canUseLocalStorage()) {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(record))
}

function readRecord(storageKey: string): PersonalScheduleCacheRecord | null {
  if (!canUseLocalStorage()) {
    return null
  }

  const raw = window.localStorage.getItem(storageKey)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as PersonalScheduleCacheRecord
  } catch {
    window.localStorage.removeItem(storageKey)
    return null
  }
}

function buildRecord(
  type: PersonalScheduleType,
  second: string,
  weeks: Record<string, DisplayScheduleItem[]>,
  meta?: Partial<SchedulePeriodMeta> | null,
): PersonalScheduleCacheRecord {
  return {
    type,
    second,
    weeks,
    meta: createMeta(meta),
    cachedAt: new Date().toISOString(),
  }
}

export function isOwnPersonalScheduleRoute(
  user: AuthUser | null | undefined,
  routeType: ScheduleKind,
  secondValue: string,
): boolean {
  const descriptor = getPersonalScheduleDescriptor(user)

  return Boolean(
    descriptor
    && descriptor.type === routeType
    && descriptor.second === secondValue.trim(),
  )
}

export function saveOwnPersonalScheduleCache(
  user: AuthUser | null | undefined,
  routeType: ScheduleKind,
  secondValue: string,
  weeks: Record<string, DisplayScheduleItem[]>,
  meta?: Partial<SchedulePeriodMeta> | null,
): void {
  const descriptor = getPersonalScheduleDescriptor(user)

  if (
    !descriptor
    || descriptor.type !== routeType
    || descriptor.second !== secondValue.trim()
  ) {
    return
  }

  writeRecord(
    descriptor.storageKey,
    buildRecord(descriptor.type, descriptor.second, weeks, meta),
  )
}

export function getOwnPersonalScheduleCache(
  user: AuthUser | null | undefined,
  routeType: ScheduleKind,
  secondValue: string,
): PersonalScheduleCacheRecord | null {
  const descriptor = getPersonalScheduleDescriptor(user)

  if (
    !descriptor
    || descriptor.type !== routeType
    || descriptor.second !== secondValue.trim()
  ) {
    return null
  }

  const record = readRecord(descriptor.storageKey)

  if (!record || record.type !== descriptor.type || record.second !== descriptor.second) {
    return null
  }

  return record
}

async function fetchOwnSchedule(
  descriptor: PersonalScheduleDescriptor,
): Promise<GroupScheduleResponse | TeacherScheduleResponse> {
  if (descriptor.type === 'students') {
    return fetchGroupSchedule(descriptor.second)
  }

  return fetchTeacherSchedule(descriptor.second)
}

export async function warmOwnPersonalScheduleCache(user: AuthUser | null | undefined): Promise<void> {
  const descriptor = getPersonalScheduleDescriptor(user)

  if (!descriptor) {
    return
  }

  try {
    const response = await fetchOwnSchedule(descriptor)

    writeRecord(
      descriptor.storageKey,
      buildRecord(descriptor.type, descriptor.second, response.weeks, response),
    )
  } catch {
    // Если сети нет, сохраняем последнюю успешную копию без шума для пользователя.
  }
}
