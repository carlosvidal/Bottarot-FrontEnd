<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { loadScript } from '@paypal/paypal-js'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  planId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  planName: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['success', 'error', 'cancel', 'loading'])

const auth = useAuthStore()
const paypalButtonContainer = ref(null)
const paypalInstance = ref(null)
const loading = ref(true)
const error = ref(null)

const API_URL = import.meta.env.VITE_API_URL

const createOrder = async () => {
  try {
    emit('loading', true)

    const response = await fetch(`${API_URL}/api/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId: props.planId,
        userId: auth.user?.id
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Error creating order')
    }

    return data.orderId

  } catch (err) {
    console.error('Error creating order:', err)
    emit('error', err.message)
    throw err
  }
}

const onApprove = async (data) => {
  try {
    emit('loading', true)

    const response = await fetch(`${API_URL}/api/payments/capture-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: data.orderID,
        userId: auth.user?.id
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Error capturing payment')
    }

    emit('success', {
      transactionId: result.transactionId,
      orderId: data.orderID,
      subscriptionActive: result.subscriptionActive
    })

  } catch (err) {
    console.error('Error capturing payment:', err)
    emit('error', err.message)
  } finally {
    emit('loading', false)
  }
}

const onError = (err) => {
  console.error('PayPal error:', err)
  emit('error', 'Error en el procesamiento de pago de PayPal')
  emit('loading', false)
}

const onCancel = (data) => {
  console.log('Payment cancelled:', data)
  emit('cancel', data)
  emit('loading', false)
}

const initPayPal = async () => {
  try {
    console.log('💰 PayPal: Initializing PayPal button...')
    loading.value = true
    error.value = null

    const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID
    console.log('💰 PayPal: Client ID:', paypalClientId ? 'Configured' : 'Missing')

    if (!paypalClientId || paypalClientId === 'YOUR_PAYPAL_CLIENT_ID_SANDBOX') {
      throw new Error('PayPal Client ID no configurado')
    }

    console.log('💰 PayPal: Loading PayPal SDK...')
    const paypal = await loadScript({
      clientId: paypalClientId,
      currency: props.currency,
      intent: 'capture'
    })

    if (!paypal || !paypal.Buttons) {
      throw new Error('PayPal SDK no se cargó correctamente')
    }
    console.log('💰 PayPal: SDK loaded successfully')

    // Clear any existing buttons
    if (paypalButtonContainer.value) {
      paypalButtonContainer.value.innerHTML = ''
    }

    paypalInstance.value = paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        height: 50
      },
      createOrder,
      onApprove,
      onError,
      onCancel
    })

    if (paypalButtonContainer.value) {
      console.log('💰 PayPal: Rendering button...')
      await paypalInstance.value.render(paypalButtonContainer.value)
      console.log('💰 PayPal: Button rendered successfully!')
    } else {
      console.warn('💰 PayPal: Container not found!')
    }

  } catch (err) {
    console.error('💰 PayPal: Error initializing:', err)
    error.value = err.message
    emit('error', err.message)
  } finally {
    loading.value = false
    emit('loading', false)
  }
}

onMounted(() => {
  console.log('💰 PayPal: Component mounted. User ID:', auth.user?.id)
  if (auth.user?.id) {
    initPayPal()
  } else {
    console.warn('💰 PayPal: User not authenticated')
    error.value = 'Usuario no autenticado'
  }
})

onUnmounted(() => {
  if (paypalInstance.value && paypalInstance.value.close) {
    paypalInstance.value.close()
  }
})
</script>

<template>
  <div class="paypal-button-wrapper">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando PayPal...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p class="error-message">❌ {{ error }}</p>
      <button @click="initPayPal" class="retry-button">Reintentar</button>
    </div>

    <div v-else class="paypal-container">
      <div class="plan-summary">
        <h3>{{ planName }}</h3>
        <p class="amount">${{ amount.toFixed(2) }} {{ currency }}</p>
      </div>

      <div ref="paypalButtonContainer" class="paypal-buttons"></div>

      <div class="payment-info">
        <p class="secure-text">🔒 Pago seguro procesado por PayPal</p>
        <p class="cancel-text">Puedes cancelar en cualquier momento</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.paypal-button-wrapper {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
  color: #ffd700;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 215, 0, 0.3);
  border-left: 4px solid #ffd700;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 20px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid #ff6b6b;
  border-radius: 8px;
  margin-bottom: 20px;
}

.error-message {
  color: #ff6b6b;
  margin-bottom: 15px;
  font-size: 1rem;
}

.retry-button {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.retry-button:hover {
  background: #ff5252;
}

.paypal-container {
  background: rgba(22, 33, 62, 0.3);
  border: 1px solid #0f3460;
  border-radius: 12px;
  padding: 25px;
}

.plan-summary {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
}

.plan-summary h3 {
  color: #ffd700;
  font-size: 1.4rem;
  margin-bottom: 8px;
}

.amount {
  color: #f4f4f4;
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
}

.paypal-buttons {
  margin: 20px 0;
  min-height: 50px;
}

.payment-info {
  text-align: center;
  margin-top: 15px;
}

.secure-text {
  color: #4caf50;
  font-size: 0.9rem;
  margin-bottom: 5px;
  font-weight: 500;
}

.cancel-text {
  color: #aaa;
  font-size: 0.8rem;
  margin: 0;
  font-style: italic;
}

/* Responsive design */
@media (max-width: 768px) {
  .paypal-button-wrapper {
    max-width: 100%;
  }

  .paypal-container {
    padding: 20px 15px;
  }

  .amount {
    font-size: 1.6rem;
  }
}
</style>