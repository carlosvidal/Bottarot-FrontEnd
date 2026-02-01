import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth.js'
import es from './locales/es.json'
import en from './locales/en.json'
import it from './locales/it.json'
import pt from './locales/pt.json'
import fr from './locales/fr.json'
import { initCookieConsent } from './utils/cookieConsent.js'

// Create i18n instance
const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: 'en', // Default locale
  fallbackLocale: 'en',
  messages: {
    es,
    en,
    it,
    pt,
    fr
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