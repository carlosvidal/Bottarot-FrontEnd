<script setup>
import ChatMessage from '../components/ChatMessage.vue';
import { ref, nextTick, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QuestionForm from '../components/QuestionForm.vue';
import Reading from '../components/Reading.vue';
import Sidebar from '../components/Sidebar.vue';
import ChatHeader from '../components/ChatHeader.vue';
import { getPersonalizedGreeting } from '../utils/personalContext.js';
import { useAuthStore } from '../stores/auth.js';

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
const authStore = useAuthStore();

import { supabase } from '../lib/supabase.js';

const readings = ref([]);
const chatHistory = ref(null);
const isLoadingHistory = ref(false);

// New function to load chat history
const loadChatHistory = async (chatId) => {
    if (!chatId || !authStore.user?.id) {
        console.warn('⚠️ Cannot load chat history: Missing chatId or user ID.');
        readings.value = []; // Clear readings if no valid chat/user
        return;
    }

    isLoadingHistory.value = true;
    readings.value = []; // Clear current readings before loading new ones

    try {
        console.log(`💬 Loading chat history for chat ID: ${chatId} and user ID: ${authStore.user.id}`);
        const { data, error } = await supabase.rpc('get_chat_history', {
            p_chat_id: chatId,
            p_user_id: authStore.user.id
        });

        if (error) {
            console.error('❌ Error fetching chat history:', error);
            // Optionally, display an error message to the user
        } else {
            console.log('✅ Chat history loaded:', data);
            readings.value = data.map(msg => ({
                id: msg.id,
                content: msg.content,
                role: msg.role,
                timestamp: msg.created_at,
            }));
        }
    } catch (err) {
        console.error('❌ Exception while loading chat history:', err);
    } finally {
        isLoadingHistory.value = false;
    }
};
const isSidebarOpen = ref(false);
const personalizedGreeting = ref('Bienvenido');

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

// Load personalized greeting
const loadPersonalizedGreeting = async () => {
    try {
        const greeting = await getPersonalizedGreeting();
        personalizedGreeting.value = greeting;
        console.log('👋 Saludo personalizado cargado:', greeting);
    } catch (error) {
        console.warn('⚠️ No se pudo cargar saludo personalizado:', error);
        personalizedGreeting.value = 'Bienvenido al oráculo';
    }
};

const callAIService = async (chatId, question, userId) => {
    console.log(`🤖 Calling AI service for chat ${chatId}, user ${userId} with question: ${question}`);
    const API_URL = import.meta.env.VITE_API_URL;

    try {
        const response = await fetch(`${API_URL}/api/chat/generate-ai-response`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatId: chatId,
                userId: userId,
                question: question,
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`AI service error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        return data.content || data.response;

    } catch (error) {
        console.error('❌ Error calling AI service:', error);
        throw error;
    }
};

const handleQuestionSubmitted = async (question) => {
    const chatId = currentChatId.value || initializeChatId();
    const userId = authStore.user?.id;

    if (!userId) {
        console.error('❌ User not logged in. Cannot submit question.');
        return;
    }

    const userMessage = {
        id: generateUUID(),
        content: question,
        role: 'user',
        chatId: chatId,
        timestamp: new Date().toISOString()
    };

    console.log('💬 Adding user question to chat:', chatId, question);
    readings.value.push(userMessage);

    const tempAiMessage = {
        id: generateUUID(),
        content: "El oráculo está meditando sobre tu destino...",
        role: 'assistant',
        chatId: chatId,
        timestamp: new Date().toISOString()
    };
    readings.value.push(tempAiMessage);
    nextTick(() => {
        if (chatHistory.value) {
            chatHistory.value.scrollTop = chatHistory.value.scrollHeight;
        }
    });


    try {
        const { data: userMessageId, error: userMessageError } = await supabase.rpc('save_message', {
            p_chat_id: chatId,
            p_user_id: userId,
            p_content: userMessage.content,
            p_role: userMessage.role
        });

        if (userMessageError) {
            console.error('❌ Error saving user message:', userMessageError);
            readings.value = readings.value.filter(msg => msg.id !== userMessage.id && msg.id !== tempAiMessage.id);
            return;
        }
        userMessage.id = userMessageId;

        const aiResponseContent = await callAIService(chatId, question, userId);

        const index = readings.value.findIndex(msg => msg.id === tempAiMessage.id);
        if (index !== -1) {
            readings.value[index].content = aiResponseContent;
            readings.value[index].timestamp = new Date().toISOString();
        }

        const { data: aiMessageId, error: aiMessageError } = await supabase.rpc('save_message', {
            p_chat_id: chatId,
            p_user_id: userId,
            p_content: aiResponseContent,
            p_role: 'assistant'
        });

        if (aiMessageError) {
            console.error('❌ Error saving AI message:', aiMessageError);
        } else {
            if (index !== -1) {
                readings.value[index].id = aiMessageId;
            }
        }

    } catch (error) {
        console.error('❌ Exception during question submission:', error);
        readings.value = readings.value.filter(msg => msg.id !== tempAiMessage.id);
    } finally {
        nextTick(() => {
            if (chatHistory.value) {
                chatHistory.value.scrollTop = chatHistory.value.scrollHeight;
            }
        });
    }
};
watch(readings, () => {
    nextTick(() => {
        if (chatHistory.value) {
            chatHistory.value.scrollTop = chatHistory.value.scrollHeight;
        }
    });
}, { deep: true });

onMounted(async () => {
    // Initialize chat ID if needed
    const chatId = initializeChatId();

    // Load personalized greeting
    await loadPersonalizedGreeting();

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

    // Load chat history on mount
    await loadChatHistory(chatId);
});

// Watch for chat ID changes (when navigating between chats)
watch(() => route.params.chatId, (newChatId, oldChatId) => {
    if (newChatId !== oldChatId && newChatId) {
        console.log('💬 Chat changed from', oldChatId, 'to', newChatId);
        // Clear current readings when switching chats
        readings.value = [];
        // Load the new chat's history
        await loadChatHistory(newChatId);
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
                <!-- Warmup message -->
                <div v-if="authStore.warmupMessage" class="warmup-notification">
                    <div class="warmup-content">
                        <span class="warmup-icon">🔥</span>
                        <span class="warmup-text">{{ authStore.warmupMessage }}</span>
                    </div>
                </div>

                <div v-if="isLoadingHistory" class="loading-message">Cargando historial...</div>
                <div v-else-if="readings.length === 0" class="welcome-message">
                    <h2>{{ personalizedGreeting }}</h2>
                    <p>Formula tu pregunta en la parte de abajo para que el oráculo te muestre tu destino.</p>
                </div>
                <div v-else class="readings-list">
                    <ChatMessage v-for="message in readings" :key="message.id" :message="message" />
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
.welcome-.message { text-align: center; margin-top: 20vh; color: #ccc; }
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

/* Warmup notification */
.warmup-notification {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    animation: slideInDown 0.5s ease-out;
}

.warmup-content {
    background: linear-gradient(135deg, #ff6b35, #ff8f00);
    color: white;
    padding: 12px 20px;
    border-radius: 25px;
    box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3);
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    font-size: 0.95rem;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.warmup-icon {
    font-size: 1.2rem;
    animation: pulse 2s infinite;
}

.warmup-text {
    white-space: nowrap;
}

@keyframes slideInDown {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(-30px);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
}

/* Scrollbar styles */
.chat-container::-webkit-scrollbar { width: 8px; }
.chat-container::-webkit-scrollbar-track { background: #16213e; }
.chat-container::-webkit-scrollbar-thumb { background-color: #0f3460; border-radius: 4px; border: 2px solid #16213e; }
.chat-container::-webkit-scrollbar-thumb:hover { background-color: #1e4a83; }
</style>