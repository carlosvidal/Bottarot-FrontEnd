<script setup>
import { ref, nextTick, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QuestionForm from '../components/QuestionForm.vue';
import Reading from '../components/Reading.vue';
import Sidebar from '../components/Sidebar.vue';
import ChatHeader from '../components/ChatHeader.vue';
import { getPersonalizedGreeting, generatePersonalContext } from '../utils/personalContext.js';
import { useAuthStore } from '../stores/auth.js';
import { tarotDeck } from '../data/tarotDeck.js';

// --- HELPERS ---
const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- STATE ---
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const conversationLog = ref([]);
const chatContainer = ref(null);
const isSidebarOpen = ref(false);
const personalizedGreeting = ref('Bienvenido');
const isLoadingHistory = ref(false);
const isThinking = ref(false);

const cardTitles = ['Pasado', 'Presente', 'Futuro'];

// --- COMPUTED ---
const currentChatId = computed(() => route.params.chatId);
const userMessages = computed(() => conversationLog.value.filter(m => m.role === 'user'));
const lastAIMessage = computed(() => {
    const log = conversationLog.value;
    for (let i = log.length - 1; i >= 0; i--) {
        if (log[i].role === 'assistant') {
            return log[i];
        }
    }
    return null;
});

// --- DATABASE INTERACTIONS ---
const loadChatHistory = async (chatId) => {
    if (!chatId) return;
    isLoadingHistory.value = true;
    conversationLog.value = [];
    console.log(`📚 Cargando historial para el chat: ${chatId}`);
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const history = await response.json();

        // Map DB messages to frontend conversationLog format
        conversationLog.value = history.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            cards: msg.cards ? msg.cards.map(card => ({ ...card, revealed: true, isFlipped: true })) : [],
            isLoading: false
        }));
        console.log(`✅ Historial cargado: ${conversationLog.value.length} mensajes.`);
    } catch (error) {
        console.error('Error cargando el historial del chat:', error);
    } finally {
        isLoadingHistory.value = false;
    }
};

const saveMessage = async (message) => {
    try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });
    } catch (error) {
        console.error('Error guardando el mensaje:', error);
    }
};

const createChatInDB = async (chatId, userId, title) => {
    try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/chats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId, userId, title }),
        });
    } catch (error) {
        console.error('Error creando el chat:', error);
    }
};

// --- LIFECYCLE & ROUTING ---
const initializeChatId = () => {
    if (!currentChatId.value) {
        const newChatId = generateUUID();
        router.replace({ name: 'chat', params: { chatId: newChatId } });
        return newChatId;
    }
    return currentChatId.value;
};

const createNewChat = () => {
    const newChatId = generateUUID();
    conversationLog.value = [];
    router.push({ name: 'chat', params: { chatId: newChatId } });
};

onMounted(async () => {
    const chatId = initializeChatId();
    await loadPersonalizedGreeting();
    
    // Load history if a chat ID is present
    if (chatId) {
        await loadChatHistory(chatId);
    }

    // Handle initial question from query parameter if no history was loaded
    if (conversationLog.value.length === 0) {
        const initialQuestion = route.query.q;
        if (initialQuestion && typeof initialQuestion === 'string') {
            handleQuestionSubmitted(initialQuestion);
            router.replace({ name: 'chat', params: { chatId }, query: {} });
        }
    }
});

watch(() => route.params.chatId, (newChatId, oldChatId) => {
    if (newChatId && newChatId !== oldChatId) {
        loadChatHistory(newChatId);
    }
});

watch(conversationLog, () => {
    nextTick(() => {
        if (chatContainer.value) {
            chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
        }
    });
}, { deep: true });


// --- CORE TAROT LOGIC ---

const drawCardsAnimation = async (existingCards = null) => {
    if (existingCards) {
        return existingCards.map(card => ({ ...card, revealed: true, isFlipped: true }));
    }

    isThinking.value = true;
    const placeholders = Array(3).fill(null).map((_, i) => ({ key: `p-${Date.now()}-${i}`, revealed: false, isFlipped: false, image: '' }));
    
    conversationLog.value.push({ id: Date.now(), role: 'assistant', cards: placeholders, content: '', isLoading: true });

    await nextTick();

    for (let i = 0; i < 3; i++) {
        await delay(200);
        const lastMsg = conversationLog.value[conversationLog.value.length - 1];
        if (lastMsg && lastMsg.cards && lastMsg.cards[i]) lastMsg.cards[i].revealed = true;
    }
    await delay(500);

    const shuffledDeck = [...tarotDeck].sort(() => Math.random() - 0.5);
    const drawnCardsData = shuffledDeck.slice(0, 3);
    const finalCards = [];

    for (let i = 0; i < 3; i++) {
        await delay(400);
        const realCard = { ...drawnCardsData[i], upright: Math.random() > 0.5, revealed: true, isFlipped: false, key: `card-${Date.now()}-${i}` };
        finalCards.push(realCard);

        const lastMsg = conversationLog.value[conversationLog.value.length - 1];
        if (lastMsg && lastMsg.cards && lastMsg.cards[i]) {
            lastMsg.cards[i] = realCard;
            await nextTick();
            lastMsg.cards[i].isFlipped = true;
        }
    }
    
    await delay(1000);
    isThinking.value = false;
    return finalCards;
};

const getTarotInterpretation = async (question, cards) => {
    const lastMsg = conversationLog.value[conversationLog.value.length - 1];
    if(lastMsg) lastMsg.isLoading = true;

    try {
        const personalContext = await generatePersonalContext();
        const historyForAPI = conversationLog.value.slice(0, -2).map(msg => ({ role: msg.role, content: msg.content }));

        const promptData = {
            pregunta: question,
            cartas: cards.map((card, index) => ({ nombre: card.name, orientacion: card.upright ? 'Derecha' : 'Invertida', posicion: cardTitles[index] })),
            contextoPersonal: personalContext.context,
            history: historyForAPI
        };

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tarot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(promptData),
        });

        if (!response.ok) throw new Error('No se pudo obtener la interpretación.');
        const data = await response.json();
        
        const finalMsg = conversationLog.value[conversationLog.value.length - 1];
        if (finalMsg) {
            finalMsg.content = data.interpretation;
            finalMsg.isLoading = false;
            // Save assistant message to DB
            saveMessage({ chatId: currentChatId.value, userId: authStore.user.id, role: 'assistant', content: finalMsg.content, cards: finalMsg.cards });
        }

    } catch (error) {
        console.error('Error fetching interpretation:', error);
        const finalMsg = conversationLog.value[conversationLog.value.length - 1];
        if (finalMsg) {
            finalMsg.content = 'Hubo un problema al conectar con el oráculo. Inténtalo de nuevo.';
            finalMsg.isLoading = false;
        }
    }
};

const handleQuestionSubmitted = async (question) => {
    if (isThinking.value) return;
    isThinking.value = true;

    const isFirstQuestionInChat = conversationLog.value.length === 0;

    const userMessage = {
        id: Date.now(), // Temporary ID, real one comes from DB
        role: 'user',
        content: question,
        chatId: currentChatId.value,
        userId: authStore.user.id
    };
    conversationLog.value.push(userMessage);
    await nextTick();

    // If it's the first message, create the chat entry in the DB
    if (isFirstQuestionInChat) {
        await createChatInDB(currentChatId.value, authStore.user.id, question.substring(0, 50));
    }
    // Save user message to DB
    await saveMessage(userMessage);

    let cardsForInterpretation;
    if (isFirstQuestionInChat) {
        cardsForInterpretation = await drawCardsAnimation();
    } else {
        try {
            const historyForCheck = conversationLog.value.map(msg => ({ role: msg.role, content: msg.content }));
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tarot/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history: historyForCheck.slice(0, -1), current_question: question }),
            });
            const { decision } = await response.json();

            if (decision === 'new_draw') {
                cardsForInterpretation = await drawCardsAnimation();
            } else { // follow_up
                cardsForInterpretation = lastAIMessage.value.cards;
                const assistantMessage = { id: Date.now(), role: 'assistant', cards: cardsForInterpretation, content: '', isLoading: true };
                conversationLog.value.push(assistantMessage);
            }
        } catch (error) {
            console.error('Error checking question type:', error);
            cardsForInterpretation = await drawCardsAnimation();
        }
    }

    await getTarotInterpretation(question, cardsForInterpretation);
    isThinking.value = false;
};

// --- OTHER UI LOGIC ---
const loadPersonalizedGreeting = async () => {
    try {
        personalizedGreeting.value = await getPersonalizedGreeting();
    } catch (error) {
        console.warn('⚠️ No se pudo cargar saludo personalizado:', error);
        personalizedGreeting.value = 'Bienvenido al oráculo';
    }
};

const addToFavorites = () => console.log('⭐ Add to favorites - coming soon!');
const shareChat = () => console.log('🔗 Share chat - coming soon!');

</script>

<template>
    <div class="chat-layout">
        <div class="sidebar-container" :class="{ 'is-open': isSidebarOpen }">
            <Sidebar />
        </div>

        <div class="main-content">
            <ChatHeader @new-chat="createNewChat" @add-to-favorites="addToFavorites" @share-chat="shareChat">
                <template #menu-button>
                    <button @click="isSidebarOpen = !isSidebarOpen" class="menu-button">
                        <span /><span /><span />
                    </button>
                </template>
            </ChatHeader>

            <main class="chat-container" ref="chatContainer">
                <div v-if="authStore.warmupMessage" class="warmup-notification">
                    <div class="warmup-content">
                        <span class="warmup-icon">🔥</span>
                        <span class="warmup-text">{{ authStore.warmupMessage }}</span>
                    </div>
                </div>

                <div v-if="conversationLog.length === 0" class="welcome-message">
                    <h2>{{ personalizedGreeting }}</h2>
                    <p>Formula tu pregunta en la parte de abajo para que el oráculo te muestre tu destino.</p>
                </div>

                <div v-else class="conversation-log">
                    <div v-for="message in conversationLog" :key="message.id" :class="'message-wrapper message-' + message.role">
                        
                        <!-- User Message -->
                        <div v-if="message.role === 'user'" class="user-message">
                            <p>{{ message.content }}</p>
                        </div>

                        <!-- AI Message -->
                        <div v-if="message.role === 'assistant'" class="bot-message">
                            <Reading 
                                :cards="message.cards" 
                                :interpretation="message.content"
                                :is-loading="message.isLoading"
                            />
                        </div>
                    </div>
                </div>
                 <div v-if="isThinking" class="thinking-indicator">
                    <div class="spinner"></div>
                    <p>El oráculo está concentrándose...</p>
                </div>
            </main>

            <footer class="form-container">
                <QuestionForm @question-submitted="handleQuestionSubmitted" :is-disabled="isThinking" />
            </footer>
        </div>
        <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="overlay"></div>
    </div>
</template>

<style scoped>
.chat-layout { display: flex; height: 100vh; background: #0f3460; }
.sidebar-container { width: 280px; flex-shrink: 0; background: #16213e; transition: transform 0.3s ease; }
.main-content { flex-grow: 1; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.chat-container { flex-grow: 1; overflow-y: auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460); }
.conversation-log { max-width: 900px; margin: 0 auto; }
.form-container { flex-shrink: 0; }

.message-wrapper {
    margin-bottom: 20px;
}

.user-message {
    background-color: #2c3e50;
    padding: 15px;
    border-radius: 15px 15px 0 15px;
    max-width: 70%;
    margin-left: auto;
    color: #ecf0f1;
    font-size: 1.1rem;
}

.bot-message {
    background-color: #1a1a2e;
    padding: 20px;
    border-radius: 15px;
    max-width: 100%;
    margin-right: auto;
}

.welcome-message { text-align: center; margin-top: 20vh; color: #ccc; }
.welcome-message h2 { font-size: 2.5rem; color: #ffd700; margin-bottom: 15px; }
.welcome-message p { font-size: 1.2rem; max-width: 500px; margin: 0 auto; line-height: 1.6; }

.thinking-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    margin: 10px auto;
    max-width: 300px;
    background: rgba(22, 33, 62, 0.7);
    border-radius: 15px;
    color: #ffd700;
}
.spinner {
    border: 4px solid rgba(255, 255, 255, 0.2);
    border-left-color: #ffd700;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
    margin-right: 15px;
}
@keyframes spin {
    to { transform: rotate(360deg); }
}


/* Menu, Sidebar, Overlay, etc. */
.menu-button { display: none; background: none; border: none; cursor: pointer; padding: 5px; }
.menu-button span { display: block; width: 22px; height: 2px; background-color: #ccc; margin: 4px 0; transition: transform 0.3s; }
.overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 998; }

@media (max-width: 768px) {
    .menu-button { display: block; z-index: 1000; }
    .sidebar-container { position: fixed; top: 0; left: 0; bottom: 0; transform: translateX(-100%); z-index: 999; }
    .sidebar-container.is-open { transform: translateX(0); }
    .overlay.is-open { display: block; }
}

/* Warmup notification */
.warmup-notification { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; animation: slideInDown 0.5s ease-out; }
.warmup-content { background: linear-gradient(135deg, #ff6b35, #ff8f00); color: white; padding: 12px 20px; border-radius: 25px; box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3); display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.95rem; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); }
.warmup-icon { font-size: 1.2rem; animation: pulse 2s infinite; }
.warmup-text { white-space: nowrap; }
@keyframes slideInDown { from { opacity: 0; transform: translateX(-50%) translateY(-30px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }

/* Scrollbar styles */
.chat-container::-webkit-scrollbar { width: 8px; }
.chat-container::-webkit-scrollbar-track { background: #16213e; }
.chat-container::-webkit-scrollbar-thumb { background-color: #0f3460; border-radius: 4px; border: 2px solid #16213e; }
.chat-container::-webkit-scrollbar-thumb:hover { background-color: #1e4a83; }
</style>
