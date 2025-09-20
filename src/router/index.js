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
import Debug from '../views/Debug.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      beforeEnter: async (to, from, next) => {
        const auth = useAuthStore();

        // Wait for auth to initialize if it hasn't already
        if (auth.loading) {
          const maxWait = 3000; // 3 seconds max
          const startTime = Date.now();

          while (auth.loading && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        console.log('🏠 Home guard - Auth state:', {
          isLoggedIn: auth.isLoggedIn,
          isFullyRegistered: auth.isFullyRegistered,
          needsRegistration: auth.needsRegistration
        });

        if (auth.isLoggedIn && auth.isFullyRegistered) {
          console.log('🚀 Redirecting to chat from home guard');
          next({ name: 'chat' });
        } else {
          console.log('🏡 Redirecting to landing from home guard');
          next({ name: 'landing' });
        }
      }
    },
    {
      path: '/landing',
      name: 'landing',
      component: Landing,
      beforeEnter: (to, from, next) => {
        const auth = useAuthStore();
        if (auth.isLoggedIn && auth.isFullyRegistered) {
          next({ name: 'chat' });
        } else {
          next();
        }
      }
    },
    {
      path: '/chat',
      name: 'chat',
      component: Chat,
      beforeEnter: (to, from, next) => {
        const auth = useAuthStore();
        if (!auth.isLoggedIn) {
          next({ name: 'landing' });
        } else if (auth.needsRegistration) {
          next({ name: 'landing' });
        } else {
          next();
        }
      }
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
      component: Profile,
      beforeEnter: (to, from, next) => {
        const auth = useAuthStore();
        if (!auth.isLoggedIn || auth.needsRegistration) {
          next({ name: 'landing' });
        } else {
          next();
        }
      }
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
    },
    {
      path: '/debug',
      name: 'debug',
      component: Debug
    },
    {
      path: '/logout',
      name: 'logout',
      beforeEnter: async (to, from, next) => {
        // Simple hard reset - clear everything and reload
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
      }
    }
  ]
})

export default router
