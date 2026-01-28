<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();

// Watch for auth state changes and redirect when user becomes fully registered
watch(
  () => auth.isFullyRegistered,
  (isFullyRegistered) => {
    console.log('👀 Watcher: isFullyRegistered changed to:', isFullyRegistered)
    if (isFullyRegistered) {
      console.log('🚀 Redirecting to chat...')
      router.push('/chat');
    }
  }
);

// State for the new sign-up flow
const showSignupForm = ref(false);
const acceptedTerms = ref(false);

// State for disclaimer
const isDisclaimerExpanded = ref(false);

// Removed startChat - no longer needed

const handleGoogleLogin = async () => {
    console.log('📱 Starting Google login...')
    const { error } = await auth.loginWithGoogle();
    if (error) {
        console.error('❌ Error with Google login:', error);
    } else {
        console.log('✅ Google login successful. Current auth state:', {
            isLoggedIn: auth.isLoggedIn,
            needsRegistration: auth.needsRegistration,
            isFullyRegistered: auth.isFullyRegistered
        })
        // Check if user is fully registered after a short delay to allow auth state to update
        setTimeout(() => {
            console.log('⏰ Timeout check - isFullyRegistered:', auth.isFullyRegistered)
            if (auth.isFullyRegistered) {
                console.log('🚀 Redirecting to chat from timeout...')
                router.push('/chat');
            }
        }, 1000);
    }
};

const handleFacebookLogin = async () => {
    const { error } = await auth.loginWithFacebook();
    if (error) {
        console.error('Error with Facebook login:', error);
    } else {
        // Check if user is fully registered after a short delay to allow auth state to update
        setTimeout(() => {
            if (auth.isFullyRegistered) {
                router.push('/chat');
            }
        }, 1000);
    }
};

const displaySignupForm = () => {
    showSignupForm.value = true;
};

const handleSignup = async (event) => {
    if (!acceptedTerms.value) return;

    // Get form data
    const formData = new FormData(event.target);
    const profileData = {
        name: formData.get('name'),
        gender: formData.get('gender'),
        dateOfBirth: formData.get('dob')
    };

    // Complete registration in Supabase
    const { error } = await auth.completeRegistration(profileData);

    if (error) {
        console.error('Error completing registration:', error);
        // You could show an error message here
    } else {
        showSignupForm.value = false;
        // Redirect to chat after successful registration
        router.push('/chat');
    }
};

</script>

<template>
    <div class="landing-container">

        <div class="main-content">
            <h1 class="title">🔮 Oráculo IA 🔮</h1>
            
            <!-- Default Logged-out View -->
            <div v-if="!showSignupForm && !auth.needsRegistration">
                <p class="subtitle">Descubre lo que el destino tiene para ti. Recibe guía sobre tu pasado, presente y futuro a través de la sabiduría del Tarot.</p>

                <!-- Try anonymously first -->
                <div class="try-section">
                    <router-link to="/chat" class="try-button">
                        🔮 Probar una Lectura Gratis
                    </router-link>
                    <p class="try-note">Sin registro · Tu futuro permanecerá velado</p>
                </div>

                <div class="divider-section">
                    <span class="divider-line"></span>
                    <span class="divider-text">o</span>
                    <span class="divider-line"></span>
                </div>

                <div class="social-login">
                    <p class="register-title">✨ Reclama tu identidad espiritual ✨</p>
                    <p class="register-benefit">Durante tus primeros 5 días, el tarot revelará tu futuro completo</p>
                    <div class="social-buttons">
                        <button @click="handleGoogleLogin" class="social-btn google" :disabled="auth.loading">
                            {{ auth.loading ? 'Conectando...' : 'Google' }}
                        </button>
                        <button @click="handleFacebookLogin" class="social-btn facebook" :disabled="auth.loading">
                            {{ auth.loading ? 'Conectando...' : 'Facebook' }}
                        </button>
                    </div>
                </div>

                <div class="offer-section">
                    <h2>Tu Camino Espiritual</h2>
                    <div class="offers">
                        <div class="offer-card free-tier">
                            <div class="offer-icon">🌙</div>
                            <h3>Buscador</h3>
                            <p class="offer-price">Gratis</p>
                            <ul class="offer-features">
                                <li>1 lectura por día</li>
                                <li>5 futuros revelados</li>
                                <li>Historial limitado</li>
                            </ul>
                        </div>
                        <router-link to="/checkout" class="offer-card-link">
                            <div class="offer-card premium">
                                <div class="offer-badge">OFERTA ESPECIAL</div>
                                <div class="offer-icon">🔮</div>
                                <h3>Ritual de Iniciación</h3>
                                <p class="offer-price"><strong>$1</strong> <span class="price-period">/ 7 días</span></p>
                                <ul class="offer-features">
                                    <li>Lecturas ilimitadas</li>
                                    <li>Futuro siempre visible</li>
                                    <li>Historial completo</li>
                                </ul>
                            </div>
                        </router-link>
                        <router-link to="/checkout" class="offer-card-link">
                            <div class="offer-card">
                                <div class="offer-icon">⭐</div>
                                <h3>Pase Mensual</h3>
                                <p class="offer-price"><strong>$8</strong> <span class="price-period">/ mes</span></p>
                                <ul class="offer-features">
                                    <li>Sin interrupciones</li>
                                    <li>Todo desbloqueado</li>
                                    <li>Mejor valor</li>
                                </ul>
                            </div>
                        </router-link>
                    </div>
                </div>
            </div>

            <!-- Sign-up Form View -->
            <div v-if="showSignupForm || auth.needsRegistration" class="signup-form-container">
                <h2 class="signup-title">Casi listo...</h2>
                <p class="subtitle">Completa tu perfil para continuar.</p>
                <form @submit.prevent="handleSignup" class="signup-form">
                    <div class="form-group">
                        <label for="name">Nombre</label>
                        <input type="text" id="name" name="name" placeholder="Tu nombre" required>
                    </div>
                    <div class="form-group">
                        <label for="gender">Género</label>
                        <select id="gender" name="gender" required>
                            <option value="" disabled selected>Selecciona una opción</option>
                            <option value="male">Masculino</option>
                            <option value="female">Femenino</option>
                            <option value="non-binary">No binario</option>
                            <option value="prefer-not-to-say">Prefiero no decir</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="dob">Fecha de Nacimiento</label>
                        <input type="date" id="dob" name="dob" required>
                    </div>
                    <div class="form-group terms">
                        <input type="checkbox" id="terms" v-model="acceptedTerms">
                        <label for="terms">Acepto los <router-link to="/terms" target="_blank">Términos y Condiciones</router-link>.</label>
                    </div>
                    <button type="submit" class="main-cta-button" :disabled="!acceptedTerms">Finalizar Registro</button>
                </form>
            </div>

            <div class="disclaimer">
                <p>Recuerda que el tarot es una herramienta de guía y autoconocimiento. Las lecturas ofrecen perspectivas y no deben ser tomadas como predicciones absolutas del futuro. <button @click="isDisclaimerExpanded = !isDisclaimerExpanded" class="disclaimer-button">{{ isDisclaimerExpanded ? 'Mostrar menos' : 'Saber más...' }}</button></p>
                <div v-if="isDisclaimerExpanded" class="disclaimer-more">
                    <p>Este servicio utiliza un modelo de inteligencia artificial para generar interpretaciones basadas en los arquetipos y simbolismo del tarot Rider-Waite. No reemplaza la consulta con un profesional del tarot ni constituye asesoramiento legal, financiero, médico o de cualquier otro tipo profesional. Las decisiones que tomes basadas en estas lecturas son de tu exclusiva responsabilidad. La aleatoriedad de las cartas es gestionada digitalmente y la interpretación se genera en tiempo real, lo que significa que dos preguntas idénticas no necesariamente producirán la misma respuesta.</p>
                </div>
            </div>
        </div>

        <footer class="footer">
            <router-link to="/terms">Términos y Condiciones</router-link>
            <span>|</span>
            <router-link to="/privacy">Políticas de Privacidad</router-link>
            <span>|</span>
            <router-link to="/cookies">Políticas de Cookies</router-link>
        </footer>
    </div>
</template>

<style scoped>
.landing-container { display: flex; flex-direction: column; min-height: 100vh; font-family: var(--font-content); background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary), var(--bg-tertiary)); color: var(--text-primary); text-align: center; padding: 20px; }
.main-content { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; max-width: 800px; margin: 0 auto; }
.title { font-size: 3.5rem; color: var(--color-accent-text); text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.6); margin-bottom: 15px; }
.subtitle { font-size: 1.3rem; color: var(--text-secondary); font-style: italic; margin-bottom: 40px; line-height: 1.6; }


/* CTA */
.main-cta-button { background: linear-gradient(45deg, var(--btn-primary), var(--btn-primary-hover)); color: var(--color-white); text-decoration: none; padding: 18px 40px; font-size: 1.4rem; border-radius: 10px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4); display: inline-block; border: none; }
.main-cta-button:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5); }
.main-cta-button:disabled { opacity: 0.5; cursor: not-allowed; }

/* Try Section */
.try-section {
    margin-bottom: 30px;
    text-align: center;
}

.try-button {
    display: inline-block;
    background: linear-gradient(45deg, var(--btn-secondary), var(--btn-secondary-hover));
    color: var(--color-white);
    text-decoration: none;
    padding: 18px 40px;
    font-size: 1.3rem;
    border-radius: 30px;
    transition: all 0.3s ease;
    box-shadow: 0 5px 25px rgba(102, 126, 234, 0.4);
    font-weight: bold;
}

.try-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 30px rgba(102, 126, 234, 0.6);
}

.try-note {
    margin-top: 12px;
    font-size: 0.9rem;
    color: var(--text-tertiary);
    font-style: italic;
}

/* Divider */
.divider-section {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 25px 0;
    gap: 15px;
}

.divider-line {
    width: 80px;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(255, 215, 0, 0.3), transparent);
}

.divider-text {
    color: var(--text-tertiary);
    font-size: 0.9rem;
}

/* Social Login */
.social-login { margin-bottom: 40px; }
.register-title {
    font-size: 1.3rem;
    color: var(--color-accent-text);
    margin-bottom: 8px;
    font-weight: bold;
}
.register-benefit {
    font-size: 1rem;
    color: var(--text-secondary);
    margin-bottom: 20px;
    font-style: italic;
}
.social-buttons { display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; }
.social-btn { border: none; padding: 12px 28px; border-radius: 8px; font-size: 1rem; cursor: pointer; transition: all 0.3s; color: var(--color-white); font-weight: 500; }
.social-btn.google { background-color: #DB4437; }
.social-btn.facebook { background-color: #4267B2; }
.social-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-2px); }
.social-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Offers */
.offer-section { margin-bottom: 40px; }
.offer-section h2 { font-size: 2rem; color: var(--color-accent-text); margin-bottom: 25px; }
.offers { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
.offer-card {
    background: var(--bg-overlay);
    padding: 25px 20px;
    border-radius: 15px;
    border: 2px solid var(--border-primary);
    width: 220px;
    text-align: center;
    position: relative;
    transition: all 0.3s ease;
}
.offer-card:hover {
    transform: translateY(-5px);
    border-color: rgba(255, 215, 0, 0.5);
}
.offer-card.free-tier {
    border-color: var(--text-tertiary);
}
.offer-card.premium {
    border-color: var(--color-error);
    box-shadow: 0 0 25px rgba(255, 107, 107, 0.4);
}
.offer-badge {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, var(--color-error), var(--color-error));
    color: var(--color-white);
    padding: 5px 15px;
    border-radius: 15px;
    font-size: 0.7rem;
    font-weight: bold;
    white-space: nowrap;
}
.offer-icon {
    font-size: 2.5rem;
    margin-bottom: 10px;
}
.offer-card h3 { font-size: 1.3rem; margin-bottom: 8px; color: var(--text-primary); }
.offer-price {
    font-size: 1.8rem;
    color: var(--color-accent-text);
    margin-bottom: 15px;
}
.offer-price strong { font-size: 2rem; }
.price-period {
    font-size: 0.9rem;
    color: var(--text-secondary);
}
.offer-features {
    list-style: none;
    padding: 0;
    margin: 0;
    text-align: left;
}
.offer-features li {
    padding: 5px 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.offer-features li:last-child {
    border-bottom: none;
}
.offer-card-link { text-decoration: none; color: inherit; }


/* Sign-up Form */
.signup-form-container { max-width: 500px; margin: 0 auto; }
.signup-title { font-size: 2.5rem; color: var(--color-accent-text); margin-bottom: 10px; }
.signup-form { display: flex; flex-direction: column; gap: 20px; text-align: left; }
.form-group { display: flex; flex-direction: column; }
.form-group label { margin-bottom: 8px; font-size: 1rem; color: var(--text-secondary); }
.form-group input[type="text"], .form-group input[type="date"], .form-group select { width: 100%; padding: 12px; font-size: 1rem; background-color: var(--bg-input); border: 1px solid var(--border-primary); border-radius: 5px; color: var(--text-primary); }
.form-group.terms { flex-direction: row; align-items: center; gap: 10px; justify-content: center; }
.form-group.terms label { margin-bottom: 0; }
.form-group.terms a { color: var(--color-accent-text); text-decoration: none; }
.form-group.terms a:hover { text-decoration: underline; }

/* Disclaimer & Footer */
.disclaimer { font-size: 0.9rem; color: var(--text-secondary); max-width: 600px; margin: 40px auto; font-style: italic; line-height: 1.6; }
.disclaimer-button { background: none; border: none; color: var(--color-accent-text); cursor: pointer; font-style: italic; text-decoration: underline; padding: 0 5px; font-size: 0.9rem; }
.disclaimer-more { margin-top: 15px; text-align: justify; }

.footer { padding: 15px; border-top: 1px solid var(--border-primary); }
.footer a, .footer .router-link-active { color: var(--text-secondary); text-decoration: none; margin: 0 15px; transition: color 0.3s; }
.footer a:hover, .footer .router-link-active:hover { color: var(--color-accent-text); }
.footer span { color: var(--text-tertiary); }

</style>