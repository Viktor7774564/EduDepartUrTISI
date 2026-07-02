<script setup lang="ts">
import { useSlots } from 'vue'
import { useRouter } from 'vue-router'

defineProps<{
  title: string
}>()

const router = useRouter()
const slots = useSlots()

const goBack = async () => {
  await router.push({ name: 'settings' })
}
</script>

<template>
  <section class="settings-detail-page">
    <div class="settings-card">
      <div class="card-header">
        <button class="back-btn" type="button" aria-label="Назад" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <h1 class="card-title">{{ title }}</h1>
      </div>

      <p v-if="!slots.default" class="settings-placeholder">Раздел в разработке</p>
      <slot />
    </div>
  </section>
</template>
