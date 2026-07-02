<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageFrame from '@/components/PageFrame.vue'

const route = useRoute()
const router = useRouter()

const isChildRouteActive = computed(() => route.name !== 'settings')

const goToPassword = () => {
  void router.push({ name: 'settings-password' })
}

const goToSessions = () => {
  void router.push({ name: 'settings-sessions' })
}

const goToTheme = () => {
  void router.push({ name: 'settings-theme' })
}

const goToStartPage = () => {
  void router.push({ name: 'settings-start-page' })
}
</script>

<template>
  <PageFrame>
    <section v-if="!isChildRouteActive" class="settings-page">
      <div class="settings-card">
        <h1 class="settings-title">Настройки</h1>

        <div class="settings-actions">
          <button class="settings-btn" type="button" @click="goToPassword">
            Смена пароля
          </button>

          <button class="settings-btn" type="button" @click="goToSessions">
            Активные сессии
          </button>

          <button class="settings-btn" type="button" @click="goToTheme">
            Тема
          </button>
        </div>
      </div>
    </section>

    <RouterView />
  </PageFrame>
</template>
