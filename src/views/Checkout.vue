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
                <router-link to="/chat/new" class="back-link">← Volver al chat</router-link>
                <h2>Desbloquea tu Destino Completo</h2>
                <p class="plans-subtitle">Elige el camino que mejor se adapte a tu viaje espiritual</p>
                <div class="plans-grid">
                    <div
                        v-for="plan in plans"
                        :key="plan.id"
                        class="plan-card"
                        :class="{
                            'plan-trial': plan.plan_type === 'trial',
                            'plan-popular': plan.badge_text === 'MÁS POPULAR',
                            'plan-annual': plan.plan_type === 'annual'
                        }"
                        @click="selectPlan(plan)"
                    >
                        <!-- Badge -->
                        <div v-if="plan.badge_text" class="plan-badge" :class="{
                            'badge-special': plan.badge_text === 'OFERTA ESPECIAL',
                            'badge-popular': plan.badge_text === 'MÁS POPULAR',
                            'badge-value': plan.badge_text === 'MEJOR VALOR'
                        }">
                            {{ plan.badge_text }}
                        </div>

                        <h3>{{ plan.name }}</h3>
                        <div class="price">
                            <span class="amount">${{ plan.price.toFixed(2) }}</span>
                            <span class="period" v-if="plan.duration_days === 7">/ 7 días</span>
                            <span class="period" v-else-if="plan.duration_days === 30">/ mes</span>
                            <span class="period" v-else-if="plan.duration_days === 365">/ año</span>
                        </div>
                        <p class="description">{{ plan.description }}</p>
                        <ul class="features" v-if="plan.features">
                            <li v-if="plan.features.unlimited_readings">✨ Lecturas ilimitadas</li>
                            <li v-if="plan.features.full_future">🔮 Futuro siempre revelado</li>
                            <li v-if="plan.features.full_history">📚 Historial completo</li>
                            <li v-if="plan.features.priority_support">⭐ Soporte prioritario</li>
                        </ul>
                        <button class="select-button" :class="{ 'btn-ritual': plan.plan_type === 'trial' }">
                            {{ plan.plan_type === 'trial' ? 'Comenzar Ritual' : 'Seleccionar' }}
                        </button>

                        <!-- Savings indicator for annual plan -->
                        <div v-if="plan.plan_type === 'annual'" class="savings-badge">
                            Ahorra $32 al año
                        </div>
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

// Load subscription plans (available for the current user)
const loadPlans = async () => {
    try {
        console.log('🛒 Checkout: Loading available plans...')
        loadingPlans.value = true
        errorMessage.value = null

        const userId = auth.user?.id || 'anonymous'
        console.log('🛒 Checkout: API_URL:', API_URL, 'userId:', userId)

        // Use the available plans endpoint to filter promotional plans by eligibility
        const response = await fetch(`${API_URL}/api/subscription-plans/available/${userId}`)

        if (!response.ok) {
            throw new Error('Error cargando planes')
        }

        const data = await response.json()
        // Filter out free plan from display (it's the default)
        plans.value = (data.plans || []).filter(p => p.price > 0)
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
const handlePaymentSuccess = async (data) => {
    console.log('Payment successful:', data)

    // Store success info for the success page
    const successData = {
        transactionId: data.transactionId,
        planName: selectedPlan.value.name,
        amount: selectedPlan.value.price
    }

    // Store in sessionStorage for the success page
    sessionStorage.setItem('paymentSuccess', JSON.stringify(successData))

    // Reload user subscription data to reflect the new premium status
    console.log('🔄 Reloading user subscription after successful payment...')
    await auth.loadUserSubscription()
    console.log('✅ User subscription reloaded:', auth.userSubscription)

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
    font-family: var(--font-content);
    background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary), var(--bg-tertiary));
    color: var(--text-primary);
    min-height: 100vh;
    padding: 40px 20px;
}

.content {
    max-width: 900px;
    margin: 0 auto;
    background: var(--bg-overlay-strong);
    padding: 30px;
    border-radius: 10px;
}

h1 {
    color: var(--color-accent-text);
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
    border-left: 4px solid var(--color-accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.error-text {
    color: var(--color-error);
    font-size: 1.2rem;
    margin-bottom: 20px;
}

.retry-button {
    background: var(--color-error);
    color: var(--color-white);
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.3s;
}

.retry-button:hover {
    background: var(--color-error);
}

/* Plans Section */
.back-link {
    display: inline-block;
    color: var(--color-accent-text);
    text-decoration: none;
    margin-bottom: 20px;
    font-size: 1rem;
    transition: opacity 0.3s;
}

.back-link:hover {
    opacity: 0.8;
}

.plans-section h2 {
    color: var(--color-accent-text);
    font-size: 2rem;
    margin-bottom: 10px;
    text-align: center;
}

.plans-subtitle {
    color: var(--text-secondary);
    font-size: 1.1rem;
    text-align: center;
    margin-bottom: 30px;
    font-style: italic;
}

.plans-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 25px;
    margin-bottom: 30px;
}

.plan-card {
    background: var(--bg-overlay-medium);
    border: 2px solid var(--border-primary);
    border-radius: 12px;
    padding: 25px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.plan-card:hover {
    border-color: var(--color-accent-text);
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

/* Plan Card Variants */
.plan-card.plan-trial {
    border-color: var(--color-error);
    box-shadow: 0 0 20px rgba(255, 107, 107, 0.3);
}

.plan-card.plan-popular {
    border-color: var(--color-accent-text);
    box-shadow: 0 0 25px rgba(255, 215, 0, 0.4);
    transform: scale(1.02);
}

.plan-card.plan-annual {
    border-color: #0f0;
    box-shadow: 0 0 20px rgba(74, 222, 128, 0.3);
}

/* Plan Badges */
.plan-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    padding: 6px 18px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
}

.badge-special {
    background: linear-gradient(135deg, var(--color-error), var(--color-error));
    color: var(--color-white);
    animation: pulseBadge 2s ease-in-out infinite;
}

.badge-popular {
    background: linear-gradient(135deg, var(--color-accent), var(--color-accent-light));
    color: var(--bg-primary);
}

.badge-value {
    background: linear-gradient(135deg, var(--color-success), var(--color-success));
    color: var(--bg-primary);
}

@keyframes pulseBadge {
    0%, 100% { box-shadow: 0 0 10px rgba(255, 107, 107, 0.5); }
    50% { box-shadow: 0 0 20px rgba(255, 107, 107, 0.8); }
}

/* Savings Badge */
.savings-badge {
    margin-top: 15px;
    padding: 8px 16px;
    background: rgba(74, 222, 128, 0.15);
    border: 1px solid rgba(74, 222, 128, 0.4);
    border-radius: 20px;
    color: #0f0;
    font-size: 0.85rem;
    font-weight: bold;
}

/* Ritual Button */
.btn-ritual {
    background: linear-gradient(45deg, var(--color-error), var(--color-error)) !important;
    animation: pulseRitual 2s ease-in-out infinite;
}

@keyframes pulseRitual {
    0%, 100% { box-shadow: 0 0 10px rgba(139, 0, 0, 0.5); }
    50% { box-shadow: 0 0 25px rgba(139, 0, 0, 0.8); }
}

.plan-card h3 {
    color: var(--color-accent-text);
    font-size: 1.5rem;
    margin-bottom: 15px;
}

.price {
    margin-bottom: 15px;
}

.amount {
    color: var(--text-primary);
    font-size: 2.2rem;
    font-weight: bold;
}

.period {
    color: var(--text-secondary);
    font-size: 1rem;
}

.description {
    color: var(--text-secondary);
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
    color: var(--text-secondary);
}

.select-button {
    background: linear-gradient(45deg, var(--btn-primary), var(--btn-primary-hover));
    color: var(--color-white);
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
    background: var(--text-tertiary);
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
    border: 1px solid var(--border-primary);
    border-radius: 12px;
    background: var(--bg-overlay-light);
}

.order-summary h2 {
    font-size: 1.5rem;
    color: var(--color-accent-text);
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
    color: var(--color-accent-text);
    margin-bottom: 5px;
}

.selected-plan p {
    color: var(--text-secondary);
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
    color: var(--color-accent-text);
    border-top: 1px solid var(--border-primary);
    padding-top: 15px;
    margin-bottom: 0;
}

/* Payment Section */
.payment-section {
    margin-bottom: 30px;
}

.payment-section h3 {
    color: var(--color-accent-text);
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
    border: 1px solid var(--color-accent);
    color: var(--color-accent-text);
}

.payment-error {
    background: rgba(255, 107, 107, 0.1);
    border: 1px solid var(--color-error);
    color: var(--color-error);
}

.clear-error {
    background: var(--color-error);
    color: var(--color-white);
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 10px;
    font-size: 0.9rem;
}

.clear-error:hover {
    background: var(--color-error);
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
    color: var(--color-accent-text);
    border: 1px solid var(--color-accent);
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
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 1rem;
    transition: color 0.3s;
}

.cancel-link:hover {
    color: var(--color-accent-text);
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
