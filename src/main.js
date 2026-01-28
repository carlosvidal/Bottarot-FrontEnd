import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth.js'
import es from './locales/es.json'
import en from './locales/en.json'
import { initCookieConsent } from './utils/cookieConsent.js'

// Create i18n instance
const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: 'es', // Default locale
  fallbackLocale: 'es',
  messages: {
    es,
    en
  }
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)
app.use(router)

// Initialize auth after pinia and router are set up
const authStore = useAuthStore()
authStore.setupAuthListener()

// Initialize auth and mount app
authStore.initAuth().then(() => {
  app.mount('#app')
  // Initialize cookie consent after app is mounted
  initCookieConsent()
})