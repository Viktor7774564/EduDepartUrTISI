<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { ScheduleKind } from '@/views/schedule/scheduleOptions'
import MobileNavScheduleLink from '@/components/MobileNavScheduleLink.vue'

type NavLink = {
  id: ScheduleKind
  shortTitle: string
}

const route = useRoute()
const authStore = useAuthStore()

const allLinks: NavLink[] = [
  { id: 'teachers', shortTitle: 'Преподы' },
  { id: 'students', shortTitle: 'Студенты' },
  { id: 'auditories', shortTitle: 'Аудитории' },
  { id: 'consults', shortTitle: 'Консультации' },
]

const visibleLinks = computed(() => {
  if (authStore.currentUser?.role === 'student') {
    return allLinks.filter((item) => item.id === 'students' || item.id === 'consults')
  }

  return allLinks
})

const leftLinks = computed(() => {
  const links = visibleLinks.value
  const splitAt = Math.ceil(links.length / 2)

  return links.slice(0, splitAt)
})

const rightLinks = computed(() => {
  const links = visibleLinks.value
  const splitAt = Math.ceil(links.length / 2)

  return links.slice(splitAt)
})

const isHomeActive = computed(() => route.name === 'home')

const isScheduleLinkActive = (id: ScheduleKind) => {
  if (route.name !== 'schedule-selection' && route.name !== 'schedule-view') {
    return false
  }

  return route.params.type === id
}
</script>

<template>
  <nav class="mobile-nav" aria-label="Мобильная навигация">
    <div class="mobile-nav__side mobile-nav__side--left">
      <MobileNavScheduleLink
        v-for="link in leftLinks"
        :key="link.id"
        :link="link"
        :active="isScheduleLinkActive(link.id)"
      />
    </div>

    <RouterLink
      class="mobile-nav__home"
      :class="{ 'mobile-nav__home--active': isHomeActive }"
      to="/"
      aria-label="Главная"
    >
      <span class="mobile-nav__home-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M4 10.5L12 4l8 6.5V19a1.5 1.5 0 01-1.5 1.5H15v-5.5H9V20.5H5.5A1.5 1.5 0 014 19V10.5z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <span class="mobile-nav__label">Главная</span>
    </RouterLink>

    <div class="mobile-nav__side mobile-nav__side--right">
      <MobileNavScheduleLink
        v-for="link in rightLinks"
        :key="link.id"
        :link="link"
        :active="isScheduleLinkActive(link.id)"
      />
    </div>
  </nav>
</template>
