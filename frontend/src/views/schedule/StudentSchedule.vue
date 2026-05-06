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
  '19:15',
]

const weekKeys = Object.keys(weeklySchedules)
const currentWeekIndex = ref(0)

/* 🔥 безопасный парсинг недели */
const parseWeekRange = (key: string) => {
  const parts = key.split(' - ')

  const startStr = parts[0]
  const endStr = parts[1]

  if (!startStr || !endStr) {
    return {
      start: new Date(0),
      end: new Date(0),
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
      end: new Date(0),
    }
  }

  const year = new Date().getFullYear()

  return {
    start: new Date(year, Number(sm) - 1, Number(sd)),
    end: new Date(year, Number(em) - 1, Number(ed)),
  }
}

/* 🔥 определение текущей недели */
const today = new Date()

const initialIndex = weekKeys.findIndex((key) => {
  const { start, end } = parseWeekRange(key)
  return today >= start && today <= end
})

if (initialIndex !== -1) {
  currentWeekIndex.value = initialIndex
}

/* текущая неделя */
const currentWeekKey = computed(() => weekKeys[currentWeekIndex.value])
const weekLabel = computed(() => currentWeekKey.value)

/* навигация */
const prevWeek = () => {
  if (currentWeekIndex.value > 0) currentWeekIndex.value--
}

const nextWeek = () => {
  if (currentWeekIndex.value < weekKeys.length - 1) currentWeekIndex.value++
}

/* занятия */
const getLessons = (day: string, time: string) => {
  const weekData = weeklySchedules[currentWeekKey.value]
  if (!weekData) return []

  return weekData.filter((item: ScheduleItem) =>
      item.day === day && item.startTime === time
  )
}

/* тип занятия */
const getLessonClass = (type: string) => {
  const t = type.toLowerCase()

  if (t.includes('лек')) return 'lecture'
  if (t.includes('практ')) return 'practice'
  if (t.includes('лаб')) return 'lab'
  if (t.includes('зач') || t.includes('защ')) return 'exam'

  return ''
}
</script>

<template>
  <PageFrame>
    <section class="schedule-page">

      <!-- заголовок -->
      <h1 class="title">Расписание группы ПЕ-316</h1>

      <!-- навигация недель -->
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

      <!-- легенда -->
      <div class="legend">
        <div class="legend-item">
          <span class="box lecture"></span> Лекция
        </div>

        <div class="legend-item">
          <span class="box practice"></span> Практика
        </div>

        <div class="legend-item">
          <span class="box lab"></span> Лабораторная
        </div>

        <div class="legend-item">
          <span class="box exam"></span> Зачёт
        </div>
      </div>

      <!-- таблица -->
      <div class="table">
        <div class="header">
          <div></div>
          <div v-for="day in days" :key="day">
            {{ day }}
          </div>
        </div>

        <div class="row" v-for="time in times" :key="time">
          <div class="time">{{ time }}</div>

          <div v-for="day in days" :key="day" class="cell">
            <div
                v-for="lesson in getLessons(day, time)"
                :key="lesson.id"
                class="lesson"
                :class="getLessonClass(lesson.type)"
            >
              <div class="subject">{{ lesson.subject }}</div>
              <div class="meta">{{ lesson.teacher }} • {{ lesson.room }}</div>
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
  background: #fff;
}

/* заголовок */
.title {
  text-align: center;
  font-size: 30px;
  font-weight: 600;
  margin-bottom: 24px;
}

/* навигация */
.week-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.week-label {
  font-weight: 600;
  font-size: 16px;
  padding: 6px 14px;
  border-radius: 10px;
  background: #f5f5f5;
}

/* кнопки */
.week-buttons {
  display: flex;
  gap: 16px;
}

.week-buttons button {
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 10px 18px;
  border: 0;
  border-radius: 13px;

  background: #4ea3d7;
  color: #eef6fb;

  font-size: 14px;
  font-weight: 500;

  cursor: pointer;

  transition: 0.2s ease;
  box-shadow: 0 6px 14px rgba(78, 163, 215, 0.25);
}

.week-buttons button:hover {
  background: #3f93c7;
  transform: translateY(-1px);
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
  font-size: 14px;
}

.box {
  width: 14px;
  height: 14px;
  border-radius: 4px;
}

.lecture { background: #c8e6c9; }
.practice { background: #b3e5fc; }
.lab { background: #fff9c4; }
.exam { background: #f8bbd0; }

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
  text-align: center;
  font-weight: 600;
  background: #eee;
  padding: 8px;
}

.cell {
  min-height: 80px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  padding: 4px;
}

.time {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee;
}

.lesson {
  padding: 6px;
  border-radius: 6px;
  font-size: 12px;
  margin-bottom: 4px;
}

.subject {
  font-weight: 600;
}

.meta {
  font-size: 11px;
  opacity: 0.7;
}
</style>