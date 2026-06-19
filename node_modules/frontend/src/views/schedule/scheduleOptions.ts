import { consultationSchedules } from '@/mocks/consultations'
import { schedules } from '@/mocks/schedule'

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
}

export interface ScheduleTypeMeta {
  title: string
  caption: string
  actionLabel: string
}

export const scheduleTypeMeta: Record<ScheduleKind, ScheduleTypeMeta> = {
  students: {
    title: 'Расписание студентов',
    caption: 'Выберите факультет и учебную группу.',
    actionLabel: 'Показать расписание',
  },
  teachers: {
    title: 'Расписание преподавателей',
    caption: 'Выберите кафедру и преподавателя.',
    actionLabel: 'Показать расписание',
  },
  auditories: {
    title: 'Расписание аудиторий',
    caption: 'Выберите учебный корпус и аудиторию.',
    actionLabel: 'Показать расписание',
  },
  consults: {
    title: 'Расписание консультаций',
    caption: 'Выберите кафедру и преподавателя.',
    actionLabel: 'Показать консультации',
  },
}

export const facultyOptions = ['СПО', 'ФИИиУ', 'ФНО', 'Магистратура', 'Аспирантура']
export const departmentOptions = ['ИСТ', 'ВМиФ', 'МЭС', 'ИТиМС', 'ГиСЭД']

const groupFacultyMap: Record<string, string> = {
  '487': 'СПО',
  'ПЕ-31б': 'ФИИиУ',
  'ПЕ-32б': 'ФИИиУ',
  'ТЕ-32б': 'ФНО',
}

const teacherDepartmentMap: Record<string, string> = {
  'Бурумбаев Д.И.': 'ИСТ',
  'Бурцев И.И.': 'ИТиМС',
  'Воробьева В.В.': 'ИТиМС',
  'Гниломедов Е.И.': 'МЭС',
  'Евдакова Л.Н.': 'ГиСЭД',
  'Еремеева Л.А.': 'ИСТ',
  'Ермоленко О.М.': 'ИСТ',
  'Зыскина Д.В.': 'МЭС',
  'Казанцев М.Ю.': 'ИСТ',
  'Каменсков А.Е.': 'ИТиМС',
  'Кириленко А.А.': 'ИСТ',
  'Кичигина Г.В.': 'МЭС',
  'Лаврентьева О.И.': 'ИТиМС',
  'Мальцев А.И.': 'ИТиМС',
  'Медведева К.О.': 'ИСТ',
  'Овчинников Д.А.': 'ИТиМС',
  'Павлов Д.В.': 'ГиСЭД',
  'Плеханов С.М.': 'ИТиМС',
  'Пономарева О.Н.': 'ГиСЭД',
  'Пупышев В.А.': 'ИСТ',
  'Савина Н.Н.': 'ГиСЭД',
  'Салимова А.Р.': 'ИСТ',
  'Тупицын К.М.': 'ИСТ',
  'Фончукова А.С.': 'ГиСЭД',
  'Чащихин А.В.': 'ГиСЭД',
  'Шаманаев Ю.Ф.': 'ВМиФ',
  'Шестаков И.И.': 'МЭС',
}

const compareText = (left: string, right: string) =>
  left.localeCompare(right, 'ru', { sensitivity: 'base', numeric: true })

const collectUnique = (items: string[]) => Array.from(new Set(items)).sort(compareText)

export const allGroups = collectUnique(Object.keys(schedules))

export const allTeachers = collectUnique(
  Object.values(schedules).flatMap((weeks) =>
    Object.values(weeks).flatMap((lessons) => lessons.map((lesson) => lesson.teacher)),
  ),
)

export const consultationTeachers = collectUnique(Object.keys(consultationSchedules))

const allRooms = collectUnique(
  Object.values(schedules).flatMap((weeks) =>
    Object.values(weeks).flatMap((lessons) => lessons.map((lesson) => lesson.room)),
  ),
)

export const getGroupFaculty = (group: string) => groupFacultyMap[group] ?? 'ФИИиУ'
export const getTeacherDepartment = (teacher: string) => teacherDepartmentMap[teacher] ?? 'ИСТ'

function getRomanBuilding(room: string) {
  const normalized = room.trim().toUpperCase()

  if (normalized.startsWith('VII') || normalized.startsWith('VIII')) {
    return 'УК3'
  }

  if (normalized.startsWith('VI') || normalized.startsWith('V') || normalized.startsWith('II')) {
    return 'УК3'
  }

  if (normalized.startsWith('III') || normalized.startsWith('IV') || normalized.startsWith('I')) {
    return 'УК5'
  }

  if (normalized.startsWith('7 ') || normalized.startsWith('8 ') || normalized.startsWith('5 ') || normalized.startsWith('6 ') || normalized.startsWith('2 ')) {
    return 'УК3'
  }

  if (normalized.startsWith('1 ') || normalized.startsWith('3 ') || normalized.startsWith('4 ')) {
    return 'УК5'
  }

  return null
}

export function getBuildingFromRoom(room: string) {
  if (room.includes('УК1')) {
    return 'УК1'
  }

  if (room.includes('УК2') || room.includes('УК№2')) {
    return 'УК2'
  }

  if (room.includes('УК3') || room.includes('УК№3')) {
    return 'УК3'
  }

  if (room.includes('УК4') || room.includes('УК№4')) {
    return 'УК4'
  }

  if (room.includes('УК5') || room.includes('УК№5')) {
    return 'УК5'
  }

  const romanBuilding = getRomanBuilding(room)

  if (romanBuilding) {
    return romanBuilding
  }

  return null
}

export const buildingOptions = ['УК1', 'УК2', 'УК3', 'УК4', 'УК5']

export function getGroupsByFaculty(faculty: string | null) {
  if (!faculty) {
    return []
  }

  return allGroups.filter((group) => getGroupFaculty(group) === faculty)
}

export function getTeachersByDepartment(department: string | null) {
  if (!department) {
    return []
  }

  return allTeachers.filter((teacher) => getTeacherDepartment(teacher) === department)
}

export function getConsultationTeachersByDepartment(department: string | null) {
  if (!department) {
    return []
  }

  return consultationTeachers.filter((teacher) => getTeacherDepartment(teacher) === department)
}

export function getRoomsByBuilding(building: string | null) {
  if (!building) {
    return []
  }

  return allRooms.filter((room) => getBuildingFromRoom(room) === building)
}

export function getWeeklySchedulesForSelection(
  kind: ScheduleKind,
  value: string,
): Record<string, DisplayScheduleItem[]> {
  const weeklySchedules: Record<string, DisplayScheduleItem[]> = {}

  Object.entries(schedules).forEach(([group, weeks]) => {
    Object.entries(weeks).forEach(([week, lessons]) => {
      const filteredLessons = lessons
        .filter((lesson) => {
          if (kind === 'students') {
            return group === value
          }

          if (kind === 'teachers') {
            return lesson.teacher === value
          }

          return lesson.room === value
        })
        .map((lesson) => ({
          ...lesson,
          group,
        }))

      if (filteredLessons.length > 0) {
        weeklySchedules[week] = [...(weeklySchedules[week] ?? []), ...filteredLessons]
      }
    })
  })

  return weeklySchedules
}

export function getConsultationSchedulesForTeacher(
  teacher: string,
): Record<string, DisplayScheduleItem[]> {
  const teacherSchedule = consultationSchedules[teacher]

  if (!teacherSchedule) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(teacherSchedule).map(([week, lessons]) => [
      week,
      lessons.map((lesson) => ({
        ...lesson,
        group: 'Консультация',
      })),
    ]),
  )
}
