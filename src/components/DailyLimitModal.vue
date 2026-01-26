<script setup>
import { ref } from 'vue';

const emit = defineEmits(['close', 'view-plans']);

const handleViewPlans = () => {
    emit('view-plans');
};

const handleClose = () => {
    emit('close');
};
</script>

<template>
    <div class="modal-overlay" @click.self="handleClose">
        <div class="modal-content">
            <div class="modal-header">
                <div class="mystical-icon">
                    <span class="moon-icon">🌙</span>
                </div>
                <h2>Tu lectura diaria ha concluido</h2>
            </div>

            <div class="modal-body">
                <p class="main-message">
                    Las cartas necesitan descansar para recuperar su energía mística.
                </p>
                <p class="sub-message">
                    Tu próxima lectura gratuita estará disponible mañana al amanecer.
                </p>

                <div class="divider">
                    <span class="divider-icon">✨</span>
                </div>

                <p class="premium-hint">
                    ¿No puedes esperar? Desbloquea lecturas ilimitadas con un plan premium.
                </p>
            </div>

            <div class="modal-actions">
                <button class="btn-primary" @click="handleViewPlans">
                    Ver Planes Premium
                </button>
                <button class="btn-secondary" @click="handleClose">
                    Vuelvo mañana
                </button>
            </div>

            <button class="close-btn" @click="handleClose" aria-label="Cerrar">
                ×
            </button>
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
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.modal-content {
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border: 2px solid rgba(255, 215, 0, 0.3);
    border-radius: 20px;
    padding: 40px;
    max-width: 450px;
    width: 90%;
    text-align: center;
    position: relative;
    box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5),
                0 0 30px rgba(255, 215, 0, 0.1);
    animation: slideUp 0.4s ease;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.modal-header {
    margin-bottom: 25px;
}

.mystical-icon {
    margin-bottom: 15px;
}

.moon-icon {
    font-size: 3rem;
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
}

.modal-header h2 {
    color: #ffd700;
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

.modal-body {
    color: #e0e0e0;
    margin-bottom: 30px;
}

.main-message {
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 10px;
    font-style: italic;
}

.sub-message {
    font-size: 0.95rem;
    color: #aaa;
    margin-bottom: 20px;
}

.divider {
    margin: 20px 0;
    position: relative;
}

.divider::before,
.divider::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(255, 215, 0, 0.3), transparent);
}

.divider::before { left: 0; }
.divider::after { right: 0; }

.divider-icon {
    font-size: 1.2rem;
    position: relative;
    z-index: 1;
}

.premium-hint {
    font-size: 1rem;
    color: #ddd;
}

.modal-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.btn-primary {
    background: linear-gradient(45deg, #8b4513, #a0522d);
    color: white;
    border: 2px solid #ffd700;
    padding: 14px 28px;
    font-size: 1.1rem;
    border-radius: 30px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s ease;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);
    background: linear-gradient(45deg, #a0522d, #cd853f);
}

.btn-secondary {
    background: transparent;
    color: #aaa;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 12px 24px;
    font-size: 1rem;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-secondary:hover {
    color: #ffd700;
    border-color: rgba(255, 215, 0, 0.4);
}

.close-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    color: #aaa;
    font-size: 1.8rem;
    cursor: pointer;
    transition: color 0.3s;
    line-height: 1;
    padding: 5px;
}

.close-btn:hover {
    color: #ffd700;
}

@media (max-width: 480px) {
    .modal-content {
        padding: 30px 20px;
        margin: 20px;
    }

    .modal-header h2 {
        font-size: 1.3rem;
    }

    .moon-icon {
        font-size: 2.5rem;
    }
}
</style>
