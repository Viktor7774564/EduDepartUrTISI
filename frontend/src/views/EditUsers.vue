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
  min-height: calc(100vh - 180px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px 20px;
}

.admin-card {
  width: 100%;
  max-width: 1100px;
  background: #ececec;
  border: 1px solid #4ea3d7;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  padding: 40px 48px;
  position: relative;
  z-index: 2;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  position: relative;
}

.back-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: #4ea3d7;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.back-btn:hover {
  background: #3f96cb;
}

.card-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #101215;
  text-align: center;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  pointer-events: none;
}

.card-subtitle {
  font-size: 16px;
  color: #5f6975;
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #d7e0e9;
}

.users-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.table-header {
  display: grid;
  grid-template-columns: 1.5fr 1.5fr 1.5fr 1fr 100px;
  gap: 16px;
  padding: 14px 18px;
  background: rgba(78, 163, 215, 0.15);
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  color: #24313f;
}

.table-row {
  display: grid;
  grid-template-columns: 1.5fr 1.5fr 1.5fr 1fr 100px;
  gap: 16px;
  padding: 16px 18px;
  background: #ffffff;
  border: 1px solid #d7e0e9;
  border-radius: 10px;
  align-items: center;
  transition: box-shadow 0.2s;
}

.table-row:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.col-name,
.col-login,
.col-role,
.col-password {
  font-size: 14px;
  color: #24313f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-name {
  font-weight: 500;
}

.col-login {
  font-family: monospace;
  color: #5f6975;
}

.col-role {
  color: #4ea3d7;
  font-weight: 500;
}

.col-password {
  font-family: monospace;
  color: #5f6975;
  /*letter-spacing: 2px;*/
}

.col-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.edit-btn {
  width: 34px;
  height: 34px;
  border: 1px solid #4ea3d7;
  border-radius: 8px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 6px;
}

.edit-btn:hover {
  background: #4ea3d7;
  border-color: #4ea3d7;
}

.edit-btn img {
  width: 22px;
  height: 22px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.edit-btn:hover img {
  opacity: 1;
}

.close-btn {
  width: 34px;
  height: 34px;
  border: 1px solid #e74c3c;
  border-radius: 8px;
  background: #ffffff;
  color: #e74c3c;
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e74c3c;
  color: #ffffff;
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
    font-size: 22px;
  }

  .card-subtitle {
    font-size: 15px;
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
    width: 32px;
    height: 32px;
  }

  .edit-btn img {
    width: 18px;
    height: 18px;
  }

  .close-btn {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .card-header {
    flex-direction: column;
    gap: 16px;
  }

  .back-btn {
    align-self: flex-start;
    width: 38px;
    height: 38px;
  }

  .card-title {
    font-size: 20px;
  }

  .card-subtitle {
    font-size: 14px;
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
    width: 30px;
    height: 30px;
  }

  .close-btn {
    font-size: 16px;
  }
}
</style>