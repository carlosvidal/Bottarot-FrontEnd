<script setup>
import { ref, nextTick, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QuestionForm from '../components/QuestionForm.vue';
import Reading from '../components/Reading.vue';
import Sidebar from '../components/Sidebar.vue';
import ChatHeader from '../components/ChatHeader.vue';

// Generate UUID v4
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const route = useRoute();
const router = useRouter();

const readings = ref([]);
const chatHistory = ref(null);
const isSidebarOpen = ref(false);

// Current chat ID - reactive
const currentChatId = computed(() => route.params.chatId);

// Initialize chat ID if not present
const initializeChatId = () => {
    if (!currentChatId.value) {
        const newChatId = generateUUID();
        console.log('💬 Creating new chat:', newChatId);
        router.replace({ name: 'chat', params: { chatId: newChatId } });
        return newChatId;
    }
    console.log('💬 Loading existing chat:', currentChatId.value);
    return currentChatId.value;
};

// Create new chat (for "Nuevo" button)
const createNewChat = () => {
    const newChatId = generateUUID();
    console.log('💬 Creating new chat via button:', newChatId);
    // Clear current readings and navigate to new chat
    readings.value = [];
    router.push({ name: 'chat', params: { chatId: newChatId } });
};

// Add to favorites (placeholder for future implementation)
const addToFavorites = () => {
    console.log('⭐ Add to favorites functionality - coming soon!');
    // TODO: Implement favorites functionality
};

// Share chat (placeholder for future implementation)
const shareChat = () => {
    console.log('🔗 Share chat functionality - coming soon!');
    // TODO: Implement sharing functionality with anonymous URLs
};

const handleQuestionSubmitted = (question) => {
    // Ensure we have a chat ID
    const chatId = currentChatId.value || initializeChatId();

    const newReading = {
        id: Date.now(),
        question: question,
        chatId: chatId,
        timestamp: new Date().toISOString()
    };

    console.log('💬 Adding question to chat:', chatId, question);
    readings.value.push(newReading);
};

watch(readings, () => {
    nextTick(() => {
        if (chatHistory.value) {
            chatHistory.value.scrollTop = chatHistory.value.scrollHeight;
        }
    });
}, { deep: true });

onMounted(() => {
    // Initialize chat ID if needed
    const chatId = initializeChatId();

    // Handle initial question from query parameter
    const initialQuestion = route.query.q;
    if (initialQuestion && typeof initialQuestion === 'string') {
        handleQuestionSubmitted(initialQuestion);
        // Clean up query parameter but keep chat ID
        router.replace({
            name: 'chat',
            params: { chatId: chatId },
            query: {}
        });
    }

    // In the future, this is where we'll load chat history from backend
    // if (chatId) {
    //     loadChatHistory(chatId);
    // }
});

// Watch for chat ID changes (when navigating between chats)
watch(() => route.params.chatId, (newChatId, oldChatId) => {
    if (newChatId !== oldChatId && newChatId) {
        console.log('💬 Chat changed from', oldChatId, 'to', newChatId);
        // Clear current readings when switching chats
        readings.value = [];
        // In the future, load the new chat's history
        // loadChatHistory(newChatId);
    }
});
</script>

<template>
    <div class="chat-layout">
        <div class="sidebar-container" :class="{ 'is-open': isSidebarOpen }">
            <Sidebar />
        </div>

        <div class="main-content">
            <ChatHeader
                @new-chat="createNewChat"
                @add-to-favorites="addToFavorites"
                @share-chat="shareChat">
                <template #menu-button>
                    <button @click="isSidebarOpen = !isSidebarOpen" class="menu-button">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </template>
            </ChatHeader>

            <main class="chat-container" ref="chatHistory">
                <div v-if="readings.length === 0" class="welcome-message">
                    <h2>Bienvenido</h2>
                    <p>Formula tu pregunta en la parte de abajo para que el oráculo te muestre tu destino.</p>
                </div>
                <div v-else class="readings-list">
                    <Reading v-for="reading in readings" :key="reading.id" :reading-data="reading" />
                </div>
            </main>

            <footer class="form-container">
                <QuestionForm @question-submitted="handleQuestionSubmitted" />
            </footer>
        </div>
        <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="overlay"></div>
    </div>
</template>

<style scoped>
.chat-layout { display: flex; height: 100vh; background: #0f3460; }

/* Sidebar */
.sidebar-container { width: 280px; flex-shrink: 0; background: #16213e; transition: transform 0.3s ease; }

/* Main Content */
.main-content { flex-grow: 1; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

.chat-container { flex-grow: 1; overflow-y: auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460); }
.readings-list { max-width: 900px; margin: 0 auto; }
.welcome-message { text-align: center; margin-top: 20vh; color: #ccc; }
.welcome-message h2 { font-size: 2.5rem; color: #ffd700; margin-bottom: 15px; }
.welcome-message p { font-size: 1.2rem; max-width: 500px; margin: 0 auto; line-height: 1.6; }
.form-container { flex-shrink: 0; }

/* Menu Button */
.menu-button { display: none; background: none; border: none; cursor: pointer; padding: 5px; }
.menu-button span { display: block; width: 22px; height: 2px; background-color: #ccc; margin: 4px 0; transition: transform 0.3s; }

/* Overlay for mobile */
.overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 998; }

/* Mobile Responsiveness */
@media (max-width: 768px) {
    .menu-button { display: block; z-index: 1000; }
    .sidebar-container { position: fixed; top: 0; left: 0; bottom: 0; transform: translateX(-100%); z-index: 999; }
    .sidebar-container.is-open { transform: translateX(0); }
    .overlay.is-open { display: block; }
}

/* Scrollbar styles */
.chat-container::-webkit-scrollbar { width: 8px; }
.chat-container::-webkit-scrollbar-track { background: #16213e; }
.chat-container::-webkit-scrollbar-thumb { background-color: #0f3460; border-radius: 4px; border: 2px solid #16213e; }
.chat-container::-webkit-scrollbar-thumb:hover { background-color: #1e4a83; }
</style>