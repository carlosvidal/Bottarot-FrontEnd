<script setup>
import { ref, nextTick, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chats';
import { supabase } from '../lib/supabase';
import { getPersonalizedGreeting, generatePersonalContext } from '../utils/personalContext.js';

import ChatMessage from '../components/ChatMessage.vue';
import Reading from '../components/Reading.vue';
import Sidebar from '../components/Sidebar.vue';
import ChatHeader from '../components/ChatHeader.vue';
import QuestionForm from '../components/QuestionForm.vue';

// 1. Core State and Store Initialization
const readings = ref([]);
const chatHistory = ref(null);
const isLoading = ref(false);
const isLoadingHistory = ref(false);
const isSidebarOpen = ref(false);
const personalizedGreeting = ref('Bienvenido');

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const chatStore = useChatStore();

// 2. Function Declarations
const scrollToBottom = () => nextTick(() => { if (chatHistory.value) chatHistory.value.scrollTop = chatHistory.value.scrollHeight; });

const loadChatHistory = async (chatId) => {
    if (!chatId || !auth.user?.id) { readings.value = []; return; }
    isLoadingHistory.value = true;
    readings.value = [];
    try {
        const { data, error } = await supabase.rpc('get_chat_history', { p_chat_id: chatId });
        if (error) throw error;
        const loadedReadings = [];
        let lastUserQuestion = '';
        data.forEach(msg => {
            if (msg.role === 'user') {
                loadedReadings.push({ id: msg.message_id, type: 'message', content: msg.content, role: msg.role, timestamp: msg.created_at });
                lastUserQuestion = msg.content;
            } else if (msg.role === 'assistant') {
                // Si hay cartas, agregarles las propiedades de animación (ya reveladas)
                let processedCards = msg.cards;
                if (msg.cards && msg.cards.length > 0) {
                    processedCards = msg.cards.map(card => ({
                        ...card,
                        revealed: true,
                        isFlipped: true
                    }));
                }
                loadedReadings.push({ id: msg.message_id, type: msg.cards?.length > 0 ? 'tarotReading' : 'message', question: lastUserQuestion, drawnCards: processedCards, interpretation: msg.content, content: msg.content, isLoading: false, role: 'assistant', timestamp: msg.created_at });
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

const createNewChat = () => router.push({ name: 'new-chat' });

const ensureChatExistsInDb = async (chatId, userId, initialQuestion) => {
    try {
        const { count } = await supabase.from('chats').select('id', { count: 'exact', head: true }).eq('id', chatId);
        if (count === 0) {
            await supabase.from('chats').insert({ id: chatId, user_id: userId, title: initialQuestion.substring(0, 50) });
        }
    } catch (dbError) { console.error('❌ DB Error ensuring chat exists:', dbError); throw dbError; }
};

const saveMessageToDb = async ({ chatId, userId, role, content, cards = null }) => {
    try {
        await supabase.rpc('save_message', { p_chat_id: chatId, p_user_id: userId, p_role: role, p_content: content, p_cards: cards });
    } catch (dbError) { console.error('❌ DB Error saving message:', dbError); }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const prepareCardsForAnimation = (cards) => {
    if (!cards || cards.length === 0) return cards;
    // Por ahora mostrar las cartas ya reveladas para que aparezcan inmediatamente
    return cards.map(card => ({
        ...card,
        revealed: true,
        isFlipped: true
    }));
};

const animateCards = async (cards) => {
    if (!cards || cards.length === 0) return;

    // Revelar cartas secuencialmente
    for (let i = 0; i < cards.length; i++) {
        await delay(600);
        cards[i].revealed = true;
        await delay(200);
        cards[i].isFlipped = true;
    }
};

const handleQuestionSubmitted = async (question) => {
    console.log('🚀 handleQuestionSubmitted called with question:', question);
    const chatId = route.params.chatId;
    const userId = auth.user?.id;
    console.log('📍 chatId:', chatId, 'userId:', userId, 'isLoading:', isLoading.value);
    if (!chatId || !userId || isLoading.value) {
        console.log('⚠️ Returning early - chatId:', chatId, 'userId:', userId, 'isLoading:', isLoading.value);
        return;
    }

    isLoading.value = true;
    const userMessage = { id: `local-${Date.now()}`, type: 'message', content: question, role: 'user', timestamp: new Date().toISOString() };
    readings.value.push(userMessage);
    scrollToBottom();
    await ensureChatExistsInDb(chatId, userId, question);
    await saveMessageToDb({ chatId, userId, role: 'user', content: question });

    let assistantMessage = null;
    let fullInterpretation = '';
    let receivedCards = null;
    let showInterpretationTimer = null;

    try {
        const historyForAgents = readings.value.slice(0, -1).map(r => ({ role: r.role, content: r.role === 'user' ? r.content : r.interpretation || r.content }));
        const API_URL = import.meta.env.VITE_API_URL;

        const response = await fetch(`${API_URL}/api/chat/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, history: historyForAgents, userId, chatId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en la comunicación con el servidor.');
        }

        // Check content type to determine if it's SSE or regular JSON
        const contentType = response.headers.get('content-type');
        console.log('📋 Content-Type:', contentType);

        if (contentType && contentType.includes('text/event-stream')) {
            // SSE Streaming
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            console.log('🔄 Starting SSE stream reading...');

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log('✅ Stream finished');
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            console.log('📦 Buffer:', buffer);
            const events = buffer.split('\n\n');
            buffer = events.pop();

            for (const event of events) {
                if (!event.trim()) continue;

                console.log('📨 Raw event:', event);

                try {
                    const lines = event.split('\n');
                    const eventType = lines[0].replace('event: ', '');
                    const dataLine = lines[1].replace('data: ', '');
                    const data = JSON.parse(dataLine);

                    console.log('🎯 Event type:', eventType, 'Data:', data);

                    // Manejar evento de cartas
                    if (eventType === 'cards') {
                        console.log('🃏 Cards received:', data.cards);
                        receivedCards = data.cards;

                        // Preparar cartas con propiedades de animación
                        const preparedCards = prepareCardsForAnimation(receivedCards);

                        // Crear mensaje de lectura de tarot INMEDIATAMENTE
                        assistantMessage = {
                            id: `local-${Date.now()}-ai`,
                            type: 'tarotReading',
                            question,
                            drawnCards: preparedCards,
                            interpretation: '',
                            isLoading: true,
                            role: 'assistant',
                            timestamp: new Date().toISOString()
                        };

                        readings.value.push(assistantMessage);
                        console.log('✅ Cartas agregadas a readings.value, total items:', readings.value.length);
                        console.log('🎬 Iniciando animación de cartas INMEDIATAMENTE...');

                        // Iniciar animación inmediatamente sin esperar nextTick
                        animateCards(preparedCards);

                        // Scroll después de nextTick
                        nextTick().then(() => {
                            console.log('✅ nextTick completado, haciendo scroll');
                            scrollToBottom();
                        });
                    }

                    // Manejar evento de interpretación
                    if (eventType === 'interpretation') {
                        console.log('📖 Interpretation chunk:', data.text);
                        fullInterpretation += data.text;
                        if (assistantMessage) {
                            // Mostrar interpretación inmediatamente
                            assistantMessage.interpretation = fullInterpretation;
                            assistantMessage.isLoading = false;
                        }
                    }

                    // Manejar evento de título
                    if (eventType === 'title') {
                        console.log('📝 Title received:', data.title);
                        setTimeout(() => {
                            chatStore.fetchChatList();
                        }, 1000);
                    }
                } catch (parseError) {
                    console.error('❌ Error parsing event:', parseError, 'Event:', event);
                }
            }
        }
        } else {
            // Regular JSON response (fallback)
            console.log('📄 Using regular JSON response');
            const result = await response.json();
            console.log('📥 JSON result:', result);

            if (result.type === 'tarot_reading') {
                // Preparar cartas con propiedades de animación
                const preparedCards = prepareCardsForAnimation(result.cards);

                assistantMessage = {
                    id: `local-${Date.now()}-ai`,
                    type: 'tarotReading',
                    question,
                    drawnCards: preparedCards,
                    interpretation: result.interpretation,
                    isLoading: false,
                    role: 'assistant',
                    timestamp: new Date().toISOString()
                };

                readings.value.push(assistantMessage);
                scrollToBottom();

                // Animar cartas
                await animateCards(preparedCards);

                receivedCards = result.cards;
                fullInterpretation = result.interpretation;

                if (result.title) {
                    setTimeout(() => {
                        chatStore.fetchChatList();
                    }, 1000);
                }
            } else {
                assistantMessage = {
                    id: `local-${Date.now()}-ai`,
                    type: 'message',
                    content: result.text,
                    role: 'assistant',
                    timestamp: new Date().toISOString()
                };
                readings.value.push(assistantMessage);
            }
        }

        // Guardar en DB después de recibir todo
        if (assistantMessage && receivedCards) {
            await saveMessageToDb({
                chatId,
                userId,
                role: 'assistant',
                content: fullInterpretation,
                cards: receivedCards
            });
        }

    } catch (error) {
        console.error('❌ Error in handleQuestionSubmitted:', error);
        readings.value.push({
            id: `local-${Date.now()}-err`,
            type: 'message',
            content: `Lo siento, ha ocurrido un error: ${error.message}`,
            role: 'assistant',
            isError: true,
            timestamp: new Date().toISOString()
        });
    } finally {
        isLoading.value = false;
        scrollToBottom();
    }
};

// 3. Lifecycle Hooks and Watchers
onMounted(async () => {
    try {
        personalizedGreeting.value = await getPersonalizedGreeting();
    } catch (e) {
        console.warn('Could not load personalized greeting.');
    }
});

watch(() => route.params.chatId, (newChatId) => {
    if (newChatId && typeof newChatId === 'string') {
        loadChatHistory(newChatId);
    }
}, { immediate: true });

watch(readings, scrollToBottom, { deep: true });
</script>

<template>
    <div class="chat-layout">
        <div class="sidebar-container" :class="{ 'is-open': isSidebarOpen }">
            <Sidebar />
        </div>
        <div class="main-content">
            <ChatHeader @new-chat="createNewChat" />
            <main class="chat-container" ref="chatHistory">
                <div v-if="isLoadingHistory">Cargando historial...</div>
                <div v-else-if="readings.length === 0 && !isLoading" class="welcome-message">
                    <h2>{{ personalizedGreeting }}</h2>
                    <p>Formula tu pregunta para que el oráculo te muestre tu destino.</p>
                </div>
                <div v-else class="readings-list">
                    <template v-for="item in readings" :key="item.id">
                        <ChatMessage v-if="item.type === 'message'" :message="item" />
                        <Reading v-else-if="item.type === 'tarotReading'" :cards="item.drawnCards" :interpretation="item.interpretation" :isLoading="item.isLoading" />
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
.sidebar-container { width: 280px; flex-shrink: 0; background: #16213e; transition: transform 0.3s ease; }
.main-content { flex-grow: 1; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.chat-container { flex-grow: 1; overflow-y: auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460); }
.readings-list { max-width: 900px; margin: 0 auto; }
.welcome-message h2 { font-size: 2.5rem; color: #ffd700; margin-bottom: 15px; }
.welcome-message p { font-size: 1.2rem; max-width: 500px; margin: 0 auto; line-height: 1.6; }
.form-container { flex-shrink: 0; }
.menu-button { display: none; background: none; border: none; cursor: pointer; padding: 5px; }
.menu-button span { display: block; width: 22px; height: 2px; background-color: #ccc; margin: 4px 0; transition: transform 0.3s; }
.overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 998; }
@media (max-width: 768px) {
    .menu-button { display: block; z-index: 1000; }
    .sidebar-container { position: fixed; top: 0; left: 0; bottom: 0; transform: translateX(-100%); z-index: 999; }
    .sidebar-container.is-open { transform: translateX(0); }
    .overlay.is-open { display: block; }
}
</style>