<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import PageFrame from '@/components/PageFrame.vue'
import type { MockUser } from '@/mocks/users'

const router = useRouter()
const authStore = useAuthStore()
const usersStore = useUsersStore()

onMounted(() => {
  if (!authStore.isAuthenticated || authStore.currentUser?.role !== 'admin') {
    router.replace({ name: 'admin-panel' })
  }
})

// Тип для формы - все поля опциональны кроме базовых
interface UserForm {
  login: string
  password: string
  role: MockUser['role']
  surname: string
  name: string
  patronymic: string
  photo?: string
  
  // Для admin, teacher, education_department
  department?: string
  
  // Для teacher, education_department
  position?: string
  cabinet?: string
  
  // Для student
  group?: string
  direction?: string
  educationForm?: string
  course?: number
}

const initialForm: UserForm = {
  login: '',
  password: '',
  role: 'student',
  surname: '',
  name: '',
  patronymic: '',
  photo: '',
  department: '',
  position: '',
  cabinet: '',
  group: '',
  direction: '',
  educationForm: 'Очная',
  course: 1,
}

const form = ref<UserForm>({ ...initialForm })
const errors = ref<Partial<Record<keyof UserForm, string>>>({})
const isSubmitting = ref(false)
const submitMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const roleOptions = [
  { value: 'student', label: 'Студент' },
  { value: 'teacher', label: 'Преподаватель' },
  { value: 'education_department', label: 'Сотрудник учебного отдела' },
  { value: 'admin', label: 'Администратор' },
]

const educationFormOptions = [
  { value: 'Очная', label: 'Очная' },
  { value: 'Заочная', label: 'Заочная' },
  { value: 'Очно-заочная', label: 'Очно-заочная' },
]

const courseOptions = [1, 2, 3, 4, 5, 6]

// Очистка специфичных полей при смене роли
watch(() => form.value.role, (newRole) => {
  // Очищаем ВСЕ специфичные поля
  form.value.department = ''
  form.value.position = ''
  form.value.cabinet = ''
  form.value.group = ''
  form.value.direction = ''
  form.value.educationForm = 'Очная'
  form.value.course = 1
  
  // Устанавливаем дефолтные значения в зависимости от роли
  if (newRole === 'student') {
    form.value.educationForm = 'Очная'
    form.value.course = 1
  }
}, { immediate: true })

// Валидация
const validate = (): boolean => {
  errors.value = {}
  
  // Базовые поля (обязательные для всех)
  if (!form.value.login.trim()) {
    errors.value.login = 'Введите логин'
  } else if (form.value.login.length < 3) {
    errors.value.login = 'Минимум 3 символа'
  }
  
  if (!form.value.password) {
    errors.value.password = 'Введите пароль'
  } else if (form.value.password.length < 3) {
    errors.value.password = 'Минимум 3 символа'
  }
  
  if (!form.value.surname.trim()) {
    errors.value.surname = 'Введите фамилию'
  }
  
  if (!form.value.name.trim()) {
    errors.value.name = 'Введите имя'
  }
  
  // Специфичная валидация по ролям
  if (form.value.role === 'student') {
    if (!form.value.group?.trim()) {
      errors.value.group = 'Введите группу'
    }
    if (!form.value.direction?.trim()) {
      errors.value.direction = 'Введите направление подготовки'
    }
    if (!form.value.course || form.value.course < 1 || form.value.course > 6) {
      errors.value.course = 'Выберите курс (1-6)'
    }
  }
  
  if (form.value.role === 'teacher') {
    if (!form.value.position?.trim()) {
      errors.value.position = 'Введите должность'
    }
    if (!form.value.department?.trim()) {
      errors.value.department = 'Введите кафедру'
    }
  }
  
  if (form.value.role === 'education_department') {
    if (!form.value.position?.trim()) {
      errors.value.position = 'Введите должность'
    }
    if (!form.value.department?.trim()) {
      errors.value.department = 'Введите отдел'
    }
  }
  
  if (form.value.role === 'admin') {
    if (!form.value.department?.trim()) {
      errors.value.department = 'Введите отдел'
    }
  }
  
  return Object.keys(errors.value).length === 0
}

// Отправка формы
const handleSubmit = async () => {
  if (!validate()) return
  
  isSubmitting.value = true
  submitMessage.value = null
  
  try {
    // Создаем базовый объект пользователя
    const newUser: Omit<MockUser, 'id'> = {
      login: form.value.login.trim(),
      password: form.value.password,
      role: form.value.role,
      surname: form.value.surname.trim(),
      name: form.value.name.trim(),
      patronymic: form.value.patronymic.trim(),
    }
    
    // Добавляем опциональное фото
    if (form.value.photo?.trim()) {
      newUser.photo = form.value.photo.trim()
    }
    
    // Добавляем поля в зависимости от роли
    if (form.value.role === 'student') {
      newUser.group = form.value.group?.trim()
      newUser.direction = form.value.direction?.trim()
      newUser.educationForm = form.value.educationForm
      newUser.course = form.value.course
    }
    
    if (form.value.role === 'teacher') {
      newUser.position = form.value.position?.trim()
      newUser.department = form.value.department?.trim()
      if (form.value.cabinet?.trim()) {
        newUser.cabinet = form.value.cabinet.trim()
      }
    }
    
    if (form.value.role === 'education_department') {
      newUser.position = form.value.position?.trim()
      newUser.department = form.value.department?.trim()
      if (form.value.cabinet?.trim()) {
        newUser.cabinet = form.value.cabinet.trim()
      }
    }
    
    if (form.value.role === 'admin') {
      newUser.department = form.value.department?.trim()
      // Для админа тоже можно указать должность и кабинет (опционально)
      if (form.value.position?.trim()) {
        newUser.position = form.value.position.trim()
      }
      if (form.value.cabinet?.trim()) {
        newUser.cabinet = form.value.cabinet.trim()
      }
    }
    
    // Добавляем через стор
    usersStore.addUser(newUser)
    
    // Успешное сообщение
    const roleLabel = roleOptions.find(r => r.value === form.value.role)?.label
    submitMessage.value = {
      type: 'success',
      text: `${roleLabel} ${form.value.surname} ${form.value.name.charAt(0)}. успешно добавлен(а)!`,
    }
    
    // Очистка и редирект
    setTimeout(() => {
      form.value = { ...initialForm }
      router.push({ name: 'admin-users' })
    }, 1500)
    
  } catch (err) {
    console.error('Ошибка при добавлении:', err)
    submitMessage.value = {
      type: 'error',
      text: 'Не удалось добавить пользователя. Попробуйте ещё раз.',
    }
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => router.push({ name: 'admin-panel' })

const resetForm = () => {
  form.value = { ...initialForm }
  errors.value = {}
  submitMessage.value = null
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
          <h1 class="card-title">Добавить пользователя</h1>
        </div>

        <!-- Сообщение -->
        <div v-if="submitMessage" :class="['submit-message', submitMessage.type]">
          {{ submitMessage.text }}
        </div>

        <form @submit.prevent="handleSubmit" class="user-form">
          <!-- Основные данные (для всех) -->
          <div class="form-section">
            <h2 class="section-title">Основные данные</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label for="login" class="form-label">
                  Логин <span class="required">*</span>
                </label>
                <input
                  id="login"
                  v-model="form.login"
                  type="text"
                  class="form-input"
                  :class="{ error: errors.login }"
                  placeholder="Введите логин"
                  :disabled="isSubmitting"
                />
                <span v-if="errors.login" class="error-message">{{ errors.login }}</span>
              </div>

              <div class="form-group">
                <label for="password" class="form-label">
                  Пароль <span class="required">*</span>
                </label>
                <input
                  id="password"
                  v-model="form.password"
                  type="password"
                  class="form-input"
                  :class="{ error: errors.password }"
                  placeholder="Введите пароль"
                  :disabled="isSubmitting"
                />
                <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="role" class="form-label">
                  Роль <span class="required">*</span>
                </label>
                <select
                  id="role"
                  v-model="form.role"
                  class="form-select"
                  :disabled="isSubmitting"
                >
                  <option v-for="option in roleOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="photo" class="form-label">
                  Фото (URL)
                </label>
                <input
                  id="photo"
                  v-model="form.photo"
                  type="text"
                  class="form-input"
                  placeholder="https://example.com/photo.jpg"
                  :disabled="isSubmitting"
                />
              </div>
            </div>
          </div>

          <!-- ФИО (для всех) -->
          <div class="form-section">
            <h2 class="section-title">Личные данные</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label for="surname" class="form-label">
                  Фамилия <span class="required">*</span>
                </label>
                <input
                  id="surname"
                  v-model="form.surname"
                  type="text"
                  class="form-input"
                  :class="{ error: errors.surname }"
                  placeholder="Введите фамилию"
                  :disabled="isSubmitting"
                />
                <span v-if="errors.surname" class="error-message">{{ errors.surname }}</span>
              </div>

              <div class="form-group">
                <label for="name" class="form-label">
                  Имя <span class="required">*</span>
                </label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  class="form-input"
                  :class="{ error: errors.name }"
                  placeholder="Введите имя"
                  :disabled="isSubmitting"
                />
                <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
              </div>

              <div class="form-group">
                <label for="patronymic" class="form-label">
                  Отчество
                </label>
                <input
                  id="patronymic"
                  v-model="form.patronymic"
                  type="text"
                  class="form-input"
                  placeholder="Введите отчество"
                  :disabled="isSubmitting"
                />
              </div>
            </div>
          </div>

          <!-- Поля для СТУДЕНТА -->
          <div v-if="form.role === 'student'" class="form-section">
            <h2 class="section-title">Данные студента</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label for="group" class="form-label">
                  Группа <span class="required">*</span>
                </label>
                <input
                  id="group"
                  v-model="form.group"
                  type="text"
                  class="form-input"
                  :class="{ error: errors.group }"
                  placeholder="Например: ИС-21"
                  :disabled="isSubmitting"
                />
                <span v-if="errors.group" class="error-message">{{ errors.group }}</span>
              </div>

              <div class="form-group">
                <label for="course" class="form-label">
                  Курс <span class="required">*</span>
                </label>
                <select
                  id="course"
                  v-model.number="form.course"
                  class="form-select"
                  :class="{ error: errors.course }"
                  :disabled="isSubmitting"
                >
                  <option value="" disabled>Выберите курс</option>
                  <option v-for="c in courseOptions" :key="c" :value="c">
                    {{ c }} курс
                  </option>
                </select>
                <span v-if="errors.course" class="error-message">{{ errors.course }}</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label for="direction" class="form-label">
                  Направление подготовки <span class="required">*</span>
                </label>
                <input
                  id="direction"
                  v-model="form.direction"
                  type="text"
                  class="form-input"
                  :class="{ error: errors.direction }"
                  placeholder="Например: Информатика и вычислительная техника"
                  :disabled="isSubmitting"
                />
                <span v-if="errors.direction" class="error-message">{{ errors.direction }}</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="educationForm" class="form-label">
                  Форма обучения
                </label>
                <select
                  id="educationForm"
                  v-model="form.educationForm"
                  class="form-select"
                  :disabled="isSubmitting"
                >
                  <option v-for="opt in educationFormOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Поля для ПРЕПОДАВАТЕЛЯ -->
          <div v-if="form.role === 'teacher'" class="form-section">
            <h2 class="section-title">Данные преподавателя</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label for="position" class="form-label">
                  Должность <span class="required">*</span>
                </label>
                <input
                  id="position"
                  v-model="form.position"
                  type="text"
                  class="form-input"
                  :class="{ error: errors.position }"
                  placeholder="Например: Преподаватель"
                  :disabled="isSubmitting"
                />
                <span v-if="errors.position" class="error-message">{{ errors.position }}</span>
              </div>

              <div class="form-group">
                <label for="cabinet" class="form-label">
                  Кабинет
                </label>
                <input
                  id="cabinet"
                  v-model="form.cabinet"
                  type="text"
                  class="form-input"
                  placeholder="Например: 312"
                  :disabled="isSubmitting"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label for="department" class="form-label">
                  Кафедра <span class="required">*</span>
                </label>
                <input
                  id="department"
                  v-model="form.department"
                  type="text"
                  class="form-input"
                  :class="{ error: errors.department }"
                  placeholder="Например: Информационные системы"
                  :disabled="isSubmitting"
                />
                <span v-if="errors.department" class="error-message">{{ errors.department }}</span>
              </div>
            </div>
          </div>

          <!-- Поля для СОТРУДНИКА УЧЕБНОГО ОТДЕЛА -->
          <div v-if="form.role === 'education_department'" class="form-section">
            <h2 class="section-title">Данные сотрудника учебного отдела</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label for="position" class="form-label">
                  Должность <span class="required">*</span>
                </label>
                <input
                  id="position"
                  v-model="form.position"
                  type="text"
                  class="form-input"
                  :class="{ error: errors.position }"
                  placeholder="Например: Специалист"
                  :disabled="isSubmitting"
                />
                <span v-if="errors.position" class="error-message">{{ errors.position }}</span>
              </div>

              <div class="form-group">
                <label for="cabinet" class="form-label">
                  Кабинет
                </label>
                <input
                  id="cabinet"
                  v-model="form.cabinet"
                  type="text"
                  class="form-input"
                  placeholder="Например: 101"
                  :disabled="isSubmitting"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label for="department" class="form-label">
                  Отдел <span class="required">*</span>
                </label>
                <input
                  id="department"
                  v-model="form.department"
                  type="text"
                  class="form-input"
                  :class="{ error: errors.department }"
                  placeholder="Например: Учебный отдел"
                  :disabled="isSubmitting"
                />
                <span v-if="errors.department" class="error-message">{{ errors.department }}</span>
              </div>
            </div>
          </div>

          <!-- Поля для АДМИНИСТРАТОРА -->
          <div v-if="form.role === 'admin'" class="form-section">
            <h2 class="section-title">Данные администратора</h2>
            
            <div class="form-row">
              <div class="form-group full-width">
                <label for="department" class="form-label">
                  Отдел <span class="required">*</span>
                </label>
                <input
                  id="department"
                  v-model="form.department"
                  type="text"
                  class="form-input"
                  :class="{ error: errors.department }"
                  placeholder="Например: Технический отдел"
                  :disabled="isSubmitting"
                />
                <span v-if="errors.department" class="error-message">{{ errors.department }}</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="position" class="form-label">
                  Должность
                </label>
                <input
                  id="position"
                  v-model="form.position"
                  type="text"
                  class="form-input"
                  placeholder="Например: Специалист"
                  :disabled="isSubmitting"
                />
              </div>

              <div class="form-group">
                <label for="cabinet" class="form-label">
                  Кабинет
                </label>
                <input
                  id="cabinet"
                  v-model="form.cabinet"
                  type="text"
                  class="form-input"
                  placeholder="Например: 000"
                  :disabled="isSubmitting"
                />
              </div>
            </div>
          </div>

          <!-- Кнопки -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="goBack" :disabled="isSubmitting">
              Отмена
            </button>
            <button type="button" class="btn btn-secondary" @click="resetForm" :disabled="isSubmitting">
              Сбросить
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Добавление...' : 'Добавить пользователя' }}
            </button>
          </div>
        </form>
      </div>
    </section>
  </PageFrame>
</template>

