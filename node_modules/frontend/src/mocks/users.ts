export interface MockUser {
  id: number
  login: string
  password: string

  role: 'admin' | 'student' | 'teacher' | 'education_department'

  surname: string
  name: string
  patronymic: string

  photo?: string

  // admin
  department?: string

  // teacher
  position?: string
  cabinet?: string

  // student
  group?: string
  direction?: string
  educationForm?: string
  course?: number
}

// Временные пользователи для локальной авторизации без БД.
export const mockUsers: MockUser[] = [
  {
    id: 1,
    login: 'admin_user',
    password: '123',

    role: 'admin',

    surname: 'Иванов',
    name: 'Иван',
    patronymic: 'Иванович',

    position: 'Специалист',
    department: 'Технический отдел',
    cabinet: '000',
  },

  {
    id: 2,
    login: 'student_u',
    password: 'qwerty',

    role: 'student',

    surname: 'Смирнов',
    name: 'Алексей',
    patronymic: 'Дмитриевич',

    group: 'ИС-21',
    direction: 'Информатика и вычислительная техника',
    educationForm: 'Очная',
    course: 4,
  },

  {
    id: 3,
    login: 'teacher_u',
    password: '123456',

    role: 'teacher',

    surname: 'Петров',
    name: 'Сергей',
    patronymic: 'Андреевич',

    position: 'Преподаватель',
    department: 'Информационные системы',
    cabinet: '312',
  },

  {
    id: 4,
    login: 'education_user',
    password: '123',

    role: 'education_department',

    surname: 'Кузнецова',
    name: 'Мария',
    patronymic: 'Алексеевна',

    position: 'Специалист',
    department: 'Учебный отдел',
    cabinet: '101',
  },
]