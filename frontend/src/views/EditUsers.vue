<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PageFrame from '@/components/PageFrame.vue'
import editIcon from '@/assets/edit.svg'
import { mockUsers, type MockUser } from '@/mocks/users'

const router = useRouter()

const users = ref<MockUser[]>(mockUsers)

const getRoleLabel = (role: MockUser['role']): string => {
  const labels: Record<MockUser['role'], string> = {
    admin: 'Администратор',
    student: 'Студент',
    teacher: 'Преподаватель',
    education_department: 'Учебный отдел',
  }
  return labels[role]
}

const getFullName = (user: MockUser): string => {
  return `${user.surname} ${user.name.charAt(0)}. ${user.patronymic.charAt(0)}.`
}

// Функция для отображения пароля в виде звездочек
const maskPassword = (password: string): string => {
  return '*'.repeat(password.length)
}

const goBack = async () => {
  await router.push({ name: 'admin-panel' })
}

const editUser = (id: number) => {
  console.log('Edit user:', id)
}

const deleteUser = (id: number) => {
  console.log('Delete user:', id)
}
</script>

<template>
  <PageFrame>
    <section class="admin-edit-page">
      <div class="admin-card">
        <div class="card-header">
          <button class="back-btn" type="button" @click="goBack" aria-label="Назад">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h1 class="card-title">Управление пользователями</h1>
        </div>

        <div class="card-subtitle">Пользователь</div>

        <div class="users-table">
          <div class="table-header">
            <div class="col-name">ФИО</div>
            <div class="col-login">Логин</div>
            <div class="col-role">Роль</div>
            <div class="col-password">Пароль</div>
            <div class="col-actions"></div>
          </div>

          <div v-for="user in users" :key="user.id" class="table-row">
            <div class="col-name" :title="`${user.surname} ${user.name} ${user.patronymic}`">
              {{ getFullName(user) }}
            </div>
            <div class="col-login">{{ user.login }}</div>
            <div class="col-role">{{ getRoleLabel(user.role) }}</div>
            <div class="col-password" :title="user.password">
              {{ maskPassword(user.password) }}
            </div>
            <div class="col-actions">
              <button 
                class="edit-btn" 
                type="button" 
                @click="editUser(user.id)"
                aria-label="Редактировать"
              >
                <img :src="editIcon" alt="" aria-hidden="true" />
              </button>
              
              <button 
                class="close-btn" 
                type="button" 
                @click="deleteUser(user.id)"
                aria-label="Удалить"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </PageFrame>
</template>

<style scoped>
.admin-edit-page {
  @apply min-h-[calc(100vh-180px)] flex justify-center items-center py-[30px] px-[20px];
}

.admin-card {
  @apply w-full max-w-[1100px] bg-[#ececec] border border-[#4ea3d7] rounded-[14px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] py-[40px] px-[48px] relative z-[2];
}

.card-header {
  @apply flex items-center gap-[20px] mb-[24px] relative;
}

.back-btn {
  @apply w-[40px] h-[40px] border-0 rounded-[10px] bg-[#4ea3d7] flex items-center justify-center cursor-pointer transition-colors duration-[200ms] shrink-0 relative z-[1];
}

.back-btn:hover {
  @apply bg-[#3f96cb];
}

.card-title {
  @apply m-0 text-[24px] font-semibold text-[#101215] text-center absolute left-1/2 -translate-x-1/2 w-full pointer-events-none;
}

.card-subtitle {
  @apply text-[16px] text-[#5f6975] text-center mb-[32px] pb-[16px] border-b border-[#d7e0e9];
}

.users-table {
  @apply flex flex-col gap-[12px];
}

.table-header {
  @apply grid gap-[16px] py-[14px] px-[18px] bg-[rgba(78,163,215,0.15)] rounded-[10px] font-semibold text-[14px] text-[#24313f];
  grid-template-columns: 1.5fr 1.5fr 1.5fr 1fr 100px;
}

.table-row {
  @apply grid gap-[16px] py-[16px] px-[18px] bg-white border border-[#d7e0e9] rounded-[10px] items-center transition-shadow duration-[200ms];
  grid-template-columns: 1.5fr 1.5fr 1.5fr 1fr 100px;
}

.table-row:hover {
  @apply shadow-[0_4px_12px_rgba(0,0,0,0.08)];
}

.col-name,
.col-login,
.col-role,
.col-password {
  @apply text-[14px] text-[#24313f] whitespace-nowrap overflow-hidden text-ellipsis;
}

.col-name {
  @apply font-medium;
}

.col-login {
  font-family: monospace;
  @apply text-[#5f6975];
}

.col-role {
  @apply text-[#4ea3d7] font-medium;
}

.col-password {
  font-family: monospace;
  @apply text-[#5f6975];
  /*letter-spacing: 2px;*/
}

.col-actions {
  @apply flex gap-[10px] justify-end;
}

.edit-btn {
  @apply w-[34px] h-[34px] border border-[#4ea3d7] rounded-[8px] bg-white flex items-center justify-center cursor-pointer transition-all duration-[200ms] p-[6px];
}

.edit-btn:hover {
  @apply bg-[#4ea3d7] border-[#4ea3d7];
}

.edit-btn img {
  @apply w-[22px] h-[22px] opacity-70 transition-opacity duration-[200ms];
}

.edit-btn:hover img {
  @apply opacity-100;
}

.close-btn {
  @apply w-[34px] h-[34px] border border-[#e74c3c] rounded-[8px] bg-white text-[#e74c3c] text-[20px] leading-[1] flex items-center justify-center cursor-pointer transition-all duration-[200ms];
}

.close-btn:hover {
  @apply bg-[#e74c3c] text-white;
}

@media (max-width: 1200px) {
  .admin-card {
    max-width: 800px;
    padding: 36px 40px;
  }
}

@media (max-width: 768px) {
  .admin-card {
    padding: 32px 24px;
  }

  .card-title {
    @apply text-[22px];
  }

  .card-subtitle {
    @apply text-[15px];
  }

  .table-header,
  .table-row {
    grid-template-columns: 1.5fr 1fr 1fr 90px;
    gap: 12px;
    font-size: 13px;
    padding: 14px 16px;
  }

  .col-login {
    display: none;
  }

  .table-header .col-login {
    display: none;
  }

  .col-actions {
    justify-content: center;
  }

  .edit-btn,
  .close-btn {
    @apply w-[32px] h-[32px];
  }

  .edit-btn img {
    @apply w-[18px] h-[18px];
  }

  .close-btn {
    @apply text-[18px];
  }
}

@media (max-width: 480px) {
  .card-header {
    flex-direction: column;
    gap: 16px;
  }

  .back-btn {
    @apply self-start w-[38px] h-[38px];
  }

  .card-title {
    @apply text-[20px];
  }

  .card-subtitle {
    @apply text-[14px];
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr 1fr 80px;
    gap: 10px;
    font-size: 13px;
    padding: 12px 14px;
  }

  .col-role,
  .col-login {
    display: none;
  }

  .table-header .col-role,
  .table-header .col-login {
    display: none;
  }

  .edit-btn,
  .close-btn {
    @apply w-[30px] h-[30px];
  }

  .close-btn {
    @apply text-[16px];
  }
}
</style>
