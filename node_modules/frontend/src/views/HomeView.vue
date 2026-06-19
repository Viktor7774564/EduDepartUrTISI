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
  @apply max-w-[1850px] mx-auto pt-[88px] px-[36px] pb-[120px];
}

h1 {
  @apply m-0 font-semibold text-[clamp(38px,4.2vw,40px)];
}

.home-main > p {
  @apply my-[3vh] mx-0 mb-[6vh] text-[clamp(23px,1.9vw,25px)] leading-[1.35];
}

.cards-grid {
  @apply grid grid-cols-2 gap-y-[9vh] gap-x-[37vh] justify-self-center;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
}

.menu-card {
  @apply relative overflow-hidden w-[38vh] min-h-[168px] grid place-content-center gap-[13px] rounded-[18px] border border-[#c8c8c8] bg-[#dcdcdc] shadow-[0_7px_10px_rgb(0_0_0_/20%)] text-center no-underline text-inherit transition-[transform,box-shadow,background-color,color] duration-[250ms] ease-in-out;
}

/* ГРАДИЕНТНАЯ ПОЛОСА СВЕРХУ (как в меню) */
.menu-card::before {
  content: '';
  @apply absolute top-0 left-0 w-full h-[5px];
  background: linear-gradient(90deg, #59b4ef 0%, #2d90d2 100%);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.32s ease;
}

.menu-card:hover {
  @apply bg-white text-[#101215];
  transform: translateY(-6px);
  box-shadow: 0 14px 28px rgb(0 0 0 / 22%);
}

.menu-card:hover::before {
  transform: scaleX(1);
}

.menu-card h2 {
  @apply m-0 font-semibold text-[clamp(21px,2.1vw,21px)];
}

.menu-card p {
  @apply m-0 text-[clamp(18px,1.5vw,20px)] text-[#4a5560];
}

/* чуть синхронизируем текст при hover */
.menu-card:hover p {
  @apply text-[#2f3a44];
}

@media (max-width: 980px) {
  .home-main {
    @apply pt-[50px] px-[16px] pb-[70px];
  }

  .home-main > p {
    @apply my-[30px] mx-0 mb-[40px];
  }

  .cards-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .menu-card {
    @apply w-full min-h-[150px];
  }
}
</style>
