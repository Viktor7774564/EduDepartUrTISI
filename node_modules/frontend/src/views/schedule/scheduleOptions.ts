export type ScheduleKind = 'students' | 'teachers' | 'auditories' | 'consults'

export interface DisplayScheduleItem {
  id: number
  day: string
  startTime: string
  endTime: string
  subject: string
  teacher: string
  type: string
  room: string
  group: string
  subgroup?: number | null
  isSameCellParallel?: boolean
}

export interface ScheduleTypeMeta {
  title: string
  caption: string
  actionLabel: string
}

export const scheduleTypeMeta: Record<ScheduleKind, ScheduleTypeMeta> = {
  students: {
    title: 'Расписание студентов',
    caption: 'Выберите факультет и группу из загруженных расписаний.',
    actionLabel: 'Показать расписание',
  },
  teachers: {
    title: 'Расписание преподавателей',
    caption: 'Выберите преподавателя из загруженных расписаний.',
    actionLabel: 'Показать расписание',
  },
  auditories: {
    title: 'Расписание аудиторий',
    caption: 'Выберите учебный корпус и аудиторию.',
    actionLabel: 'Показать расписание',
  },
  consults: {
    title: 'Расписание консультаций',
    caption: 'Выберите преподавателя из загруженных расписаний.',
    actionLabel: 'Показать консультации',
  },
}

export const facultyOptions = ['СПО', 'ФИИиУ', 'ФНО', 'Магистратура', 'Аспирантура']

const groupFacultyMap: Record<string, string> = {
  '381': 'СПО',
  '382': 'СПО',
  '487': 'СПО',
  'ПЕ-31б': 'ФИИиУ',
  'ПЕ-32б': 'ФИИиУ',
  'ТЕ-32б': 'ФНО',
}

export const studentFacultySelectOptions = [
  { value: 'СПО', label: 'СПО' },
  { value: 'ФИИиУ', label: 'ФИИиУ' },
  { value: 'ФНО', label: 'ФНО' },
  { value: 'Магистратура', label: 'Магистратура' },
  { value: 'Аспирантура', label: 'Аспирантура' },
] as const

const compareText = (left: string, right: string) =>
  left.localeCompare(right, 'ru', { sensitivity: 'base', numeric: true })

const collectUnique = (items: string[]) => Array.from(new Set(items)).sort(compareText)

export const getGroupFaculty = (group: string) => {
  const normalized = group.trim()

  if (groupFacultyMap[normalized]) {
    return groupFacultyMap[normalized]
  }

  if (/^\d{3}$/.test(normalized)) {
    return 'СПО'
  }

  if (/^ТЕ-/i.test(normalized)) {
    return 'ФНО'
  }

  if (/^ПЕ-/i.test(normalized)) {
    return 'ФИИиУ'
  }

  return 'ФИИиУ'
}

export function getGroupsByFaculty(
  faculty: string | null,
  additionalGroups: string[] = [],
  groupFacultyOverrides: Record<string, string | null> = {},
) {
  if (!faculty) {
    return []
  }

  return collectUnique(additionalGroups).filter((group) => {
    const assignedFaculty = groupFacultyOverrides[group] ?? getGroupFaculty(group)
    return assignedFaculty === faculty
  })
}

export function getBuildingFromRoom(room: string) {
  const normalized = room.trim().toUpperCase()

  if (normalized.includes('УК1')) {
    return 'УК1'
  }

  if (normalized.includes('УК2') || normalized.includes('УК№2')) {
    return 'УК2'
  }

  if (normalized.includes('УК3') || normalized.includes('УК№3')) {
    return 'УК3'
  }

  if (normalized.includes('УК4') || normalized.includes('УК№4')) {
    return 'УК4'
  }

  if (normalized.includes('УК5') || normalized.includes('УК№5')) {
    return 'УК5'
  }

  if (
    normalized.startsWith('VII')
    || normalized.startsWith('VIII')
    || normalized.startsWith('VI ')
    || normalized.startsWith('V ')
    || normalized.startsWith('II ')
    || normalized.startsWith('7 ')
    || normalized.startsWith('8 ')
    || normalized.startsWith('5 ')
    || normalized.startsWith('6 ')
    || normalized.startsWith('2 ')
  ) {
    return 'УК3'
  }

  if (
    normalized.startsWith('III')
    || normalized.startsWith('IV')
    || normalized.startsWith('I ')
    || normalized.startsWith('1 ')
    || normalized.startsWith('3 ')
    || normalized.startsWith('4 ')
  ) {
    return 'УК5'
  }

  return null
}
