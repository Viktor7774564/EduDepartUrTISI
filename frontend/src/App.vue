<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import logoUrtisi from '@/assets/urtisi-logo.png'
import avatarIcon from '@/assets/Avatar.png'
import caretIcon from '@/assets/Down.png'
import notificationIcon from '@/assets/notification.svg'
import { useAuthStore } from '@/stores/auth'
import type { ScheduleKind } from '@/views/schedule/scheduleOptions'
import { getPhotoUrl } from '@/config/api'
import { useNotificationsStore } from '@/stores/notifications'

const notificationsStore = useNotificationsStore()

const router = useRouter()
const authStore = useAuthStore()

const showAuthHeader = computed(() => authStore.isAuthenticated)
const currentUserName = computed(() => authStore.currentUser?.name ?? '')
const currentUserRole = computed(() => authStore.roleLabel)
const currentUserPhoto = computed(() => getPhotoUrl(authStore.currentUser?.photoUrl))

const isAdmin = computed(() => authStore.currentUser?.role === 'admin')
const isEducationDepartment = computed(() => authStore.currentUser?.role === 'education_department')

const mainLinks = [
  { id: 'teachers', title: 'Расписание преподавателей' },
  { id: 'students', title: 'Расписание студентов' },
  { id: 'auditories', title: 'Расписание аудиторий' },
  { id: 'consults', title: 'Расписание консультаций' },
]

const visibleMainLinks = computed(() => {
  if (authStore.currentUser?.role === 'student') {
    return mainLinks.filter((item) => item.id === 'students' || item.id === 'consults')
  }

  return mainLinks
})

const getScheduleRoute = (type: string) => ({
  name: 'schedule-selection' as const,
  params: { type: type as ScheduleKind },
})

const onLogout = async () => {
  isProfileOpen.value = false
  await authStore.logout()
  await router.push({ name: 'home' })
}

const goToProfile = async () => {
  isProfileOpen.value = false

  await router.push({ name: 'profile' })
}

const goToAdminPanel = async () => {
  isProfileOpen.value = false

  await router.push({ name: 'admin-panel' })
}

const goToScheduleUpload = async () => {
  isProfileOpen.value = false

  await router.push({ name: 'schedule-upload' })
}

const isProfileOpen = ref(false)
let connectedNotificationsToken: string | null = null

const toggleProfileMenu = () => {
  isProfileOpen.value = !isProfileOpen.value
}

const syncNotificationsConnection = () => {
  if (!authStore.isAuthenticated) {
    notificationsStore.disconnectLiveUpdates()
    connectedNotificationsToken = null
    return
  }

  const accessToken = localStorage.getItem('access_token')

  if (!accessToken || accessToken === connectedNotificationsToken) {
    return
  }

  connectedNotificationsToken = accessToken
  void notificationsStore.loadNotifications()
  notificationsStore.connectLiveUpdates(accessToken)
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement

  if (!target.closest('.profile-wrapper')) {
    isProfileOpen.value = false
  }
}

const handleTokenRefreshed = () => {
  connectedNotificationsToken = null
  syncNotificationsConnection()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('auth:token-refreshed', handleTokenRefreshed)

  syncNotificationsConnection()

  sessionCheckTimer = window.setInterval(async () => {
    if (!authStore.isAuthenticated) {
      return
    }

    await authStore.validateSession()
  }, 15000)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('auth:token-refreshed', handleTokenRefreshed)
  notificationsStore.disconnectLiveUpdates()
  if (sessionCheckTimer !== null) {
    window.clearInterval(sessionCheckTimer)
  }
})

watch(
  () => authStore.isAuthenticated,
  () => {
    syncNotificationsConnection()
  },
)

let sessionCheckTimer: number | null = null

const handleVisibilityChange = async () => {
  if (document.visibilityState !== 'visible' || !authStore.isAuthenticated) {
    return
  }

  await authStore.validateSession()
  syncNotificationsConnection()
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink class="brand" to="/" aria-label="УрТИСИ">
        <img :src="logoUrtisi" alt="Логотип УрТИСИ" />
      </RouterLink>

      <template v-if="showAuthHeader">
        <nav class="menu">
          <RouterLink
              v-for="link in visibleMainLinks"
              :key="link.id"
              :to="getScheduleRoute(link.id)"
          >
            {{ link.title }}
          </RouterLink>
        </nav>

        <div class="profile-actions">
          <RouterLink
            :to="{ name: 'notifications' }"
            class="notifications-icon-link"
            aria-label="Уведомления"
          >
            <img :src="notificationIcon" alt="" />
            <span v-if="notificationsStore.unreadCount > 0" class="notifications-badge">
              {{ notificationsStore.unreadCount }}
            </span>
          </RouterLink>

          <div class="profile-wrapper">
            <button class="profile-btn" type="button" @click="toggleProfileMenu">
              <img
                class="profile-icon"
                :src="currentUserPhoto || avatarIcon"
                alt=""
              />
              <span class="profile-name">{{ currentUserName }}</span>
              <span class="profile-role">{{ currentUserRole }}</span>
              <img class="caret" :src="caretIcon" alt="" />
            </button>

            <div v-if="isProfileOpen" class="profile-dropdown">
              <button
                class="dropdown-item"
                type="button"
                @click="goToProfile"
              >
                Личный кабинет
              </button>

              <button
                v-if="isAdmin"
                class="dropdown-item"
                type="button"
                @click="goToAdminPanel"
              >
                Админ панель
              </button>

              <button
                v-if="isEducationDepartment"
                class="dropdown-item"
                type="button"
                @click="goToScheduleUpload"
              >
                Загрузка расписания
              </button>

              <button
                class="dropdown-item danger"
                type="button"
                @click="onLogout"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="header-spacer" />
        <RouterLink to="/login">
          <button class="signin-btn" type="button">Войти</button>
        </RouterLink>
      </template>
    </header>

    <main class="page-content">
      <RouterView />
    </main>

    <footer class="bottombar" />
  </div>
</template>

