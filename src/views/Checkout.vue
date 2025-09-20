<template>
    <div class="legal-container">
        <div class="content">
            <h1>Upgrade a Premium</h1>
            <p>Elige el plan que mejor se adapte a tus necesidades.</p>

            <!-- Loading state -->
            <div v-if="loadingPlans" class="loading-section">
                <div class="spinner"></div>
                <p>Cargando planes disponibles...</p>
            </div>

            <!-- Error state -->
            <div v-else-if="errorMessage" class="error-section">
                <p class="error-text">❌ {{ errorMessage }}</p>
                <button @click="loadPlans" class="retry-button">Reintentar</button>
            </div>

            <!-- Plans selection -->
            <div v-else-if="!selectedPlan" class="plans-section">
                <h2>Planes Disponibles</h2>
                <div class="plans-grid">
                    <div
                        v-for="plan in plans"
                        :key="plan.id"
                        class="plan-card"
                        :class="{ 'premium': plan.price > 0 && plan.price <= 1 }"
                        @click="selectPlan(plan)"
                    >
                        <h3>{{ plan.name }}</h3>
                        <div class="price">
                            <span class="amount">${{ plan.price.toFixed(2) }}</span>
                            <span class="period" v-if="plan.duration_days === 7">/ semana</span>
                            <span class="period" v-else-if="plan.duration_days === 30">/ mes</span>
                        </div>
                        <p class="description">{{ plan.description }}</p>
                        <ul class="features" v-if="plan.features">
                            <li v-if="plan.features.unlimited_questions">✅ Preguntas ilimitadas</li>
                            <li v-if="plan.features.premium_readings">✅ Lecturas premium</li>
                            <li v-if="plan.features.full_history">✅ Historial completo</li>
                            <li v-if="plan.features.export_pdf">✅ Exportar a PDF</li>
                            <li v-if="plan.features.priority_support">✅ Soporte prioritario</li>
                            <li v-if="plan.max_questions_per_period && !plan.features.unlimited_questions">
                                📊 {{ plan.max_questions_per_period }} pregunta{{ plan.max_questions_per_period > 1 ? 's' : '' }} por {{ plan.duration_days === 7 ? 'semana' : 'mes' }}
                            </li>
                        </ul>
                        <button class="select-button" :disabled="plan.price === 0">
                            {{ plan.price === 0 ? 'Plan Actual' : 'Seleccionar' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Payment section -->
            <div v-else class="checkout-section">
                <div class="order-summary">
                    <h2>Resumen de tu Orden</h2>
                    <div class="selected-plan">
                        <h3>{{ selectedPlan.name }}</h3>
                        <p>{{ selectedPlan.description }}</p>
                    </div>
                    <div class="order-item">
                        <span>{{ selectedPlan.name }}</span>
                        <span>${{ selectedPlan.price.toFixed(2) }} USD</span>
                    </div>
                    <div class="order-total">
                        <span>Total</span>
                        <span>${{ selectedPlan.price.toFixed(2) }} USD</span>
                    </div>
                </div>

                <div class="payment-section">
                    <h3>Método de Pago</h3>

                    <PayPalButton
                        :plan-id="selectedPlan.id"
                        :amount="selectedPlan.price"
                        :plan-name="selectedPlan.name"
                        @success="handlePaymentSuccess"
                        @error="handlePaymentError"
                        @cancel="handlePaymentCancel"
                        @loading="handlePaymentLoading"
                    />

                    <div v-if="paymentLoading" class="payment-loading">
                        <div class="spinner"></div>
                        <p>Procesando pago...</p>
                    </div>

                    <div v-if="paymentError" class="payment-error">
                        <p>❌ {{ paymentError }}</p>
                        <button @click="paymentError = null" class="clear-error">Reintentar</button>
                    </div>
                </div>

                <div class="action-buttons">
                    <button @click="goBack" class="back-button">← Cambiar Plan</button>
                    <router-link to="/chat" class="cancel-link">Cancelar</router-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import PayPalButton from '../components/PayPalButton.vue'

const router = useRouter()
const auth = useAuthStore()

// State
const plans = ref([])
const selectedPlan = ref(null)
const loadingPlans = ref(true)
const errorMessage = ref(null)
const paymentLoading = ref(false)
const paymentError = ref(null)

const API_URL = import.meta.env.VITE_API_URL

// Load subscription plans
const loadPlans = async () => {
    try {
        console.log('🛒 Checkout: Loading plans...')
        loadingPlans.value = true
        errorMessage.value = null

        console.log('🛒 Checkout: API_URL:', API_URL)
        const response = await fetch(`${API_URL}/api/subscription-plans`)

        if (!response.ok) {
            throw new Error('Error cargando planes')
        }

        const data = await response.json()
        plans.value = data.plans || []
        console.log('🛒 Checkout: Plans loaded:', plans.value.length)

    } catch (error) {
        console.error('🛒 Checkout: Error loading plans:', error)
        errorMessage.value = 'No se pudieron cargar los planes disponibles'
    } finally {
        loadingPlans.value = false
    }
}

// Select a plan
const selectPlan = (plan) => {
    console.log('🛒 Checkout: Plan selected:', plan.name, plan.price)
    if (plan.price > 0) {
        selectedPlan.value = plan
        paymentError.value = null
    }
}

// Go back to plan selection
const goBack = () => {
    selectedPlan.value = null
    paymentError.value = null
}

// Payment handlers
const handlePaymentSuccess = (data) => {
    console.log('Payment successful:', data)

    // Store success info for the success page
    const successData = {
        transactionId: data.transactionId,
        planName: selectedPlan.value.name,
        amount: selectedPlan.value.price
    }

    // Store in sessionStorage for the success page
    sessionStorage.setItem('paymentSuccess', JSON.stringify(successData))

    // Redirect to success page
    router.push('/checkout-success')
}

const handlePaymentError = (error) => {
    paymentError.value = error
    paymentLoading.value = false
}

const handlePaymentCancel = () => {
    paymentError.value = 'Pago cancelado por el usuario'
    paymentLoading.value = false
}

const handlePaymentLoading = (loading) => {
    paymentLoading.value = loading
}

// Load plans on component mount
onMounted(() => {
    console.log('🛒 Checkout: Component mounted')
    loadPlans()
})
</script>

<style scoped>
.legal-container {
    font-family: 'Georgia', serif;
    background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
    color: #f4f4f4;
    min-height: 100vh;
    padding: 40px 20px;
}

.content {
    max-width: 900px;
    margin: 0 auto;
    background: rgba(22, 33, 62, 0.5);
    padding: 30px;
    border-radius: 10px;
}

h1 {
    color: #ffd700;
    font-size: 2.5rem;
    margin-bottom: 10px;
    text-align: center;
}

p {
    font-size: 1.1rem;
    line-height: 1.7;
    margin-bottom: 25px;
    text-align: center;
}

/* Loading and Error States */
.loading-section, .error-section {
    text-align: center;
    padding: 60px 20px;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 215, 0, 0.3);
    border-left: 4px solid #ffd700;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.error-text {
    color: #ff6b6b;
    font-size: 1.2rem;
    margin-bottom: 20px;
}

.retry-button {
    background: #ff6b6b;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.3s;
}

.retry-button:hover {
    background: #ff5252;
}

/* Plans Section */
.plans-section h2 {
    color: #ffd700;
    font-size: 2rem;
    margin-bottom: 30px;
    text-align: center;
}

.plans-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 25px;
    margin-bottom: 30px;
}

.plan-card {
    background: rgba(15, 52, 96, 0.2);
    border: 2px solid #0f3460;
    border-radius: 12px;
    padding: 25px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.plan-card:hover {
    border-color: #ffd700;
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.plan-card.premium {
    border-color: #ffd700;
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.plan-card.premium::before {
    content: "🎉 OFERTA ESPECIAL";
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: #ffd700;
    color: #1a1a2e;
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
}

.plan-card h3 {
    color: #ffd700;
    font-size: 1.5rem;
    margin-bottom: 15px;
}

.price {
    margin-bottom: 15px;
}

.amount {
    color: #f4f4f4;
    font-size: 2.2rem;
    font-weight: bold;
}

.period {
    color: #ccc;
    font-size: 1rem;
}

.description {
    color: #ddd;
    margin-bottom: 20px;
    line-height: 1.5;
}

.features {
    list-style: none;
    padding: 0;
    margin: 20px 0;
    text-align: left;
}

.features li {
    margin-bottom: 8px;
    font-size: 0.95rem;
    color: #ddd;
}

.select-button {
    background: linear-gradient(45deg, #8b4513, #a0522d);
    color: white;
    border: none;
    padding: 12px 25px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: bold;
    transition: all 0.3s ease;
    width: 100%;
}

.select-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.select-button:disabled {
    background: #666;
    cursor: not-allowed;
    opacity: 0.6;
}

/* Checkout Section */
.checkout-section {
    max-width: 600px;
    margin: 0 auto;
}

.order-summary {
    margin-bottom: 30px;
    padding: 25px;
    border: 1px solid #0f3460;
    border-radius: 12px;
    background: rgba(15, 52, 96, 0.1);
}

.order-summary h2 {
    font-size: 1.5rem;
    color: #ffd700;
    margin-bottom: 20px;
    text-align: center;
}

.selected-plan {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 215, 0, 0.2);
}

.selected-plan h3 {
    color: #ffd700;
    margin-bottom: 5px;
}

.selected-plan p {
    color: #ddd;
    margin: 0;
    font-size: 1rem;
}

.order-item, .order-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    font-size: 1.1rem;
}

.order-total {
    font-weight: bold;
    font-size: 1.4rem;
    color: #ffd700;
    border-top: 1px solid #0f3460;
    padding-top: 15px;
    margin-bottom: 0;
}

/* Payment Section */
.payment-section {
    margin-bottom: 30px;
}

.payment-section h3 {
    color: #ffd700;
    font-size: 1.3rem;
    margin-bottom: 20px;
    text-align: center;
}

.payment-loading, .payment-error {
    text-align: center;
    padding: 20px;
    margin-top: 15px;
    border-radius: 8px;
}

.payment-loading {
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid #ffd700;
    color: #ffd700;
}

.payment-error {
    background: rgba(255, 107, 107, 0.1);
    border: 1px solid #ff6b6b;
    color: #ff6b6b;
}

.clear-error {
    background: #ff6b6b;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 10px;
    font-size: 0.9rem;
}

.clear-error:hover {
    background: #ff5252;
}

/* Action Buttons */
.action-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 30px;
}

.back-button {
    background: rgba(255, 215, 0, 0.1);
    color: #ffd700;
    border: 1px solid #ffd700;
    padding: 12px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.3s ease;
    text-decoration: none;
}

.back-button:hover {
    background: rgba(255, 215, 0, 0.2);
    transform: translateY(-2px);
}

.cancel-link {
    color: #ccc;
    text-decoration: none;
    font-size: 1rem;
    transition: color 0.3s;
}

.cancel-link:hover {
    color: #ffd700;
}

/* Responsive Design */
@media (max-width: 768px) {
    .content {
        max-width: 100%;
        padding: 20px;
    }

    .plans-grid {
        grid-template-columns: 1fr;
        gap: 20px;
    }

    .plan-card {
        padding: 20px;
    }

    .amount {
        font-size: 1.8rem;
    }

    .action-buttons {
        flex-direction: column;
        gap: 15px;
    }

    .back-button {
        width: 100%;
        text-align: center;
    }

    h1 {
        font-size: 2rem;
    }
}
</style>
