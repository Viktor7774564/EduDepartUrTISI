<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getPushSubscriptionStatus,
  registerPushSubscription,
  unregisterPushSubscription,
  type PushSubscriptionStatus,
} from '@/api/pushNotifications'
import { useNotificationsStore } from '@/stores/notifications'

const route = useRoute()
const router = useRouter()
const notificationsStore = useNotificationsStore()

const pushStatus = ref<PushSubscriptionStatus | null>(null)
const pushActionMessage = ref('')
const isPushActionError = ref(false)
const isPushActionLoading = ref(false)
const highlightedNotificationId = ref<number | null>(null)

let highlightTimer: number | null = null

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

function parseNotificationIdFromRoute(): number | null {
  const rawId = route.query.id

  if (typeof rawId !== 'string') {
    return null
  }

  const notificationId = Number(rawId)

  return Number.isInteger(notificationId) && notificationId > 0
    ? notificationId
    : null
}

async function focusNotificationFromRoute() {
  const notificationId = parseNotificationIdFromRoute()

  if (!notificationId) {
    return
  }

  if (notificationsStore.isLoading) {
    await notificationsStore.loadNotifications()
  }

  const notification = notificationsStore.notifications.find((item) => item.id === notificationId)

  if (!notification) {
    return
  }

  highlightedNotificationId.value = notificationId

  if (highlightTimer !== null) {
    window.clearTimeout(highlightTimer)
  }

  await nextTick()

  document.getElementById(`notification-${notificationId}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  if (!notification.isRead) {
    await notificationsStore.markAsRead(notificationId)
  }

  if (route.query.id) {
    await router.replace({ name: 'notifications' })
  }

  highlightTimer = window.setTimeout(() => {
    highlightedNotificationId.value = null
    highlightTimer = null
  }, 3000)
}

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

watch(
  () => route.query.id,
  () => {
    void focusNotificationFromRoute()
  },
)

onMounted(async () => {
  await notificationsStore.loadNotifications()
  void refreshPushStatus()
  await focusNotificationFromRoute()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)

  if (highlightTimer !== null) {
    window.clearTimeout(highlightTimer)
  }
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
          :id="`notification-${notification.id}`"
          :key="notification.id"
          class="notification-card"
          :class="{
            unread: !notification.isRead,
            highlighted: highlightedNotificationId === notification.id,
          }"
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
