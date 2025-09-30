<script setup>
import { computed, ref } from 'vue';
import { marked } from 'marked';

const props = defineProps({
    message: {
        type: Object,
        required: true,
        validator: (value) => {
            return ['id', 'content', 'role', 'timestamp'].every(key => key in value);
        }
    }
});

const isUser = computed(() => props.message.role === 'user');
const messageClass = computed(() => ({
    'chat-message': true,
    'user-message': isUser.value,
    'ai-message': !isUser.value
}));

const formattedTimestamp = computed(() => {
    const date = new Date(props.message.timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

const parsedContent = computed(() => {
    if (!isUser.value) {
        return marked.parse(props.message.content);
    }
    return props.message.content;
});

// --- ElevenLabs TTS Logic ---
const audio = ref(null);
const audioState = ref('idle'); // idle, loading, playing, error

const playAudio = async () => {
    if (audio.value && audioState.value === 'playing') {
        audio.value.pause();
        audio.value.currentTime = 0;
        audioState.value = 'idle';
        return;
    }

    audioState.value = 'loading';
    try {
        const API_URL = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API_URL}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: props.message.content })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch audio from server.');
        }

        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        audio.value = new Audio(audioUrl);

        audio.value.onplaying = () => audioState.value = 'playing';
        audio.value.onended = () => audioState.value = 'idle';
        audio.value.onerror = () => audioState.value = 'error';
        
        audio.value.play();

    } catch (error) {
        console.error('Error playing TTS audio:', error);
        audioState.value = 'error';
    }
};

</script>

<template>
    <div :class="messageClass">
        <div class="message-bubble">
            <div class="message-header" v-if="!isUser">
                <button @click="playAudio" class="tts-button" :disabled="audioState === 'loading'">
                    <span v-if="audioState === 'idle' || audioState === 'error'">▶️</span>
                    <span v-if="audioState === 'loading'">⏳</span>
                    <span v-if="audioState === 'playing'">⏸️</span>
                </button>
            </div>
            <div class="message-content" v-html="parsedContent"></div>
            <span class="message-timestamp">{{ formattedTimestamp }}</span>
        </div>
    </div>
</template>

<style scoped>
.chat-message { display: flex; margin-bottom: 15px; }
.user-message { justify-content: flex-end; }
.ai-message { justify-content: flex-start; }

.message-bubble {
    max-width: 70%;
    padding: 12px 18px;
    border-radius: 20px;
    position: relative;
    font-size: 0.95rem;
    line-height: 1.6;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.user-message .message-bubble { background-color: #0f3460; color: #e0e0e0; border-bottom-right-radius: 5px; }
.ai-message .message-bubble { background-color: #16213e; color: #f0f0f0; border-bottom-left-radius: 5px; }

.message-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
}

.tts-button {
    background: #2c3e50;
    border: 1px solid #7f8c8d;
    color: #ecf0f1;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.8rem;
}
.tts-button:disabled { cursor: not-allowed; opacity: 0.7; }

.message-content { margin: 0; word-wrap: break-word; }
.message-timestamp { font-size: 0.75rem; color: #999; align-self: flex-end; margin-top: 8px; }
</style>