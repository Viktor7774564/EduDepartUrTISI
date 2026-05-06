<script setup lang="ts">
import { computed, ref } from 'vue'
import PageFrame from '@/components/PageFrame.vue'
import { weeklySchedules } from '@/mocks/schedule'
import type { ScheduleItem } from '@/mocks/schedule'

const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ']

const times = [
  '08:30',
  '10:15',
  '12:00',
  '14:15',
  '16:00',
  '17:40',
  '19:15'
]

const weekKeys = Object.keys(weeklySchedules)
const currentWeekIndex = ref(0)

const selectedLesson = ref<ScheduleItem | null>(null)

const openModal = (lesson: ScheduleItem) => {
  selectedLesson.value = lesson
}

const closeModal = () => {
  selectedLesson.value = null
}

/* определение текущей недели */
const parseWeekRange = (key: string) => {
  const parts = key.split(' - ')

  const startStr = parts[0]
  const endStr = parts[1]

  if (!startStr || !endStr) {
    return {
      start: new Date(0),
      end: new Date(0)
    }
  }

  const startParts = startStr.split('.')
  const endParts = endStr.split('.')

  const sd = startParts[0]
  const sm = startParts[1]
  const ed = endParts[0]
  const em = endParts[1]

  if (!sd || !sm || !ed || !em) {
    return {
      start: new Date(0),
      end: new Date(0)
    }
  }

  const year = new Date().getFullYear()

  return {
    start: new Date(year, Number(sm) - 1, Number(sd)),
    end: new Date(year, Number(em) - 1, Number(ed))
  }
}

const today = new Date()

const initialIndex = weekKeys.findIndex((key) => {
  const { start, end } = parseWeekRange(key)
  return today >= start && today <= end
})

if (initialIndex !== -1) {
  currentWeekIndex.value = initialIndex
}

const currentWeekKey = computed(() => weekKeys[currentWeekIndex.value])
const weekLabel = computed(() => currentWeekKey.value)

const prevWeek = () => {
  if (currentWeekIndex.value > 0) {
    currentWeekIndex.value--
  }
}

const nextWeek = () => {
  if (currentWeekIndex.value < weekKeys.length - 1) {
    currentWeekIndex.value++
  }
}

const getLessons = (day: string, time: string) => {
  const weekData = weeklySchedules[currentWeekKey.value]

  if (!weekData) return []

  return weekData.filter(
      (item: ScheduleItem) =>
          item.day === day &&
          item.startTime === time
  )
}

const getLessonClass = (type: string) => {
  const t = type.toLowerCase()

  if (t.includes('лек')) return 'lecture'
  if (t.includes('практ')) return 'practice'
  if (t.includes('лаб')) return 'lab'
  if (t.includes('зач') || t.includes('защ')) return 'exam'

  return ''
}

const getTypeName = (type: string) => {
  const t = type.toLowerCase()

  if (t.includes('лек')) return 'Лекция'
  if (t.includes('практ')) return 'Практика'
  if (t.includes('лаб')) return 'Лабораторная'
  if (t.includes('зач')) return 'Зачёт'
  if (t.includes('защ')) return 'Защита'

  return type
}
</script>

<template>
  <PageFrame>
    <section class="schedule-page">

      <h1 class="title">
        Расписание группы ПЕ-316
      </h1>

      <div class="week-nav">
        <span class="week-label">
          Неделя: {{ weekLabel }}
        </span>

        <div class="week-buttons">
          <button @click="prevWeek">
            ← Предыдущая неделя
          </button>

          <button @click="nextWeek">
            Следующая неделя →
          </button>
        </div>
      </div>

      <div class="legend">
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
      </div>

      <div class="table">

        <div class="header">
          <div></div>

          <div
              v-for="day in days"
              :key="day"
          >
            {{ day }}
          </div>
        </div>

        <div
            class="row"
            v-for="time in times"
            :key="time"
        >
          <div class="time">
            {{ time }}
          </div>

          <div
              v-for="day in days"
              :key="day"
              class="cell"
          >
            <div
                v-for="lesson in getLessons(day, time)"
                :key="lesson.id"
                class="lesson"
                :class="getLessonClass(lesson.type)"
                @click="openModal(lesson)"
            >
              <div class="subject">
                {{ lesson.subject }}
              </div>

              <div class="meta">
                {{ lesson.teacher }} • {{ lesson.room }}
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- модальное окно -->
      <div
          v-if="selectedLesson"
          class="modal-overlay"
          @click="closeModal"
      >
        <div
            class="modal"
            @click.stop
        >
          <button
              class="close-btn"
              @click="closeModal"
          >
            ✕
          </button>

          <h2 class="modal-title">
            {{ selectedLesson.subject }}
          </h2>

          <div class="modal-body">

            <div
                class="type-badge"
                :class="getLessonClass(selectedLesson.type)"
            >
              {{ getTypeName(selectedLesson.type) }}
            </div>

            <div class="modal-info">

              <p>
                <strong>Группа:</strong>
                ПЕ-316
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
  padding: 40px;
  background: #ffffff;
}

/* заголовок */
.title {
  text-align: center;
  font-size: 30px;
  font-weight: 700;
  margin-bottom: 24px;
}

/* неделя */
.week-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.week-label {
  padding: 8px 16px;
  border-radius: 12px;
  background: #f2f2f2;
  font-weight: 600;
}

.week-buttons {
  display: flex;
  gap: 14px;
}

.week-buttons button {
  padding: 10px 18px;
  border: none;
  border-radius: 12px;
  background: #4ea3d7;
  color: white;
  cursor: pointer;
  transition: 0.2s;
}

.week-buttons button:hover {
  background: #3f93c7;
}

/* легенда */
.legend {
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.box {
  width: 14px;
  height: 14px;
  border-radius: 4px;
}

/* таблица */
.table {
  display: grid;
  gap: 6px;
}

.header,
.row {
  display: grid;
  grid-template-columns: 120px repeat(6, 1fr);
  gap: 6px;
}

.header div {
  background: #eeeeee;
  padding: 8px;
  text-align: center;
  font-weight: 700;
}

.time {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #eeeeee;
}

.cell {
  min-height: 82px;
  padding: 4px;
  border: 1px solid #dddddd;
  background: #f8f8f8;
}

.lesson {
  padding: 8px;
  border-radius: 8px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: 0.2s;
}

.lesson:hover {
  transform: scale(1.02);
}

.subject {
  font-weight: 700;
  font-size: 12px;
}

.meta {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}

/* цвета пар */
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

/* модальное окно */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

/* ЗАМЕНИ ТОЛЬКО стили модального окна */

.modal {
  width: 876px;          /* было 1460 */
  max-width: 96%;
  min-height: 468px;     /* было 780 */

  background: #f4f4f4;
  border: 1px solid #999999;
  border-radius: 10px;

  position: relative;
  overflow: hidden;

  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
}

.modal-title {
  margin: 0;
  padding: 17px 22px;    /* было 28 / 36 */

  font-size: 25px;       /* было 42 */
  font-style: italic;
  font-weight: 400;

  border-bottom: 1px solid #999999;
}

.modal-body {
  padding: 29px 22px;    /* было 48 / 36 */
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 17px;

  width: 34px;
  height: 34px;

  border: none;
  background: transparent;

  font-size: 32px;
  color: red;
  cursor: pointer;
}

.type-badge {
  display: inline-block;
  min-width: 174px;

  padding: 10px 14px;
  margin-bottom: 28px;

  border-radius: 8px;
  font-size: 16px;
  font-weight: 400;
}

.modal-info p {
  margin: 0 0 20px;
  font-size: 16px;
  line-height: 1.35;
}

.modal-info strong {
  display: block;
  font-weight: 400;
  font-style: italic;
  margin-bottom: 5px;
}

/* Это для типа */
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

.modal-info p {
  margin: 0 0 34px;
  font-size: 18px;
  line-height: 1.35;
}

.modal-info strong {
  display: block;
  font-weight: 400;
  font-style: italic;
  margin-bottom: 8px;
}
</style>