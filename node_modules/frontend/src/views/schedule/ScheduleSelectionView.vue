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

<style scoped>
.selection-page {
  @apply relative min-h-[calc(100vh-157px)] py-[32px] px-[24px] pb-[56px] overflow-hidden;
}

.triangle-side {
  @apply absolute top-0 right-0 bottom-0 overflow-hidden;
  width: min(50vw, 820px);
  background: linear-gradient(180deg, #3a4049 0%, #2d3138 100%);
  clip-path: polygon(44% 0, 100% 0, 100% 100%, 0 100%);
}

.hero-card {
  @apply relative z-[1] max-w-[520px] pt-[56px] pr-0 pb-[56px] pl-[18px];
}

.back-home-btn {
  @apply mb-[18px] inline-flex items-center gap-[10px] border-0 rounded-[12px] bg-white/85 text-[#1c232b] px-[14px] py-[10px] text-[15px] font-semibold cursor-pointer shadow-[0_8px_22px_rgba(18,38,63,0.08)] transition-transform duration-[200ms] ease-in-out;
}

.back-home-btn:hover {
  @apply translate-y-[-1px];
}

.back-home-arrow {
  @apply inline-flex items-center justify-center w-[24px] h-[24px] rounded-full bg-[#eef2f6] text-[#2d90d2] text-[16px];
}

h1 {
  @apply m-0 mb-[12px] text-[clamp(34px,4vw,54px)] leading-[1.05] text-[#111111];
}

p {
  @apply max-w-[480px] m-0 mb-[40px] text-[18px] leading-[1.55] text-[#4d5660];
}

.form-grid {
  @apply grid gap-[28px] max-w-[420px];
}

.field {
  @apply grid gap-[12px];
}

/* Общие стили для кастомных селектов */
.custom-picker {
  @apply relative;
}

.custom-picker.disabled {
  @apply opacity-60;
}

.picker-trigger {
  @apply w-full min-h-[54px] flex items-center justify-between gap-[12px] px-[16px] border border-[#c9d2dc] rounded-[14px] bg-white text-[#1c232b] text-[16px] shadow-[0_10px_24px_rgba(18,38,63,0.06)] cursor-pointer text-left;
}

.picker-trigger:disabled {
  @apply bg-[#eef2f6] cursor-not-allowed;
}

.picker-trigger.open {
  @apply border-[#2d90d2] rounded-b-none shadow-[0_0_0_2px_rgba(45,144,210,0.12)];
}

.picker-arrow {
  @apply block w-[8px] h-[8px] border-r-2 border-b-2 border-[#5b6470] rotate-45 transition-transform duration-[200ms] ease-in-out mt-[-4px];
}

.picker-arrow.open {
  @apply rotate-[-135deg] mt-[4px];
}

.picker-arrow.small {
  @apply border-0 text-[10px] rotate-0 m-0;
}

.picker-arrow.small.open {
  @apply rotate-180;
}

.picker-panel {
  @apply absolute top-[calc(100%-1px)] left-0 right-0 z-[10] max-h-[300px] overflow-y-auto pt-[6px] pb-[10px] border-2 border-[#2d90d2] border-t-0 rounded-b-[14px] bg-white shadow-[0_12px_28px_rgba(18,38,63,0.12)];
}

.picker-option {
  @apply w-full py-[10px] px-[16px] border-0 bg-transparent text-[#5f6977] text-[16px] text-left cursor-pointer;
}

.picker-option:hover {
  @apply bg-[rgba(89,180,239,0.08)];
}

.picker-group {
  @apply grid;
}

.picker-option.group-toggle {
  @apply flex items-center justify-between;
}

.picker-subgroup {
  @apply grid pt-[2px] pb-[6px];
}

.picker-option.nested {
  @apply pl-[38px];
}

.submit-btn {
  @apply mt-[38px] min-w-[240px] min-h-[54px] px-[28px] border-0 rounded-[14px] text-white text-[17px] font-bold cursor-pointer shadow-[0_16px_36px_rgba(48,142,208,0.28)] transition-[transform,box-shadow,opacity] duration-[200ms] ease-in-out;
  background: linear-gradient(135deg, #59b4ef 0%, #308ed0 100%);
}

.submit-btn:hover:not(:disabled) {
  @apply translate-y-[-1px] shadow-[0_22px_42px_rgba(48,142,208,0.34)];
}

.submit-btn:disabled {
  @apply opacity-[0.55] cursor-not-allowed shadow-none;
}

.code-wall {
  @apply absolute flex flex-col justify-evenly items-stretch py-[20px] px-[24px] text-[rgba(89,180,239,0.48)] text-[clamp(42px,4.4vw,72px)] font-bold leading-[0.95] tracking-[0.03em] select-none;
  inset: -2% -1% -2% -16%;
}

.code-wall span {
  @apply block w-full text-right whitespace-nowrap;
}

@media (max-width: 1100px) {
  .triangle-side {
    width: min(44vw, 420px);
    clip-path: polygon(58% 0, 100% 0, 100% 100%, 10% 100%);
  }
  .hero-card {
    @apply pt-[36px] pr-0 pb-[24px] pl-[8px];
  }
}

@media (max-width: 640px) {
  .triangle-side {
    display: none;
  }
  .selection-page {
    @apply px-[14px] py-[18px] pb-[28px];
  }
  .hero-card {
    @apply max-w-full p-0;
  }
  .back-home-btn {
    @apply w-full justify-center text-[14px] py-[11px] mb-[14px];
  }
  h1 {
    @apply text-[clamp(26px,8vw,34px)] mb-[10px];
  }
  p {
    @apply text-[15px] mb-[22px];
  }
  .form-grid {
    @apply max-w-full gap-[18px];
  }
  .field {
    @apply gap-[8px];
  }
  .picker-trigger {
    @apply min-h-[48px] text-[15px] rounded-[12px] px-[14px];
  }
  .picker-panel {
    @apply max-h-[260px];
  }
  .picker-option {
    @apply py-[9px] px-[14px] text-[15px];
  }
  .submit-btn {
    @apply w-full mt-[24px] min-h-[48px] text-[16px];
  }
}
</style>
