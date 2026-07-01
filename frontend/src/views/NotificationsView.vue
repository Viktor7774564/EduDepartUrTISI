<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  fetchConsultationNotificationPreferences,
  fetchConsultationNotificationTeachers,
  updateConsultationNotificationPreferences,
  type ConsultationNotificationPreference,
  type ConsultationTeacherOption,
} from '@/api/notifications'
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

const consultationPrefs = ref<ConsultationNotificationPreference>({
  enabled: false,
  allTeachers: true,
  teacherIds: [],
})
const savedConsultationPrefs = ref<ConsultationNotificationPreference>({
  enabled: false,
  allTeachers: true,
  teacherIds: [],
})
const teacherOptions = ref<ConsultationTeacherOption[]>([])
const teacherSearchQuery = ref('')
const isConsultationPrefsLoading = ref(false)
const isConsultationPrefsSaving = ref(false)
const consultationPrefsMessage = ref('')
const isConsultationPrefsError = ref(false)

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

const filteredTeacherOptions = computed(() => {
  const query = teacherSearchQuery.value.trim().toLowerCase()

  if (!query) {
    return teacherOptions.value
  }

  return teacherOptions.value.filter((teacher) =>
      teacher.name.toLowerCase().includes(query)
      || teacher.departmentLabel.toLowerCase().includes(query),
  )
})

const isConsultationPrefsDirty = computed(() =>
    JSON.stringify(consultationPrefs.value) !== JSON.stringify(savedConsultationPrefs.value),
)

const canSaveConsultationPrefs = computed(() => {
  if (!isConsultationPrefsDirty.value || isConsultationPrefsSaving.value) {
    return false
  }

  if (!consultationPrefs.value.enabled) {
    return true
  }

  if (consultationPrefs.value.allTeachers) {
    return true
  }

  return consultationPrefs.value.teacherIds.length > 0
})

function cloneConsultationPrefs(
    value: ConsultationNotificationPreference,
): ConsultationNotificationPreference {
  return {
    enabled: value.enabled,
    allTeachers: value.allTeachers,
    teacherIds: [...value.teacherIds],
  }
}

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

async function loadConsultationPreferences() {
  isConsultationPrefsLoading.value = true
  consultationPrefsMessage.value = ''
  isConsultationPrefsError.value = false

  try {
    const [preferences, teachers] = await Promise.all([
      fetchConsultationNotificationPreferences(),
      fetchConsultationNotificationTeachers(),
    ])

    consultationPrefs.value = cloneConsultationPrefs(preferences)
    savedConsultationPrefs.value = cloneConsultationPrefs(preferences)
    teacherOptions.value = teachers
  } catch {
    consultationPrefsMessage.value = 'Не удалось загрузить настройки консультаций'
    isConsultationPrefsError.value = true
  } finally {
    isConsultationPrefsLoading.value = false
  }
}

function setConsultationMode(allTeachers: boolean) {
  consultationPrefs.value.allTeachers = allTeachers

  if (allTeachers) {
    consultationPrefs.value.teacherIds = []
  }
}

function toggleTeacherSelection(teacherId: number) {
  const selectedIds = new Set(consultationPrefs.value.teacherIds)

  if (selectedIds.has(teacherId)) {
    selectedIds.delete(teacherId)
  } else {
    selectedIds.add(teacherId)
  }

  consultationPrefs.value.teacherIds = [...selectedIds]
}

async function saveConsultationPreferences() {
  isConsultationPrefsSaving.value = true
  consultationPrefsMessage.value = ''
  isConsultationPrefsError.value = false

  try {
    const saved = await updateConsultationNotificationPreferences({
      enabled: consultationPrefs.value.enabled,
      allTeachers: consultationPrefs.value.allTeachers,
      teacherIds: consultationPrefs.value.allTeachers
          ? []
          : [...consultationPrefs.value.teacherIds],
    })

    consultationPrefs.value = cloneConsultationPrefs(saved)
    savedConsultationPrefs.value = cloneConsultationPrefs(saved)
    consultationPrefsMessage.value = 'Настройки сохранены'
  } catch {
    consultationPrefsMessage.value = 'Не удалось сохранить настройки'
    isConsultationPrefsError.value = true
  } finally {
    isConsultationPrefsSaving.value = false
  }
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
  await Promise.all([
    notificationsStore.loadNotifications(),
    loadConsultationPreferences(),
  ])
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
        <p>Здесь отображаются изменения в расписании и консультациях.</p>
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

    <div class="notifications-consultation-settings">
      <div class="notifications-consultation-settings__content">
        <h2>Уведомления о консультациях</h2>
        <p>
          Выберите, о консультациях каких преподавателей вы хотите получать оповещения.
        </p>

        <p v-if="isConsultationPrefsLoading" class="notifications-consultation-settings__hint">
          Загрузка настроек...
        </p>

        <template v-else>
          <label class="notifications-consultation-settings__toggle">
            <input
                v-model="consultationPrefs.enabled"
                type="checkbox"
            >
            <span>Получать уведомления о консультациях</span>
          </label>

          <div
              v-if="consultationPrefs.enabled"
              class="notifications-consultation-settings__mode"
          >
            <label class="notifications-consultation-settings__radio">
              <input
                  :checked="consultationPrefs.allTeachers"
                  type="radio"
                  name="consultation-mode"
                  @change="setConsultationMode(true)"
              >
              <span>Все преподаватели</span>
            </label>

            <label class="notifications-consultation-settings__radio">
              <input
                  :checked="!consultationPrefs.allTeachers"
                  type="radio"
                  name="consultation-mode"
                  @change="setConsultationMode(false)"
              >
              <span>Только выбранные преподаватели</span>
            </label>
          </div>

          <div
              v-if="consultationPrefs.enabled && !consultationPrefs.allTeachers"
              class="notifications-consultation-settings__teachers"
          >
            <input
                v-model="teacherSearchQuery"
                class="notifications-consultation-settings__search"
                type="search"
                placeholder="Поиск преподавателя или кафедры"
            >

            <p
                v-if="teacherOptions.length === 0"
                class="notifications-consultation-settings__hint"
            >
              Пока нет преподавателей для подписки.
            </p>

            <p
                v-else-if="filteredTeacherOptions.length === 0"
                class="notifications-consultation-settings__hint"
            >
              По вашему запросу ничего не найдено.
            </p>

            <ul v-else class="notifications-consultation-settings__teacher-list">
              <li
                  v-for="teacher in filteredTeacherOptions"
                  :key="teacher.id"
                  class="notifications-consultation-settings__teacher-item"
              >
                <label>
                  <input
                      :checked="consultationPrefs.teacherIds.includes(teacher.id)"
                      type="checkbox"
                      @change="toggleTeacherSelection(teacher.id)"
                  >
                  <span class="notifications-consultation-settings__teacher-name">
                    {{ teacher.name }}
                  </span>
                  <span class="notifications-consultation-settings__teacher-department">
                    {{ teacher.departmentLabel }}
                  </span>
                </label>
              </li>
            </ul>
          </div>
        </template>

        <p
            v-if="consultationPrefsMessage"
            class="notifications-consultation-settings__message"
            :class="{ error: isConsultationPrefsError }"
        >
          {{ consultationPrefsMessage }}
        </p>
      </div>

      <div class="notifications-consultation-settings__actions">
        <button
            class="notifications-consultation-settings__save"
            type="button"
            :disabled="!canSaveConsultationPrefs"
            @click="saveConsultationPreferences"
        >
          {{ isConsultationPrefsSaving ? 'Сохранение...' : 'Сохранить' }}
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