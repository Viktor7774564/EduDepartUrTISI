<script setup lang="ts">
import PageFrame from '@/components/PageFrame.vue'
</script>

<template>
  <PageFrame>
    <section class="settings-page">
      <h1>Разработке этот раздел, сделаю когда нибудь</h1>
    </section>
  </PageFrame>
</template>

<style scoped>
.settings-page {
  @apply min-h-[calc(100vh-180px)] flex justify-center items-center py-[40px] px-[20px];
}

.settings-page h1 {
  @apply text-[28px] font-semibold text-center text-[#2b2b2b];
}
</style>
