<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import telegramIcon from '@/assets/telegram.png'
import vkIcon from '@/assets/vk.png'
import maxIcon from '@/assets/max.png'
import bgCard from '@/assets/bg-card.png'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { mockUsers } from '@/mocks/users'

const router = useRouter()
const authStore = useAuthStore()

const formData = reactive({
  login: '',
  password: '',
})

const errorMessage = ref('')

const helpfulLinks = [
  {
    id: 'telegram',
    title: 'Telegram',
    subtitle: 'Учебный отдел',
    icon: telegramIcon,
    alt: 'Логотип Telegram',
    url: 'https://t.me/c/2226177795/1',
  },
  {
    id: 'vk',
    title: 'ВКонтакте',
    subtitle: 'Новости УрТИСИ',
    icon: vkIcon,
    alt: 'Логотип ВКонтакте',
    url: 'https://vk.com/urtisi',
  },
  {
    id: 'max',
    title: 'MAX',
    subtitle: 'Новости УрТИСИ',
    icon: maxIcon,
    alt: 'Логотип MAX',
    url: 'https://max.ru/id5405101327_gos2',
  },
]

const openLink = (url: string) => {
  window.open(url, '_blank')
}

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

const demoAccountsText = computed(() =>
    mockUsers.map((user) => `${user.login} / ${user.password}`).join(' | '),
)

const onFormSubmit = async () => {
  errorMessage.value = ''

  const result = authStore.login(formData.login, formData.password)

  if (!result.success) {
    errorMessage.value = result.message ?? 'Не удалось выполнить вход.'
    return
  }

  await router.push({ name: 'home' })
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

      <form class="login-form" @submit.prevent="onFormSubmit">
        <label for="login">Логин</label>
        <input id="login" v-model="formData.login" name="login" type="text" />

        <label for="password">Пароль</label>
        <input id="password" v-model="formData.password" name="password" type="password" />

        <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

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

            <button
                type="button"
                @click="openLink(item.url)"
            >
              Открыть
            </button>
          </li>
        </ul>
      </article>
    </section>
  </main>
</template>

<style scoped>
:global(html),
:global(body),
:global(#app) {
  background: #ffffff;
}

.content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100%;
  background: #ffffff;
}

.login-card {
  position: relative;
  border: 1px solid rgba(99, 171, 222, 0.45);
  border-right-width: 2px;
  border-radius: 12px;
  background: rgba(234, 234, 234, 0.90);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 34px 22px;
  overflow: hidden;
}

.login-card h1 {
  font-size: 34px;
  font-weight: 600;
  margin-bottom: 70px;
}

.login-form {
  width: min(380px, 90%);
  display: grid;
  gap: 16px;
}

.login-form label {
  font-size: 20px;
}

.login-form input {
  height: 50px;
  border: 1px solid #c4cbd0;
  border-radius: 10px;
  background: #fff;
  padding: 0 16px;
  font-size: 18px;
  margin-bottom: 22px;
  z-index: 1;
  transition: 0.2s ease;
}

.login-form input:focus {
  outline: none;
  border-color: #4ea3d7;
  box-shadow: 0 0 0 3px rgb(78 163 215 / 15%);
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

.form-error {
  color: #c43636;
  font-size: 18px;
  margin: -20px 0 0;
  z-index: 1;
}

.mock-note {
  margin-top: 24px;
  padding: 12px 18px;
  border-radius: 10px;
  background: rgb(78 163 215 / 10%);
  color: #1f4053;
  font-size: 16px;
  text-align: center;
  z-index: 1;
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
  border: 1px solid rgba(99, 171, 222, 0.45);
  border-radius: 14px;
  background: rgba(234, 234, 234, 0.9);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  padding: 24px 24px 30px;
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
  gap: 22px;
  padding: 0;
  margin: 0;
}

.links-card li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
  background: #ffffff;
  border-radius: 14px;
  padding: 16px 18px;
}

.link-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.link-info img {
  width: 54px;
  height: 54px;
  object-fit: contain;
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
    border-right: 1px solid rgba(99, 171, 222, 0.45);
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

  .mock-note {
    font-size: 18px;
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

.login-card,
.links-side {
  min-height: 100%;
}

.login-card {
  border-right-width: 2px;
}
</style>