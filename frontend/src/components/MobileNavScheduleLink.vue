<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { ScheduleKind } from '@/views/schedule/scheduleOptions'

type NavLink = {
  id: ScheduleKind
  shortTitle: string
}

defineProps<{
  link: NavLink
  active: boolean
}>()

const getScheduleRoute = (type: ScheduleKind) => ({
  name: 'schedule-selection' as const,
  params: { type },
})
</script>

<template>
  <RouterLink
    class="mobile-nav__item"
    :class="{ 'mobile-nav__item--active': active }"
    :to="getScheduleRoute(link.id)"
  >
    <span class="mobile-nav__label">{{ link.shortTitle }}</span>
  </RouterLink>
</template>
