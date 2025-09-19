<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const authStore = useAuthStore()
const isLoginMode = ref(true)
const email = ref('')
const password = ref('')
const error = ref('')

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  error.value = ''
  email.value = ''
  password.value = ''
}

const handleGoogleLogin = async () => {
  error.value = ''
  const { error: authError } = await authStore.loginWithGoogle()
  if (authError) {
    error.value = authError.message
  }
}

const handleFacebookLogin = async () => {
  error.value = ''
  const { error: authError } = await authStore.loginWithFacebook()
  if (authError) {
    error.value = authError.message
  }
}

const handleEmailAuth = async () => {
  error.value = ''

  if (!email.value || !password.value) {
    error.value = 'Por favor completa todos los campos'
    return
  }

  let result
  if (isLoginMode.value) {
    result = await authStore.loginWithEmail(email.value, password.value)
  } else {
    result = await authStore.signUpWithEmail(email.value, password.value)
  }

  if (result.error) {
    error.value = result.error.message
  } else if (!isLoginMode.value) {
    error.value = 'Revisa tu email para confirmar tu cuenta'
  } else {
    emit('close')
  }
}

const closeModal = () => {
  emit('close')
  error.value = ''
  email.value = ''
  password.value = ''
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta' }}</h2>
        <button @click="closeModal" class="close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- Social Login Buttons -->
        <div class="social-buttons">
          <button @click="handleGoogleLogin" class="social-btn google-btn" :disabled="authStore.loading">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <button @click="handleFacebookLogin" class="social-btn facebook-btn" :disabled="authStore.loading">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continuar con Facebook
          </button>
        </div>

        <div class="divider">
          <span>o</span>
        </div>

        <!-- Email/Password Form -->
        <form @submit.prevent="handleEmailAuth" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="tu@email.com"
            >
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              :placeholder="isLoginMode ? 'Tu contraseña' : 'Mínimo 6 caracteres'"
              minlength="6"
            >
          </div>

          <button type="submit" class="submit-btn" :disabled="authStore.loading">
            {{ authStore.loading ? 'Cargando...' : (isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta') }}
          </button>
        </form>

        <div class="toggle-mode">
          <p>
            {{ isLoginMode ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?' }}
            <button @click="toggleMode" class="toggle-btn">
              {{ isLoginMode ? 'Crear cuenta' : 'Iniciar sesión' }}
            </button>
          </p>
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
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: linear-gradient(145deg, #2a2a3e, #1f1f32);
  border-radius: 20px;
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid #444;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px 0;
  margin-bottom: 20px;
}

.modal-header h2 {
  color: #ffd700;
  font-size: 1.8rem;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #ddd;
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
  color: #ffd700;
}

.modal-body {
  padding: 0 30px 30px;
}

.error-message {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid #ff6b6b;
  color: #ff6b6b;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.social-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 20px;
  border: 1px solid #444;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.social-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.social-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-btn:hover:not(:disabled) {
  border-color: #4285F4;
}

.facebook-btn:hover:not(:disabled) {
  border-color: #1877F2;
}

.divider {
  text-align: center;
  margin: 25px 0;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #444;
}

.divider span {
  background: linear-gradient(145deg, #2a2a3e, #1f1f32);
  padding: 0 15px;
  color: #888;
  font-size: 0.9rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #ddd;
  font-size: 0.9rem;
  font-weight: 500;
}

.form-group input {
  padding: 12px 16px;
  border: 1px solid #444;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #ffd700;
  background: rgba(255, 255, 255, 0.08);
}

.submit-btn {
  padding: 14px;
  background: linear-gradient(145deg, #ffd700, #ffed4a);
  color: #1f1f32;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(145deg, #ffed4a, #ffd700);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.toggle-mode {
  text-align: center;
  margin-top: 25px;
}

.toggle-mode p {
  color: #ddd;
  font-size: 0.9rem;
  margin: 0;
}

.toggle-btn {
  background: none;
  border: none;
  color: #ffd700;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: underline;
  transition: color 0.3s ease;
}

.toggle-btn:hover {
  color: #ffed4a;
}

@media (max-width: 480px) {
  .modal-content {
    margin: 10px;
    max-width: none;
  }

  .modal-header,
  .modal-body {
    padding-left: 20px;
    padding-right: 20px;
  }
}
</style>