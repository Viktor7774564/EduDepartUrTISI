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

const isAdmin = computed(() => authStore.currentUser?.role === 'admin')

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

const goToProfile = async () => {
  isProfileOpen.value = false

  await router.push({ name: 'profile' })
}

const goToAdminPanel = async () => {
  isProfileOpen.value = false

  await router.push({ name: 'admin-panel' })
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

<style scoped>
.app-shell {
  @apply min-h-screen flex flex-col bg-[#e8e8e8] text-[#101215];
}

.page-content {
  @apply flex-1 flex flex-col;
}

.topbar {
  @apply sticky top-0 z-[1000] min-h-[72px] px-[28px] bg-[#333840] grid grid-cols-[auto_1fr_auto] items-center gap-[18px];
}

.brand img {
  @apply h-[58px];
}

.menu {
  @apply flex justify-center gap-[18px];
}

.menu a {
  @apply text-[#f0f4f7] no-underline text-[16px] py-[14px] px-[16px] pb-[12px] rounded-[14px];
}


.profile-wrapper {
  @apply relative;
}

.profile-actions {
  @apply justify-self-end;
}

.profile-btn {
  @apply bg-transparent border-0 cursor-pointer text-[#eaf3f9] flex items-center gap-[10px] text-[15px] py-[6px] px-[10px] rounded-[10px];
}

.profile-role {
  @apply text-[12px] text-[rgba(234,243,249,0.7)];
}

.profile-icon {
  @apply w-[24px] h-[24px];
}

.caret {
  @apply w-[12px] h-[8px];
}

.profile-dropdown {
  @apply absolute top-[calc(100%+10px)] right-0 bg-white rounded-[12px] min-w-[180px] shadow-[0_10px_25px_rgba(0,0,0,0.15)] overflow-hidden z-[2000] flex flex-col;
}

.dropdown-item {
  @apply w-full py-[12px] px-[14px] border-0 bg-transparent text-left cursor-pointer text-[14px];
}

.dropdown-item:hover {
  @apply bg-[rgba(0,0,0,0.05)];
}

.dropdown-item.danger {
  @apply text-[#c43636];
}

.signin-btn {
  @apply min-w-[120px] h-[40px] bg-[#4ea3d7] border-0 rounded-[10px] text-white cursor-pointer;
}

.bottombar {
  @apply h-[85px] bg-[#333840];
}

@media (max-width: 1100px) {
  .topbar {
    grid-template-columns: auto 1fr;
    grid-template-areas:
      'brand auth'
      'menu menu';
    padding: 14px 18px;
  }

  .brand {
    grid-area: brand;
  }

  .profile-actions {
    grid-area: auth;
    justify-self: end;
  }

  .menu {
    grid-area: menu;
  }

  .menu {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .topbar {
    grid-template-columns: auto 1fr;
    grid-template-areas:
      'brand auth'
      'menu menu';
    gap: 10px;
    padding: 10px 12px;
    min-height: auto;
  }

  .brand img {
    @apply h-[44px];
  }

  .menu,
  .signin-btn,
  .header-spacer {
    display: none;
  }

  .profile-actions {
    @apply justify-self-end;
  }

  .profile-btn {
    @apply gap-[6px] px-[8px] py-[4px] text-[13px];
  }

  .profile-role {
    @apply hidden;
  }

  .profile-icon {
    @apply w-[20px] h-[20px];
  }

  .caret {
    @apply w-[10px] h-[7px];
  }

  .bottombar {
    @apply h-[56px];
  }
}
</style>
