<template>
  <div class="debug-page">
    <h1>🔍 Debug - Variables de Entorno</h1>
    <div class="debug-info">
      <h2>Variables VITE</h2>
      <pre>{{ debugInfo }}</pre>

      <h2>Environment Mode</h2>
      <p><strong>NODE_ENV:</strong> {{ envInfo.NODE_ENV }}</p>
      <p><strong>MODE:</strong> {{ envInfo.MODE }}</p>
      <p><strong>PROD:</strong> {{ envInfo.PROD }}</p>
      <p><strong>DEV:</strong> {{ envInfo.DEV }}</p>

      <h2>Test API Connection</h2>
      <button @click="testApi" :disabled="loading">Test API</button>
      <div v-if="apiResult" class="api-result">
        <h3>API Response:</h3>
        <pre>{{ apiResult }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const loading = ref(false)
const apiResult = ref(null)

const debugInfo = computed(() => {
  return {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '***' + import.meta.env.VITE_SUPABASE_ANON_KEY.slice(-10) : 'NOT_SET',
    VITE_PAYPAL_CLIENT_ID: import.meta.env.VITE_PAYPAL_CLIENT_ID ? '***' + import.meta.env.VITE_PAYPAL_CLIENT_ID.slice(-10) : 'NOT_SET'
  }
})

const envInfo = computed(() => {
  return {
    NODE_ENV: typeof process !== 'undefined' ? process.env.NODE_ENV : 'undefined',
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD,
    DEV: import.meta.env.DEV
  }
})

const testApi = async () => {
  loading.value = true
  try {
    const API_URL = import.meta.env.VITE_API_URL
    const response = await fetch(`${API_URL}/api/test`)
    const data = await response.json()
    apiResult.value = {
      status: response.status,
      url: `${API_URL}/api/test`,
      data: data
    }
  } catch (error) {
    apiResult.value = {
      error: error.message,
      url: `${import.meta.env.VITE_API_URL}/api/test`
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.debug-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.debug-info {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}

pre {
  background: #000;
  color: #0f0;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

.api-result {
  margin-top: 20px;
  padding: 10px;
  background: #e8f4f8;
  border-radius: 4px;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>