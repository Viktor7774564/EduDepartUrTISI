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

<style scoped>
.not-found-main {
  min-height: calc(100vh - 180px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 38px;
  padding: 24px;
}

.not-found-main img {
  width: min(560px, 20vw);
  height: auto;
}

.not-found-main h1 {
  margin: 0 0 22px;
  font-size: clamp(36px, 3.1vw, 36px);
}

.back-btn {
  min-width: 300px;
  height: 58px;
  border: 0;
  border-radius: 14px;
  background: #4ea3d7;
  color: #eef6fb;
  font-size: clamp(20px, 1.55vw, 20px);
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
}

@media (max-width: 980px) {
  .not-found-main {
    flex-direction: column;
    text-align: center;
  }

  .not-found-main img {
    width: min(460px, 90vw);
  }

  .not-found-main h1 {
    margin-bottom: 20px;
  }
}
</style>
