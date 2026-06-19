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
  @apply flex-1 grid grid-cols-2 min-h-full bg-white;
}

.login-card {
  @apply relative border border-[rgba(99,171,222,0.45)] border-r-2 rounded-[12px] bg-[rgba(234,234,234,0.9)] backdrop-blur-[14px] flex flex-col items-center justify-center py-[34px] px-[22px] overflow-hidden;
}

.login-card h1 {
  @apply text-[34px] font-semibold mb-[70px];
}

.login-form {
  width: min(380px, 90%);
  @apply grid gap-[16px];
}

.login-form label {
  @apply text-[20px];
}

.login-form input {
  @apply h-[50px] border border-[#c4cbd0] rounded-[10px] bg-white px-[16px] text-[18px] mb-[22px] z-[1] transition-[border-color,box-shadow] duration-[200ms] ease-in-out;
}

.login-form input:focus {
  @apply outline-none border-[#4ea3d7] shadow-[0_0_0_3px_rgb(78_163_215_/_15%)];
}

.action-btn {
  @apply justify-self-center mt-[30px] min-w-[250px] h-[55px] border-0 rounded-[13px] bg-[#4ea3d7] text-[#eef6fb] text-[22px] cursor-pointer;
}

.form-error {
  @apply text-[#c43636] text-[18px] mt-[-20px] z-[1];
}

.mock-note {
  @apply mt-[24px] py-[12px] px-[18px] rounded-[10px] bg-[rgb(78_163_215_/_10%)] text-[#1f4053] text-[16px] text-center z-[1];
}

.links-side {
  @apply relative flex items-center justify-center p-[20px] overflow-hidden;
}

.links-card {
  width: min(892px, 58%);
  @apply border border-[rgba(99,171,222,0.45)] rounded-[14px] bg-[rgba(234,234,234,0.9)] backdrop-blur-[14px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] pt-[24px] px-[24px] pb-[30px] relative z-[2];
}

.links-card h2 {
  @apply text-center text-[34px] font-semibold mb-[60px];
}

.links-card ul {
  @apply list-none grid gap-[22px] p-0 m-0;
}

.links-card li {
  @apply flex justify-between items-center gap-[40px] bg-white rounded-[14px] py-[16px] px-[18px];
}

.link-info {
  @apply flex items-center gap-[12px];
}

.link-info img {
  @apply w-[54px] h-[54px] object-contain;
}

.link-info h3 {
  @apply text-[18px] font-semibold leading-[1.15] m-0;
}

.link-info p {
  @apply text-[18px] mt-[2px] mb-0 leading-[1.15];
}

.links-card li button {
  @apply min-w-[118px] h-[35px] border-0 rounded-[10px] bg-[#4ea3d7] text-[#edf6fb] text-[17px] cursor-pointer;
}

.decor-card {
  @apply absolute w-[160px] opacity-[0.36] pointer-events-none;
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
    @apply text-[42px] mb-[36px];
  }

  .login-form {
    width: min(620px, 92%);
    gap: 16px;
  }

  .login-form label {
    @apply text-[28px];
  }

  .login-form input {
    @apply h-[60px] text-[24px];
  }

  .action-btn {
    @apply min-w-[240px] h-[60px] text-[30px];
  }

  .mock-note {
    @apply text-[18px];
  }

  .links-side {
    @apply p-[32px] px-[16px];
  }

  .links-card {
    width: min(860px, 96%);
    padding: 24px 16px;
  }

  .links-card h2 {
    @apply text-[clamp(12px,1.15vw,18px)] mb-[24px];
  }

  .link-info h3 {
    @apply text-[26px];
  }

  .link-info p {
    @apply text-[22px];
  }

  .links-card li button {
    @apply min-w-[110px] h-[42px] text-[24px];
  }

  .decor-card {
    @apply w-[140px];
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
