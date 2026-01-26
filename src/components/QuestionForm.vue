<script setup>
import { ref } from 'vue';

const props = defineProps({
    isDisabled: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['question-submitted']);

const userQuestion = ref('');
const maxQuestionLength = 500;

const submitQuestion = () => {
    if (props.isDisabled || !userQuestion.value.trim()) return;
    emit('question-submitted', userQuestion.value);
    userQuestion.value = ''; // Clear input after submitting
};
</script>

<template>
    <div class="question-form-container">
        <div class="question-container">
            <textarea v-model="userQuestion" class="question-input" :maxlength="maxQuestionLength"
                placeholder="Escribe tu pregunta aquí..." @keyup.enter.exact="submitQuestion" :disabled="isDisabled"></textarea>
            <p class="char-counter">{{ userQuestion.length }} / {{ maxQuestionLength }}</p>
        </div>
        <button class="draw-button" @click="submitQuestion" :disabled="isDisabled || !userQuestion.trim()">
            <span v-if="isDisabled">Pensando...</span>
            <span v-else>Realizar Tirada</span>
        </button>
    </div>
</template>

<style scoped>
.question-form-container {
    padding: 12px;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    width: 100%;
    box-sizing: border-box;
    box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.3);
}

.question-container {
    max-width: 800px;
    margin: 0 auto 12px;
    position: relative;
}

.question-input {
    display: block;
    width: 100%;
    padding: 12px;
    padding-bottom: 28px;
    font-family: 'Georgia', serif;
    font-size: 1rem;
    color: #f4f4f4;
    background-color: rgba(15, 52, 96, 0.7);
    border: 2px solid #0f3460;
    border-radius: 8px;
    resize: none;
    min-height: 60px;
    max-height: 120px;
    box-sizing: border-box;
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
}

.question-input::placeholder {
    color: #aaa;
    font-style: italic;
}

.question-input:focus {
    outline: none;
    border-color: #ffd700;
    background-color: rgba(22, 33, 62, 0.9);
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.3), 0 0 12px rgba(255, 215, 0, 0.4);
}

.char-counter {
    position: absolute;
    bottom: 10px;
    right: 15px;
    font-size: 0.85rem;
    color: #aaa;
}

.draw-button {
    display: block;
    margin: 0 auto;
    background: linear-gradient(45deg, #8b4513, #a0522d);
    color: white;
    border: none;
    padding: 12px 25px;
    font-size: 1.1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.draw-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.draw-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Desktop styles */
@media (min-width: 769px) {
    .question-form-container { padding: 20px; }
    .question-container { margin-bottom: 20px; }
    .question-input {
        padding: 15px;
        padding-bottom: 30px;
        font-size: 1.1rem;
        min-height: 70px;
        max-height: 150px;
        resize: vertical;
    }
}
</style>
