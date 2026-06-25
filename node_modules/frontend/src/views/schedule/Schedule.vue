<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fetchGroupSchedule, fetchRoomSchedule, fetchTeacherSchedule } from '@/api/schedule'
import {
  createConsultation,
  deleteConsultation,
  fetchDepartmentConsultations,
  updateConsultation,
} from '@/api/consultations'
import {
  createScheduleItem,
  disableScheduleItem,
  updateScheduleItem,
} from '@/api/scheduleAdmin'
import editIcon from '@/assets/edit.svg'
import {
  type DisplayScheduleItem,
  type ScheduleKind,
  buildConsultationAcademicWeeks,
  getConsultationAcademicYearStart,
  getWeekStartFromLabel,
} from './scheduleOptions'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ']
const times = ['08:30', '10:15', '12:00', '14:15', '16:00', '17:40', '19:15']

const PAIR_END_TIMES: Record<string, string> = {
  '08:30': '10:00',
  '10:15': '11:45',
  '12:00': '13:30',
  '14:15': '15:45',
  '16:00': '17:30',
  '17:40': '19:05',
  '19:15': '20:40',
}

const DAY_TO_NUMBER: Record<string, number> = {
  ПН: 1,
  ВТ: 2,
  СР: 3,
  ЧТ: 4,
  ПТ: 5,
  СБ: 6,
}

const scheduleType = computed(() => route.params.type as ScheduleKind)
const firstValue = computed(() => String(route.query.first ?? ''))
const secondValue = computed(() => String(route.query.second ?? ''))
const departmentName = computed(() => secondValue.value)

type CellLesson = DisplayScheduleItem & {
  groups: string[]
}

const selectedLesson = ref<CellLesson | null>(null)
const editingLesson = ref<CellLesson | null>(null)
const currentWeekIndex = ref(0)
const studentWeeklySchedules = ref<Record<string, DisplayScheduleItem[]>>({})
const isLoadingSchedule = ref(false)
const scheduleLoadError = ref<string | null>(null)

const isMenuVisible = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const contextLesson = ref<CellLesson | null>(null)
const isMobileLayout = ref(false)
let mobileMediaQuery: MediaQueryList | null = null

const isEditModalVisible = ref(false)
const isCreatingLesson = ref(false)
const editForm = ref({
  name: '',
  type: '',
  group: '',
  teacher: '',
  building: '',
  room: '',
  time: '',
  additional: '',
})

const loadSchedule = async () => {
  if (!secondValue.value && scheduleType.value !== 'consults') {
    studentWeeklySchedules.value = {}
    scheduleLoadError.value = null
    isLoadingSchedule.value = false
    return
  }

  if (scheduleType.value === 'consults' && !firstValue.value) {
    studentWeeklySchedules.value = {}
    scheduleLoadError.value = null
    isLoadingSchedule.value = false
    return
  }

  isLoadingSchedule.value = true
  scheduleLoadError.value = null

  try {
    if (scheduleType.value === 'students') {
      const response = await fetchGroupSchedule(secondValue.value)
      studentWeeklySchedules.value = response.weeks
      return
    }

    if (scheduleType.value === 'teachers') {
      const response = await fetchTeacherSchedule(secondValue.value)
      studentWeeklySchedules.value = response.weeks
      return
    }

    if (scheduleType.value === 'consults') {
      const response = await fetchDepartmentConsultations(Number(firstValue.value))
      studentWeeklySchedules.value = response.weeks
      return
    }

    if (scheduleType.value === 'auditories') {
      const response = await fetchRoomSchedule(secondValue.value)
      studentWeeklySchedules.value = response.weeks
      return
    }

    studentWeeklySchedules.value = {}
  } catch {
    studentWeeklySchedules.value = {}

    if (scheduleType.value !== 'consults') {
      scheduleLoadError.value = 'Не удалось загрузить расписание'
    }
  } finally {
    isLoadingSchedule.value = false
  }
}

watch([scheduleType, firstValue, secondValue], () => {
  void loadSchedule()
}, { immediate: true })

const consultationAcademicWeeks = computed(() => buildConsultationAcademicWeeks())

const weeklySchedules = computed(() => {
  if (scheduleType.value === 'consults' && firstValue.value) {
    const baseWeeks = Object.fromEntries(
      consultationAcademicWeeks.value.map((week) => [week.label, [] as DisplayScheduleItem[]]),
    ) as Record<string, DisplayScheduleItem[]>

    return {
      ...baseWeeks,
      ...studentWeeklySchedules.value,
    }
  }

  if (!secondValue.value) {
    return {}
  }

  return studentWeeklySchedules.value
})

const weekKeys = computed(() => {
  if (scheduleType.value === 'consults' && firstValue.value) {
    return consultationAcademicWeeks.value.map((week) => week.label)
  }

  return Object.keys(weeklySchedules.value)
})

const parseWeekRange = (key: string) => {
  const parts = key.split(' - ')
  const startStr = parts[0]
  const endStr = parts[1]

  if (!startStr || !endStr) {
    return { start: new Date(0), end: new Date(0) }
  }

  const startParts = startStr.split('.')
  const endParts = endStr.split('.')
  const sd = startParts[0]
  const sm = startParts[1]
  const ed = endParts[0]
  const em = endParts[1]

  if (!sd || !sm || !ed || !em) {
    return { start: new Date(0), end: new Date(0) }
  }

  const year = new Date().getFullYear()

  return {
    start: new Date(year, Number(sm) - 1, Number(sd)),
    end: new Date(year, Number(em) - 1, Number(ed)),
  }
}

const syncWeekIndex = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (scheduleType.value === 'consults') {
    const initialIndex = consultationAcademicWeeks.value.findIndex((week) => {
      const start = new Date(week.start)
      const end = new Date(week.end)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)

      return today >= start && today <= end
    })

    currentWeekIndex.value = initialIndex !== -1 ? initialIndex : 0
    return
  }

  const initialIndex = weekKeys.value.findIndex((key) => {
    const { start, end } = parseWeekRange(key)

    // Тоже обнуляем
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    return today >= start && today <= end
  })

  currentWeekIndex.value = initialIndex !== -1
      ? initialIndex
      : 0
}

watch(weekKeys, syncWeekIndex, { immediate: true })

const currentWeekKey = computed(() => weekKeys.value[currentWeekIndex.value] ?? '')
const weekLabel = computed(() => currentWeekKey.value)
const isEmptySchedule = computed(() => {
  if (scheduleType.value === 'consults' && firstValue.value) {
    return false
  }

  return !isLoadingSchedule.value && weekKeys.value.length === 0
})

const pageTitle = computed(() => {
  if (scheduleType.value === 'students') {
    return `Расписание группы ${secondValue.value}`
  }

  if (scheduleType.value === 'teachers') {
    return `Расписание преподавателя ${secondValue.value}`
  }

  if (scheduleType.value === 'auditories') {
    return `Расписание аудитории ${secondValue.value}`
  }

  if (scheduleType.value === 'consults') {
    const startYear = getConsultationAcademicYearStart()
    return `Консультации кафедры ${departmentName.value} · ${startYear}/${String(startYear + 1).slice(-2)} (сентябрь — июль)`
  }

  return 'Расписание'
})

const openModal = (lesson: CellLesson) => {
  selectedLesson.value = lesson
}

const closeModal = () => {
  selectedLesson.value = null
}

const openEditModal = () => {
  if (!selectedLesson.value) return

  isCreatingLesson.value = false
  editingLesson.value = selectedLesson.value

  editForm.value = {
    name: editingLesson.value.subject,
    type: editingLesson.value.type,
    group: editingLesson.value.groups.join(', '),
    teacher: editingLesson.value.teacher,
    building: '',
    room: editingLesson.value.room,
    time: `${editingLesson.value.startTime} - ${editingLesson.value.endTime}`,
    additional: '',
  }

  // Закрываем первое окно
  selectedLesson.value = null

  // Открываем второе
  isEditModalVisible.value = true
}

const closeEditModal = () => {
  isEditModalVisible.value = false
  editingLesson.value = null
  isCreatingLesson.value = false
}

const resolveScheduleGroupName = (): string => {
  if (scheduleType.value === 'students') {
    return secondValue.value
  }

  if (editForm.value.group.trim()) {
    return editForm.value.group.split(',')[0]?.trim() ?? ''
  }

  return editingLesson.value?.groups[0] ?? editingLesson.value?.group ?? ''
}

const saveEdit = async () => {
  if (scheduleType.value !== 'consults') {
    const groupName = resolveScheduleGroupName()
    const timeParts = editForm.value.time.split('-').map((part) => part.trim())
    const startTime = timeParts[0] ?? ''
    const endTime = timeParts[1] ?? ''
    const weekStart = getWeekStartFromLabel(currentWeekKey.value)
    const dayOfWeek = emptyCellData.value
      ? DAY_TO_NUMBER[emptyCellData.value.day]
      : editingLesson.value
        ? DAY_TO_NUMBER[editingLesson.value.day]
        : undefined

    if (!groupName || !weekStart || !dayOfWeek || !startTime || !endTime || !editForm.value.name.trim()) {
      alert('Заполните все обязательные поля')
      return
    }

    const payload = {
      subject: editForm.value.name.trim(),
      lessonType: editForm.value.type.trim(),
      teacherName: editForm.value.teacher.trim() || undefined,
      room: editForm.value.room.trim() || undefined,
      dayOfWeek,
      startTime,
      endTime,
      weekStart,
      comment: editForm.value.additional.trim() || undefined,
    }

    try {
      if (isCreatingLesson.value) {
        await createScheduleItem({
          groupName,
          ...payload,
        })
      } else if (editingLesson.value) {
        await updateScheduleItem(editingLesson.value.id, payload)
      }

      await loadSchedule()
      closeEditModal()
    } catch {
      alert('Не удалось сохранить занятие')
    }

    return
  }

  const departmentId = Number(firstValue.value)
  if (!departmentId) {
    alert('Не удалось определить кафедру')
    return
  }

  const timeParts = editForm.value.time.split('-').map((part) => part.trim())
  const startTime = timeParts[0] ?? ''
  const endTime = timeParts[1] ?? ''
  const weekStart = getWeekStartFromLabel(currentWeekKey.value)
  const dayOfWeek = emptyCellData.value
    ? DAY_TO_NUMBER[emptyCellData.value.day]
    : editingLesson.value
      ? DAY_TO_NUMBER[editingLesson.value.day]
      : undefined

  if (!weekStart || !dayOfWeek || !startTime || !endTime) {
    alert('Заполните все обязательные поля')
    return
  }

  const consultationType = editForm.value.type.includes('Онлайн')
    ? 'Онлайн-консультация'
    : 'Консультация'

  try {
    if (isCreatingLesson.value) {
      await createConsultation({
        departmentId,
        subject: editForm.value.name.trim(),
        consultationType,
        dayOfWeek,
        startTime,
        endTime,
        weekStart,
        room: editForm.value.room.trim() || undefined,
      })
    } else if (editingLesson.value) {
      await updateConsultation(editingLesson.value.id, {
        subject: editForm.value.name.trim(),
        consultationType,
        dayOfWeek,
        startTime,
        endTime,
        weekStart,
        room: editForm.value.room.trim() || undefined,
      })
    }

    await loadSchedule()
    closeEditModal()
  } catch {
    alert('Не удалось сохранить консультацию')
  }
}

const showContextMenu = (event: MouseEvent, lesson: CellLesson) => {
  if (!canEdit.value) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  emptyCellData.value = null

  menuX.value = event.clientX
  menuY.value = event.clientY

  contextLesson.value = lesson
  isMenuVisible.value = true
}

const closeMenu = (event?: MouseEvent) => {
  const target = event?.target as HTMLElement

  if (target?.closest('.context-menu')) {
    return
  }

  isMenuVisible.value = false
}

const openLessonMenu = (lesson: CellLesson) => {
  if (!canEdit.value) {
    return
  }

  contextLesson.value = lesson
  emptyCellData.value = null
  isMenuVisible.value = true
}

const handleLessonTap = (lesson: CellLesson, event: MouseEvent) => {
  if (isMobileLayout.value && canEdit.value) {
    event.stopPropagation()
    openLessonMenu(lesson)
    return
  }

  openModal(lesson)
}

const handleCellTap = (
    day: string,
    time: string,
    lessons: CellLesson[],
    event: MouseEvent
) => {
  if (!isMobileLayout.value || lessons.length > 0) {
    return
  }

  if (!canEdit.value) {
    return
  }

  event.stopPropagation()
  showEmptyContextMenu(event, day, time)
}


const viewLesson = () => {
  if (!contextLesson.value) return

  selectedLesson.value = contextLesson.value

  closeMenu()
}

const EditLesson = () => {
  if (!contextLesson.value) return

  // Закрываем контекстное меню
  closeMenu()

  // Устанавливаем выбранное занятие из контекстного меню
  selectedLesson.value = contextLesson.value

  // Открываем модальное окно редактирования
  openEditModal()
}

const cancelLesson = async () => {
  if (!contextLesson.value) return

  const isConfirmed = window.confirm(
      scheduleType.value === 'consults'
        ? `Удалить консультацию "${contextLesson.value.subject}"?`
        : `Отменить пару "${contextLesson.value.subject}"?`,
  )

  if (!isConfirmed) {
    return
  }

  if (scheduleType.value === 'consults') {
    try {
      await deleteConsultation(contextLesson.value.id)
      await loadSchedule()
    } catch {
      alert('Не удалось удалить консультацию')
    }
  } else {
    try {
      await disableScheduleItem(contextLesson.value.id)
      await loadSchedule()
    } catch {
      alert('Не удалось отменить пару')
    }
  }

  closeMenu()
}

const emptyCellData = ref<{
  day: string
  time: string
} | null>(null)

const showEmptyContextMenu = (
    event: MouseEvent,
    day: string,
    time: string
) => {
  if (!canEdit.value) {
    return
  }

  event.preventDefault()

  menuX.value = event.clientX
  menuY.value = event.clientY

  // Сбрасываем выбранную пару
  contextLesson.value = null

  // Сохраняем данные пустого слота
  emptyCellData.value = {
    day,
    time,
  }

  isMenuVisible.value = true
}

const commandAddLesson = () => {
  if (!emptyCellData.value) return

  isCreatingLesson.value = true
  editForm.value = {
    name: '',
    type: scheduleType.value === 'consults' ? 'Консультация' : '',
    group: '',
    teacher: '',
    building: '',
    room: '',
    time: `${emptyCellData.value.time} - ${PAIR_END_TIMES[emptyCellData.value.time] ?? ''}`.trim(),
    additional: '',
  }

  isEditModalVisible.value = true

  closeMenu()
}

const editModalTitle = computed(() =>
    isCreatingLesson.value ? 'Добавить пару' : 'Редактирование занятия'
)

const contextMenuStyle = computed(() =>
    isMobileLayout.value
        ? {}
        : {
          top: `${menuY.value}px`,
          left: `${menuX.value}px`,
        }
)

const backToSelection = async () => {
  await router.push({
    name: 'schedule-selection',
    params: { type: scheduleType.value },
  })
}

const prevWeek = () => {
  if (currentWeekIndex.value > 0) {
    currentWeekIndex.value--
  }
}

const nextWeek = () => {
  if (currentWeekIndex.value < weekKeys.value.length - 1) {
    currentWeekIndex.value++
  }
}

const getLessons = (day: string, time: string) => {
  const weekData = weeklySchedules.value[currentWeekKey.value]

  if (!weekData) {
    return []
  }

  const lessons = weekData.filter((item) => item.day === day && item.startTime === time)

  if (scheduleType.value === 'consults') {
    return lessons.map((lesson) => ({
      ...lesson,
      groups: lesson.teacher ? [lesson.teacher] : [],
    }))
  }

  if (scheduleType.value !== 'teachers') {
    return lessons.map((lesson) => ({
      ...lesson,
      groups: [lesson.group],
    }))
  }

  const groupedLessons = new Map<string, CellLesson>()

  lessons.forEach((lesson) => {
    const key = [
      lesson.day,
      lesson.startTime,
      lesson.endTime,
      lesson.subject,
      lesson.teacher,
      lesson.type,
      lesson.room,
    ].join('|')

    const existingLesson = groupedLessons.get(key)

    if (existingLesson) {
      if (!existingLesson.groups.includes(lesson.group)) {
        existingLesson.groups.push(lesson.group)
        existingLesson.group = existingLesson.groups.join(', ')
      }

      return
    }

    groupedLessons.set(key, {
      ...lesson,
      groups: [lesson.group],
    })
  })

  return Array.from(groupedLessons.values())
}

const getLessonClass = (type: string) => {
  const lessonType = type.toLowerCase()

  if (scheduleType.value === 'consults') {
    if (lessonType.includes('онлайн')) return 'consult-online'
    return 'consultation'
  }

  if (lessonType.includes('лек')) return 'lecture'
  if (lessonType.includes('практ')) return 'practice'
  if (lessonType.includes('лаб')) return 'lab'
  if (lessonType.includes('зач') || lessonType.includes('защ')) return 'exam'

  return ''
}

const getTypeName = (type: string) => {
  const lessonType = type.toLowerCase()

  if (scheduleType.value === 'consults') {
    if (lessonType.includes('онлайн')) return 'Онлайн-консультация'
    return 'Консультация'
  }

  if (lessonType.includes('лек')) return 'Лекция'
  if (lessonType.includes('практ')) return 'Практика'
  if (lessonType.includes('лаб')) return 'Лабораторная'
  if (lessonType.includes('зач')) return 'Зачёт'
  if (lessonType.includes('защ')) return 'Защита'

  return type
}

const getLessonMeta = (lesson: CellLesson) => {
  const subgroupLabel = lesson.subgroup ? `п/гр ${lesson.subgroup} • ` : ''

  if (scheduleType.value === 'consults') {
    return `${lesson.teacher} • ${lesson.room}`
  }

  if (scheduleType.value === 'students') {
    return `${subgroupLabel}${lesson.teacher} • ${lesson.room}`
  }

  if (scheduleType.value === 'auditories') {
    return `${subgroupLabel}${lesson.groups.join(', ')} • ${lesson.teacher}`
  }

  return `${subgroupLabel}${lesson.groups.join(', ')} • ${lesson.room}`
}

const currentWeekLessons = computed(() => weeklySchedules.value[currentWeekKey.value] ?? [])

const parallelPairWarnings = computed(() => {
  const slots = new Map<string, { day: string; time: string; subjects: string[] }>()

  for (const lesson of currentWeekLessons.value) {
    if (!lesson.isSameCellParallel) {
      continue
    }

    const key = `${lesson.day}|${lesson.startTime}`
    const existing = slots.get(key)

    if (existing) {
      if (!existing.subjects.includes(lesson.subject)) {
        existing.subjects.push(lesson.subject)
      }
      continue
    }

    slots.set(key, {
      day: lesson.day,
      time: lesson.startTime,
      subjects: [lesson.subject],
    })
  }

  return Array.from(slots.values()).filter((slot) => slot.subjects.length > 1)
})

const hasParallelPairsInWeek = computed(() => parallelPairWarnings.value.length > 0)

const isParallelCell = (day: string, time: string) => {
  const lessons = getLessons(day, time)

  return lessons.some((lesson) => lesson.isSameCellParallel) && lessons.length > 1
}

const isConsultationSchedule = computed(() => scheduleType.value === 'consults')

// Проверка, может ли текущий пользователь редактировать
const canEdit = computed(() => {
  if (scheduleType.value === 'consults') {
    if (authStore.currentUser?.role !== 'teacher') {
      return false
    }

    return authStore.currentUser.departmentId === Number(firstValue.value)
  }

  return authStore.currentUser?.role === 'education_department'
})

const syncMobileLayout = (queryList: MediaQueryList | MediaQueryListEvent) => {
  isMobileLayout.value = queryList.matches
}

onMounted(() => {
  document.addEventListener('click', closeMenu as EventListener)

  mobileMediaQuery = window.matchMedia('(max-width: 640px)')
  syncMobileLayout(mobileMediaQuery)
  mobileMediaQuery.addEventListener('change', syncMobileLayout)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
  mobileMediaQuery?.removeEventListener('change', syncMobileLayout)
})
</script>

<template>
  <PageFrame>
    <section class="schedule-page">
      <div class="page-head">
        <h1 class="title">{{ pageTitle }}</h1>
      </div>

      <div v-if="isLoadingSchedule && !isConsultationSchedule" class="empty-state">
        <h2>Загрузка расписания...</h2>
      </div>

      <div v-else-if="scheduleLoadError" class="empty-state">
        <h2>{{ scheduleLoadError }}</h2>
        <p>Попробуйте обновить страницу или вернуться назад и выбрать группу снова.</p>
      </div>

      <template v-else-if="!isEmptySchedule">
        <div class="week-nav">
          <span class="week-label">Неделя: {{ weekLabel }}</span>

          <div class="week-buttons">
            <button type="button" @click="prevWeek" :disabled="currentWeekIndex === 0">
              ← Предыдущая неделя
            </button>

            <button
                type="button"
                @click="nextWeek"
                :disabled="currentWeekIndex >= weekKeys.length - 1"
            >
              Следующая неделя →
            </button>
          </div>
        </div>

        <div v-if="hasParallelPairsInWeek" class="parallel-warning">
          <strong>Внимание:</strong> в эту неделю в одно время стоят две разные дисциплины (параллельные пары).
          <ul>
            <li v-for="(slot, index) in parallelPairWarnings" :key="index">
              {{ slot.day }}, {{ slot.time }} — {{ slot.subjects.join(' / ') }}
            </li>
          </ul>
        </div>

        <div class="legend">
          <template v-if="isConsultationSchedule">
            <div class="legend-item">
              <span class="box consultation"></span>
              Консультация
            </div>

            <div class="legend-item">
              <span class="box consult-online"></span>
              Онлайн-консультация
            </div>
          </template>

          <template v-else>
            <div class="legend-item">
              <span class="box lecture"></span>
              Лекция
            </div>

            <div class="legend-item">
              <span class="box practice"></span>
              Практика
            </div>

            <div class="legend-item">
              <span class="box lab"></span>
              Лабораторная
            </div>

            <div class="legend-item">
              <span class="box exam"></span>
              Зачёт
            </div>
          </template>
        </div>

        <div class="table">
          <div class="header">
            <div></div>

            <div v-for="day in days" :key="day">
              {{ day }}
            </div>
          </div>

          <div v-for="time in times" :key="time" class="row">
            <div class="time">{{ time }}</div>

            <div
                v-for="day in days"
                :key="day"
                class="cell"
                :class="{ 'cell--parallel': isParallelCell(day, time) }"
                @click.stop="handleCellTap(day, time, getLessons(day, time), $event)"
                @contextmenu.prevent="showEmptyContextMenu($event, day, time)"
            >
              <div
                  v-for="lesson in getLessons(day, time)"
                  :key="`${lesson.group}-${lesson.id}`"
                  class="lesson"
                  :class="getLessonClass(lesson.type)"
                  @click.stop="handleLessonTap(lesson, $event)"
                  @contextmenu.prevent.stop="showContextMenu($event, lesson)"
              >
                <div class="subject">{{ lesson.subject }}</div>
                <div class="meta">{{ getLessonMeta(lesson) }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="empty-state">
        <h2>По выбранным параметрам расписание пока не найдено</h2>
        <p v-if="scheduleType === 'students'">
          Для группы {{ secondValue }} расписание ещё не загружено учебным отделом.
        </p>
        <p v-else-if="scheduleType === 'teachers'">
          Для преподавателя {{ secondValue }} расписание ещё не найдено в загруженных файлах.
        </p>
        <p v-else-if="scheduleType === 'auditories'">
          Для аудитории {{ secondValue }} расписание ещё не найдено в загруженных файлах.
        </p>
        <p v-else>
          Попробуйте вернуться назад и выбрать другие параметры.
        </p>
      </div>

      <!-- Первое модальное окно (просмотр) -->
      <div v-if="selectedLesson" class="modal-overlay" @click="closeModal">
        <div class="modal" @click.stop>
          <div class="modal-header-actions">
            <button
                v-if="canEdit"
                class="edit-btn"
                type="button"
                @click="openEditModal"
                title="Редактировать"
            >
              <img :src="editIcon" alt="Редактировать" />
            </button>

            <!-- Кнопка закрытия -->
            <button class="close-btn-main" type="button" @click="closeModal">✕</button>
          </div>

          <h2 class="modal-title">{{ selectedLesson.subject }}</h2>

          <div v-if="selectedLesson.isSameCellParallel" class="parallel-notice">
            В это время идёт параллельная пара — в ячейке расписания показаны две разные дисциплины.
          </div>

          <div class="modal-body">
            <div class="type-badge" :class="getLessonClass(selectedLesson.type)">
              {{ getTypeName(selectedLesson.type) }}
            </div>

            <div class="modal-info">
              <p v-if="!isConsultationSchedule">
                <strong>Группа:</strong>
                {{ selectedLesson.groups.join(', ') }}
              </p>

              <p>
                <strong>Преподаватель:</strong>
                {{ selectedLesson.teacher }}
              </p>

              <p v-if="selectedLesson.subgroup && !isConsultationSchedule">
                <strong>Подгруппа:</strong>
                {{ selectedLesson.subgroup }}
              </p>

              <p>
                <strong>Аудитория:</strong>
                {{ selectedLesson.room }}
              </p>

              <p>
                <strong>Время:</strong>
                {{ selectedLesson.startTime }} - {{ selectedLesson.endTime }}
              </p>
            </div>
          </div>
        </div>
      </div>


      <div v-if="isEditModalVisible" class="modal-overlay" @click="closeEditModal">
        <div class="modal edit-modal" @click.stop>
          <button class="close-btn" type="button" @click="closeEditModal">✕</button>

          <h2 class="modal-title">{{ editModalTitle }}</h2>

          <div class="modal-body">
            <div class="edit-form">
              <div class="form-group">
                <label for="edit-name" class="form-label">Название</label>
                <input
                    id="edit-name"
                    v-model="editForm.name"
                    type="text"
                    class="form-input"
                    placeholder="Название"
                />
              </div>

              <div class="form-group">
                <label for="edit-type" class="form-label">Тип занятия</label>
                <select id="edit-type" v-model="editForm.type" class="form-select">
                  <option value="" disabled>Выберите</option>
                  <template v-if="isConsultationSchedule">
                    <option value="Консультация">Консультация</option>
                    <option value="Онлайн-консультация">Онлайн-консультация</option>
                  </template>
                  <template v-else>
                    <option value="Лекция">Лекция</option>
                    <option value="Практика">Практика</option>
                    <option value="Лабораторная">Лабораторная</option>
                    <option value="Консультация">Консультация</option>
                    <option value="Зачёт">Зачёт</option>
                  </template>
                </select>
              </div>

              <div v-if="!isConsultationSchedule" class="form-group">
                <label for="edit-group" class="form-label">Группа</label>
                <input
                    id="edit-group"
                    v-model="editForm.group"
                    type="text"
                    class="form-input"
                    placeholder="Выберите"
                />
              </div>

              <div v-if="!isConsultationSchedule" class="form-group">
                <label for="edit-teacher" class="form-label">Преподаватель</label>
                <input
                    id="edit-teacher"
                    v-model="editForm.teacher"
                    type="text"
                    class="form-input"
                    placeholder="Выберите"
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="edit-building" class="form-label">Корпус</label>
                  <select id="edit-building" v-model="editForm.building" class="form-select">
                    <option value="" disabled>Выберите</option>
                    <option value="1">Корпус 1</option>
                    <option value="2">Корпус 2</option>
                    <option value="3">Корпус 3</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="edit-room" class="form-label">Аудитория</label>
                  <select id="edit-room" v-model="editForm.room" class="form-select">
                    <option value="" disabled>Выберите</option>
                    <option value="101">101</option>
                    <option value="102">102</option>
                    <option value="201">201</option>
                    <option value="312">312</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="edit-time" class="form-label">Время</label>
                <select id="edit-time" v-model="editForm.time" class="form-select">
                  <option value="" disabled>Выберите</option>
                  <option value="08:30 - 10:00">08:30 - 10:00</option>
                  <option value="10:15 - 11:45">10:15 - 11:45</option>
                  <option value="12:00 - 13:30">12:00 - 13:30</option>
                  <option value="14:15 - 15:45">14:15 - 15:45</option>
                  <option value="16:00 - 17:30">16:00 - 17:30</option>
                  <option value="17:40 - 19:05">17:40 - 19:05</option>
                  <option value="19:15 - 20:40">19:15 - 20:40</option>
                </select>
              </div>

              <div class="form-group">
                <label for="edit-additional" class="form-label">Дополнительное</label>
                <input
                    id="edit-additional"
                    v-model="editForm.additional"
                    type="text"
                    class="form-input"
                    placeholder="Выберите"
                />
              </div>
            </div>

            <div class="edit-actions">
              <button type="button" class="btn btn-secondary" @click="closeEditModal">
                Отмена
              </button>
              <button type="button" class="btn btn-primary" @click="saveEdit">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <ul
        v-if="isMenuVisible"
        class="context-menu"
        :style="contextMenuStyle"
    >
      <!-- Если слот пустой -->
      <template v-if="!contextLesson">

        <li v-if="canEdit" @click="commandAddLesson">
          {{ isConsultationSchedule ? 'Добавить консультацию' : 'Добавить пару' }}
        </li>

      </template>

      <!-- Если есть пара -->
      <template v-else>

        <li @click="viewLesson">
          Просмотр
        </li>

        <li v-if="canEdit" @click="EditLesson">
          Внести изменения
        </li>

        <li v-if="canEdit" @click="cancelLesson">
          {{ isConsultationSchedule ? 'Удалить консультацию' : 'Отменить пару' }}
        </li>

      </template>

      <li @click="closeMenu">
        Отмена
      </li>
    </ul>
  </PageFrame>
</template>
