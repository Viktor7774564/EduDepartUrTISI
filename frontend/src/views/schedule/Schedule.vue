<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PageFrame from '@/components/PageFrame.vue'
import editIcon from '@/assets/edit.svg'
import {
  getConsultationSchedulesForTeacher,
  getWeeklySchedulesForSelection,
  type DisplayScheduleItem,
  type ScheduleKind,
} from './scheduleOptions'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ']
const times = ['08:30', '10:15', '12:00', '14:15', '16:00', '17:40', '19:15']

const scheduleType = computed(() => route.params.type as ScheduleKind)
const secondValue = computed(() => String(route.query.second ?? ''))

type CellLesson = DisplayScheduleItem & {
  groups: string[]
}

const selectedLesson = ref<CellLesson | null>(null)
const editingLesson = ref<CellLesson | null>(null)
const currentWeekIndex = ref(0)

const isMenuVisible = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const contextLesson = ref<CellLesson | null>(null)

const isEditModalVisible = ref(false)
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

  // Обнуляем время
  today.setHours(0, 0, 0, 0)

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

const openEditModal = () => {
  if (!selectedLesson.value) return

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
}

const saveEdit = () => {
  // Здесь логика сохранения (API call)
  console.log('Saving changes:', editForm.value)
  
  // Закрываем оба модальных окна
  closeEditModal()
  
  // Показываем уведомление (опционально)
  alert('Изменения сохранены!')
}

const showContextMenu = (event: MouseEvent, lesson: CellLesson) => {
  if (authStore.currentUser?.role !== 'education_department') {
    return
  }

  menuX.value = event.clientX
  menuY.value = event.clientY
  contextLesson.value = lesson
  isMenuVisible.value = true
}

const closeMenu = () => {
  isMenuVisible.value = false
}


const commandOne = () => {
  if (!contextLesson.value) return

  alert(`Команда 1: ${contextLesson.value.subject}`)

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

const commandTwo = () => {
  if (!contextLesson.value) return

  alert(`Команда 2: ${contextLesson.value.teacher}`)

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
  if (authStore.currentUser?.role !== 'education_department') {
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

  editForm.value = {
    name: '',
    type: '',
    group: '',
    teacher: '',
    building: '',
    room: '',
    time: emptyCellData.value.time,
    additional: '',
  }

  isEditModalVisible.value = true

  closeMenu()
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

// Проверка, может ли текущий пользователь редактировать
const canEdit = computed(() => authStore.currentUser?.role === 'education_department')

onMounted(() => {
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})
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

            <div
                v-for="day in days"
                :key="day"
                class="cell"
                @contextmenu.prevent="showEmptyContextMenu($event, day, time)"
            >
              <div
                v-for="lesson in getLessons(day, time)"
                :key="`${lesson.group}-${lesson.id}`"
                class="lesson"
                :class="getLessonClass(lesson.type)"
                @click="openModal(lesson)"
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
        <p>Попробуйте вернуться назад и выбрать другой факультет, преподавателя или аудиторию.</p>
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

      
      <div v-if="isEditModalVisible" class="modal-overlay" @click="closeEditModal">
        <div class="modal edit-modal" @click.stop>
          <button class="close-btn" type="button" @click="closeEditModal">✕</button>

          <h2 class="modal-title">Редактирование занятия</h2>

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
                  <option value="Лекция">Лекция</option>
                  <option value="Практика">Практика</option>
                  <option value="Лабораторная">Лабораторная</option>
                  <option value="Консультация">Консультация</option>
                  <option value="Зачёт">Зачёт</option>
                </select>
              </div>

              <div class="form-group">
                <label for="edit-group" class="form-label">Группа</label>
                <input
                  id="edit-group"
                  v-model="editForm.group"
                  type="text"
                  class="form-input"
                  placeholder="Выберите"
                />
              </div>

              <div class="form-group">
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
        :style="{
    top: menuY + 'px',
    left: menuX + 'px'
  }"
    >
      <!-- Если слот пустой -->
      <template v-if="!contextLesson">

        <li @click="commandAddLesson">
          Добавить пару
        </li>

      </template>

      <!-- Если есть пара -->
      <template v-else>

        <li @click="EditLesson">
          Внести изменения
        </li>

        <li @click="commandTwo">
          Отменить пару
        </li>

      </template>

      <li @click="closeMenu">
        Отмена
      </li>
    </ul>
  </PageFrame>
</template>

<style scoped>
.schedule-page {
  @apply pt-[36px] px-[24px] pb-[56px];
}

.page-head {
  @apply flex flex-col items-center gap-[12px] max-w-[1460px] mx-auto mb-[26px] text-center;
}

.title {
  @apply m-0 text-[clamp(28px,4vw,42px)] font-extrabold text-[#101215];
}

.week-nav {
  @apply max-w-[1460px] mx-auto mb-[24px] flex flex-col items-center gap-[14px];
}

.week-label {
  @apply py-[10px] px-[16px] rounded-[12px] bg-[rgba(255,255,255,0.92)] border border-[#d7e0e9] font-bold;
}

.week-buttons {
  @apply flex gap-[12px] flex-wrap justify-center;
}

.week-buttons button {
  @apply min-h-[44px] px-[16px] border-0 rounded-[12px] bg-[#4ea3d7] text-white cursor-pointer transition-colors duration-[200ms];
}

.week-buttons button:disabled {
  @apply opacity-[0.55] cursor-not-allowed;
}

.week-buttons button:hover:not(:disabled) {
  @apply bg-[#3f93c7];
}

.legend {
  @apply max-w-[1460px] mx-auto mb-[24px] flex gap-[18px] flex-wrap justify-center;
}

.legend-item {
  @apply flex items-center gap-[8px] text-[#24313f];
}

.box {
  @apply w-[14px] h-[14px] rounded-[4px];
}

.table {
  @apply max-w-[1460px] mx-auto grid gap-[6px];
}

.header,
.row {
  @apply grid gap-[6px];
  grid-template-columns: 120px repeat(6, minmax(130px, 1fr));
}

.header div {
  @apply bg-[#dfe7ef] p-[10px] text-center font-extrabold text-[#18212a];
}

.time {
  @apply flex justify-center items-center bg-[#dfe7ef] text-[#18212a] font-bold;
}

.cell {
  @apply min-h-[92px] min-w-0 p-[4px] border border-[#d7dee6] bg-[rgba(255,255,255,0.78)];
}

.lesson {
  @apply min-w-0 p-[8px] rounded-[8px] mb-[4px] cursor-pointer transition-transform duration-[200ms] ease-in-out overflow-hidden;
}

.lesson:hover {
  @apply translate-y-[-1px];
}

.subject {
  @apply font-bold text-[12px] break-words whitespace-normal leading-[1.2] [overflow-wrap:anywhere];
}

.meta {
  @apply mt-[4px] text-[11px] opacity-[0.76] break-words whitespace-normal leading-[1.2] [overflow-wrap:anywhere];
}

.lecture {
  @apply bg-[#c8e6c9];
}

.practice {
  @apply bg-[#b3e5fc];
}

.lab {
  @apply bg-[#fff9c4];
}

.exam {
  @apply bg-[#f8bbd0];
}

.consultation {
  @apply bg-[#9773bd] text-white;
}

.consult-online {
  @apply bg-[#b39dc7] text-white;
}

.box.consultation {
  @apply bg-[#9773bd];
}

.box.consult-online {
  @apply bg-[#b39dc7];
}

.empty-state {
  @apply max-w-[720px] mx-auto my-[80px] py-[36px] px-[28px] rounded-[24px] bg-[rgba(255,255,255,0.9)] shadow-[0_20px_40px_rgba(18,38,63,0.08)] text-center;
}

.empty-state h2 {
  @apply m-0 mb-[12px] text-[28px];
}

.empty-state p {
  @apply m-0 text-[#5f6975] leading-[1.55];
}

.modal-overlay {
  @apply fixed inset-0 bg-[rgba(0,0,0,0.18)] flex items-center justify-center z-[999];
}

.modal {
  @apply relative w-[876px] max-w-[96%] min-h-[468px] overflow-hidden border border-[#999999] rounded-[10px] bg-[#f4f4f4] shadow-[0_12px_28px_rgba(0,0,0,0.18)];
}

.edit-modal {
  min-height: auto;
  @apply max-h-[90vh] overflow-y-auto;
}

.modal-header-actions {
  @apply absolute top-[23px] right-[17px] flex items-center gap-[8px] z-[10];
}

/* Кнопка редактирования */
.edit-btn {
  @apply static w-[34px] h-[34px] border border-[#4ea3d7] rounded-[8px] bg-white flex items-center justify-center cursor-pointer transition-all duration-[200ms] p-[4px];
}

.edit-btn:hover {
  @apply bg-[#4ea3d7] border-[#4ea3d7];
}

.edit-btn img {
  @apply w-[30px] h-[30px] opacity-70 transition-opacity duration-[200ms];
}

.edit-btn:hover img {
  @apply opacity-100;
  filter: brightness(0) invert(1);
}

.modal-title {
  @apply m-0 py-[17px] px-[22px] border-b border-[#999999] text-[25px] italic font-normal;
}

.modal-body {
  @apply py-[29px] px-[22px];
}

.close-btn {
  @apply absolute top-[23px] right-[17px] w-[34px] h-[34px] border-0 bg-transparent text-red-600 text-[32px] leading-[1] cursor-pointer flex items-center justify-center;
}

.close-btn-main {
  @apply static w-[34px] h-[34px] border-0 bg-transparent text-red-600 text-[32px] leading-[1] cursor-pointer flex items-center justify-center;
}

.type-badge {
  @apply inline-block min-w-[174px] mb-[28px] py-[10px] px-[14px] rounded-[8px] text-[16px] font-normal;
}

.type-badge.lecture {
  @apply bg-[rgba(76,175,80,0.14)] border-2 border-[#4caf50] text-[#388e3c];
}

.type-badge.practice {
  @apply bg-[rgba(33,150,243,0.14)] border-2 border-[#2196f3] text-[#1976d2];
}

.type-badge.lab {
  @apply bg-[rgba(255,193,7,0.14)] border-2 border-[#ffc107] text-[#f57f17];
}

.type-badge.exam {
  @apply bg-[rgba(233,30,99,0.14)] border-2 border-[#e91e63] text-[#c2185b];
}

.type-badge.consultation {
  @apply bg-[rgba(151,115,189,0.16)] border-2 border-[#9773bd] text-[#6e5092];
}

.type-badge.consult-online {
  @apply bg-[rgba(179,157,199,0.22)] border-2 border-[#b39dc7] text-[#7c6794];
}

.modal-info p {
  @apply m-0 mb-[24px] text-[18px] leading-[1.35];
}

.modal-info strong {
  @apply block mb-[8px] font-normal italic;
}

.edit-form {
  @apply flex flex-col gap-[20px] mb-[24px];
}

.form-row {
  @apply grid gap-[16px];
  grid-template-columns: 1fr 1fr;
}

.form-group {
  @apply flex flex-col gap-[6px];
}

.form-label {
  @apply text-[14px] font-medium text-[#24313f];
}

.form-input,
.form-select {
  @apply py-[10px] px-[14px] border border-[#d7e0e9] rounded-[8px] text-[14px] bg-white transition-all duration-[200ms];
}

.form-input:hover,
.form-select:hover {
  @apply border-[#4ea3d7];
}

.form-input:focus,
.form-select:focus {
  @apply outline-none border-[#4ea3d7] shadow-[0_0_0_3px_rgba(78,163,215,0.1)];
}

.edit-actions {
  @apply flex gap-[16px] justify-end pt-[20px] border-t border-[#d7e0e9];
}

.btn {
  @apply py-[12px] px-[24px] border-0 rounded-[8px] text-[14px] font-semibold cursor-pointer transition-all duration-[200ms];
}

.btn-primary {
  @apply bg-[#4caf50] text-white;
}

.btn-primary:hover {
  @apply bg-[#43a047] translate-y-[-1px] shadow-[0_4px_8px_rgba(76,175,80,0.3)];
}

.btn-secondary {
  @apply bg-white text-[#24313f] border border-[#d7e0e9];
}

.btn-secondary:hover {
  @apply bg-[#f5f5f5] border-[#4ea3d7];
}

.context-menu {
  @apply fixed min-w-[220px] py-[6px] m-0 list-none bg-white border border-[#d9dfe5] rounded-[12px] shadow-[0_10px_30px_rgba(0,0,0,0.15)] z-[3000];
}

.context-menu li {
  @apply py-[12px] px-[18px] cursor-pointer transition-colors duration-[150ms] ease-in-out;
}

.context-menu li:hover {
  @apply bg-[#f3f6f9];
}

@media (max-width: 960px) {
  .schedule-page {
    @apply pt-[22px] px-[12px] pb-[40px];
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

  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .schedule-page {
    @apply pt-[16px] px-[10px] pb-[28px];
  }

  .page-head {
    @apply mb-[18px];
  }

  .title {
    @apply text-[clamp(22px,7vw,30px)];
  }

  .week-label {
    @apply w-full text-center text-[14px] py-[8px] px-[12px];
  }

  .week-buttons {
    @apply w-full flex-col gap-[10px];
  }

  .week-buttons button {
    @apply w-full min-h-[42px] text-[14px];
  }

  .legend {
    @apply gap-[10px] mb-[18px] justify-start;
  }

  .legend-item {
    @apply text-[13px];
  }

  .table {
    @apply -mx-[10px] px-[10px];
  }

  .header,
  .row {
    min-width: 860px;
  }

  .cell {
    @apply overflow-hidden;
  }

  .lesson {
    @apply p-[7px];
  }

  .subject {
    @apply text-[11px];
  }

  .meta {
    @apply text-[10px];
  }

  .empty-state {
    @apply my-[40px] py-[24px] px-[18px] rounded-[18px];
  }

  .empty-state h2 {
    @apply text-[22px];
  }

  .empty-state p {
    @apply text-[14px];
  }

  .modal {
    @apply w-[100%] max-w-[calc(100%-20px)] min-h-0 rounded-[14px];
  }

  .modal-title {
    @apply text-[20px] py-[14px] px-[16px];
  }

  .modal-body {
    @apply py-[18px] px-[16px];
  }

  .modal-header-actions {
    @apply top-[14px] right-[12px] gap-[6px];
  }

  .edit-btn,
  .close-btn,
  .close-btn-main {
    @apply w-[30px] h-[30px] text-[24px];
  }

  .type-badge {
    @apply mb-[18px] min-w-0 text-[14px] py-[8px] px-[12px];
  }

  .modal-info p {
    @apply mb-[16px] text-[15px];
  }

  .edit-actions {
    @apply flex-col;
  }

  .btn {
    @apply w-full;
  }

  .context-menu {
    @apply min-w-[180px];
  }
}
</style>
