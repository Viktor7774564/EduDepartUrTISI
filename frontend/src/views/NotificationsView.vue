<script setup lang="ts">
import { onMounted } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'

const notificationsStore = useNotificationsStore()

onMounted(() => {
  void notificationsStore.loadNotifications()
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
        <div>
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