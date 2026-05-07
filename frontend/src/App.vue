<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import logoUrtisi from '@/assets/urtisi-logo.png'
import avatarIcon from '@/assets/Avatar.png'
import caretIcon from '@/assets/Down.png'
import { useAuthStore } from '@/stores/auth'
import type { ScheduleKind } from '@/views/schedule/scheduleOptions'

const router = useRouter()
const authStore = useAuthStore()

const showAuthHeader = computed(() => authStore.isAuthenticated)
const currentUserName = computed(() => authStore.currentUser?.name ?? '')
const currentUserRole = computed(() => authStore.roleLabel)

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
  authStore.logout()
  isProfileOpen.value = false
  await router.push({ name: 'home' })
}

const isProfileOpen = ref(false)

const toggleProfileMenu = () => {
  isProfileOpen.value = !isProfileOpen.value
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement

  if (!target.closest('.profile-wrapper')) {
    isProfileOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
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
          <div class="profile-wrapper">
            <button class="profile-btn" type="button" @click="toggleProfileMenu">
              <img class="profile-icon" :src="avatarIcon" alt="" />
              <span>{{ currentUserName }}</span>
              <span class="profile-role">{{ currentUserRole }}</span>
              <img class="caret" :src="caretIcon" alt="" />
            </button>

            <div v-if="isProfileOpen" class="profile-dropdown">
              <button class="dropdown-item" type="button">Личный кабинет</button>
              <button class="dropdown-item danger" type="button" @click="onLogout">
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

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #e8e8e8;
  color: #101215;
}

.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  min-height: 72px;
  padding: 0 28px;
  background: #333840;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
}

.brand img {
  height: 58px;
}

.menu {
  display: flex;
  justify-content: center;
  gap: 18px;
}

.menu a {
  color: #f0f4f7;
  text-decoration: none;
  font-size: 16px;
  padding: 14px 16px 12px;
  border-radius: 14px;
}


.profile-wrapper {
  position: relative;
}

.profile-btn {
  background: transparent;
  border: 0;
  cursor: pointer;
  color: #eaf3f9;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  padding: 6px 10px;
  border-radius: 10px;
}

.profile-role {
  font-size: 12px;
  color: rgba(234, 243, 249, 0.7);
}

.profile-icon {
  width: 24px;
  height: 24px;
}

.caret {
  width: 12px;
  height: 8px;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: #fff;
  border-radius: 12px;
  min-width: 180px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 2000;
  display: flex;
  flex-direction: column;
}

.dropdown-item {
  width: 100%;
  padding: 12px 14px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
}

.dropdown-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.dropdown-item.danger {
  color: #c43636;
}

.signin-btn {
  min-width: 120px;
  height: 40px;
  background: #4ea3d7;
  border: 0;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
}

.bottombar {
  height: 85px;
  background: #333840;
}

@media (max-width: 1100px) {
  .topbar {
    grid-template-columns: auto 1fr;
    grid-template-areas:
      'brand auth'
      'menu menu';
    padding: 14px 18px;
  }

  .menu {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>