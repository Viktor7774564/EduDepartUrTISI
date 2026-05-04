<template>
  <section class="page-frame">
    <img
      v-for="item in decorations"
      :key="item.id"
      :src="bgCard"
      class="decor-card fade-card"
      :style="{
        top: item.top,
        left: item.left,
        right: item.right,
        bottom: item.bottom,
        transform: `rotate(${item.rotate}deg)`,
        animationDelay: `${item.delay}s`,
      }"
      alt=""
      aria-hidden="true"
    />

    <div class="frame-content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import bgCard from '@/assets/bg-card.png'

type Decoration = {
  id: string
  top?: string
  left?: string
  right?: string
  bottom?: string
  rotate: number
  delay: number
}

const decorations: Decoration[] = [
  { id: 'card-1', top: '42px', left: '15%', rotate: -28, delay: 0 },
  { id: 'card-2', top: '18px', left: '46%', rotate: 3, delay: 0.45 },
  { id: 'card-3', top: '44px', right: '8%', rotate: 31, delay: 0.95 },
  { id: 'card-4', top: '38%', left: '3%', rotate: 23, delay: 0.3 },
  { id: 'card-5', top: '70%', left: '15%', rotate: -50, delay: 0.5 },
  { id: 'card-6', top: '37%', left: '47%', rotate: -18, delay: 1.1 },
  { id: 'card-7', bottom: '15%', left: '29%', rotate: -12, delay: 0.6 },
  { id: 'card-8', bottom: '12%', right: '16%', rotate: 34, delay: 1.5 },
]
</script>

<style scoped>
.page-frame {
  position: relative;
  min-height: calc(100vh - 180px);
  background: #efefef;
  overflow: hidden;
}

.frame-content {
  position: relative;
  z-index: 2;
  min-height: calc(100vh - 180px);
}

.decor-card {
  position: absolute;
  width: 160px;
  opacity: 0.34;
  pointer-events: none;
  z-index: 1;
}

.fade-card {
  animation: fadeInOut 3s ease-in-out infinite alternate;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
  }

  50% {
    opacity: 0.34;
  }

  100% {
    opacity: 0.34;
  }
}

@media (max-width: 900px) {
  .decor-card {
    width: 125px;
  }
}

@media (max-width: 640px) {
  .decor-card:nth-child(n + 5) {
    display: none;
  }
}
</style>
