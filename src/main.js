import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth after pinia and router are set up
const authStore = useAuthStore()
authStore.setupAuthListener()

// Initialize auth and mount app
authStore.initAuth().then(() => {
  app.mount('#app')
})