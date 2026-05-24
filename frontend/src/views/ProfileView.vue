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
  min-height: calc(100vh - 180px);

  display: flex;
  justify-content: center;
  align-items: center;

  padding: 40px 20px;
}

/* ===================== */
/* CARD */
/* ===================== */

.profile-card {
  width: 100%;
  max-width: 850px;

  min-height: 470px;

  background: #ececec;

  border: 1px solid #4ea3d7;
  border-radius: 18px;

  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);

  display: flex;
  gap: 30px;

  padding: 42px;

  position: relative;
  z-index: 2;
}

/* ===================== */
/* PHOTO */
/* ===================== */

.photo-block {
  display: flex;
  align-items: flex-start;
}

.photo-placeholder {
  width: 240px;
  height: 320px;

  border: 2px solid #4ea3d7;
  border-radius: 16px;

  background: #ececec;

  display: flex;
  justify-content: center;
  align-items: center;

  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.photo-placeholder span {
  transform: rotate(-45deg);
  font-size: 18px;
}

/* ===================== */
/* INFO */
/* ===================== */

.profile-info {
  flex: 1;

  display: flex;
  flex-direction: column;
}

.fullname {
  font-size: 18px;
  line-height: 1.8;
}

.divider {
  width: 270px;
  height: 2px;
  background: #222;

  margin: 12px 0 24px;
}

.details {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.label {
  font-weight: 500;
}

.value {
  color: #444;
}

/* ===================== */
/* BUTTONS */
/* ===================== */

.actions {
  margin-top: auto;

  display: flex;
  flex-wrap: wrap;
  gap: 20px;

  padding-top: 40px;
}

.action-btn {
  min-width: 240px;
  height: 52px;

  border: none;
  border-radius: 14px;

  background: #4ea3d7;
  color: white;

  font-size: 15px;

  cursor: pointer;

  transition:
    transform 0.2s,
    background 0.2s;
}

.action-btn:hover {
  background: #3f96cb;
  transform: translateY(-2px);
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
    width: 200px;
    height: 260px;
  }

  .profile-card {
    padding: 24px;
  }

  .action-btn {
    width: 100%;
  }
}
</style>