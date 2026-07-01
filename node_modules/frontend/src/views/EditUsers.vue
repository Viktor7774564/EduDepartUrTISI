<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageFrame from '@/components/PageFrame.vue'
import editIcon from '@/assets/edit.svg'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import type { AdminUser } from '@/api/admin'
import type { UserRole } from '@/stores/auth'


const searchQuery = ref('')
const roleFilter = ref<UserRole | ''>('')
const statusFilter = ref<'all' | 'active' | 'inactive'>('all')

const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return usersStore.users.filter((user) => {
    if (roleFilter.value && user.role !== roleFilter.value) {
      return false
    }

    if (statusFilter.value === 'active' && !user.isActive) {
      return false
    }

    if (statusFilter.value === 'inactive' && user.isActive) {
      return false
    }

    if (!query) {
      return true
    }

    const fullName = getFullName(user).toLowerCase()
    return (
        fullName.includes(query)
        || user.surname.toLowerCase().includes(query)
        || user.name.toLowerCase().includes(query)
        || (user.patronymic?.toLowerCase().includes(query) ?? false)
        || user.login.toLowerCase().includes(query)
    )
  })
})

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
    employee: 'Сотрудник',
  }
  return labels[role]
}

const getFullName = (user: AdminUser): string => {
  return [user.surname, user.name, user.patronymic]
      .filter(Boolean)
      .join(' ')
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

        <template v-else>
          <div class="users-filters">
            <input
              v-model="searchQuery"
              class="users-search"
              type="search"
              placeholder="Поиск по ФИО или логину"
            >

            <select v-model="roleFilter" class="users-filter-select">
              <option value="">Все роли</option>
              <option value="admin">Администратор</option>
              <option value="student">Студент</option>
              <option value="teacher">Преподаватель</option>
              <option value="employee">Сотрудник</option>
            </select>

            <select v-model="statusFilter" class="users-filter-select">
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
          </div>

          <p v-if="filteredUsers.length === 0" class="card-subtitle">
            По вашему запросу ничего не найдено
          </p>

          <div v-else class="users-table">
            <div class="table-header">
              <div class="col-name">ФИО</div>
              <div class="col-login">Логин</div>
              <div class="col-role">Роль</div>
              <div class="col-status">Статус</div>
              <div class="col-actions"></div>
            </div>

            <div v-for="user in filteredUsers" :key="user.id" class="table-row">
              <div class="col-name">
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
        </template>
      </div>
    </section>
  </PageFrame>
</template>
