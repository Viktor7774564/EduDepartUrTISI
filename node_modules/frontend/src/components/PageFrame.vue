<template>
  <section class="page-frame">
    <div class="decor-layer" :class="{ fade: isFading }">
      <img
          v-for="item in decorations"
          :key="item.id"
          :src="bgCard"
          class="decor-card"
          :style="{
          top: item.top,
          left: item.left,
          transform: `translate(-50%, -50%) rotate(${item.rotate}deg)`,
        }"
          alt=""
          aria-hidden="true"
      />
    </div>

    <div class="frame-content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import bgCard from '@/assets/bg-card.png'

type Decoration = {
  id: string
  top: string
  left: string
  rotate: number
}

const decorations = ref<Decoration[]>([])
const isFading = ref(false)

const CARD_COUNT = 8
const MIN_DISTANCE = 16 // расстояния между карточками

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function toPoint(top: string, left: string) {
  return {
    x: parseFloat(left),
    y: parseFloat(top),
  }
}

function distance(a: any, b: any) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

function generateValidPosition(existing: any[]) {
  let tries = 0

  while (tries < 50) {
    const pos = {
      top: `${randomBetween(5, 90)}%`,
      left: `${randomBetween(5, 90)}%`,
    }

    const point = toPoint(pos.top, pos.left)

    const isTooClose = existing.some((e) => {
      const ep = toPoint(e.top, e.left)
      return distance(point, ep) < MIN_DISTANCE
    })

    if (!isTooClose) {
      return pos
    }

    tries++
  }

  return {
    top: `${randomBetween(5, 90)}%`,
    left: `${randomBetween(5, 90)}%`,
  }
}

function generateDecorations() {
  const items: Decoration[] = []

  for (let i = 0; i < CARD_COUNT; i++) {
    const pos = generateValidPosition(items)

    items.push({
      id: `card-${Date.now()}-${i}`,
      top: pos.top,
      left: pos.left,
      rotate: randomBetween(-60, 60),
    })
  }

  decorations.value = items
}

function cycle() {
  isFading.value = true

  setTimeout(() => {
    generateDecorations()
    isFading.value = false
  }, 600)
}

onMounted(() => {
  generateDecorations()

  setInterval(() => {
    cycle()
  }, 3500)
})
</script>

<style scoped>
.page-frame {
  @apply relative min-h-[calc(100vh-180px)] bg-[#efefef] overflow-hidden;
}

.frame-content {
  @apply relative z-[2];
}

/* слой */
.decor-layer {
  @apply absolute inset-0 z-[1] opacity-100 transition-opacity duration-[600ms] ease-in-out;
}

.decor-layer.fade {
  @apply opacity-0;
}

.decor-card {
  @apply absolute w-[160px] opacity-50 pointer-events-none;
}

@media (max-width: 900px) {
  .decor-card {
    @apply w-[125px];
  }
}

@media (max-width: 640px) {
  .decor-card:nth-child(n + 5) {
    display: none;
  }
}
</style>
