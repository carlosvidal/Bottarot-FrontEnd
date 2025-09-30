<script setup>
import ChatMessage from '../components/ChatMessage.vue';
import { ref, nextTick, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QuestionForm from '../components/QuestionForm.vue';
import Reading from '../components/Reading.vue';
import Sidebar from '../components/Sidebar.vue';
import ChatHeader from '../components/ChatHeader.vue';
import { getPersonalizedGreeting, generatePersonalContext } from '../utils/personalContext.js';
import { useAuthStore } from '../stores/auth.js';
import { supabase } from '../lib/supabase.js';

// --- Core Refs ---
const readings = ref([]);
const chatHistory = ref(null);
const isLoading = ref(false);
const isLoadingHistory = ref(false);
const isSidebarOpen = ref(false);
const personalizedGreeting = ref('Bienvenido');

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// --- Chat History Management ---
const loadChatHistory = async (chatId) => {
    if (!chatId || !authStore.user?.id) {
        console.warn('⚠️ Cannot load chat history: Missing chatId or user ID.');
        readings.value = [];
        return;
    }

    isLoadingHistory.value = true;
    readings.value = []; // Clear previous chat

    try {
        console.log(`💬 Loading chat history for chat ID: ${chatId}`);
        const { data, error } = await supabase.rpc('get_chat_history', { p_chat_id: chatId });

        if (error) throw error;

        console.log('✅ Chat history loaded:', data);
        const loadedReadings = [];
        let lastUserQuestion = '';

        data.forEach(msg => {
            if (msg.role === 'user') {
                loadedReadings.push({ id: msg.message_id, type: 'message', content: msg.content, role: msg.role, timestamp: msg.created_at });
                lastUserQuestion = msg.content;
            } else if (msg.role === 'assistant') {
                const messageData = {
                    id: msg.message_id,
                    type: msg.cards && msg.cards.length > 0 ? 'tarotReading' : 'message',
                    question: lastUserQuestion,
                    drawnCards: msg.cards,
                    interpretation: msg.content,
                    content: msg.content,
                    isLoading: false,
                    role: 'assistant',
                    timestamp: msg.created_at
                };
                loadedReadings.push(messageData);
                lastUserQuestion = '';
            }
        });
        readings.value = loadedReadings;
    } catch (err) {
        console.error('❌ Exception while loading chat history:', err);
    } finally {
        isLoadingHistory.value = false;
    }
};

// --- Chat Navigation ---
const createNewChat = () => {
    console.log('💬 Navigating to create a new chat...');
    router.push({ name: 'new-chat' });
};

// --- Main Logic: Handling Question Submission ---
const handleQuestionSubmitted = async (question) => {
    const chatId = route.params.chatId;
    const userId = authStore.user?.id;

    if (!chatId || !userId || isLoading.value) return;

    isLoading.value = true;

    const userMessage = {
        id: `local-${Date.now()}`,
        type: 'message',
        content: question,
        role: 'user',
        timestamp: new Date().toISOString()
    };
    readings.value.push(userMessage);
    scrollToBottom();

    try {
        await ensureChatExistsInDb(chatId, userId, question);
        await saveMessageToDb({ chatId, userId, role: 'user', content: question });

        const historyForAgents = readings.value.slice(0, -1).map(r => ({
            role: r.role,
            content: r.role === 'user' ? r.content : r.interpretation || r.content,
        }));
        
        const personalCtx = await generatePersonalContext();

        const API_URL = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API_URL}/api/chat/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, history: historyForAgents, personalContext: personalCtx.context, userId, chatId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en la comunicación con el servidor.');
        }

        const result = await response.json();

        let assistantMessage;
        if (result.type === 'tarot_reading') {
            assistantMessage = { id: `local-${Date.now()}-ai`, type: 'tarotReading', question, drawnCards: result.cards.map(c => ({ ...c, revealed: true, isFlipped: true })), interpretation: result.interpretation, isLoading: false, role: 'assistant', timestamp: new Date().toISOString() };
        } else {
            assistantMessage = { id: `local-${Date.now()}-ai`, type: 'message', content: result.text, role: 'assistant', timestamp: new Date().toISOString() };
        }
        readings.value.push(assistantMessage);

        await saveMessageToDb({ chatId, userId, role: 'assistant', content: assistantMessage.interpretation || assistantMessage.content, cards: assistantMessage.drawnCards || null });

    } catch (error) {
        console.error('❌ Error in handleQuestionSubmitted:', error);
        readings.value.push({ id: `local-${Date.now()}-err`, type: 'message', content: `Lo siento, ha ocurrido un error: ${error.message}`, role: 'assistant', isError: true, timestamp: new Date().toISOString() });
    } finally {
        isLoading.value = false;
        scrollToBottom();
    }
};

// --- Database and Utility Functions ---
const ensureChatExistsInDb = async (chatId, userId, initialQuestion) => {
    try {
        const { count } = await supabase.from('chats').select('id', { count: 'exact', head: true }).eq('id', chatId);
        if (count === 0) {
            console.log(`🔗 Chat ${chatId} does not exist. Creating...`);
            const { error } = await supabase.from('chats').insert({ id: chatId, user_id: userId, title: initialQuestion.substring(0, 50) });
            if (error) throw error;
            console.log(`✅ Chat ${chatId} created.`);
        }
    } catch (dbError) {
        console.error('❌ DB Error ensuring chat exists:', dbError);
        throw dbError;
    }
};

const saveMessageToDb = async ({ chatId, userId, role, content, cards = null }) => {
    try {
        console.log(`💾 Saving message to DB... (Role: ${role})`);
        const { error } = await supabase.rpc('save_message', { p_chat_id: chatId, p_user_id: userId, p_role: role, p_content: content, p_cards: cards });
        if (error) throw error;
        console.log('✅ Message saved successfully.');
    } catch (dbError) {
        console.error('❌ DB Error saving message:', dbError);
    }
};

const scrollToBottom = () => {
    nextTick(() => {
        if (chatHistory.value) chatHistory.value.scrollTop = chatHistory.value.scrollHeight;
    });
};

// --- Lifecycle and Watchers ---
watch(() => route.params.chatId, (newChatId) => {
    if (newChatId && typeof newChatId === 'string') {
        console.log(`▶️ Chat ID is present: ${newChatId}. Loading history.`);
        loadChatHistory(newChatId);
    } else {
        console.log('❔ No chat ID in route yet, router will redirect.');
    }
}, { immediate: true });

watch(readings, scrollToBottom, { deep: true });

onMounted(async () => {
    try {
        personalizedGreeting.value = await getPersonalizedGreeting();
    } catch (e) {
        console.warn('Could not load personalized greeting.');
    }
});

// --- Placeholder Functions ---
const addToFavorites = () => console.log('⭐ Favorites - coming soon!');
const shareChat = () => console.log('🔗 Share - coming soon!');
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
                <div v-else-if="readings.length === 0 && !isLoading" class="welcome-message">
                    <h2>{{ personalizedGreeting }}</h2>
                    <p>Formula tu pregunta en la parte de abajo para que el oráculo te muestre tu destino.</p>
                </div>
                <div v-else class="readings-list">
                    <template v-for="item in readings" :key="item.id">
                        <ChatMessage v-if="item.type === 'message'" :message="item" />
                        <Reading v-else-if="item.type === 'tarotReading'" :cards="item.drawnCards" :interpretation="item.interpretation" />
                    </template>
                </div>
            </main>

            <footer class="form-container">
                <QuestionForm @question-submitted="handleQuestionSubmitted" :is-disabled="isLoading" />
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
</style>