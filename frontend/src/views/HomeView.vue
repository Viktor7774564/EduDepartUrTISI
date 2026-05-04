<script setup lang="ts">
import PageFrame from '@/components/PageFrame.vue'

const menuCards = [
  { id: 'students', title: 'Расписание студентов', needAuth: false },
  { id: 'consults', title: 'Расписание консультаций', needAuth: true },
  { id: 'auditories', title: 'Расписание аудитории', needAuth: true },
  { id: 'teachers', title: 'Расписание преподавателей', needAuth: true },
]
</script>

<template>
  <PageFrame>
    <main class="home-main">
      <h1>Расписание института</h1>
      <p>Удобный доступ к расписанию занятий для студентов, преподавателей и аудиторий в одном месте.</p>

      <section class="cards-grid" aria-label="Категории расписания">
        <article v-for="item in menuCards" :key="item.id" class="menu-card">
          <h2>{{ item.title }}</h2>
          <p v-if="item.needAuth">Требуется авторизация</p>
        </article>
      </section>
    </main>
  </PageFrame>
</template>

<style scoped>
.home-main {
  max-width: 1850px;
  margin: 0 auto;
  padding: 88px 36px 120px;
}

h1 {
  font-size: clamp(38px, 4.2vw, 40px);
  margin: 0;
  font-weight: 600;
}

.home-main > p {
  font-size: clamp(23px, 1.9vw, 25px);
  margin: 3vh 0 6vh;
  line-height: 1.35;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 9vh 37vh;
  justify-self: center;
}

.menu-card {
  min-height: 168px;
  border-radius: 18px;
  border: 1px solid #c8c8c8;
  background: #dcdcdc;
  box-shadow: 0 7px 10px rgb(0 0 0 / 20%);
  display: grid;
  place-content: center;
  gap: 13px;
  text-align: center;
  width: 38vh;
}

.menu-card h2 {
  margin: 0;
  font-size: clamp(21px, 2.1vw, 21px);
  font-weight: 600;
}

.menu-card p {
  margin: 0;
  font-size: clamp(21px, 1.6vw, 21px);
}

@media (max-width: 980px) {
  .home-main {
    padding: 50px 16px 70px;
  }

  .home-main > p {
    margin: 30px 0 40px;
  }

  .cards-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .menu-card {
    min-height: 150px;
  }
}
</style>
