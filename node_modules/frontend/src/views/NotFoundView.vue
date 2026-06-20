<script setup lang="ts">
import { RouterLink } from 'vue-router'
import PageFrame from '@/components/PageFrame.vue'
import notFoundImg from '@/assets/404-illustration.png'
</script>

<template>
  <PageFrame>
    <main class="not-found-main">
      <img :src="notFoundImg" alt="Иллюстрация 404" />

      <section>
        <h1>Упс! Страница не найдена</h1>
        <RouterLink class="back-btn" to="/">Вернуться на главную</RouterLink>
      </section>
    </main>
  </PageFrame>
</template>

