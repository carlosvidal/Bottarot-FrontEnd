import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import Landing from '../views/Landing.vue'
import Chat from '../views/Chat.vue'
import Terms from '../views/Terms.vue'
import Privacy from '../views/Privacy.vue'
import Cookies from '../views/Cookies.vue'
import Profile from '../views/Profile.vue'
import Checkout from '../views/Checkout.vue'
import CheckoutSuccess from '../views/CheckoutSuccess.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: Landing
    },
    {
      path: '/chat',
      name: 'chat',
      component: Chat
    },
    {
      path: '/terms',
      name: 'terms',
      component: Terms
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: Privacy
    },
    {
      path: '/cookies',
      name: 'cookies',
      component: Cookies
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: Checkout,
      beforeEnter: (to, from, next) => {
        const auth = useAuthStore();
        if (auth.isLoggedIn) {
          next();
        } else {
          next({ name: 'landing' });
        }
      }
    },
    {
      path: '/checkout-success',
      name: 'checkout-success',
      component: CheckoutSuccess
    }
  ]
})

export default router
