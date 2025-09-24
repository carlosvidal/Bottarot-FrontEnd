<script setup>
import { computed } from 'vue';
import { marked } from 'marked'; // Import marked

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

// New computed property to parse Markdown content
const parsedContent = computed(() => {
    // Only parse if it's an AI message, user messages are plain text
    if (!isUser.value) {
        return marked.parse(props.message.content);
    }
    return props.message.content; // Return as is for user messages
});
</script>

<template>
    <div :class="messageClass">
        <div class="message-bubble">
            <!-- Use v-html for parsed Markdown content -->
            <p class="message-content" v-html="parsedContent"></p>
            <span class="message-timestamp">{{ formattedTimestamp }}</span>
        </div>
    </div>
</template>

<style scoped>
.chat-message {
    display: flex;
    margin-bottom: 15px;
}

.user-message {
    justify-content: flex-end;
}

.ai-message {
    justify-content: flex-start;
}

.message-bubble {
    max-width: 70%;
    padding: 12px 18px;
    border-radius: 20px;
    position: relative;
    font-size: 0.95rem;
    line-height: 1.4;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.user-message .message-bubble {
    background-color: #0f3460; /* Dark blue for user */
    color: #e0e0e0;
    border-bottom-right-radius: 5px;
}

.ai-message .message-bubble {
    background-color: #16213e; /* Slightly lighter dark blue for AI */
    color: #f0f0f0;
    border-bottom-left-radius: 5px;
}

.message-content {
    margin: 0;
    word-wrap: break-word;
}

.message-timestamp {
    font-size: 0.75rem;
    color: #999;
    align-self: flex-end;
    margin-top: 5px;
}

.user-message .message-timestamp {
    color: #b0b0b0;
}

.ai-message .message-timestamp {
    color: #c0c0c0;
}
</style>
