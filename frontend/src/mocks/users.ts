export interface MockUser {
  id: number
  login: string
  password: string
  role: 'admin' | 'student'
  name: string
}

// Временные пользователи для локальной авторизации без БД.
export const mockUsers: MockUser[] = [
  {
    id: 1,
    login: 'admin_user',
    password: '123',
    role: 'admin',
    name: 'Иван Иванов',
  },
  {
    id: 2,
    login: 'student_u',
    password: 'qwerty',
    role: 'student',
    name: 'Алексей Смирнов',
  },
]
