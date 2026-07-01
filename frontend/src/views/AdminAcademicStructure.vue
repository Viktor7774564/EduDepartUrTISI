<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageFrame from '@/components/PageFrame.vue'
import { useAuthStore } from '@/stores/auth'
import { getErrorRoute } from '@/config/errorPages'
import {
  createAcademicDirection,
  createAcademicGroup,
  createStaffDepartment,
  createTeacherDepartment,
  deleteAcademicDirection,
  deleteAcademicGroup,
  educationFormLabels,
  fetchAcademicOverview,
  mergeAcademicDirections,
  roleLabels,
  selectableEducationFormOptions,
  setDepartmentHead,
  type AcademicDepartment,
  type AcademicDirection,
  type AcademicGroup,
  type AcademicStructureOverview,
} from '@/api/adminAcademic'

type TabId = 'teacher' | 'staff' | 'groups'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref<TabId>('teacher')
const overview = ref<AcademicStructureOverview | null>(null)
const isLoading = ref(false)
const pageError = ref('')
const savingDepartmentId = ref<number | null>(null)
const structureSearch = ref('')
const mergeTargetByDirection = ref<Record<number, string>>({})
const deletingGroupId = ref<number | null>(null)
const deletingDirectionId = ref<number | null>(null)
const mergingDirectionId = ref<number | null>(null)
const newDirectionName = ref('')
const isCreatingDirection = ref(false)
const creatingGroupForDirectionId = ref<number | null>(null)
const newGroupForms = ref<Record<number, {
  name: string
  educationForm: AcademicGroup['educationForm']
}>>({})

const newTeacherDepartment = ref({
  shortName: '',
  name: '',
})
const newStaffDepartmentName = ref('')
const isCreatingTeacherDepartment = ref(false)
const isCreatingStaffDepartment = ref(false)

const educationFormOptions = selectableEducationFormOptions

const tabs: { id: TabId; label: string }[] = [
  { id: 'teacher', label: 'Кафедры' },
  { id: 'staff', label: 'Отделы' },
  { id: 'groups', label: 'Группы' },
]

onMounted(async () => {
  if (!authStore.isAuthenticated || authStore.currentUser?.role !== 'admin') {
    await router.replace(getErrorRoute('403'))
    return
  }

  await loadOverview()
})

async function loadOverview() {
  isLoading.value = true
  pageError.value = ''

  try {
    overview.value = await fetchAcademicOverview()
  } catch (err: any) {
    pageError.value = err.response?.data?.message || 'Не удалось загрузить структуру'
  } finally {
    isLoading.value = false
  }
}

const activeDepartments = computed(() => {
  if (activeTab.value === 'teacher') {
    return filteredTeacherDepartments.value
  }

  return filteredStaffDepartments.value
})

const filteredTeacherDepartments = computed(() =>
    filterDepartments(overview.value?.teacherDepartments ?? []),
)

const filteredStaffDepartments = computed(() =>
    filterDepartments(overview.value?.staffDepartments ?? []),
)

const filteredDirections = computed(() => {
  const query = structureSearch.value.trim().toLowerCase()
  const directions = overview.value?.directions ?? []

  if (!query) {
    return directions
  }

  return directions
      .map((direction) => ({
        ...direction,
        groups: direction.groups.filter((group) =>
            group.name.toLowerCase().includes(query)
            || direction.name.toLowerCase().includes(query)
            || group.students.some((student) => matchesMember(student, query)),
        ),
      }))
      .filter((direction) => direction.groups.length > 0)
})

function filterDepartments(departments: AcademicDepartment[]) {
  const query = structureSearch.value.trim().toLowerCase()

  if (!query) {
    return departments
  }

  return departments.filter((department) =>
      department.name.toLowerCase().includes(query)
      || (department.shortName?.toLowerCase().includes(query) ?? false)
      || department.members.some((member) => matchesMember(member, query)),
  )
}

function matchesMember(
    member: { fullName: string; login: string; position: string },
    query: string,
): boolean {
  return member.fullName.toLowerCase().includes(query)
      || member.login.toLowerCase().includes(query)
      || member.position.toLowerCase().includes(query)
}

async function onHeadChange(department: AcademicDepartment, value: string) {
  const headUserId = value ? Number(value) : null
  savingDepartmentId.value = department.id
  pageError.value = ''

  try {
    const updated = await setDepartmentHead(department.id, headUserId)
    updateDepartmentInOverview(updated)
  } catch (err: any) {
    pageError.value = err.response?.data?.message || 'Не удалось назначить руководителя'
  } finally {
    savingDepartmentId.value = null
  }
}

function updateDepartmentInOverview(updated: AcademicDepartment) {
  if (!overview.value) {
    return
  }

  const list = updated.type === 'teacher'
      ? overview.value.teacherDepartments
      : overview.value.staffDepartments

  const index = list.findIndex((item) => item.id === updated.id)

  if (index >= 0) {
    list[index] = updated
  }
}

const goBack = async () => {
  await router.push({ name: 'admin-panel' })
}

const headLabel = (type: AcademicDepartment['type']) =>
    type === 'teacher' ? 'Заведующий кафедрой' : 'Руководитель отдела'

const emptyLabel = (type: AcademicDepartment['type']) =>
    type === 'teacher' ? 'Нет преподавателей' : 'Нет сотрудников'

const membersCountLabel = (department: AcademicDepartment) => {
  const count = department.members.length

  if (department.type === 'teacher') {
    return `${count} преподавателей`
  }

  return `${count} сотрудников`
}

function directionHasStudents(direction: AcademicDirection): boolean {
  return direction.groups.some((group) => group.students.length > 0)
}

function canDeleteDirection(direction: AcademicDirection): boolean {
  return !directionHasStudents(direction)
}

function canDeleteGroup(group: AcademicGroup): boolean {
  return group.students.length === 0
}

function otherDirections(directionId: number): AcademicDirection[] {
  return (overview.value?.directions ?? []).filter((direction) => direction.id !== directionId)
}

async function deleteGroup(group: AcademicGroup) {
  if (!canDeleteGroup(group)) {
    return
  }

  const confirmed = window.confirm(`Удалить группу ${group.name}?`)

  if (!confirmed) {
    return
  }

  deletingGroupId.value = group.id
  pageError.value = ''

  try {
    await deleteAcademicGroup(group.id)
    await loadOverview()
  } catch (err: any) {
    pageError.value = err.response?.data?.message || 'Не удалось удалить группу'
  } finally {
    deletingGroupId.value = null
  }
}

async function deleteDirection(direction: AcademicDirection) {
  if (!canDeleteDirection(direction)) {
    return
  }

  const confirmed = window.confirm(`Удалить направление «${direction.name}»?`)

  if (!confirmed) {
    return
  }

  deletingDirectionId.value = direction.id
  pageError.value = ''

  try {
    await deleteAcademicDirection(direction.id)
    await loadOverview()
  } catch (err: any) {
    pageError.value = err.response?.data?.message || 'Не удалось удалить направление'
  } finally {
    deletingDirectionId.value = null
  }
}

async function mergeDirection(sourceDirection: AcademicDirection) {
  const targetId = Number(mergeTargetByDirection.value[sourceDirection.id])

  if (!targetId) {
    return
  }

  const target = overview.value?.directions.find((direction) => direction.id === targetId)

  if (!target) {
    return
  }

  const confirmed = window.confirm(
      `Объединить «${sourceDirection.name}» с «${target.name}»? Группы и студенты будут перенесены.`,
  )

  if (!confirmed) {
    return
  }

  mergingDirectionId.value = sourceDirection.id
  pageError.value = ''

  try {
    await mergeAcademicDirections(sourceDirection.id, targetId)
    mergeTargetByDirection.value[sourceDirection.id] = ''
    await loadOverview()
  } catch (err: any) {
    pageError.value = err.response?.data?.message || 'Не удалось объединить направления'
  } finally {
    mergingDirectionId.value = null
  }
}

function getGroupForm(directionId: number) {
  if (!newGroupForms.value[directionId]) {
    newGroupForms.value[directionId] = {
      name: '',
      educationForm: 'full_time',
    }
  }

  return newGroupForms.value[directionId]
}

async function createDirection() {
  const name = newDirectionName.value.trim()

  if (!name) {
    pageError.value = 'Введите название направления'
    return
  }

  isCreatingDirection.value = true
  pageError.value = ''

  try {
    await createAcademicDirection({ name })
    newDirectionName.value = ''
    await loadOverview()
  } catch (err: any) {
    pageError.value = err.response?.data?.message || 'Не удалось создать направление'
  } finally {
    isCreatingDirection.value = false
  }
}

async function createTeacherDepartmentSubmit() {
  const shortName = newTeacherDepartment.value.shortName.trim()
  const name = newTeacherDepartment.value.name.trim()

  if (!shortName || !name) {
    pageError.value = 'Укажите сокращение и название кафедры'
    return
  }

  isCreatingTeacherDepartment.value = true
  pageError.value = ''

  try {
    await createTeacherDepartment({ shortName, name })
    newTeacherDepartment.value = { shortName: '', name: '' }
    await loadOverview()
  } catch (err: any) {
    pageError.value = err.response?.data?.message || 'Не удалось создать кафедру'
  } finally {
    isCreatingTeacherDepartment.value = false
  }
}

async function createStaffDepartmentSubmit() {
  const name = newStaffDepartmentName.value.trim()

  if (!name) {
    pageError.value = 'Введите название отдела'
    return
  }

  isCreatingStaffDepartment.value = true
  pageError.value = ''

  try {
    await createStaffDepartment({ name })
    newStaffDepartmentName.value = ''
    await loadOverview()
  } catch (err: any) {
    pageError.value = err.response?.data?.message || 'Не удалось создать отдел'
  } finally {
    isCreatingStaffDepartment.value = false
  }
}

async function createGroup(directionId: number) {
  const form = getGroupForm(directionId)
  const name = form.name.trim()

  if (!name) {
    pageError.value = 'Введите название группы'
    return
  }

  creatingGroupForDirectionId.value = directionId
  pageError.value = ''

  try {
    await createAcademicGroup(directionId, {
      name,
      educationForm: form.educationForm,
    })

    newGroupForms.value[directionId] = {
      name: '',
      educationForm: form.educationForm,
    }

    await loadOverview()
  } catch (err: any) {
    pageError.value = err.response?.data?.message || 'Не удалось создать группу'
  } finally {
    creatingGroupForDirectionId.value = null
  }
}
</script>

<template>
  <PageFrame>
    <section class="admin-edit-page">
      <div class="admin-card academic-card">
        <div class="card-header">
          <button class="back-btn" type="button" @click="goBack" aria-label="Назад">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h1 class="card-title">Структура</h1>
        </div>

        <div class="card-subtitle">Кафедры, отделы и учебные группы</div>

        <div class="academic-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="academic-tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <input
          v-model="structureSearch"
          class="users-search"
          type="search"
          placeholder="Поиск по названию, ФИО или логину"
        >

        <p v-if="pageError" class="submit-message error">{{ pageError }}</p>
        <p v-else-if="isLoading" class="card-subtitle">Загрузка...</p>

        <template v-else-if="overview">
          <template v-if="activeTab === 'groups'">
            <div class="academic-create-panel">
              <h2 class="academic-create-panel__title">Новое направление</h2>
              <div class="academic-create-row">
                <input
                  v-model="newDirectionName"
                  class="form-input"
                  type="text"
                  placeholder="Например: 09.03.01 Информатика и вычислительная техника"
                  :disabled="isCreatingDirection"
                >
                <button
                  type="button"
                  class="btn btn-primary"
                  :disabled="isCreatingDirection || !newDirectionName.trim()"
                  @click="createDirection"
                >
                  {{ isCreatingDirection ? '...' : 'Добавить направление' }}
                </button>
              </div>
            </div>

            <p v-if="filteredDirections.length === 0" class="card-subtitle">
              Направления не найдены
            </p>

            <div v-else class="academic-sections">
              <article
                v-for="direction in filteredDirections"
                :key="direction.id"
                class="academic-section"
              >
                <div class="academic-section__header">
                  <div>
                    <h2 class="academic-section__title">{{ direction.name }}</h2>
                    <p class="academic-section__meta">
                      {{ direction.groups.length }} групп
                    </p>
                  </div>

                  <div class="academic-direction-actions">
                    <div v-if="otherDirections(direction.id).length > 0" class="academic-merge-row">
                      <select
                        v-model="mergeTargetByDirection[direction.id]"
                        class="form-select"
                        :disabled="mergingDirectionId === direction.id"
                      >
                        <option value="">Объединить с...</option>
                        <option
                          v-for="target in otherDirections(direction.id)"
                          :key="target.id"
                          :value="String(target.id)"
                        >
                          {{ target.name }}
                        </option>
                      </select>
                      <button
                        type="button"
                        class="btn btn-secondary"
                        :disabled="!mergeTargetByDirection[direction.id] || mergingDirectionId === direction.id"
                        @click="mergeDirection(direction)"
                      >
                        {{ mergingDirectionId === direction.id ? '...' : 'Объединить' }}
                      </button>
                    </div>

                    <button
                      v-if="canDeleteDirection(direction)"
                      type="button"
                      class="btn btn-secondary academic-delete-btn"
                      :disabled="deletingDirectionId === direction.id"
                      @click="deleteDirection(direction)"
                    >
                      {{ deletingDirectionId === direction.id ? '...' : 'Удалить направление' }}
                    </button>
                  </div>
                </div>

                <div
                  v-for="group in direction.groups"
                  :key="group.id"
                  class="academic-group"
                >
                  <div class="academic-group__header">
                    <div>
                      <h3 class="academic-group__title">{{ group.name }}</h3>
                      <p class="academic-group__meta">
                        {{ educationFormLabels[group.educationForm] }}
                        · {{ group.students.length }} студентов
                      </p>
                    </div>

                    <button
                      v-if="canDeleteGroup(group)"
                      type="button"
                      class="btn btn-secondary academic-delete-btn"
                      :disabled="deletingGroupId === group.id"
                      @click="deleteGroup(group)"
                    >
                      {{ deletingGroupId === group.id ? '...' : 'Удалить группу' }}
                    </button>
                  </div>

                  <div v-if="group.students.length === 0" class="academic-section__empty">
                    Нет студентов
                  </div>

                  <ul v-else class="academic-members">
                    <li
                      v-for="student in group.students"
                      :key="student.id"
                      class="academic-member"
                    >
                      <div class="academic-member__name">{{ student.fullName }}</div>
                      <div class="academic-member__meta">{{ student.position }}</div>
                      <div class="academic-member__login">{{ student.login }}</div>
                    </li>
                  </ul>
                </div>

                <div class="academic-create-panel academic-create-panel--nested">
                  <h3 class="academic-create-panel__title">Новая группа</h3>
                  <div class="academic-create-group-form">
                    <input
                      v-model="getGroupForm(direction.id).name"
                      class="form-input"
                      type="text"
                      placeholder="Например: ПЕ-31б"
                      :disabled="creatingGroupForDirectionId === direction.id"
                    >
                    <select
                      v-model="getGroupForm(direction.id).educationForm"
                      class="form-select"
                      :disabled="creatingGroupForDirectionId === direction.id"
                    >
                      <option
                        v-for="option in educationFormOptions"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </option>
                    </select>
                    <button
                      type="button"
                      class="btn btn-primary"
                      :disabled="creatingGroupForDirectionId === direction.id || !getGroupForm(direction.id).name.trim()"
                      @click="createGroup(direction.id)"
                    >
                      {{ creatingGroupForDirectionId === direction.id ? '...' : 'Добавить группу' }}
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </template>

          <template v-else>
          <div
            v-if="activeTab === 'teacher'"
            class="academic-create-panel"
          >
            <h2 class="academic-create-panel__title">Новая кафедра</h2>
            <div class="academic-create-row">
              <input
                v-model="newTeacherDepartment.shortName"
                class="form-input academic-create-short-name"
                type="text"
                placeholder="Сокращение, например: ИТиМС"
                :disabled="isCreatingTeacherDepartment"
              >
              <input
                v-model="newTeacherDepartment.name"
                class="form-input"
                type="text"
                placeholder="Полное название кафедры"
                :disabled="isCreatingTeacherDepartment"
              >
              <button
                type="button"
                class="btn btn-primary"
                :disabled="isCreatingTeacherDepartment || !newTeacherDepartment.shortName.trim() || !newTeacherDepartment.name.trim()"
                @click="createTeacherDepartmentSubmit"
              >
                {{ isCreatingTeacherDepartment ? '...' : 'Добавить кафедру' }}
              </button>
            </div>
          </div>

          <div
            v-else-if="activeTab === 'staff'"
            class="academic-create-panel"
          >
            <h2 class="academic-create-panel__title">Новый отдел</h2>
            <div class="academic-create-row">
              <input
                v-model="newStaffDepartmentName"
                class="form-input"
                type="text"
                placeholder="Например: Учебный отдел"
                :disabled="isCreatingStaffDepartment"
              >
              <button
                type="button"
                class="btn btn-primary"
                :disabled="isCreatingStaffDepartment || !newStaffDepartmentName.trim()"
                @click="createStaffDepartmentSubmit"
              >
                {{ isCreatingStaffDepartment ? '...' : 'Добавить отдел' }}
              </button>
            </div>
          </div>

          <p v-if="activeDepartments.length === 0" class="card-subtitle">
            {{ activeTab === 'teacher' ? 'Кафедры не найдены' : 'Отделы не найдены' }}
          </p>

          <div v-else class="academic-sections">
            <article
              v-for="department in activeDepartments"
              :key="department.id"
              class="academic-section"
            >
              <div class="academic-section__header">
                <div>
                  <h2 class="academic-section__title">
                    {{ department.name }}
                    <span v-if="department.shortName" class="academic-section__badge">
                      {{ department.shortName }}
                    </span>
                  </h2>
                  <p class="academic-section__meta">
                    {{ membersCountLabel(department) }}
                  </p>
                </div>

                <div class="academic-section__head">
                  <label :for="`head-${department.id}`">{{ headLabel(department.type) }}</label>
                  <select
                    :id="`head-${department.id}`"
                    class="form-select"
                    :disabled="savingDepartmentId === department.id"
                    :value="department.headUserId ?? ''"
                    @change="onHeadChange(department, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="">Не назначен</option>
                    <option
                      v-for="member in department.members"
                      :key="member.id"
                      :value="member.id"
                    >
                      {{ member.fullName }}
                    </option>
                  </select>
                </div>
              </div>

              <div v-if="department.members.length === 0" class="academic-section__empty">
                {{ emptyLabel(department.type) }}
              </div>

              <ul v-else class="academic-members">
                <li
                  v-for="member in department.members"
                  :key="member.id"
                  class="academic-member"
                  :class="{ 'is-head': member.id === department.headUserId }"
                >
                  <div class="academic-member__name">
                    {{ member.fullName }}
                    <span v-if="member.id === department.headUserId" class="academic-member__tag">
                      Руководитель
                    </span>
                  </div>
                  <div class="academic-member__meta">
                    <template v-if="department.type === 'staff'">
                      {{ roleLabels[member.role] }} ·
                    </template>
                    {{ member.position }}
                    <span v-if="member.cabinet"> · каб. {{ member.cabinet }}</span>
                  </div>
                  <div class="academic-member__login">{{ member.login }}</div>
                </li>
              </ul>
            </article>
          </div>
          </template>
        </template>
      </div>
    </section>
  </PageFrame>
</template>
