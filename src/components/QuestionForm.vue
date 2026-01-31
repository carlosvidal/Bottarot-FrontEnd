<script setup>
import { ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowUp, Loader } from 'lucide-vue-next';

const { t } = useI18n();

const props = defineProps({
    isDisabled: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['question-submitted']);

const userQuestion = ref('');
const textareaRef = ref(null);
const maxQuestionLength = 500;

const autoResize = () => {
    const el = textareaRef.value;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
};

watch(userQuestion, () => {
    nextTick(autoResize);
});

const submitQuestion = () => {
    if (props.isDisabled || !userQuestion.value.trim()) return;
    emit('question-submitted', userQuestion.value);
    userQuestion.value = '';
    nextTick(autoResize);
};
</script>

<template>
    <div class="question-form-container">
        <div class="question-container">
            <textarea ref="textareaRef" v-model="userQuestion" class="question-input" :maxlength="maxQuestionLength"
                :placeholder="t('chat.placeholder')" @keyup.enter.exact="submitQuestion" :disabled="isDisabled"></textarea>
            <button class="send-btn" @click="submitQuestion" :disabled="isDisabled || !userQuestion.trim()">
                <Loader v-if="isDisabled" :size="18" class="spinner" />
                <ArrowUp v-else :size="18" />
            </button>
        </div>
        <p class="char-counter">{{ t('chat.charCount', { current: userQuestion.length, max: maxQuestionLength }) }}</p>
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
    margin: 0 auto;
    position: relative;
}

.question-input {
    display: block;
    width: 100%;
    padding: 12px;
    padding-right: 50px;
    font-family: var(--font-content);
    font-size: 1rem;
    color: var(--text-primary);
    background-color: var(--bg-input);
    border: 2px solid var(--border-primary);
    border-radius: 12px;
    resize: none;
    min-height: 48px;
    max-height: 200px;
    overflow-y: auto;
    box-sizing: border-box;
    box-shadow: inset 0 2px 5px var(--shadow-sm);
    transition: border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease;
    field-sizing: content;
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

.send-btn {
    position: absolute;
    right: 8px;
    bottom: 8px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(45deg, var(--btn-primary), var(--btn-primary-hover));
    color: var(--color-white);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.send-btn:hover:not(:disabled) {
    transform: scale(1.1);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
}

.send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.spinner {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.char-counter {
    max-width: 800px;
    margin: 4px auto 0;
    text-align: right;
    font-size: 0.8rem;
    color: var(--text-tertiary);
    padding: 0 4px;
}

/* Desktop styles */
@media (min-width: 769px) {
    .question-form-container { padding: 16px 20px; }
    .question-input {
        padding: 14px;
        padding-right: 54px;
        font-size: 1.1rem;
        min-height: 52px;
        max-height: 250px;
    }
    .send-btn {
        width: 40px;
        height: 40px;
        right: 10px;
        bottom: 10px;
    }
}
</style>
