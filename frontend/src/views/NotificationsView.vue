<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  getPushSubscriptionStatus,
  registerPushSubscription,
  unregisterPushSubscription,
  type PushSubscriptionStatus,
} from '@/api/pushNotifications'
import { useNotificationsStore } from '@/stores/notifications'

const notificationsStore = useNotificationsStore()

const pushStatus = ref<PushSubscriptionStatus | null>(null)
const pushActionMessage = ref('')
const isPushActionError = ref(false)
const isPushActionLoading = ref(false)

const pushStatusText = computed(() => {
  if (!pushStatus.value) {
    return 'Проверка поддержки push-уведомлений...'
  }

  if (!pushStatus.value.supported) {
    return pushStatus.value.hint
  }

  if (!pushStatus.value.serverEnabled) {
    return 'Push-уведомления временно недоступны: на сервере не настроены VAPID-ключи.'
  }

  if (pushStatus.value.permission === 'denied') {
    return 'Уведомления заблокированы в настройках браузера. Разрешите их, чтобы включить push.'
  }

  if (pushStatus.value.subscribed) {
    return 'Push-уведомления включены. Вы будете получать оповещения даже при закрытой вкладке.'
  }

  if (pushStatus.value.browserSubscribed) {
    return 'Подписка в браузере есть, но на сервере она не активна. Нажмите «Включить», чтобы синхронизировать.'
  }

  return 'Push-уведомления выключены. Нажмите «Включить», чтобы получать оповещения при закрытой вкладке.'
})

const canEnablePush = computed(() => {
  if (!pushStatus.value) {
    return false
  }

  return pushStatus.value.supported
    && pushStatus.value.serverEnabled
    && pushStatus.value.permission !== 'denied'
    && !pushStatus.value.subscribed
})

const canDisablePush = computed(() => {
  if (!pushStatus.value) {
    return false
  }

  return pushStatus.value.subscribed || pushStatus.value.browserSubscribed
})

async function refreshPushStatus() {
  pushStatus.value = await getPushSubscriptionStatus()
}

async function enablePushNotifications() {
  isPushActionLoading.value = true
  pushActionMessage.value = ''
  isPushActionError.value = false

  const result = await registerPushSubscription()
  pushActionMessage.value = result.message ?? ''
  isPushActionError.value = !result.success
  await refreshPushStatus()

  isPushActionLoading.value = false
}

async function disablePushNotifications() {
  isPushActionLoading.value = true
  pushActionMessage.value = ''
  isPushActionError.value = false

  const result = await unregisterPushSubscription()
  pushActionMessage.value = result.message ?? ''
  isPushActionError.value = !result.success
  await refreshPushStatus()

  isPushActionLoading.value = false
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    void refreshPushStatus()
  }
}

onMounted(() => {
  void notificationsStore.loadNotifications()
  void refreshPushStatus()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <section class="notifications-page">
    <div class="notifications-header">
      <div>
        <h1>Уведомления</h1>
        <p>Здесь отображаются изменения в вашем расписании.</p>
      </div>

      <button
          class="notifications-read-all"
          type="button"
          :disabled="notificationsStore.unreadCount === 0"
          @click="notificationsStore.markAllAsRead"
      >
        Отметить все прочитанными
      </button>
    </div>

    <div class="notifications-push-settings">
      <div class="notifications-push-settings__content">
        <h2>Push-уведомления</h2>
        <p>{{ pushStatusText }}</p>
        <p
            v-if="pushActionMessage"
            class="notifications-push-settings__message"
            :class="{ error: isPushActionError }"
        >
          {{ pushActionMessage }}
        </p>
      </div>

      <div class="notifications-push-settings__actions">
        <button
            v-if="canEnablePush"
            class="notifications-push-settings__button enable"
            type="button"
            :disabled="isPushActionLoading"
            @click="enablePushNotifications"
        >
          Включить
        </button>

        <button
            v-if="canDisablePush"
            class="notifications-push-settings__button disable"
            type="button"
            :disabled="isPushActionLoading"
            @click="disablePushNotifications"
        >
          Выключить
        </button>
      </div>
    </div>

    <p v-if="notificationsStore.isLoading" class="notifications-state">
      Загрузка уведомлений...
    </p>

    <p v-else-if="notificationsStore.error" class="notifications-state error">
      {{ notificationsStore.error }}
    </p>

    <div v-else-if="notificationsStore.notifications.length === 0" class="notifications-empty">
      Уведомлений пока нет
    </div>

    <ul v-else class="notifications-list">
      <li
          v-for="notification in notificationsStore.notifications"
          :key="notification.id"
          class="notification-card"
          :class="{ unread: !notification.isRead }"
      >
        <div class="notification-card__content">
          <h2>{{ notification.title }}</h2>
          <p>{{ notification.message }}</p>
          <time>{{ new Date(notification.createdAt).toLocaleString('ru-RU') }}</time>
        </div>

        <button
            v-if="!notification.isRead"
            type="button"
            @click="notificationsStore.markAsRead(notification.id)"
        >
          Прочитано
        </button>
      </li>
    </ul>
  </section>
</template>
