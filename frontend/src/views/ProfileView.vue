<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, type AuthUser } from '@/stores/auth'
import PageFrame from '@/components/PageFrame.vue'
import { getPhotoUrl } from '@/config/api'
import { getGroupFaculty } from '@/views/schedule/scheduleOptions'

const authStore = useAuthStore()
const router = useRouter()

const user = computed(() => authStore.currentUser)
const role = computed(() => user.value?.role)
const userPhoto = computed(() => getPhotoUrl(user.value?.photoUrl))

function formatTeacherDisplayName(currentUser: AuthUser): string {
  const nameInitial = currentUser.name?.charAt(0) ?? ''
  const patronymicInitial = currentUser.patronymic?.charAt(0) ?? ''

  return `${currentUser.surname} ${nameInitial}.${patronymicInitial}.`.trim()
}

async function goToMySchedule() {
  const currentUser = user.value
  if (!currentUser) {
    return
  }

  if (currentUser.role === 'student') {
    const group = currentUser.group?.trim()

    if (!group) {
      await router.push({ name: 'schedule-selection', params: { type: 'students' } })
      return
    }

    await router.push({
      name: 'schedule-view',
      params: { type: 'students' },
      query: {
        first: getGroupFaculty(group),
        second: group,
      },
    })
    return
  }

  if (currentUser.role === 'teacher') {
    await router.push({
      name: 'schedule-view',
      params: { type: 'teachers' },
      query: {
        first: currentUser.departmentId ? String(currentUser.departmentId) : '',
        second: formatTeacherDisplayName(currentUser),
      },
    })
  }
}

const profileFields = computed(() => {
  if (!user.value) return []

  switch (role.value) {
    case 'student':
      return [
        { label: 'Группа', value: user.value.group },
        { label: 'Направление', value: user.value.direction },
        { label: 'Форма обучения', value: user.value.educationForm },
        { label: 'Курс', value: user.value.course },
      ]

    case 'teacher':
      return [
        { label: 'Должность', value: user.value.position },
        { label: 'Кафедра', value: user.value.department },
        { label: 'Кабинет', value: user.value.cabinet },
      ]

    default:
      return [
        { label: 'Должность', value: user.value.position },
        {
          label: 'Структурное подразделение',
          value: user.value.department,
        },
        { label: 'Кабинет', value: user.value.cabinet },
      ]
  }
})

const buttons = computed(() => {
  switch (role.value) {
    case 'student':
      return [
        {
          text: 'Перейти к моему расписанию',
          action: goToMySchedule,
        },
      ]

    case 'teacher':
      return [
        {
          text: 'Перейти к моему расписанию',
          action: goToMySchedule,
        },
        {
          text: 'Составить отчёт',
          action: () => {},
        },
      ]

    default:
      return []
  }
})
</script>

<template>
  <PageFrame>
    <section class="profile-page">
      <div class="profile-card">
        <div class="photo-block">
          <img
            v-if="userPhoto"
            :src="userPhoto"
            alt="Фото пользователя"
            class="profile-photo"
          />
          <div v-else class="photo-placeholder">
            <span>ФОТО</span>
          </div>
        </div>

        <div class="profile-info">
          <div class="fullname">
            <p>{{ user?.surname || 'Фамилия' }}</p>
            <p>{{ user?.name || 'Имя' }}</p>
            <p>{{ user?.patronymic || 'Отчество' }}</p>

            <div class="divider"></div>
          </div>

          <div class="details">
            <div
              v-for="field in profileFields"
              :key="field.label"
              class="detail-row"
            >
              <span class="label">{{ field.label }}:</span>
              <span class="value">{{ field.value }}</span>
            </div>
          </div>

          <div v-if="buttons.length" class="actions">
            <button
              v-for="button in buttons"
              :key="button.text"
              class="action-btn"
              @click="button.action"
            >
              {{ button.text }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </PageFrame>
</template>

