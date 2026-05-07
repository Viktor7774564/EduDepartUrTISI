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

<style scoped>
.selection-page {
  position: relative;
  min-height: calc(100vh - 157px);
  padding: 32px 24px 56px;
  overflow: hidden;
}

.triangle-side {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(50vw, 820px);
  overflow: hidden;
  background: linear-gradient(180deg, #3a4049 0%, #2d3138 100%);
  clip-path: polygon(44% 0, 100% 0, 100% 100%, 0 100%);
}

.hero-card {
  position: relative;
  z-index: 1;
  max-width: 520px;
  padding: 56px 0 56px 18px;
}

h1 {
  margin: 0 0 12px;
  font-size: clamp(34px, 4vw, 54px);
  line-height: 1.05;
  color: #111111;
}

p {
  max-width: 480px;
  margin: 0 0 40px;
  font-size: 18px;
  line-height: 1.55;
  color: #4d5660;
}

.form-grid {
  display: grid;
  gap: 28px;
  max-width: 420px;
}

.field {
  display: grid;
  gap: 12px;
}

/* Общие стили для кастомных селектов */
.custom-picker {
  position: relative;
}

.custom-picker.disabled {
  opacity: 0.6;
}

.picker-trigger {
  width: 100%;
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px;
  border: 1px solid #c9d2dc;
  border-radius: 14px;
  background: #ffffff;
  color: #1c232b;
  font-size: 16px;
  box-shadow: 0 10px 24px rgba(18, 38, 63, 0.06);
  cursor: pointer;
  text-align: left;
}

.picker-trigger:disabled {
  background: #eef2f6;
  cursor: not-allowed;
}

.picker-trigger.open {
  border-color: #2d90d2;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  box-shadow: 0 0 0 2px rgba(45, 144, 210, 0.12);
}

.picker-arrow {
  display: block;
  width: 8px;
  height: 8px;
  border-right: 2px solid #5b6470;
  border-bottom: 2px solid #5b6470;
  transform: rotate(45deg);
  transition: transform 0.2s ease;
  margin-top: -4px;
}

.picker-arrow.open {
  transform: rotate(-135deg);
  margin-top: 4px;
}

.picker-arrow.small {
  border: none;
  font-size: 10px;
  transform: none;
  margin: 0;
}

.picker-arrow.small.open {
  transform: rotate(180deg);
}

.picker-panel {
  position: absolute;
  top: calc(100% - 1px);
  left: 0;
  right: 0;
  z-index: 10;
  max-height: 300px;
  overflow-y: auto;
  padding: 6px 0 10px;
  border: 2px solid #2d90d2;
  border-top: none;
  border-radius: 0 0 14px 14px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(18, 38, 63, 0.12);
}

.picker-option {
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: #5f6977;
  font-size: 16px;
  text-align: left;
  cursor: pointer;
}

.picker-option:hover {
  background: rgba(89, 180, 239, 0.08);
}

.picker-group {
  display: grid;
}

.picker-option.group-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.picker-subgroup {
  display: grid;
  padding: 2px 0 6px;
}

.picker-option.nested {
  padding-left: 38px;
}

.submit-btn {
  margin-top: 38px;
  min-width: 240px;
  min-height: 54px;
  padding: 0 28px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #59b4ef 0%, #308ed0 100%);
  color: #ffffff;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 16px 36px rgba(48, 142, 208, 0.28);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 22px 42px rgba(48, 142, 208, 0.34);
}

.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.code-wall {
  position: absolute;
  inset: -2% -1% -2% -16%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: stretch;
  padding: 20px 24px;
  color: rgba(89, 180, 239, 0.48);
  font-size: clamp(42px, 4.4vw, 72px);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: 0.03em;
  user-select: none;
}

.code-wall span {
  display: block;
  width: 100%;
  text-align: right;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .triangle-side {
    width: min(44vw, 420px);
    clip-path: polygon(58% 0, 100% 0, 100% 100%, 10% 100%);
  }
  .hero-card {
    padding: 36px 0 24px 8px;
  }
}

@media (max-width: 640px) {
  .triangle-side {
    display: none;
  }
  .submit-btn {
    width: 100%;
  }
}
</style>