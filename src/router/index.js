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

// UUID Generator
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Helper function to wait for auth initialization
async function waitForAuthInitialization() {
  const auth = useAuthStore();
  if (auth.isInitialized) return true;
  console.log('🔄 Waiting for auth initialization...');
  const maxWait = 5000;
  const startTime = Date.now();
  while (!auth.isInitialized && (Date.now() - startTime) < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log('✅ Auth initialization completed:', auth.isInitialized);
  return auth.isInitialized;
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      beforeEnter: async (to, from, next) => {
        const auth = useAuthStore();
        if (!auth.isInitialized) await waitForAuthInitialization();
        if (auth.isLoggedIn && auth.isFullyRegistered) {
          next({ name: 'new-chat' });
        } else {
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
          next({ name: 'new-chat' });
        } else {
          next();
        }
      }
    },
    {
      path: '/chat',
      name: 'new-chat',
      redirect: () => {
        return { name: 'chat', params: { chatId: generateUUID() } }
      }
    },
    {
      path: '/chat/:chatId',
      name: 'chat',
      component: Chat,
      beforeEnter: async (to, from, next) => {
        const auth = useAuthStore();
        if (!auth.isInitialized) await waitForAuthInitialization();
        if (!auth.isLoggedIn || auth.needsRegistration) {
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
      beforeEnter: async (to, from, next) => {
        const auth = useAuthStore();
        if (!auth.isInitialized) await waitForAuthInitialization();
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
      beforeEnter: async (to, from, next) => {
        const auth = useAuthStore();
        if (!auth.isInitialized) await waitForAuthInitialization();
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
      path: '/shared/:shareId',
      name: 'shared-chat',
      component: () => import('../views/SharedChat.vue'),
    },
    {
      path: '/logout',
      name: 'logout',
      beforeEnter: async (to, from, next) => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
      }
    }
  ]
})

export default router