<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminSessionsStore } from '@/stores/adminSessions'
import { getErrorRoute } from '@/config/errorPages'
import PageFrame from '@/components/PageFrame.vue'
import type { UserRole } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const sessionsStore = useAdminSessionsStore()

const revokingSessionId = ref<number | null>(null)
const pageError = ref('')
const searchQuery = ref('')

const filteredSessions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return sessionsStore.sessions
  }

  return sessionsStore.sessions.filter((session) =>
      session.fullName.toLowerCase().includes(query)
      || session.login.toLowerCase().includes(query)
      || getRoleLabel(session.role).toLowerCase().includes(query),
  )
})

onMounted(async () => {
  if (!authStore.isAuthenticated || authStore.currentUser?.role !== 'admin') {
    await router.replace(getErrorRoute('403'))
    return
  }

  const accessToken = localStorage.getItem('access_token')

  if (!accessToken) {
    pageError.value = 'Не найден access token для live-обновлений'
    return
  }

  sessionsStore.connectLiveUpdates(accessToken)
})

onUnmounted(() => {
  sessionsStore.disconnectLiveUpdates()
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

const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const goBack = async () => {
  await router.push({ name: 'admin-panel' })
}

const revokeSession = async (sessionId: number, login: string) => {
  const confirmed = window.confirm(
      `Завершить сессию пользователя ${login}?`,
  )

  if (!confirmed) {
    return
  }

  revokingSessionId.value = sessionId
  pageError.value = ''

  try {
    await sessionsStore.revokeSession(sessionId)
  } catch (err: any) {
    pageError.value = err.response?.data?.message || 'Не удалось завершить сессию'
  } finally {
    revokingSessionId.value = null
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
          <h1 class="card-title">Активные сессии</h1>
        </div>

        <p v-if="pageError" class="submit-message error">{{ pageError }}</p>
        <p v-else-if="sessionsStore.error" class="submit-message error">{{ sessionsStore.error }}</p>
        <p v-else-if="sessionsStore.isLoading" class="card-subtitle">Подключение...</p>
        <p v-else-if="sessionsStore.sessions.length === 0" class="card-subtitle">
          Активных сессий нет
        </p>

        <template v-else>
          <input
            v-model="searchQuery"
            class="users-search"
            type="search"
            placeholder="Поиск по ФИО, логину или роли"
          >

          <p v-if="filteredSessions.length === 0" class="card-subtitle">
            По вашему запросу ничего не найдено
          </p>

          <div v-else class="users-table sessions-table">
            <div class="table-header">
              <div class="col-name">Пользователь</div>
              <div class="col-login">Логин</div>
              <div class="col-role">Роль</div>
              <div class="col-created">Начало сессии</div>
              <div class="col-actions"></div>
            </div>

            <div
              v-for="session in filteredSessions"
              :key="session.id"
              class="table-row"
            >
              <div class="col-name">{{ session.fullName }}</div>
              <div class="col-login">{{ session.login }}</div>
              <div class="col-role">{{ getRoleLabel(session.role) }}</div>
              <div class="col-created">{{ formatDate(session.createdAt) }}</div>
              <div class="col-actions">
                <button
                  class="close-btn"
                  type="button"
                  :disabled="revokingSessionId === session.id"
                  @click="revokeSession(session.id, session.login)"
                >
                  {{ revokingSessionId === session.id ? '...' : '✕' }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>
  </PageFrame>
</template>
