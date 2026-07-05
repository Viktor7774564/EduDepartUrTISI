<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import PageFrame from '@/components/PageFrame.vue'
import { getErrorPageConfig } from '@/config/errorPages'

const props = defineProps<{
  code?: string
}>()

const route = useRoute()

const page = computed(() => {
  const code = props.code || (route.params.code as string | undefined)
  const message = typeof route.query.message === 'string' ? route.query.message : null

  return getErrorPageConfig(code, message)
})
</script>

<template>
  <PageFrame>
    <main class="error-page-main">
      <p class="error-page-code" aria-hidden="true">{{ page.displayCode }}</p>

      <section>
        <h1>{{ page.title }}</h1>
        <p class="error-page-description">{{ page.description }}</p>
        <RouterLink class="back-btn" :to="page.actionTo">{{ page.actionLabel }}</RouterLink>
      </section>
    </main>
  </PageFrame>
</template>
