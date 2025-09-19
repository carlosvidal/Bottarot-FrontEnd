<template>
    <div class="legal-container">
        <div class="content">
            <h1>Checkout</h1>
            <p>Estás a un paso de tener acceso ilimitado.</p>
            
            <div class="order-summary">
                <h2>Resumen de tu Orden</h2>
                <div class="order-item">
                    <span>Plan Semanal Ilimitado</span>
                    <span>$5.00 USD</span>
                </div>
                <div class="order-total">
                    <span>Total</span>
                    <span>$5.00 USD</span>
                </div>
            </div>

            <div class="payment-section">
                <p>Selecciona tu método de pago:</p>
                <button @click="processPayment" class="paypal-button">Pagar con PayPal</button>
            </div>

            <router-link to="/chat" class="back-button">Cancelar</router-link>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const processPayment = () => {
    // Here you would integrate with PayPal SDK
    // For now, we just simulate a successful payment
    console.log('Processing payment...');
    router.push('/checkout-success');
};
</script>

<style scoped>
.legal-container { font-family: 'Georgia', serif; background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460); color: #f4f4f4; min-height: 100vh; padding: 40px 20px; }
.content { max-width: 600px; margin: 0 auto; background: rgba(22, 33, 62, 0.5); padding: 30px; border-radius: 10px; }
h1 { color: #ffd700; font-size: 2.5rem; margin-bottom: 10px; }
p { font-size: 1.1rem; line-height: 1.7; margin-bottom: 25px; }

.order-summary { margin-top: 20px; padding: 20px; border: 1px solid #0f3460; border-radius: 8px; }
.order-summary h2 { font-size: 1.5rem; color: #ffd700; margin-bottom: 20px; }
.order-item, .order-total { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 1.1rem; }
.order-total { font-weight: bold; font-size: 1.3rem; color: #ffd700; border-top: 1px solid #0f3460; padding-top: 15px; }

.payment-section { margin-top: 30px; text-align: center; }
.paypal-button { background-color: #ffc439; color: #003087; border: none; padding: 15px 30px; font-size: 1.2rem; font-weight: bold; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; width: 100%; }
.paypal-button:hover { opacity: 0.9; }

.back-button { display: inline-block; margin-top: 30px; color: #ccc; text-decoration: none; }
.back-button:hover { color: #ffd700; }
</style>
