<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageFrame from '@/components/PageFrame.vue'
import {
  getConsultationSchedulesForTeacher,
  getWeeklySchedulesForSelection,
  type DisplayScheduleItem,
  type ScheduleKind,
} from './scheduleOptions'

const route = useRoute()
const router = useRouter()

const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ']
const times = ['08:30', '10:15', '12:00', '14:15', '16:00', '17:40', '19:15']

const scheduleType = computed(() => route.params.type as ScheduleKind)
const secondValue = computed(() => String(route.query.second ?? ''))

type CellLesson = DisplayScheduleItem & {
  groups: string[]
}

const selectedLesson = ref<CellLesson | null>(null)
const currentWeekIndex = ref(0)

const weeklySchedules = computed(() => {
  if (!secondValue.value) {
    return {}
  }

  if (scheduleType.value === 'consults') {
    return getConsultationSchedulesForTeacher(secondValue.value)
  }

  return getWeeklySchedulesForSelection(scheduleType.value, secondValue.value)
})

const weekKeys = computed(() => Object.keys(weeklySchedules.value))

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
  const initialIndex = weekKeys.value.findIndex((key) => {
    const { start, end } = parseWeekRange(key)
    return today >= start && today <= end
  })

  currentWeekIndex.value = initialIndex !== -1 ? initialIndex : 0
}

watch(weekKeys, syncWeekIndex, { immediate: true })

const currentWeekKey = computed(() => weekKeys.value[currentWeekIndex.value] ?? '')
const weekLabel = computed(() => currentWeekKey.value)
const isEmptySchedule = computed(() => weekKeys.value.length === 0)

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

  return `Консультации преподавателя ${secondValue.value}`
})

const openModal = (lesson: CellLesson) => {
  selectedLesson.value = lesson
}

const closeModal = () => {
  selectedLesson.value = null
}

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

  if (scheduleType.value !== 'teachers' && scheduleType.value !== 'consults') {
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
  if (scheduleType.value === 'students') {
    return `${lesson.teacher} • ${lesson.room}`
  }

  if (scheduleType.value === 'auditories') {
    return `${lesson.groups.join(', ')} • ${lesson.teacher}`
  }

  return `${lesson.groups.join(', ')} • ${lesson.room}`
}

const isConsultationSchedule = computed(() => scheduleType.value === 'consults')
</script>

<template>
  <PageFrame>
    <section class="schedule-page">
      <div class="page-head">
        <h1 class="title">{{ pageTitle }}</h1>
      </div>

      <template v-if="!isEmptySchedule">
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

            <div v-for="day in days" :key="day" class="cell">
              <div
                v-for="lesson in getLessons(day, time)"
                :key="`${lesson.group}-${lesson.id}`"
                class="lesson"
                :class="getLessonClass(lesson.type)"
                @click="openModal(lesson)"
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
        <p>Попробуйте вернуться назад и выбрать другой факультет, преподавателя или аудиторию.</p>
      </div>

      <div v-if="selectedLesson" class="modal-overlay" @click="closeModal">
        <div class="modal" @click.stop>
          <button class="close-btn" type="button" @click="closeModal">✕</button>

          <h2 class="modal-title">{{ selectedLesson.subject }}</h2>

          <div class="modal-body">
            <div class="type-badge" :class="getLessonClass(selectedLesson.type)">
              {{ getTypeName(selectedLesson.type) }}
            </div>

            <div class="modal-info">
              <p>
                <strong>Группа:</strong>
                {{ selectedLesson.groups.join(', ') }}
              </p>

              <p>
                <strong>Преподаватель:</strong>
                {{ selectedLesson.teacher }}
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
    </section>
  </PageFrame>
</template>

<style scoped>
.schedule-page {
  padding: 36px 24px 56px;
}

.page-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 1460px;
  margin: 0 auto 26px;
  text-align: center;
}

.title {
  margin: 0;
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 800;
  color: #101215;
}

.week-nav {
  max-width: 1460px;
  margin: 0 auto 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.week-label {
  padding: 10px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #d7e0e9;
  font-weight: 700;
}

.week-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.week-buttons button {
  min-height: 44px;
  padding: 0 16px;
  border: none;
  border-radius: 12px;
  background: #4ea3d7;
  color: white;
  cursor: pointer;
  transition: 0.2s;
}

.week-buttons button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.week-buttons button:hover:not(:disabled) {
  background: #3f93c7;
}

.legend {
  max-width: 1460px;
  margin: 0 auto 24px;
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #24313f;
}

.box {
  width: 14px;
  height: 14px;
  border-radius: 4px;
}

.table {
  max-width: 1460px;
  margin: 0 auto;
  display: grid;
  gap: 6px;
}

.header,
.row {
  display: grid;
  grid-template-columns: 120px repeat(6, minmax(130px, 1fr));
  gap: 6px;
}

.header div {
  background: #dfe7ef;
  padding: 10px;
  text-align: center;
  font-weight: 800;
  color: #18212a;
}

.time {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #dfe7ef;
  color: #18212a;
  font-weight: 700;
}

.cell {
  min-height: 92px;
  padding: 4px;
  border: 1px solid #d7dee6;
  background: rgba(255, 255, 255, 0.78);
}

.lesson {
  padding: 8px;
  border-radius: 8px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.lesson:hover {
  transform: translateY(-1px);
}

.subject {
  font-weight: 700;
  font-size: 12px;
}

.meta {
  margin-top: 4px;
  font-size: 11px;
  opacity: 0.76;
}

.lecture {
  background: #c8e6c9;
}

.practice {
  background: #b3e5fc;
}

.lab {
  background: #fff9c4;
}

.exam {
  background: #f8bbd0;
}

.consultation {
  background: #9773bd;
  color: #ffffff;
}

.consult-online {
  background: #b39dc7;
  color: #ffffff;
}

.box.consultation {
  background: #9773bd;
}

.box.consult-online {
  background: #b39dc7;
}

.empty-state {
  max-width: 720px;
  margin: 80px auto;
  padding: 36px 28px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 20px 40px rgba(18, 38, 63, 0.08);
  text-align: center;
}

.empty-state h2 {
  margin: 0 0 12px;
  font-size: 28px;
}

.empty-state p {
  margin: 0;
  color: #5f6975;
  line-height: 1.55;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal {
  position: relative;
  width: 876px;
  max-width: 96%;
  min-height: 468px;
  overflow: hidden;
  border: 1px solid #999999;
  border-radius: 10px;
  background: #f4f4f4;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
}

.modal-title {
  margin: 0;
  padding: 17px 22px;
  border-bottom: 1px solid #999999;
  font-size: 25px;
  font-style: italic;
  font-weight: 400;
}

.modal-body {
  padding: 29px 22px;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 17px;
  width: 34px;
  height: 34px;
  border: none;
  background: transparent;
  color: red;
  font-size: 32px;
  cursor: pointer;
}

.type-badge {
  display: inline-block;
  min-width: 174px;
  margin-bottom: 28px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 400;
}

.type-badge.lecture {
  background: rgba(76, 175, 80, 0.14);
  border: 2px solid #4caf50;
  color: #388e3c;
}

.type-badge.practice {
  background: rgba(33, 150, 243, 0.14);
  border: 2px solid #2196f3;
  color: #1976d2;
}

.type-badge.lab {
  background: rgba(255, 193, 7, 0.14);
  border: 2px solid #ffc107;
  color: #f57f17;
}

.type-badge.exam {
  background: rgba(233, 30, 99, 0.14);
  border: 2px solid #e91e63;
  color: #c2185b;
}

.type-badge.consultation {
  background: rgba(151, 115, 189, 0.16);
  border: 2px solid #9773bd;
  color: #6e5092;
}

.type-badge.consult-online {
  background: rgba(179, 157, 199, 0.22);
  border: 2px solid #b39dc7;
  color: #7c6794;
}

.modal-info p {
  margin: 0 0 24px;
  font-size: 18px;
  line-height: 1.35;
}

.modal-info strong {
  display: block;
  margin-bottom: 8px;
  font-weight: 400;
  font-style: italic;
}

@media (max-width: 960px) {
  .schedule-page {
    padding: 22px 12px 40px;
  }

  .week-nav {
    align-items: center;
  }

  .table {
    overflow-x: auto;
  }

  .header,
  .row {
    min-width: 920px;
  }
}
</style>
