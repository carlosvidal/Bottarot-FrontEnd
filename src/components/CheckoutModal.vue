<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import PayPalButton from './PayPalButton.vue'
import { useAnalytics } from '../composables/useAnalytics.js'

const auth = useAuthStore()
const { trackViewCheckout, trackBeginCheckout, trackPurchase } = useAnalytics()

const emit = defineEmits(['close', 'payment-success'])

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
        loadingPlans.value = true
        errorMessage.value = null

        const userId = auth.user?.id || 'anonymous'
        const response = await fetch(`${API_URL}/api/subscription-plans/available/${userId}`)

        if (!response.ok) {
            throw new Error('Error cargando planes')
        }

        const data = await response.json()
        plans.value = (data.plans || []).filter(p => p.price > 0)
    } catch (error) {
        console.error('CheckoutModal: Error loading plans:', error)
        errorMessage.value = 'No se pudieron cargar los planes disponibles'
    } finally {
        loadingPlans.value = false
    }
}

const selectPlan = (plan) => {
    if (plan.price > 0) {
        selectedPlan.value = plan
        paymentError.value = null
        trackBeginCheckout(plan.plan_type || 'unknown', plan.price)
    }
}

const goBack = () => {
    selectedPlan.value = null
    paymentError.value = null
}

const handlePaymentSuccess = async (data) => {
    console.log('CheckoutModal: Payment successful:', data)

    trackPurchase(
        selectedPlan.value.plan_type || 'unknown',
        selectedPlan.value.price,
        data.transactionId
    )

    // Reload subscription and permissions
    await auth.loadUserSubscription()
    await auth.loadReadingPermissions()

    emit('payment-success')
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

onMounted(() => {
    trackViewCheckout()
    loadPlans()
})
</script>

<template>
    <div class="modal-overlay" @click.self="emit('close')">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Desbloquea tu Destino</h2>
                <button @click="emit('close')" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
                <!-- Loading -->
                <div v-if="loadingPlans" class="loading-section">
                    <div class="spinner"></div>
                    <p>Cargando planes...</p>
                </div>

                <!-- Error -->
                <div v-else-if="errorMessage" class="error-section">
                    <p class="error-text">{{ errorMessage }}</p>
                    <button @click="loadPlans" class="retry-button">Reintentar</button>
                </div>

                <!-- Plan selection -->
                <div v-else-if="!selectedPlan" class="plans-section">
                    <p class="plans-subtitle">Elige el camino que mejor se adapte a tu viaje espiritual</p>
                    <p class="one-time-notice">Pagos únicos, sin renovación automática</p>
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
                                <li v-if="plan.features.unlimited_readings">Lecturas ilimitadas</li>
                                <li v-if="plan.features.full_future">Futuro siempre revelado</li>
                                <li v-if="plan.features.full_history">Historial completo</li>
                                <li v-if="plan.features.priority_support">Soporte prioritario</li>
                            </ul>
                            <button class="select-button" :class="{ 'btn-ritual': plan.plan_type === 'trial' }">
                                {{ plan.plan_type === 'trial' ? 'Comenzar Ritual' : 'Seleccionar' }}
                            </button>

                            <div v-if="plan.plan_type === 'annual'" class="savings-badge">
                                Ahorra $32 al año
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Payment section -->
                <div v-else class="checkout-section">
                    <div class="order-summary">
                        <h3>{{ selectedPlan.name }}</h3>
                        <p class="plan-desc">{{ selectedPlan.description }}</p>
                        <div class="order-total">
                            <span>Total</span>
                            <span>${{ selectedPlan.price.toFixed(2) }} USD</span>
                        </div>
                    </div>

                    <div class="payment-section">
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
                            <p>{{ paymentError }}</p>
                            <button @click="paymentError = null" class="clear-error">Reintentar</button>
                        </div>
                    </div>

                    <button @click="goBack" class="back-button">Cambiar Plan</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
}

.modal-content {
    background: linear-gradient(145deg, var(--bg-card), var(--bg-elevated));
    border-radius: 20px;
    width: 100%;
    max-width: 700px;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid var(--border-primary);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 25px 30px 0;
    margin-bottom: 15px;
}

.modal-header h2 {
    color: var(--color-accent-text);
    font-size: 1.6rem;
    margin: 0;
}

.close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-accent-text);
}

.modal-body {
    padding: 0 30px 30px;
}

/* Loading & Error */
.loading-section, .error-section {
    text-align: center;
    padding: 40px 20px;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 215, 0, 0.3);
    border-left: 3px solid var(--color-accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.error-text {
    color: var(--color-error);
    margin-bottom: 15px;
}

.retry-button {
    background: var(--color-error);
    color: var(--color-white);
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
}

/* Plans */
.plans-subtitle {
    color: var(--text-secondary);
    font-size: 1rem;
    text-align: center;
    margin-bottom: 10px;
    font-style: italic;
}

.one-time-notice {
    background: rgba(74, 222, 128, 0.1);
    border: 1px solid rgba(74, 222, 128, 0.3);
    border-radius: 8px;
    padding: 8px 16px;
    margin-bottom: 15px;
    font-size: 0.85rem;
    color: #4ade80;
    text-align: center;
}

.plans-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 15px;
}

.plan-card {
    background: var(--bg-overlay-medium);
    border: 2px solid var(--border-primary);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.plan-card:hover {
    border-color: var(--color-accent-text);
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.plan-card.plan-trial { border-color: var(--color-error); }
.plan-card.plan-popular {
    border-color: var(--color-accent-text);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}
.plan-card.plan-annual { border-color: #0f0; }

.plan-badge {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 14px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
}

.badge-special { background: linear-gradient(135deg, var(--color-error), var(--color-error)); color: var(--color-white); }
.badge-popular { background: linear-gradient(135deg, var(--color-accent), var(--color-accent-light)); color: var(--bg-primary); }
.badge-value { background: linear-gradient(135deg, var(--color-success), var(--color-success)); color: var(--bg-primary); }

.plan-card h3 {
    color: var(--color-accent-text);
    font-size: 1.3rem;
    margin-bottom: 10px;
}

.price { margin-bottom: 10px; }
.amount { color: var(--text-primary); font-size: 1.8rem; font-weight: bold; }
.period { color: var(--text-secondary); font-size: 0.9rem; }

.description {
    color: var(--text-secondary);
    margin-bottom: 12px;
    line-height: 1.4;
    font-size: 0.9rem;
}

.features {
    list-style: none;
    padding: 0;
    margin: 12px 0;
    text-align: left;
}

.features li {
    margin-bottom: 6px;
    font-size: 0.85rem;
    color: var(--text-secondary);
}

.features li::before {
    content: '\2728 ';
}

.select-button {
    background: linear-gradient(45deg, var(--btn-primary), var(--btn-primary-hover));
    color: var(--color-white);
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: bold;
    transition: all 0.3s ease;
    width: 100%;
}

.select-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.btn-ritual {
    background: linear-gradient(45deg, var(--color-error), var(--color-error)) !important;
}

.savings-badge {
    margin-top: 10px;
    padding: 6px 12px;
    background: rgba(74, 222, 128, 0.15);
    border: 1px solid rgba(74, 222, 128, 0.4);
    border-radius: 20px;
    color: #0f0;
    font-size: 0.8rem;
    font-weight: bold;
}

/* Checkout */
.checkout-section {
    max-width: 500px;
    margin: 0 auto;
}

.order-summary {
    margin-bottom: 20px;
    padding: 20px;
    border: 1px solid var(--border-primary);
    border-radius: 12px;
    background: var(--bg-overlay-light);
    text-align: center;
}

.order-summary h3 {
    color: var(--color-accent-text);
    margin-bottom: 5px;
}

.plan-desc {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: 15px;
}

.order-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    font-size: 1.2rem;
    color: var(--color-accent-text);
    border-top: 1px solid var(--border-primary);
    padding-top: 12px;
}

.payment-section {
    margin-bottom: 20px;
}

.payment-loading, .payment-error {
    text-align: center;
    padding: 15px;
    margin-top: 10px;
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
    padding: 6px 14px;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 8px;
    font-size: 0.85rem;
}

.back-button {
    background: rgba(255, 215, 0, 0.1);
    color: var(--color-accent-text);
    border: 1px solid var(--color-accent);
    padding: 10px 18px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    width: 100%;
    text-align: center;
}

.back-button:hover {
    background: rgba(255, 215, 0, 0.2);
}

/* Responsive */
@media (min-width: 600px) {
    .plans-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }
}

@media (max-width: 480px) {
    .modal-content {
        margin: 10px;
        max-width: none;
    }

    .modal-header, .modal-body {
        padding-left: 20px;
        padding-right: 20px;
    }
}
</style>
