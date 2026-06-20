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

