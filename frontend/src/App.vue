<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import logoUrtisi from '@/assets/urtisi-logo.png'

const route = useRoute()
const showAuthHeader = computed(() => route.meta.headerVariant === 'auth')

const mainLinks = [
  'Расписание преподавателей',
  'Расписание студентов',
  'Расписание аудитории',
  'Расписание консультаций',
]
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="/" aria-label="УрТИСИ">
        <img :src="logoUrtisi" alt="Логотип УрТИСИ" />
      </a>

      <template v-if="showAuthHeader">
        <nav class="menu" aria-label="Навигация">
          <a v-for="link in mainLinks" :key="link" href="#">{{ link }}</a>
        </nav>

        <button class="profile-btn" type="button" aria-label="Профиль пользователя">
          <img class="profile-icon" src="../src/assets/Avatar.png"></img>
          <span>Преподаватель</span>
          <img class="caret" aria-hidden="true" src="../src/assets/Down.png"></img>
        </button>
      </template>

      <template v-else>
        <div class="header-spacer" />
        <router-link to="/login">
          <button class="signin-btn" type="button">Войти</button>
        </router-link>
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

.signin-btn,
.profile-btn {
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
  gap: 14px;
  font-size: 21px;
}

.profile-icon {
  width: 28px;
  height: 28px;
  display: inline-block;
  position: relative;
}

.caret {
  font-size: 20px;
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

  .signin-btn,
  .profile-btn {
    min-width: 130px;
    height: 52px;
    font-size: 24px;
  }

  .profile-icon {
    width: 18px;
    height: 18px;
    border-width: 3px;
  }

  .profile-icon::after {
    width: 24px;
    height: 12px;
    border-width: 3px;
    top: 16px;
  }
}
</style>
