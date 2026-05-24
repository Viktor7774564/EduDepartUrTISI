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
  min-height: calc(100vh - 180px);

  display: flex;
  justify-content: center;
  align-items: center;

  padding: 40px 20px;
}

/* ===================== */
/* CARD */
/* ===================== */

.admin-card {
  width: 100%;
  max-width: 450px;

  min-height: 280px;

  background: #ececec;

  border: 1px solid #4ea3d7;
  border-radius: 18px;

  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 36px;

  padding: 48px 42px;

  position: relative;
  z-index: 2;
}

.admin-title {
  font-size: 26px;
  font-weight: 500;
  margin: 0;
  text-align: center;
}

.admin-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.admin-btn {
  width: 100%;
  height: 52px;

  border: none;
  border-radius: 14px;

  background: #4ea3d7;
  color: white;

  font-size: 15px;

  cursor: pointer;

  transition:
    transform 0.2s,
    background 0.2s;
}

.admin-btn:hover {
  background: #3f96cb;
  transform: translateY(-2px);
}
</style>