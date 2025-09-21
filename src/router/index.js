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

// Helper function to wait for auth initialization
async function waitForAuthInitialization() {
  const auth = useAuthStore();

  if (auth.isInitialized) {
    return true;
  }

  console.log('🔄 Waiting for auth initialization...');

  const maxWait = 5000; // 5 seconds max wait
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

        // Wait for auth initialization if not ready
        if (!auth.isInitialized) {
          const authReady = await waitForAuthInitialization();
          if (!authReady) {
            next({ name: 'landing' });
            return;
          }
        }

        console.log('🏠 Home guard - Auth state:', {
          isLoggedIn: auth.isLoggedIn,
          isFullyRegistered: auth.isFullyRegistered,
          needsRegistration: auth.needsRegistration
        });

        if (auth.isLoggedIn && auth.isFullyRegistered) {
          console.log('🚀 Redirecting to chat from home guard');
          // Generate UUID for new chat session
          const chatId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
          next({ name: 'chat', params: { chatId } });
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
      path: '/chat/:chatId?',
      name: 'chat',
      component: Chat,
      beforeEnter: async (to, from, next) => {
        const auth = useAuthStore();
        console.log('🚪 Chat guard - Initial auth state:', {
          isLoggedIn: auth.isLoggedIn,
          needsRegistration: auth.needsRegistration,
          isInitialized: auth.isInitialized,
          user: !!auth.user
        });

        // Wait for auth initialization if not ready
        if (!auth.isInitialized) {
          console.log('⏳ Chat guard - Waiting for auth initialization...');
          const authReady = await waitForAuthInitialization();

          if (!authReady) {
            console.log('⚠️ Chat guard - Auth failed to initialize, redirecting to landing');
            next({ name: 'landing' });
            return;
          }
        }

        console.log('🚪 Chat guard - Final auth state:', {
          isLoggedIn: auth.isLoggedIn,
          needsRegistration: auth.needsRegistration,
          isInitialized: auth.isInitialized,
          user: !!auth.user
        });

        if (!auth.isLoggedIn) {
          console.log('❌ Chat guard - Not logged in, redirecting to landing');
          next({ name: 'landing' });
        } else if (auth.needsRegistration) {
          console.log('❌ Chat guard - Needs registration, redirecting to landing');
          next({ name: 'landing' });
        } else {
          console.log('✅ Chat guard - Access granted');
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

        // Wait for auth initialization if not ready
        if (!auth.isInitialized) {
          const authReady = await waitForAuthInitialization();
          if (!authReady) {
            next({ name: 'landing' });
            return;
          }
        }

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

        // Wait for auth initialization if not ready
        if (!auth.isInitialized) {
          const authReady = await waitForAuthInitialization();
          if (!authReady) {
            next({ name: 'landing' });
            return;
          }
        }

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
      // No auth guard - anonymous access
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

// TEMPORARILY DISABLED: Global guard causing infinite loops
// TODO: Fix auth initialization synchronization
// router.beforeEach(async (to, from, next) => {
//   console.log('🔒 Global guard - Navigating to:', to.name, 'from:', from.name)

//   const auth = useAuthStore()

//   // Skip auth wait for public routes
//   const publicRoutes = ['landing', 'terms', 'privacy', 'cookies', 'debug', 'logout', 'checkout-success']
//   if (publicRoutes.includes(to.name)) {
//     console.log('🔓 Public route, proceeding without auth check')
//     next()
//     return
//   }

//   // Wait for auth initialization only for protected routes
//   const authReady = await waitForAuthInitialization()

//   if (!authReady) {
//     console.log('⚠️ Global guard - Auth failed to initialize, redirecting to landing')
//     next({ name: 'landing' })
//     return
//   }

//   console.log('✅ Global guard - Auth ready, proceeding with navigation')
//   next()
// })

export default router
