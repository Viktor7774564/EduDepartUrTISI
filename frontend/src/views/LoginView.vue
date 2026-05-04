<script setup lang="ts">
import telegramIcon from '@/assets/telegram.png'
import vkIcon from '@/assets/vk.png'
import maxIcon from '@/assets/max.png'
import bgCard from '@/assets/bg-card.png'
import { useRouter } from 'vue-router'

const router = useRouter()

const helpfulLinks = [
  {
    id: 'telegram',
    title: 'Telegram',
    subtitle: 'Учебный отдел',
    icon: telegramIcon,
    alt: 'Логотип Telegram',
  },
  {
    id: 'vk',
    title: 'ВКонтакте',
    subtitle: 'Новости УрТИСИ',
    icon: vkIcon,
    alt: 'Логотип ВКонтакте',
  },
  {
    id: 'max',
    title: 'MAX',
    subtitle: 'Новости УрТИСИ',
    icon: maxIcon,
    alt: 'Логотип MAX',
  },
]

const leftDecor = [
  { id: 'left-top-right', className: 'left-top-right', rotate: 3 },
  { id: 'left-mid-left', className: 'left-mid-left', rotate: -32 },
  { id: 'left-mid-right', className: 'left-mid-right', rotate: -18 },
  { id: 'left-bottom-left', className: 'left-bottom-left', rotate: 24 },
  { id: 'left-bottom-right', className: 'left-bottom-right', rotate: -12 },
]

const rightDecor = [
  { id: 'right-top-right', className: 'right-top-right', rotate: 31 },
  { id: 'right-top-left', className: 'right-top-left', rotate: -22 },
  { id: 'right-mid-right', className: 'right-mid-right', rotate: 14 },
  { id: 'right-mid-left', className: 'right-mid-left', rotate: -28 },
  { id: 'right-bottom-center', className: 'right-bottom-center', rotate: 34 },
  { id: 'right-bottom-right', className: 'right-bottom-right', rotate: -10 },
]

const onFormSubmit = async () => {
  
  console.log("goto not found")
  
  router.push({ name: 'not-found' }) 
}

</script>

<template>
  <main class="content">
    <section class="login-card">
      <img
        v-for="item in leftDecor"
        :key="item.id"
        :src="bgCard"
        class="decor-card fade-card"
        :class="item.className"
        :style="{ transform: `rotate(${item.rotate}deg)` }"
        alt=""
        aria-hidden="true"
      />

      <h1>Вход</h1>

      <!--Временное решение (при появлении backend части будет исправлено)-->
      <form class="login-form" @submit.prevent="onFormSubmit">
        <label for="login">Логин</label>
        <input id="login" name="login" type="text" />

        <label for="password">Пароль</label>
        <input id="password" name="password" type="password" />

        <button class="action-btn" type="submit">Войти</button>
      </form>
    </section>

    <section class="links-side">
      <img
        v-for="item in rightDecor"
        :key="item.id"
        :src="bgCard"
        class="decor-card fade-card"
        :class="item.className"
        :style="{ transform: `rotate(${item.rotate}deg)` }"
        alt=""
        aria-hidden="true"
      />

      <article class="links-card">
        <h2>Полезные ссылки</h2>

        <ul>
          <li v-for="item in helpfulLinks" :key="item.id">
            <div class="link-info">
              <img :src="item.icon" :alt="item.alt" />
              <div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.subtitle }}</p>
              </div>
            </div>
            <button type="button">Открыть</button>
          </li>
        </ul>
      </article>
    </section>
  </main>
</template>

<style scoped>
.content {
  min-height: calc(100vh - 180px);
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.login-card {
  position: relative;
  border: 1px solid #63abde;
  border-right-width: 2px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 34px 22px 34px;
  overflow: hidden;
}

.login-card h1 {
  font-size: 34px;
  font-weight: 600;
  margin-bottom: 70px;
}

.login-form {
  width: min(540px, 90%);
  display: grid;
  gap: 18px;
}

.login-form label {
  font-size: 20px;
}

.login-form input {
  height: 75px;
  border: 1px solid #c4cbd0;
  border-radius: 6px;
  background: #fff;
  padding: 0 14px;
  font-size: 24px;
  margin-bottom: 40px;
  z-index: 1;
}

.action-btn {
  justify-self: center;
  margin-top: 30px;
  min-width: 250px;
  height: 55px;
  border: 0;
  border-radius: 13px;
  background: #4ea3d7;
  color: #eef6fb;
  font-size: 22px;
  cursor: pointer;
}

.links-side {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}

.links-card {
  width: min(892px, 58%);
  border: 1px solid #63abde;
  border-radius: 14px;
  background: #dfdfdf;
  box-shadow: 0 8px 18px rgb(0 0 0 / 10%);
  padding: 24px 0 30px;
  position: relative;
  z-index: 2;
}

.links-card h2 {
  text-align: center;
  font-size: 34px;
  font-weight: 600;
  margin-bottom: 60px;
}

.links-card ul {
  list-style: none;
  display: grid;
  gap: 36px;
  padding: 0;
  margin: 0;
  justify-content: center;
}

.links-card li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10vh;
  background: #f1f1f1;
  border-radius: 14px;
  padding: 11px 14px;
}

.link-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.link-info img {
  width: 80px;
  height: 80px;
}

.link-info h3 {
  font-size: 18px;
  font-weight: 640;
  line-height: 1.15;
  margin: 0;
}

.link-info p {
  font-size: 18px;
  margin: 2px 0 0;
  line-height: 1.15;
}

.links-card li button {
  min-width: 118px;
  height: 35px;
  border: 0;
  border-radius: 10px;
  background: #4ea3d7;
  color: #edf6fb;
  font-size: 17px;
  cursor: pointer;
}

.decor-card {
  position: absolute;
  width: 160px;
  opacity: 0.36;
  pointer-events: none;
}

.fade-card {
  animation: fadeInOut 4s ease-in-out infinite alternate;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
  }

  50% {
    opacity: 0.36;
  }

  100% {
    opacity: 0.36;
  }
}

.left-top-right {
  top: 32px;
  right: 12px;
  animation-delay: 0s;
}

.left-mid-left {
  top: 222px;
  left: 228px;
  animation-delay: 0.5s;
}

.left-mid-right {
  top: 368px;
  right: -12px;
  animation-delay: 1s;
}

.left-bottom-left {
  bottom: 192px;
  left: 20px;
  animation-delay: 1.5s;
}

.left-bottom-right {
  bottom: 126px;
  right: 150px;
  animation-delay: 2s;
}

.right-top-right {
  top: 70px;
  right: 98px;
  animation-delay: 0.3s;
}

.right-top-left {
  top: 56px;
  left: 44px;
  animation-delay: 0.55s;
}

.right-mid-right {
  top: 246px;
  right: 14px;
  animation-delay: 0.95s;
}

.right-mid-left {
  top: 332px;
  left: 112px;
  animation-delay: 1.25s;
}

.right-bottom-center {
  bottom: 54px;
  left: 184px;
  animation-delay: 0.8s;
}

.right-bottom-right {
  bottom: 34px;
  right: 48px;
  animation-delay: 1.55s;
}

@media (max-width: 1360px) {
  .content {
    grid-template-columns: 1fr;
  }

  .login-card {
    border-right: 1px solid #63abde;
    border-radius: 0;
    padding-top: 80px;
  }

  .login-card h1 {
    font-size: 42px;
    margin-bottom: 36px;
  }

  .login-form {
    width: min(620px, 92%);
    gap: 16px;
  }

  .login-form label {
    font-size: 28px;
  }

  .login-form input {
    height: 60px;
    font-size: 24px;
  }

  .action-btn {
    min-width: 240px;
    height: 60px;
    font-size: 30px;
  }

  .links-side {
    padding: 32px 16px;
  }

  .links-card {
    width: min(860px, 96%);
    padding: 24px 16px;
  }

  .links-card h2 {
    font-size: clamp(12px, 1.15vw, 18px);
    margin-bottom: 24px;
  }

  .link-info h3 {
    font-size: 26px;
  }

  .link-info p {
    font-size: 22px;
  }

  .links-card li button {
    min-width: 110px;
    height: 42px;
    font-size: 24px;
  }

  .decor-card {
    width: 140px;
  }
}

@media (max-width: 760px) {
  .links-card li {
    flex-direction: column;
    align-items: flex-start;
  }

  .links-card li button {
    align-self: flex-end;
  }

  .left-mid-left,
  .left-mid-right,
  .left-bottom-right,
  .right-top-right,
  .right-top-left,
  .right-mid-right,
  .right-mid-left,
  .right-bottom-center {
    display: none;
  }
}
</style>
