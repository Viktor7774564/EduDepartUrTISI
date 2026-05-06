import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

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

    // РАСПИСАНИЕ
    {
      path: '/schedule/students',
      name: 'students',
      component: () => import('../views/schedule/StudentSchedule.vue'),
    },
    // {
    //   path: '/schedule/teachers',
    //   name: 'teachers',
    //   component: () => import('../views/schedule/TeacherSchedule.vue'),
    // },
    // {
    //   path: '/schedule/auditories',
    //   name: 'auditories',
    //   component: () => import('../views/schedule/AuditorySchedule.vue'),
    // },
    // {
    //   path: '/schedule/consults',
    //   name: 'consults',
    //   component: () => import('../views/schedule/ConsultSchedule.vue'),
    // },

    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

export default router