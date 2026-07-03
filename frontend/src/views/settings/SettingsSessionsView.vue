<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SettingsSectionLayout from '@/components/SettingsSectionLayout.vue'
import { fetchUserSessions, revokeUserSession, type UserSession } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useConfirmDialogStore } from '@/stores/confirmDialog'

const router = useRouter()
const authStore = useAuthStore()
const confirmDialog = useConfirmDialogStore()

const sessions = ref<UserSession[]>([])
const isLoading = ref(true)
const pageError = ref('')
const revokingSessionId = ref<number | null>(null)

const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const loadSessions = async () => {
  isLoading.value = true
  pageError.value = ''

  try {
    sessions.value = await fetchUserSessions()
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'response' in err
      && err.response && typeof err.response === 'object' && 'data' in err.response
      && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data
      ? String((err.response.data as { message?: unknown }).message)
      : 'Не удалось загрузить сессии'

    pageError.value = message
  } finally {
    isLoading.value = false
  }
}

const revokeSession = async (session: UserSession) => {
  const message = session.isCurrent
    ? 'Завершить текущую сессию? Вы будете перенаправлены на страницу входа.'
    : 'Завершить эту сессию на другом устройстве?'

  const confirmed = await confirmDialog.confirm({
    message,
    confirmText: 'Завершить',
    variant: session.isCurrent ? 'danger' : 'default',
  })

  if (!confirmed) {
    return
  }

  revokingSessionId.value = session.id
  pageError.value = ''

  try {
    const result = await revokeUserSession(session.id)

    if (result.currentSessionRevoked) {
      await authStore.clearSession()
      await router.replace({ name: 'login' })
      return
    }

    sessions.value = sessions.value.filter((item) => item.id !== session.id)
  } catch (err: unknown) {
    const message = err && typeof err === 'object' && 'response' in err
      && err.response && typeof err.response === 'object' && 'data' in err.response
      && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data
      ? String((err.response.data as { message?: unknown }).message)
      : 'Не удалось завершить сессию'

    pageError.value = message
  } finally {
    revokingSessionId.value = null
  }
}

onMounted(() => {
  void loadSessions()
})
</script>

<template>
  <SettingsSectionLayout title="Активные сессии">

    <p v-if="pageError" class="settings-message error">{{ pageError }}</p>
    <p v-else-if="isLoading" class="settings-sessions-status">Загрузка...</p>
    <p v-else-if="sessions.length === 0" class="settings-sessions-status">
      Активных сессий нет
    </p>

    <ul v-else class="settings-sessions-list">
      <li
        v-for="session in sessions"
        :key="session.id"
        class="settings-session-item"
        :class="{ 'settings-session-item--current': session.isCurrent }"
      >
        <div class="settings-session-item__info">
          <span class="settings-session-item__title">
            {{ session.isCurrent ? 'Текущее устройство' : 'Другое устройство' }}
          </span>
          <span class="settings-session-item__date">
            Начало сессии: {{ formatDate(session.createdAt) }}
          </span>
        </div>

        <button
          class="settings-session-item__revoke"
          type="button"
          :disabled="revokingSessionId === session.id"
          @click="revokeSession(session)"
        >
          {{ revokingSessionId === session.id ? '...' : 'Завершить' }}
        </button>
      </li>
    </ul>
  </SettingsSectionLayout>
</template>
