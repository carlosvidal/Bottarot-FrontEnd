<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Reading from '../components/Reading.vue';

const route = useRoute();
const sharedReadings = ref([]);
const loading = ref(true);
const error = ref(null);

// Get share ID from route parameters
const shareId = route.params.shareId;

// Load shared chat data
const loadSharedChat = async () => {
    try {
        loading.value = true;
        const API_URL = import.meta.env.VITE_API_URL;

        const response = await fetch(`${API_URL}/api/shared/${shareId}`);

        if (!response.ok) {
            throw new Error('Chat compartido no encontrado');
        }

        const data = await response.json();
        sharedReadings.value = data.readings || [];
    } catch (err) {
        error.value = err.message;
        console.error('Error loading shared chat:', err);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    if (shareId) {
        loadSharedChat();
    } else {
        error.value = 'ID de chat compartido no válido';
        loading.value = false;
    }
});
</script>

<template>
    <div class="shared-chat-layout">
        <header class="shared-header">
            <div class="header-content">
                <h1>Free Tarot Fun - Chat Compartido</h1>
                <p>Este es un chat compartido de forma anónima</p>
            </div>
        </header>

        <main class="shared-content">
            <div v-if="loading" class="loading-message">
                <div class="spinner"></div>
                <p>Cargando chat compartido...</p>
            </div>

            <div v-else-if="error" class="error-message">
                <h2>Error</h2>
                <p>{{ error }}</p>
                <router-link to="/" class="home-link">Ir al inicio</router-link>
            </div>

            <div v-else-if="sharedReadings.length === 0" class="empty-message">
                <h2>Chat vacío</h2>
                <p>Este chat no contiene mensajes.</p>
                <router-link to="/" class="home-link">Ir al inicio</router-link>
            </div>

            <div v-else class="readings-container">
                <div class="readings-list">
                    <Reading
                        v-for="reading in sharedReadings"
                        :key="reading.id"
                        :reading-data="reading"
                        :is-shared="true"
                    />
                </div>

                <div class="shared-footer">
                    <p>🔗 Este chat ha sido compartido de forma anónima</p>
                    <router-link to="/" class="cta-button">Crear tu propia lectura</router-link>
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped>
.shared-chat-layout {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary), var(--bg-tertiary));
    color: var(--text-secondary);
}

/* Header */
.shared-header {
    background: var(--bg-input);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border-primary);
    padding: 20px;
}

.header-content {
    max-width: 900px;
    margin: 0 auto;
    text-align: center;
}

.shared-header h1 {
    color: var(--color-accent-text);
    font-size: 2rem;
    margin-bottom: 8px;
}

.shared-header p {
    color: var(--text-secondary);
    font-size: 1.1rem;
}

/* Content */
.shared-content {
    padding: 20px;
    max-width: 900px;
    margin: 0 auto;
}

/* Loading */
.loading-message {
    text-align: center;
    padding: 60px 20px;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border-primary);
    border-top: 4px solid var(--color-accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Error and Empty states */
.error-message, .empty-message {
    text-align: center;
    padding: 60px 20px;
}

.error-message h2, .empty-message h2 {
    color: var(--color-accent-text);
    font-size: 1.8rem;
    margin-bottom: 15px;
}

.error-message p, .empty-message p {
    font-size: 1.1rem;
    margin-bottom: 30px;
    line-height: 1.6;
}

/* Links and buttons */
.home-link, .cta-button {
    display: inline-block;
    padding: 12px 24px;
    background: linear-gradient(45deg, var(--color-accent), var(--color-accent-light));
    color: var(--bg-primary);
    text-decoration: none;
    border-radius: 25px;
    font-weight: bold;
    transition: all 0.3s ease;
}

.home-link:hover, .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
}

/* Readings */
.readings-container {
    min-height: 400px;
}

.readings-list {
    margin-bottom: 40px;
}

/* Shared footer */
.shared-footer {
    text-align: center;
    padding: 40px 20px;
    border-top: 1px solid rgba(255, 215, 0, 0.2);
    margin-top: 40px;
}

.shared-footer p {
    color: var(--text-secondary);
    margin-bottom: 20px;
    font-size: 0.95rem;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
    .shared-header {
        padding: 15px;
    }

    .shared-header h1 {
        font-size: 1.6rem;
    }

    .shared-header p {
        font-size: 1rem;
    }

    .shared-content {
        padding: 15px;
    }

    .loading-message, .error-message, .empty-message {
        padding: 40px 15px;
    }
}
</style>