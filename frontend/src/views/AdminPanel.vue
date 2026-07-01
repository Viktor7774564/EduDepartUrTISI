<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageFrame from '@/components/PageFrame.vue'

const route = useRoute()
const router = useRouter()

const isChildRouteActive = computed(() => {
  return route.name === 'admin-edit-user'
      || route.name === 'admin-user-edit'
      || route.name === 'admin-add-user'
      || route.name === 'admin-sessions'
      || route.name === 'admin-academic-structure'
})

const goToAddUser = () => {
  router.push({ name: 'admin-add-user' })
}

const goToEditUser = () => {
  router.push({ name: 'admin-edit-user' })
}

const goToSessions = () => {
  router.push({ name: 'admin-sessions' })
}

const goToAcademicStructure = () => {
  router.push({ name: 'admin-academic-structure' })
}
</script>

<template>
  <PageFrame>
    <section v-if="!isChildRouteActive" class="admin-panel-page">
      <div class="admin-card">
        <h1 class="admin-title">Админ панель</h1>

        <div class="admin-actions">
          <button class="admin-btn" @click="goToAddUser">
            Добавить пользователя
          </button>
          <button class="admin-btn" @click="goToEditUser">
            Управление пользователями
          </button>
          <button class="admin-btn" @click="goToSessions">
            Активные сессии
          </button>
          <button class="admin-btn" @click="goToAcademicStructure">
            Структура
          </button>
        </div>
      </div>
    </section>

    <router-view />
  </PageFrame>
</template>
