import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const AUTH_STORAGE_KEY = 'edu-depart-auth-user'
const protectedScheduleTypes = new Set(['teachers', 'auditories', 'consults'])

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/schedule/:type',
      name: 'schedule-selection',
      component: () => import('../views/schedule/ScheduleSelectionView.vue'),
    },
    {
      path: '/schedule/:type/view',
      name: 'schedule-view',
      component: () => import('../views/schedule/Schedule.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
    },
    {
      path: '/education-department/schedule-upload',
      name: 'schedule-upload',
      component: () => import('../views/ScheduleUpload.vue'),
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('../views/NotificationsView.vue'),
    },
    {
      path: '/admin',
      name: 'admin-panel',
      component: () => import('../views/AdminPanel.vue'),
      children: [
        {
          path: 'edit-user',
          name: 'admin-edit-user',
          component: () => import('../views/EditUsers.vue'),    
        },
        {
          path: 'edit-user/:id',
          name: 'admin-user-edit',
          component: () => import('../views/EditUser.vue'),
        },
        {
          path: 'add-user',
          name: 'admin-add-user',
          component: () => import('../views/AddUser.vue'),    
        },
        {
          path: 'sessions',
          name: 'admin-sessions',
          component: () => import('../views/AdminSessions.vue'),
        },
      ]
    },

    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  if (typeof window !== 'undefined' && to.path.startsWith('/admin')) {
    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY)

    if (!storedUser) {
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }

    if (to.path === '/notifications') {
      const isAuthenticated = Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY))

      if (!isAuthenticated) {
        return {
          name: 'login',
          query: { redirect: to.fullPath },
        }
      }
    }

    try {
      const user = JSON.parse(storedUser)

      if (user.role !== 'admin') {
        return { name: 'home' }
      }
    } catch {
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }
  }

  if (typeof window !== 'undefined' && to.path.startsWith('/education-department')) {
    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY)

    if (!storedUser) {
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }

    try {
      const user = JSON.parse(storedUser)

      if (user.role !== 'education_department') {
        return { name: 'home' }
      }
    } catch {
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }
  }

  if (!to.path.startsWith('/schedule/')) {
    return true
  }

  const scheduleType = String(to.params.type ?? '')
  const isProtectedType = protectedScheduleTypes.has(scheduleType)

  if (!isProtectedType) {
    return true
  }

  if (typeof window === 'undefined') {
    return true
  }

  const isAuthenticated = Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY))

  if (isAuthenticated) {
    return true
  }

  return {
    name: 'login',
    query: {
      redirect: to.fullPath,
    },
  }
})

export default router
