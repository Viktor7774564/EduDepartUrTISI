<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import PageFrame from '@/components/PageFrame.vue'
import { useAuthStore } from '@/stores/auth'
import type { ScheduleKind } from '@/views/schedule/scheduleOptions'

const authStore = useAuthStore()

const menuCards = [
  { id: 'students', title: 'Расписание студентов', needAuth: false },
  { id: 'consults', title: 'Расписание консультаций', needAuth: true },
  { id: 'auditories', title: 'Расписание аудиторий', needAuth: true },
  { id: 'teachers', title: 'Расписание преподавателей', needAuth: true },
]

const visibleMenuCards = computed(() => {
  if (authStore.currentUser?.role === 'student') {
    return menuCards.filter((item) => item.id === 'students' || item.id === 'consults')
  }

  return menuCards
})

const getCardRoute = (type: string) => ({
  name: 'schedule-selection' as const,
  params: { type: type as ScheduleKind },
})
</script>

<template>
  <PageFrame>
    <main class="home-main">
      <h1>Расписание института</h1>
      <p>
        Удобный доступ к расписанию занятий для студентов, преподавателей, аудиторий и
        консультаций в одном месте.
      </p>

      <section class="cards-grid" aria-label="Категории расписания">
        <RouterLink
            v-for="item in visibleMenuCards"
            :key="item.id"
            class="menu-card"
            :to="getCardRoute(item.id)"
        >
          <h2>{{ item.title }}</h2>
          <p v-if="item.needAuth && !authStore.isAuthenticated">
            Требуется авторизация
          </p>
        </RouterLink>
      </section>
    </main>
  </PageFrame>
</template>

<style scoped>
.home-main {
  max-width: 1850px;
  margin: 0 auto;
  padding: 88px 36px 120px;
}

h1 {
  margin: 0;
  font-size: clamp(38px, 4.2vw, 40px);
  font-weight: 600;
}

.home-main > p {
  margin: 3vh 0 6vh;
  font-size: clamp(23px, 1.9vw, 25px);
  line-height: 1.35;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 9vh 37vh;
  justify-self: center;
}

.menu-card {
  position: relative;
  overflow: hidden;

  width: 38vh;
  min-height: 168px;

  display: grid;
  place-content: center;
  gap: 13px;

  border-radius: 18px;
  border: 1px solid #c8c8c8;

  background: #dcdcdc;
  box-shadow: 0 7px 10px rgb(0 0 0 / 20%);

  text-align: center;
  text-decoration: none;
  color: inherit;

  transition:
      transform 0.25s ease,
      box-shadow 0.25s ease,
      background-color 0.25s ease,
      color 0.25s ease;
}

/* ГРАДИЕНТНАЯ ПОЛОСА СВЕРХУ (как в меню) */
.menu-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;

  width: 100%;
  height: 5px;

  background: linear-gradient(90deg, #59b4ef 0%, #2d90d2 100%);

  transform: scaleX(0);
  transform-origin: left center;

  transition: transform 0.32s ease;
}

.menu-card:hover {
  background: #ffffff;
  color: #101215;

  transform: translateY(-6px);
  box-shadow: 0 14px 28px rgb(0 0 0 / 22%);
}

.menu-card:hover::before {
  transform: scaleX(1);
}

.menu-card h2 {
  margin: 0;
  font-size: clamp(21px, 2.1vw, 21px);
  font-weight: 600;
}

.menu-card p {
  margin: 0;
  font-size: clamp(18px, 1.5vw, 20px);
  color: #4a5560;
}

/* чуть синхронизируем текст при hover */
.menu-card:hover p {
  color: #2f3a44;
}

@media (max-width: 980px) {
  .home-main {
    padding: 50px 16px 70px;
  }

  .home-main > p {
    margin: 30px 0 40px;
  }

  .cards-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .menu-card {
    width: 100%;
    min-height: 150px;
  }
}
</style>