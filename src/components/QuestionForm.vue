<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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
                :placeholder="t('chat.placeholder')" @keyup.enter.exact="submitQuestion" :disabled="isDisabled"></textarea>
            <p class="char-counter">{{ t('chat.charCount', { current: userQuestion.length, max: maxQuestionLength }) }}</p>
        </div>
        <button class="draw-button" @click="submitQuestion" :disabled="isDisabled || !userQuestion.trim()">
            <span v-if="isDisabled">{{ t('chat.thinking') }}</span>
            <span v-else>{{ t('chat.submit') }}</span>
        </button>
    </div>
</template>

<style scoped>
.question-form-container {
    padding: 12px;
    background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
    width: 100%;
    box-sizing: border-box;
    box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.3);
    position: relative;
    z-index: 2;
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
    font-family: var(--font-content);
    font-size: 1rem;
    color: var(--text-primary);
    background-color: var(--bg-input);
    border: 2px solid var(--border-primary);
    border-radius: 8px;
    resize: none;
    min-height: 60px;
    max-height: 120px;
    box-sizing: border-box;
    box-shadow: inset 0 2px 5px var(--shadow-sm);
    transition: all 0.3s ease;
}

.question-input::placeholder {
    color: var(--text-secondary);
    font-style: italic;
}

.question-input:focus {
    outline: none;
    border-color: var(--color-accent-text);
    background-color: var(--bg-input-focus);
    box-shadow: inset 0 2px 5px var(--shadow-sm), 0 0 12px var(--accent-glow);
}

.char-counter {
    position: absolute;
    bottom: 10px;
    right: 15px;
    font-size: 0.85rem;
    color: var(--text-secondary);
}

.draw-button {
    display: block;
    margin: 0 auto;
    background: linear-gradient(45deg, var(--btn-primary), var(--btn-primary-hover));
    color: var(--color-white);
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
