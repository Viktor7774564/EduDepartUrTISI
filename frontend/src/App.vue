<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import logoUrtisi from '@/assets/urtisi-logo.png'
import avatarIcon from '@/assets/Avatar.png'
import caretIcon from '@/assets/Down.png'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const showAuthHeader = computed(() => authStore.isAuthenticated)
const currentUserName = computed(() => authStore.currentUser?.name ?? '')
const currentUserRole = computed(() => authStore.roleLabel)

const mainLinks = [
  { id: 'teachers', title: 'Расписание преподавателей' },
  { id: 'students', title: 'Расписание студентов' },
  { id: 'auditories', title: 'Расписание аудитории' },
  { id: 'consults', title: 'Расписание консультаций' },
]

const visibleMainLinks = computed(() => {
  if (authStore.currentUser?.role === 'student') {
    return mainLinks.filter((item) => item.id === 'students' || item.id === 'consults')
  }

  return mainLinks
})

const onLogout = async () => {
  authStore.logout()
  await router.push({ name: 'home' })
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink class="brand" to="/" aria-label="УрТИСИ">
        <img :src="logoUrtisi" alt="Логотип УрТИСИ" />
      </RouterLink>

      <template v-if="showAuthHeader">
        <nav class="menu" aria-label="Навигация">
          <a v-for="link in visibleMainLinks" :key="link.id" href="#">{{ link.title }}</a>
        </nav>

        <div class="profile-actions">
          <button class="profile-btn" type="button" aria-label="Профиль пользователя">
            <img class="profile-icon" :src="avatarIcon" alt="" />
            <span>{{ currentUserName }}</span>
            <span class="profile-role">{{ currentUserRole }}</span>
            <img class="caret" aria-hidden="true" :src="caretIcon" alt="" />
          </button>

          <button class="logout-btn" type="button" @click="onLogout">Выйти</button>
        </div>
      </template>

      <template v-else>
        <div class="header-spacer" />
        <RouterLink to="/login">
          <button class="signin-btn" type="button">Войти</button>
        </RouterLink>
      </template>
    </header>

    <RouterView />

    <footer class="bottombar" />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #e8e8e8;
  color: #101215;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  min-height: 95px;
  padding: 0 40px;
  background: #333840;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
}

.brand {
  display: inline-flex;
}

.header-spacer {
  min-height: 1px;
}

.menu {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 26px;
  min-width: 0;
}

.menu a {
  color: #f0f4f7;
  text-decoration: none;
  font-size: 21px;
  line-height: 1.2;
  white-space: nowrap;
}

.profile-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.signin-btn,
.profile-btn,
.logout-btn {
  border: 0;
  cursor: pointer;
  border-radius: 12px;
  color: #eaf3f9;
}

.signin-btn {
  min-width: 146px;
  height: 57px;
  background: #4ea3d7;
  font-size: 21px;
}

.profile-btn {
  background: transparent;
  min-height: 62px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
}

.profile-role {
  color: rgb(234 243 249 / 75%);
  font-size: 15px;
}

.logout-btn {
  min-width: 104px;
  height: 44px;
  background: rgb(255 255 255 / 10%);
  font-size: 16px;
}

.profile-icon {
  width: 28px;
  height: 28px;
  display: inline-block;
}

.caret {
  width: 14px;
  height: 8px;
}

.bottombar {
  height: 85px;
  background: #333840;
}

@media (max-width: 1360px) {
  .topbar {
    padding: 14px 18px;
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .menu {
    gap: 12px;
  }

  .menu a {
    font-size: clamp(14px, 2.6vw, 20px);
  }

  .profile-actions {
    flex-direction: column;
  }

  .signin-btn,
  .profile-btn {
    min-width: 130px;
    height: 52px;
    font-size: 20px;
  }

  .logout-btn {
    min-width: 130px;
    height: 44px;
    font-size: 18px;
  }

  .profile-icon {
    width: 18px;
    height: 18px;
  }
}
</style>
