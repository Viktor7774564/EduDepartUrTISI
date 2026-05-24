// stores/users.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { mockUsers, type MockUser } from '@/mocks/users'

export const useUsersStore = defineStore('users', () => {
  const users = ref<MockUser[]>([...mockUsers])

  function addUser(user: Omit<MockUser, 'id'>): MockUser {
    const newUser: MockUser = {
      id: Date.now(),
      login: user.login,
      password: user.password,
      role: user.role,
      surname: user.surname,
      name: user.name,
      patronymic: user.patronymic,
      photo: user.photo,
      department: user.department,
      position: user.position,
      cabinet: user.cabinet,
      group: user.group,
      direction: user.direction,
      educationForm: user.educationForm,
      course: user.course,
    }
    users.value.push(newUser)
    return newUser
  }

  function updateUser(id: number, updates: Partial<MockUser>): boolean {
    const index = users.value.findIndex((u) => u.id === id)
    if (index === -1) return false
    
    const user = users.value[index]
    
    
    users.value[index] = {
      ...user,
      ...updates,
      id: user!.id, // Гарантируем, что id не изменится
    } as MockUser
    
    return true
  }

  function deleteUser(id: number): boolean {
    const index = users.value.findIndex((u) => u.id === id)
    if (index === -1) return false
    
    users.value.splice(index, 1)
    return true
  }

  function getUserById(id: number): MockUser | undefined {
    return users.value.find((u) => u.id === id)
  }

  return {
    users,
    addUser,
    updateUser,
    deleteUser,
    getUserById,
  }
})