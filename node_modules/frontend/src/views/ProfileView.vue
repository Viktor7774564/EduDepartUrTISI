<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import PageFrame from '@/components/PageFrame.vue'

const authStore = useAuthStore()

const user = computed(() => authStore.currentUser)
const role = computed(() => user.value?.role)

const profileFields = computed(() => {
  if (!user.value) return []

  switch (role.value) {
    case 'student':
      return [
        { label: 'Группа', value: user.value.group },
        { label: 'Направление', value: user.value.direction },
        { label: 'Форма обучения', value: user.value.educationForm },
        { label: 'Курс', value: user.value.course },
      ]

    case 'teacher':
      return [
        { label: 'Должность', value: user.value.position },
        { label: 'Кафедра', value: user.value.department },
        { label: 'Кабинет', value: user.value.cabinet },
      ]

    default:
      return [
        { label: 'Должность', value: user.value.position },
        {
          label: 'Структурное подразделение',
          value: user.value.department,
        },
        { label: 'Кабинет', value: user.value.cabinet },
      ]
  }
})

const buttons = computed(() => {
  switch (role.value) {
    case 'student':
      return [
        {
          text: 'Перейти к моему расписанию',
          action: () => {},
        },
      ]

    case 'teacher':
      return [
        {
          text: 'Перейти к моему расписанию',
          action: () => {},
        },
        {
          text: 'Составить отчёт',
          action: () => {},
        },
      ]

    default:
      return []
  }
})
</script>

<template>
  <PageFrame>
    <section class="profile-page">
      <div class="profile-card">
        <div class="photo-block">
          <div class="photo-placeholder">
            <span>ФОТО</span>
          </div>
        </div>

        <div class="profile-info">
          <div class="fullname">
            <p>{{ user?.surname || 'Фамилия' }}</p>
            <p>{{ user?.name || 'Имя' }}</p>
            <p>{{ user?.patronymic || 'Отчество' }}</p>

            <div class="divider"></div>
          </div>

          <div class="details">
            <div
              v-for="field in profileFields"
              :key="field.label"
              class="detail-row"
            >
              <span class="label">{{ field.label }}:</span>
              <span class="value">{{ field.value }}</span>
            </div>
          </div>

          <div v-if="buttons.length" class="actions">
            <button
              v-for="button in buttons"
              :key="button.text"
              class="action-btn"
              @click="button.action"
            >
              {{ button.text }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </PageFrame>
</template>

<style scoped>
.profile-page {
  @apply min-h-[calc(100vh-180px)] flex justify-center items-center py-[40px] px-[20px];
}

/* ===================== */
/* CARD */
/* ===================== */

.profile-card {
  @apply w-full max-w-[850px] min-h-[470px] bg-[#ececec] border border-[#4ea3d7] rounded-[18px] shadow-[0_6px_14px_rgba(0,0,0,0.15)] flex gap-[30px] p-[42px] relative z-[2];
}

/* ===================== */
/* PHOTO */
/* ===================== */

.photo-block {
  @apply flex items-start;
}

.photo-placeholder {
  @apply w-[240px] h-[320px] border-2 border-[#4ea3d7] rounded-[16px] bg-[#ececec] flex justify-center items-center shadow-[0_4px_10px_rgba(0,0,0,0.15)];
}

.photo-placeholder span {
  @apply rotate-[-45deg] text-[18px];
}

/* ===================== */
/* INFO */
/* ===================== */

.profile-info {
  @apply flex-1 flex flex-col;
}

.fullname {
  @apply text-[18px] leading-[1.8];
}

.divider {
  @apply w-[270px] h-[2px] bg-[#222] my-[12px] mx-0 mb-[24px];
}

.details {
  @apply flex flex-col gap-[18px];
}

.detail-row {
  @apply flex gap-[8px] flex-wrap;
}

.label {
  @apply font-medium;
}

.value {
  @apply text-[#444];
}

/* ===================== */
/* BUTTONS */
/* ===================== */

.actions {
  @apply mt-auto flex flex-wrap gap-[20px] pt-[40px];
}

.action-btn {
  @apply min-w-[240px] h-[52px] border-0 rounded-[14px] bg-[#4ea3d7] text-white text-[15px] cursor-pointer transition-[transform,background-color] duration-[200ms];
}

.action-btn:hover {
  @apply bg-[#3f96cb] translate-y-[-2px];
}

/* ===================== */
/* ADAPTIVE */
/* ===================== */

@media (max-width: 900px) {
  .profile-card {
    flex-direction: column;
    align-items: center;
  }

  .profile-info {
    width: 100%;
  }

  .divider {
    width: 100%;
  }

  .actions {
    justify-content: center;
  }
}

@media (max-width: 600px) {
  .photo-placeholder {
    @apply w-[200px] h-[260px];
  }

  .profile-card {
    @apply p-[24px];
  }

  .action-btn {
    @apply w-full;
  }
}
</style>
