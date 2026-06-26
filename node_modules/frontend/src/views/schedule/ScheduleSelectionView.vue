<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  fetchScheduleBuildings,
  fetchScheduleGroups,
  fetchScheduleRooms,
  fetchScheduleTeachers,
  type ScheduleGroupInfo,
} from '@/api/schedule'
import { fetchConsultationDepartments, type DepartmentInfo } from '@/api/consultations'
import PageFrame from '@/components/PageFrame.vue'
import { getGroupFaculty, scheduleTypeMeta, DISTANCE_BUILDING, DISTANCE_ROOM_LABEL, type ScheduleKind } from './scheduleOptions'

const route = useRoute()
const router = useRouter()

const scheduleType = computed(() => route.params.type as ScheduleKind)
const meta = computed(() => scheduleTypeMeta[scheduleType.value])

const firstChoice = ref('')
const secondChoice = ref('')

const uploadedGroups = ref<ScheduleGroupInfo[]>([])
const teachers = ref<string[]>([])
const buildings = ref<string[]>([])
const rooms = ref<string[]>([])
const departments = ref<DepartmentInfo[]>([])

const isFirstOpen = ref(false)
const isSecondOpen = ref(false)
const isFacultyGroupOpen = ref(false)
const isLoadingOptions = ref(false)

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

const isStudents = computed(() => scheduleType.value === 'students')
const isTeachers = computed(() => scheduleType.value === 'teachers')
const isConsults = computed(() => scheduleType.value === 'consults')
const isAuditories = computed(() => scheduleType.value === 'auditories')

const firstLabel = computed(() => {
  if (isStudents.value) return 'Выбор факультета'
  if (isConsults.value) return 'Выбор кафедры'
  if (isTeachers.value) return 'Выбор кафедры'
  if (isAuditories.value) return 'Выбор учебного корпуса'
  return 'Выбор преподавателя'
})

const secondLabel = computed(() => {
  if (isStudents.value) return 'Выбор группы'
  if (isTeachers.value) return 'Выбор преподавателя'
  if (isAuditories.value) return 'Выбор аудитории'
  return ''
})

const groupOptions = computed(() => {
  if (!firstChoice.value) {
    return []
  }

  return uploadedGroups.value
    .filter((group) => {
      const faculty = group.facultyName ?? getGroupFaculty(group.groupName)
      return faculty === firstChoice.value
    })
    .map((group) => group.groupName)
})

const showSecondPicker = computed(() =>
    isStudents.value || isAuditories.value || isTeachers.value,
)

const isSubmitDisabled = computed(() => {
  if (isStudents.value) {
    return !firstChoice.value.trim() || !secondChoice.value.trim()
  }

  if (isTeachers.value) {
    return !secondChoice.value.trim()
  }

  if (isConsults.value) {
    return !firstChoice.value.trim()
  }

  return !firstChoice.value.trim() || !secondChoice.value.trim()
})

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

const loadUploadedGroups = async () => {
  if (!isStudents.value) {
    uploadedGroups.value = []
    return
  }

  isLoadingOptions.value = true

  try {
    uploadedGroups.value = await fetchScheduleGroups()
  } catch {
    uploadedGroups.value = []
  } finally {
    isLoadingOptions.value = false
  }
}

const loadTeachers = async () => {
  if (!isTeachers.value) {
    teachers.value = []
    return
  }

  isLoadingOptions.value = true

  try {
    const departmentId = firstChoice.value
      ? Number(firstChoice.value)
      : undefined

    teachers.value = await fetchScheduleTeachers(
      departmentId && !Number.isNaN(departmentId) ? departmentId : undefined,
    )
  } catch {
    teachers.value = []
  } finally {
    isLoadingOptions.value = false
  }
}

const loadDepartments = async () => {
  if (!isConsults.value && !isTeachers.value) {
    departments.value = []
    return
  }

  isLoadingOptions.value = true

  try {
    departments.value = await fetchConsultationDepartments()
  } catch {
    departments.value = []
  } finally {
    isLoadingOptions.value = false
  }
}

const loadBuildings = async () => {
  if (!isAuditories.value) {
    buildings.value = []
    return
  }

  isLoadingOptions.value = true

  try {
    buildings.value = await fetchScheduleBuildings()
  } catch {
    buildings.value = []
  } finally {
    isLoadingOptions.value = false
  }
}

const loadRooms = async () => {
  if (!isAuditories.value || !firstChoice.value) {
    rooms.value = []
    return
  }

  isLoadingOptions.value = true

  try {
    rooms.value = await fetchScheduleRooms(firstChoice.value)

    if (firstChoice.value === DISTANCE_BUILDING) {
      secondChoice.value = rooms.value.includes(DISTANCE_ROOM_LABEL)
        ? DISTANCE_ROOM_LABEL
        : (rooms.value[0] ?? DISTANCE_ROOM_LABEL)
    }
  } catch {
    rooms.value = []
  } finally {
    isLoadingOptions.value = false
  }
}

watch(
  () => scheduleType.value,
  () => {
    firstChoice.value = ''
    secondChoice.value = ''
    isFirstOpen.value = false
    isSecondOpen.value = false
    void loadUploadedGroups()
    void loadTeachers()
    void loadDepartments()
    void loadBuildings()
  },
)

watch(firstChoice, () => {
  secondChoice.value = ''

  if (isAuditories.value) {
    void loadRooms()
  }

  if (isTeachers.value) {
    void loadTeachers()
  }
})

const openSchedule = async () => {
  if (isSubmitDisabled.value) return

  const second = isStudents.value
    ? secondChoice.value.trim()
    : isTeachers.value
      ? secondChoice.value.trim()
      : isConsults.value
        ? firstChoice.value.trim()
        : secondChoice.value.trim()

  const selectedDepartment = departments.value.find(
    (department) => String(department.id) === firstChoice.value,
  )

  await router.push({
    name: 'schedule-view',
    params: { type: scheduleType.value },
    query: {
      first: isTeachers.value
        ? (firstChoice.value || '')
        : firstChoice.value,
      second: isConsults.value
        ? String(selectedDepartment?.shortName ?? firstChoice.value)
        : second,
    },
  })
}

onMounted(() => {
  document.addEventListener('click', closeDropdownsOnOutside)
  void loadUploadedGroups()
  void loadTeachers()
  void loadDepartments()
  void loadBuildings()
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
          <label class="field">
            <span>{{ firstLabel }}</span>

            <template v-if="isStudents">
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
                      <button
                        class="picker-option group-toggle"
                        type="button"
                        @click="isFacultyGroupOpen = !isFacultyGroupOpen"
                      >
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
                </div>
              </div>
            </template>

            <template v-else-if="isConsults">
              <div class="custom-picker">
                <button
                  class="picker-trigger"
                  :class="{ open: isFirstOpen }"
                  type="button"
                  @click.stop="isFirstOpen = !isFirstOpen"
                >
                  <span>{{
                    departments.find((item) => String(item.id) === firstChoice)?.shortName
                      || (isLoadingOptions ? 'Загрузка...' : 'Выберите')
                  }}</span>
                  <span class="picker-arrow" :class="{ open: isFirstOpen }"></span>
                </button>

                <div v-if="isFirstOpen" class="picker-panel" @click.stop>
                  <p v-if="departments.length === 0" class="picker-empty">
                    Кафедры появятся после добавления преподавателей
                  </p>
                  <button
                    v-for="department in departments"
                    :key="department.id"
                    class="picker-option"
                    type="button"
                    @click="selectFirst(String(department.id))"
                  >
                    {{ department.shortName }}
                  </button>
                </div>
              </div>
            </template>

            <template v-else-if="isTeachers">
              <div class="custom-picker">
                <button
                  class="picker-trigger"
                  :class="{ open: isFirstOpen }"
                  type="button"
                  @click.stop="isFirstOpen = !isFirstOpen; isSecondOpen = false"
                >
                  <span>{{
                    departments.find((item) => String(item.id) === firstChoice)?.shortName
                      || (firstChoice ? firstChoice : 'Все кафедры')
                  }}</span>
                  <span class="picker-arrow" :class="{ open: isFirstOpen }"></span>
                </button>

                <div v-if="isFirstOpen" class="picker-panel" @click.stop>
                  <button
                    class="picker-option"
                    type="button"
                    @click="selectFirst('')"
                  >
                    Все кафедры
                  </button>
                  <p v-if="departments.length === 0" class="picker-empty">
                    Кафедры появятся после добавления преподавателей
                  </p>
                  <button
                    v-for="department in departments"
                    :key="department.id"
                    class="picker-option"
                    type="button"
                    @click="selectFirst(String(department.id))"
                  >
                    {{ department.shortName }}
                  </button>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="custom-picker">
                <button
                  class="picker-trigger"
                  :class="{ open: isFirstOpen }"
                  type="button"
                  @click.stop="isFirstOpen = !isFirstOpen; isSecondOpen = false"
                >
                  <span>{{ firstChoice || (isLoadingOptions ? 'Загрузка...' : 'Выберите') }}</span>
                  <span class="picker-arrow" :class="{ open: isFirstOpen }"></span>
                </button>

                <div v-if="isFirstOpen" class="picker-panel" @click.stop>
                  <p v-if="buildings.length === 0" class="picker-empty">
                    Корпуса появятся после загрузки расписаний групп
                  </p>
                  <button
                    v-for="building in buildings"
                    :key="building"
                    class="picker-option"
                    type="button"
                    @click="selectFirst(building)"
                  >
                    {{ building }}
                  </button>
                </div>
              </div>
            </template>
          </label>

          <label v-if="showSecondPicker" class="field">
            <span>{{ secondLabel }}</span>
            <div
                class="custom-picker"
                :class="{ disabled: isStudents && !firstChoice }"
            >
              <button
                  class="picker-trigger"
                  :class="{ open: isSecondOpen }"
                  type="button"
                  :disabled="isStudents && !firstChoice"
                  @click.stop="isSecondOpen = !isSecondOpen; isFirstOpen = false"
              >
                <span>{{
                  secondChoice
                    || (isStudents && !firstChoice
                      ? 'Сначала выберите факультет'
                      : isAuditories && !firstChoice
                        ? 'Сначала выберите корпус'
                        : (isLoadingOptions ? 'Загрузка...' : 'Выберите'))
                }}</span>
                <span class="picker-arrow" :class="{ open: isSecondOpen }"></span>
              </button>

              <div v-if="isSecondOpen" class="picker-panel" @click.stop>
                <template v-if="isStudents">
                  <p v-if="groupOptions.length === 0" class="picker-empty">
                    Группы появятся после загрузки расписаний учебным отделом
                  </p>
                  <button
                      v-for="group in groupOptions"
                      :key="group"
                      class="picker-option"
                      type="button"
                      @click="selectSecond(group)"
                  >
                    {{ group }}
                  </button>
                </template>

                <template v-else-if="isTeachers">
                  <p v-if="teachers.length === 0" class="picker-empty">
                    Преподаватели появятся после загрузки расписаний групп
                  </p>
                  <button
                      v-for="teacher in teachers"
                      :key="teacher"
                      class="picker-option"
                      type="button"
                      @click="selectSecond(teacher)"
                  >
                    {{ teacher }}
                  </button>
                </template>

                <template v-else>
                  <p v-if="rooms.length === 0" class="picker-empty">
                    Аудитории появятся после загрузки расписаний групп
                  </p>
                  <button
                      v-for="room in rooms"
                      :key="room"
                      class="picker-option"
                      type="button"
                      @click="selectSecond(room)"
                  >
                    {{ room }}
                  </button>
                </template>
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
.picker-empty {
  margin: 0;
  padding: 12px 16px;
  color: #5f6770;
  font-size: 14px;
}
</style>
