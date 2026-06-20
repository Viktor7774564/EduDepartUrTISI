<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageFrame from '@/components/PageFrame.vue'
import {
  buildingOptions,
  departmentOptions,
  getConsultationTeachersByDepartment,
  getGroupsByFaculty,
  getRoomsByBuilding,
  getTeachersByDepartment,
  scheduleTypeMeta,
  type ScheduleKind,
} from './scheduleOptions'

const route = useRoute()
const router = useRouter()

const scheduleType = computed(() => route.params.type as ScheduleKind)
const meta = computed(() => scheduleTypeMeta[scheduleType.value])

const firstChoice = ref('')
const secondChoice = ref('')

// Состояния для кастомных выпадающих списков
const isFirstOpen = ref(false)
const isSecondOpen = ref(false)
const isFacultyGroupOpen = ref(false) // Для вложенного списка факультетов

const studentFacultyOptions = [
  { label: 'СПО', value: 'СПО' },
  {
    label: 'Факультет',
    options: [
      { label: 'ФИИиУ', value: 'ФИИиУ' },
      { label: 'ФНО', value: 'ФНО' },
    ],
  },
  { label: 'Магистратура', value: 'Магистратура' },
  { label: 'Аспирантура', value: 'Аспирантура' },
]

const firstLabel = computed(() => {
  if (scheduleType.value === 'students') return 'Выбор факультета'
  if (scheduleType.value === 'auditories') return 'Выбор учебного корпуса'
  return 'Выбор кафедры'
})

const secondLabel = computed(() => {
  if (scheduleType.value === 'students') return 'Выбор группы'
  if (scheduleType.value === 'auditories') return 'Выбор аудитории'
  return 'Выбор преподавателя'
})

const firstOptions = computed(() => {
  if (scheduleType.value === 'auditories') return buildingOptions
  return departmentOptions
})

const secondOptions = computed(() => {
  if (!firstChoice.value) return []
  if (scheduleType.value === 'students') return getGroupsByFaculty(firstChoice.value)
  if (scheduleType.value === 'auditories') return getRoomsByBuilding(firstChoice.value)
  if (scheduleType.value === 'consults') return getConsultationTeachersByDepartment(firstChoice.value)
  return getTeachersByDepartment(firstChoice.value)
})

const isSubmitDisabled = computed(() => !firstChoice.value || !secondChoice.value)

// Универсальные методы выбора
const selectFirst = (value: string) => {
  firstChoice.value = value
  isFirstOpen.value = false
  isFacultyGroupOpen.value = false
}

const selectSecond = (value: string) => {
  secondChoice.value = value
  isSecondOpen.value = false
}

const goBackHome = async () => {
  await router.push({ name: 'home' })
}

const closeDropdownsOnOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.custom-picker')) {
    isFirstOpen.value = false
    isSecondOpen.value = false
    isFacultyGroupOpen.value = false
  }
}

watch(
    () => scheduleType.value,
    () => {
      firstChoice.value = ''
      secondChoice.value = ''
      isFirstOpen.value = false
      isSecondOpen.value = false
    },
)

watch(firstChoice, () => {
  secondChoice.value = ''
})

const openSchedule = async () => {
  if (isSubmitDisabled.value) return
  await router.push({
    name: 'schedule-view',
    params: { type: scheduleType.value },
    query: {
      first: firstChoice.value,
      second: secondChoice.value,
    },
  })
}

onMounted(() => {
  document.addEventListener('click', closeDropdownsOnOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeDropdownsOnOutside)
})
</script>

<template>
  <PageFrame>
    <section class="selection-page">
      <div class="triangle-side" aria-hidden="true">
        <div class="code-wall">
          <span v-for="index in 12" :key="index">00110010 11000101</span>
        </div>
      </div>

      <div class="hero-card">
        <button class="back-home-btn" type="button" @click="goBackHome">
          <span class="back-home-arrow">←</span>
          <span>К выбору расписания</span>
        </button>

        <h1>{{ meta.title }}</h1>
        <p>{{ meta.caption }}</p>

        <div class="form-grid">
          <!-- Первый список (Факультет / Корпус / Кафедра) -->
          <label class="field">
            <span>{{ firstLabel }}</span>
            <div class="custom-picker">
              <button
                  class="picker-trigger"
                  :class="{ open: isFirstOpen }"
                  type="button"
                  @click.stop="isFirstOpen = !isFirstOpen; isSecondOpen = false"
              >
                <span>{{ firstChoice || 'Выберите' }}</span>
                <span class="picker-arrow" :class="{ open: isFirstOpen }"></span>
              </button>

              <div v-if="isFirstOpen" class="picker-panel" @click.stop>
                <template v-if="scheduleType === 'students'">
                  <template v-for="option in studentFacultyOptions" :key="option.label">
                    <button
                        v-if="'value' in option"
                        class="picker-option"
                        type="button"
                        @click="selectFirst(String(option.value))"
                    >
                      {{ option.label }}
                    </button>

                    <div v-else class="picker-group">
                      <button class="picker-option group-toggle" type="button" @click="isFacultyGroupOpen = !isFacultyGroupOpen">
                        <span>{{ option.label }}</span>
                        <span class="picker-arrow small" :class="{ open: isFacultyGroupOpen }">▲</span>
                      </button>

                      <div v-if="isFacultyGroupOpen" class="picker-subgroup">
                        <button
                            v-for="nestedOption in option.options"
                            :key="nestedOption.value"
                            class="picker-option nested"
                            type="button"
                            @click="selectFirst(nestedOption.value)"
                        >
                          {{ nestedOption.label }}
                        </button>
                      </div>
                    </div>
                  </template>
                </template>
                <template v-else>
                  <button
                      v-for="option in firstOptions"
                      :key="option"
                      class="picker-option"
                      type="button"
                      @click="selectFirst(option)"
                  >
                    {{ option }}
                  </button>
                </template>
              </div>
            </div>
          </label>

          <!-- Второй список (Группа / Аудитория / Преподаватель) -->
          <label class="field">
            <span>{{ secondLabel }}</span>
            <div class="custom-picker" :class="{ disabled: !firstChoice }">
              <button
                  class="picker-trigger"
                  :class="{ open: isSecondOpen }"
                  type="button"
                  :disabled="!firstChoice"
                  @click.stop="isSecondOpen = !isSecondOpen; isFirstOpen = false"
              >
                <span>{{ secondChoice || 'Выберите' }}</span>
                <span class="picker-arrow" :class="{ open: isSecondOpen }"></span>
              </button>

              <div v-if="isSecondOpen" class="picker-panel" @click.stop>
                <button
                    v-for="option in secondOptions"
                    :key="option"
                    class="picker-option"
                    type="button"
                    @click="selectSecond(option)"
                >
                  {{ option }}
                </button>
              </div>
            </div>
          </label>
        </div>

        <button class="submit-btn" type="button" :disabled="isSubmitDisabled" @click="openSchedule">
          {{ meta.actionLabel }}
        </button>
      </div>
    </section>
  </PageFrame>
</template>

