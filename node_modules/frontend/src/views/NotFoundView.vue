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
  @apply min-h-[calc(100vh-180px)] flex items-center justify-center gap-[38px] p-[24px];
}

.not-found-main img {
  width: min(560px, 20vw);
  height: auto;
}

.not-found-main h1 {
  @apply m-0 mb-[22px] text-[clamp(36px,3.1vw,36px)];
}

.back-btn {
  @apply min-w-[300px] h-[58px] border-0 rounded-[14px] bg-[#4ea3d7] text-[#eef6fb] text-[clamp(20px,1.55vw,20px)] cursor-pointer no-underline inline-flex items-center justify-center px-[16px];
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
