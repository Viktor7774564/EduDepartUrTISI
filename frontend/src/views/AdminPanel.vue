<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageFrame from '@/components/PageFrame.vue'
import { useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Проверяем, если активен дочерний маршрут — скрываем контент родителя
const isChildRouteActive = computed(() => {
  return route.name === 'admin-edit-user' || route.name === 'admin-add-user'
})

const goToAddUser = () => {
  router.push({ name: 'admin-add-user' })
}

const goToEditUser = () => {
  router.push({ name: 'admin-edit-user' })
}
</script>

<template>
  <PageFrame>
    <!-- Показываем контент только если нет активного дочернего маршрута -->
    <section v-if="!isChildRouteActive" class="admin-panel-page">
      <div class="admin-card">
        <h1 class="admin-title">Админ панель</h1>

        <div class="admin-actions">
          <button class="admin-btn" @click="goToAddUser">
            Добавить пользователя
          </button>
          <button class="admin-btn" @click="goToEditUser">
            Изменить пользователя
          </button>
        </div>
      </div>
    </section>

    <!-- RouterView для дочерних маршрутов -->
    <router-view />
  </PageFrame>
</template>

