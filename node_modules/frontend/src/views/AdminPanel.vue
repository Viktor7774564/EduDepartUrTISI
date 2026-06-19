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

<style scoped>
.admin-panel-page {
  @apply min-h-[calc(100vh-180px)] flex justify-center items-center py-[40px] px-[20px];
}

/* ===================== */
/* CARD */
/* ===================== */

.admin-card {
  @apply w-full max-w-[450px] min-h-[280px] bg-[#ececec] border border-[#4ea3d7] rounded-[18px] shadow-[0_6px_14px_rgba(0,0,0,0.15)] flex flex-col items-center gap-[36px] p-[48px] px-[42px] relative z-[2];
}

.admin-title {
  @apply text-[26px] font-medium m-0 text-center;
}

.admin-actions {
  @apply flex flex-col gap-[20px] w-full;
}

.admin-btn {
  @apply w-full h-[52px] border-0 rounded-[14px] bg-[#4ea3d7] text-white text-[15px] cursor-pointer transition-[transform,background-color] duration-[200ms];
}

.admin-btn:hover {
  @apply bg-[#3f96cb] translate-y-[-2px];
}
</style>
