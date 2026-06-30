<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageFrame from '@/components/PageFrame.vue'
import editIcon from '@/assets/edit.svg'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import type { AdminUser } from '@/api/admin'
import type { UserRole } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const usersStore = useUsersStore()

const deletingUserId = ref<number | null>(null)
const pageError = ref('')

onMounted(async () => {
  if (!authStore.isAuthenticated || authStore.currentUser?.role !== 'admin') {
    await router.replace({ name: 'home' })
    return
  }

  try {
    await usersStore.loadUsers()
  } catch {
    pageError.value = usersStore.error ?? 'Не удалось загрузить пользователей'
  }
})

const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    admin: 'Администратор',
    student: 'Студент',
    teacher: 'Преподаватель',
    education_department: 'Учебный отдел',
  }
  return labels[role]
}

const getFullName = (user: AdminUser): string => {
  const patronymicInitial = user.patronymic
      ? ` ${user.patronymic.charAt(0)}.`
      : ''

  return `${user.surname} ${user.name.charAt(0)}.${patronymicInitial}`.trim()
}

const formatStatus = (user: AdminUser): string => {
  return user.isActive ? 'Активен' : 'Неактивен'
}

const goBack = async () => {
  await router.push({ name: 'admin-panel' })
}

const editUser = async (user: AdminUser) => {
  await router.push({ name: 'admin-user-edit', params: { id: String(user.id) } })
}

const deleteUser = async (user: AdminUser) => {
  if (user.id === authStore.currentUser?.id) {
    pageError.value = 'Нельзя удалить собственную учётную запись'
    return
  }

  const confirmed = window.confirm(
      `Удалить пользователя ${user.login}? Это действие нельзя отменить.`,
  )

  if (!confirmed) {
    return
  }

  deletingUserId.value = user.id
  pageError.value = ''

  try {
    await usersStore.removeUser(user.id)
  } catch (err: any) {
    pageError.value = err.response?.data?.message || 'Не удалось удалить пользователя'
  } finally {
    deletingUserId.value = null
  }
}
</script>

<template>
  <PageFrame>
    <section class="admin-edit-page">
      <div class="admin-card">
        <div class="card-header">
          <button class="back-btn" type="button" @click="goBack" aria-label="Назад">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h1 class="card-title">Управление пользователями</h1>
        </div>

        <div class="card-subtitle">Список пользователей системы</div>

        <p v-if="pageError" class="submit-message error">{{ pageError }}</p>
        <p v-else-if="usersStore.isLoading" class="card-subtitle">Загрузка...</p>
        <p v-else-if="usersStore.users.length === 0" class="card-subtitle">
          Пользователи не найдены
        </p>

        <div v-else class="users-table">
          <div class="table-header">
            <div class="col-name">ФИО</div>
            <div class="col-login">Логин</div>
            <div class="col-role">Роль</div>
            <div class="col-status">Статус</div>
            <div class="col-actions"></div>
          </div>

          <div v-for="user in usersStore.users" :key="user.id" class="table-row">
            <div class="col-name" :title="`${user.surname} ${user.name} ${user.patronymic}`">
              {{ getFullName(user) }}
            </div>
            <div class="col-login">{{ user.login }}</div>
            <div class="col-role">{{ getRoleLabel(user.role) }}</div>
            <div class="col-status" :class="{ inactive: !user.isActive }">
              {{ formatStatus(user) }}
            </div>
            <div class="col-actions">
              <button
                class="edit-btn"
                type="button"
                @click="editUser(user)"
                aria-label="Редактировать"
              >
                <img :src="editIcon" alt="" aria-hidden="true" />
              </button>
              <button
                class="close-btn"
                type="button"
                :disabled="deletingUserId === user.id || user.id === authStore.currentUser?.id"
                @click="deleteUser(user)"
                aria-label="Удалить"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </PageFrame>
</template>
