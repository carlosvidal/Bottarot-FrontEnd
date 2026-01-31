<script setup>
import { ref, nextTick, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chats';
import { supabase } from '../lib/supabase';
import { getPersonalizedGreeting, generatePersonalContext } from '../utils/personalContext.js';
import { useAnalytics } from '../composables/useAnalytics.js';

import ChatMessage from '../components/ChatMessage.vue';
import Reading from '../components/Reading.vue';
import Sidebar from '../components/Sidebar.vue';
import ChatHeader from '../components/ChatHeader.vue';
import QuestionForm from '../components/QuestionForm.vue';
import DailyLimitModal from '../components/DailyLimitModal.vue';
import AuthModal from '../components/AuthModal.vue';
import CheckoutModal from '../components/CheckoutModal.vue';

// 1. Core State and Store Initialization
const readings = ref([]);
const chatHistory = ref(null);
const isLoading = ref(false);
const isLoadingHistory = ref(false);
const isSidebarOpen = ref(false);
const personalizedGreeting = ref('Bienvenido');
const showDailyLimitModal = ref(false);
const currentFutureHidden = ref(false);
const currentCtaMessage = ref(null);
const isAnonymousSession = ref(false);

// Modal state for in-chat auth/checkout
const showAuthModal = ref(false);
const showCheckoutModal = ref(false);
const pendingRevealReadingId = ref(null);
const isTransferring = ref(false); // blocks history load during post-OAuth transfer

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const chatStore = useChatStore();
const { trackTarotReadingStart, trackTarotReadingComplete, trackTarotCardsRevealed, trackFirstReading, trackWeeklyLimitReached } = useAnalytics();

// 2. Function Declarations
const scrollToBottom = () => nextTick(() => { if (chatHistory.value) chatHistory.value.scrollTop = chatHistory.value.scrollHeight; });

const loadChatHistory = async (chatId, options = {}) => {
    // No cargar historial si es un chat nuevo o no hay usuario
    if (!chatId || chatId === 'new' || !auth.user?.id) { readings.value = []; return; }
    const { animateEntrance = false } = options;
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

                // Parse v2 structured content or fallback to v1 plain text
                let sections = null;
                let interpretation = msg.content;
                let msgFutureHidden = false;

                try {
                    const parsed = JSON.parse(msg.content);
                    if (parsed._version === 2 && parsed.sections) {
                        // v2 format: apply paywall filter for history
                        const canSeeFuture = auth.canSeeFuture || auth.isPremiumUser;
                        sections = {};
                        const sectionOrder = ['saludo', 'pasado', 'presente', 'futuro', 'sintesis', 'consejo'];
                        for (const key of sectionOrder) {
                            if (!parsed.sections[key]) continue;
                            if (!canSeeFuture && key === 'futuro') {
                                const firstSentence = parsed.sections[key].match(/^[^.!?]*[.!?]/);
                                sections[key] = {
                                    text: firstSentence ? firstSentence[0] + ' ...' : parsed.sections[key].substring(0, 100) + '...',
                                    isTeaser: true
                                };
                                msgFutureHidden = true;
                            } else if (!canSeeFuture && (key === 'sintesis' || key === 'consejo')) {
                                // Skip hidden sections
                                msgFutureHidden = true;
                            } else {
                                sections[key] = { text: parsed.sections[key], isTeaser: false };
                            }
                        }
                        interpretation = parsed.rawText || msg.content;
                    }
                } catch (e) {
                    // v1 plain text — sections stays null
                }

                loadedReadings.push({
                    id: msg.message_id,
                    type: msg.cards?.length > 0 ? 'tarotReading' : 'message',
                    question: lastUserQuestion,
                    drawnCards: processedCards,
                    interpretation: interpretation,
                    sections: sections,
                    content: msg.content,
                    isLoading: false,
                    role: 'assistant',
                    timestamp: msg.created_at,
                    futureHidden: msgFutureHidden,
                    ctaMessage: msgFutureHidden ? (auth.isAnonymousUser ? 'Para revelar tu futuro, reclama tu identidad espiritual' : 'Desbloquea tu futuro completo con un plan premium') : null,
                    isAnonymous: auth.isAnonymousUser,
                    animateEntrance: animateEntrance
                });
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

// Compute the OAuth redirect URL to return to this exact chat
const chatRedirectUrl = computed(() => {
    const chatId = route.params.chatId;
    return chatId ? `${window.location.origin}/chat/${chatId}` : window.location.origin;
});

// CTA handlers — open modals instead of navigating away
const handleRegisterCta = (readingId) => {
    pendingRevealReadingId.value = readingId;
    // Save transfer info for post-OAuth return
    const chatId = route.params.chatId;
    sessionStorage.setItem('bottarot_pending_transfer', JSON.stringify({
        chatId,
        readingItemId: readingId,
        messages: buildMessagesForTransfer(),
        timestamp: Date.now()
    }));
    showAuthModal.value = true;
};

const handleUnlockFutureCta = (readingId) => {
    pendingRevealReadingId.value = readingId;
    showCheckoutModal.value = true;
};

// Build messages array from in-memory readings for transfer
const buildMessagesForTransfer = () => {
    return readings.value.map(r => {
        if (r.role === 'user') {
            return { role: 'user', content: r.content, cards: null };
        }
        // Assistant message — build structured content
        const hasSections = r.sections && Object.keys(r.sections).length > 0;
        const contentToSave = hasSections
            ? JSON.stringify({
                _version: 2,
                sections: Object.fromEntries(
                    Object.entries(r.sections).map(([k, v]) => [k, v.text || v])
                ),
                rawText: r.interpretation || ''
            })
            : r.interpretation || r.content;

        return { role: 'assistant', content: contentToSave, cards: r.drawnCards || null };
    });
};

// Transfer anonymous chat to authenticated user via backend
const transferAnonymousChat = async (chatId, newUserId, messages) => {
    const API_URL = import.meta.env.VITE_API_URL;
    try {
        const response = await fetch(`${API_URL}/api/chat/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId, newUserId, messages })
        });
        if (!response.ok) {
            console.error('Transfer failed:', await response.text());
            return false;
        }
        console.log('Chat transferred successfully');
        return true;
    } catch (err) {
        console.error('Transfer error:', err);
        return false;
    }
};

// Reveal future in-place after payment success
const revealFutureInPlace = async (readingId) => {
    const reading = readings.value.find(r => r.id === readingId);
    if (!reading) return;

    const API_URL = import.meta.env.VITE_API_URL;
    const chatId = route.params.chatId;

    try {
        const response = await fetch(
            `${API_URL}/api/chat/message/${chatId}/${readingId}/full-sections?userId=${auth.user.id}`
        );
        if (response.ok) {
            const data = await response.json();
            if (data.sections) {
                reading.sections = data.sections;
                reading.futureHidden = false;
                reading.ctaMessage = null;
                // Reveal future card visually
                if (reading.drawnCards?.[2]) {
                    reading.drawnCards[2].isFlipped = true;
                    reading.drawnCards = [...reading.drawnCards];
                }
            }
        }
    } catch (err) {
        console.error('Error revealing future in-place:', err);
    }
};

// Handle checkout modal success
const handleCheckoutSuccess = async () => {
    showCheckoutModal.value = false;
    // Permissions already reloaded inside CheckoutModal
    if (pendingRevealReadingId.value) {
        await revealFutureInPlace(pendingRevealReadingId.value);
        pendingRevealReadingId.value = null;
    }
};

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
    // Preparar cartas para animación
    return cards.map(card => ({
        ...card,
        revealed: false,
        isFlipped: false
    }));
};

const animateCards = async (cardsArray, messageRef) => {
    if (!cardsArray || cardsArray.length === 0) return;

    // Revelar cartas secuencialmente
    for (let i = 0; i < cardsArray.length; i++) {
        await delay(600);
        // Actualizar directamente la referencia del mensaje para forzar reactividad
        cardsArray[i].revealed = true;
        if (messageRef) {
            messageRef.drawnCards = [...cardsArray]; // Forzar actualización
        }

        await delay(200);
        cardsArray[i].isFlipped = true;
        if (messageRef) {
            messageRef.drawnCards = [...cardsArray]; // Forzar actualización
        }
    }
};

const handleQuestionSubmitted = async (question) => {
    console.log('🚀 handleQuestionSubmitted called with question:', question);
    isLiveSession.value = true; // Enable auto-scroll for live conversation
    const chatId = route.params.chatId;
    const userId = auth.user?.id;
    isAnonymousSession.value = !userId;

    console.log('📍 chatId:', chatId, 'userId:', userId, 'isLoading:', isLoading.value, 'isAnonymous:', isAnonymousSession.value);

    // For anonymous users, we proceed without user ID
    if (!chatId || isLoading.value) {
        console.log('⚠️ Returning early - chatId:', chatId, 'isLoading:', isLoading.value);
        return;
    }

    // Check reading permissions for authenticated users
    if (userId && !auth.isPremiumUser) {
        await auth.loadReadingPermissions();
        if (!auth.canReadToday) {
            console.log('⚠️ Daily reading limit reached');
            // Track weekly limit reached
            trackWeeklyLimitReached(auth.readingsThisWeek || 0);
            showDailyLimitModal.value = true;
            return;
        }
    }

    isLoading.value = true;

    // Track reading start
    trackTarotReadingStart(question.length);

    const userMessage = { id: `local-${Date.now()}`, type: 'message', content: question, role: 'user', timestamp: new Date().toISOString() };
    readings.value.push(userMessage);
    scrollToBottom();

    // Only save to DB for authenticated users
    if (userId) {
        await ensureChatExistsInDb(chatId, userId, question);
        await saveMessageToDb({ chatId, userId, role: 'user', content: question });
    }

    let assistantMessage = null;
    let fullInterpretation = '';
    let receivedCards = null;
    let showInterpretationTimer = null;

    try {
        const historyForAgents = readings.value.slice(0, -1).map(r => ({ role: r.role, content: r.role === 'user' ? r.content : r.interpretation || r.content }));
        const API_URL = import.meta.env.VITE_API_URL;

        // Use 'anonymous' as userId for non-authenticated users
        const effectiveUserId = userId || 'anonymous';

        const response = await fetch(`${API_URL}/api/chat/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, history: historyForAgents, userId: effectiveUserId, chatId })
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
                        console.log('🔮 Future hidden:', data.futureHidden, 'CTA:', data.ctaMessage);
                        receivedCards = data.cards;

                        // Track cards revealed
                        const cardNames = data.cards.map(c => c.name);
                        trackTarotCardsRevealed(cardNames);

                        // Store future visibility state
                        currentFutureHidden.value = data.futureHidden || false;
                        currentCtaMessage.value = data.ctaMessage || null;
                        isAnonymousSession.value = data.isAnonymous || false;

                        // Preparar cartas con propiedades de animación
                        const preparedCards = prepareCardsForAnimation(receivedCards);

                        // Crear mensaje de lectura de tarot INMEDIATAMENTE
                        assistantMessage = {
                            id: `local-${Date.now()}-ai`,
                            type: 'tarotReading',
                            question,
                            drawnCards: preparedCards,
                            interpretation: '',
                            sections: {},
                            isLoading: true,
                            role: 'assistant',
                            timestamp: new Date().toISOString(),
                            futureHidden: currentFutureHidden.value,
                            ctaMessage: currentCtaMessage.value,
                            isAnonymous: isAnonymousSession.value
                        };

                        readings.value.push(assistantMessage);
                        console.log('✅ Cartas agregadas a readings.value, total items:', readings.value.length);
                        console.log('🎬 Iniciando animación de cartas INMEDIATAMENTE...');

                        // Iniciar animación inmediatamente sin esperar nextTick
                        animateCards(preparedCards, assistantMessage);

                        // Scroll después de nextTick
                        nextTick().then(() => {
                            console.log('✅ nextTick completado, haciendo scroll');
                            scrollToBottom();
                        });
                    }

                    // Manejar evento de sección (v2)
                    if (eventType === 'section') {
                        console.log('📖 Section received:', data.section, data.isTeaser ? '(teaser)' : '');
                        if (assistantMessage) {
                            if (!assistantMessage.sections) assistantMessage.sections = {};
                            assistantMessage.sections[data.section] = {
                                text: data.text,
                                isTeaser: data.isTeaser || false
                            };
                            // Trigger Vue reactivity
                            assistantMessage.sections = { ...assistantMessage.sections };
                            assistantMessage.isLoading = false;
                        }
                        nextTick().then(() => scrollToBottom());
                    }

                    // Manejar evento de interpretación (legacy/fallback)
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
                            chatStore.fetchChatList(userId);
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
                await animateCards(preparedCards, assistantMessage);

                receivedCards = result.cards;
                fullInterpretation = result.interpretation;

                if (result.title) {
                    setTimeout(() => {
                        chatStore.fetchChatList(userId);
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

        // Guardar en DB después de recibir todo (only for authenticated users)
        if (assistantMessage && receivedCards && userId) {
            // Store structured sections if available (v2), else plain text (v1)
            const hasSections = assistantMessage.sections && Object.keys(assistantMessage.sections).length > 0;
            const contentToSave = hasSections
                ? JSON.stringify({
                    _version: 2,
                    sections: Object.fromEntries(
                        Object.entries(assistantMessage.sections).map(([k, v]) => [k, v.text || v])
                    ),
                    rawText: fullInterpretation
                })
                : fullInterpretation;

            await saveMessageToDb({
                chatId,
                userId,
                role: 'assistant',
                content: contentToSave,
                cards: receivedCards
            });

            // Record the reading for stats tracking
            const revealedFuture = !currentFutureHidden.value;
            await auth.recordReading(revealedFuture);

            // Track reading complete
            trackTarotReadingComplete(receivedCards.length);

            // Track first reading if this is the user's first reading
            if (readings.value.filter(r => r.type === 'tarotReading').length === 1) {
                trackFirstReading();
            }
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

// Helper: wait for auth store to finish initializing
const waitForAuth = () => {
    if (auth.isInitialized) return Promise.resolve();
    return new Promise(resolve => {
        const unwatch = watch(() => auth.isInitialized, (initialized) => {
            if (initialized) {
                unwatch();
                resolve();
            }
        }, { immediate: true });
    });
};

onMounted(async () => {
    try {
        personalizedGreeting.value = await getPersonalizedGreeting();
    } catch (e) {
        console.warn('Could not load personalized greeting.');
    }

    // Post-OAuth transfer: check if we have a pending anonymous chat transfer
    const pendingTransferRaw = sessionStorage.getItem('bottarot_pending_transfer');
    if (pendingTransferRaw) {
        isTransferring.value = true;
        try {
            // Wait for auth to fully initialize (Supabase session restore is async)
            await waitForAuth();

            if (auth.isLoggedIn) {
                const transfer = JSON.parse(pendingTransferRaw);
                sessionStorage.removeItem('bottarot_pending_transfer');

                // Only process if within 5 minute window
                if (Date.now() - transfer.timestamp < 300000) {
                    console.log('Post-OAuth: Transferring anonymous chat', transfer.chatId);
                    const success = await transferAnonymousChat(
                        transfer.chatId,
                        auth.user.id,
                        transfer.messages || []
                    );

                    if (success) {
                        // Reload permissions (new user gets 5 free futures)
                        await auth.loadReadingPermissions();

                        // Record reading with future revealed
                        await auth.recordReading(true);

                        // Reload chat history from DB — now with full sections
                        await loadChatHistory(transfer.chatId, { animateEntrance: true });

                        // Refresh chat list in sidebar
                        chatStore.fetchChatList(auth.user.id);
                    }
                } else {
                    // Expired — clean up and load normally
                    sessionStorage.removeItem('bottarot_pending_transfer');
                    loadChatHistory(route.params.chatId);
                }
            } else {
                // Not logged in (user cancelled OAuth?) — load chat normally
                console.log('Post-OAuth: User not logged in, loading chat normally');
                loadChatHistory(route.params.chatId);
            }
        } catch (e) {
            console.error('Post-OAuth transfer error:', e);
            sessionStorage.removeItem('bottarot_pending_transfer');
            loadChatHistory(route.params.chatId);
        } finally {
            isTransferring.value = false;
        }
    }
});

watch(() => route.params.chatId, (newChatId) => {
    if (newChatId && typeof newChatId === 'string') {
        // Skip history load if a post-OAuth transfer is pending — onMounted handles it
        if (isTransferring.value || sessionStorage.getItem('bottarot_pending_transfer')) {
            console.log('Skipping history load — pending transfer detected');
            return;
        }
        loadChatHistory(newChatId);
    }
}, { immediate: true });

// Only auto-scroll during live conversation, not when loading history
const isLiveSession = ref(false);
watch(readings, () => {
    if (isLiveSession.value) scrollToBottom();
}, { deep: true });
</script>

<template>
    <div class="chat-layout">
        <div class="sidebar-container" :class="{ 'is-open': isSidebarOpen }">
            <Sidebar @close-sidebar="isSidebarOpen = false" />
        </div>
        <div class="main-content">
            <ChatHeader>
                <template #menu-button>
                    <button class="menu-button" @click="isSidebarOpen = !isSidebarOpen" aria-label="Abrir menú">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </template>
            </ChatHeader>
            <main class="chat-container" ref="chatHistory">
                <div v-if="isTransferring || isLoadingHistory" class="loading-history">
                    <div class="loading-spinner"></div>
                    <p v-if="isTransferring">Preparando tu lectura...</p>
                    <p v-else>Cargando historial...</p>
                </div>
                <div v-else-if="readings.length === 0 && !isLoading" class="welcome-message">
                    <h2>{{ personalizedGreeting }}</h2>
                    <p>Formula tu pregunta para que el oráculo te muestre tu destino.</p>
                </div>
                <div v-else class="readings-list">
                    <template v-for="item in readings" :key="item.id">
                        <ChatMessage v-if="item.type === 'message'" :message="item" />
                        <Reading
                            v-else-if="item.type === 'tarotReading'"
                            :cards="item.drawnCards"
                            :interpretation="item.interpretation"
                            :sections="item.sections || null"
                            :isLoading="item.isLoading"
                            :futureHidden="item.futureHidden || false"
                            :ctaMessage="item.ctaMessage"
                            :isAnonymous="item.isAnonymous || false"
                            :readingId="item.id"
                            :animateEntrance="item.animateEntrance || false"
                            @register="handleRegisterCta"
                            @unlock-future="handleUnlockFutureCta"
                        />
                    </template>
                </div>
            </main>
            <footer class="form-container">
                <QuestionForm @question-submitted="handleQuestionSubmitted" :is-disabled="isLoading" />
            </footer>
        </div>
        <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="overlay"></div>

        <!-- Daily Limit Modal -->
        <DailyLimitModal
            v-if="showDailyLimitModal"
            @close="showDailyLimitModal = false"
            @view-plans="showDailyLimitModal = false; showCheckoutModal = true"
        />

        <!-- Auth Modal (for anonymous users) -->
        <AuthModal
            :isOpen="showAuthModal"
            :redirectTo="chatRedirectUrl"
            @close="showAuthModal = false"
        />

        <!-- Checkout Modal (for free users without futures) -->
        <CheckoutModal
            v-if="showCheckoutModal"
            @close="showCheckoutModal = false"
            @payment-success="handleCheckoutSuccess"
        />
    </div>
</template>

<style scoped>
/* Mobile First Base Styles */
.chat-layout { display: flex; height: 100vh; height: 100dvh; background: var(--bg-tertiary); overflow: hidden; }
.sidebar-container {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    background: var(--bg-secondary);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 999;
}
.sidebar-container.is-open { transform: translateX(0); }
.main-content { flex-grow: 1; display: flex; flex-direction: column; height: 100vh; height: 100dvh; overflow: hidden; width: 100%; }
.chat-container { flex-grow: 1; overflow-y: auto; padding: 15px; background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary), var(--bg-tertiary)); }
.readings-list { max-width: 900px; margin: 0 auto; }

/* Loading animation for history/transfer */
.loading-history {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: var(--text-secondary);
}

.loading-history p {
    margin-top: 16px;
    font-size: 1rem;
    font-style: italic;
    color: var(--color-accent-text);
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 215, 0, 0.2);
    border-left: 3px solid var(--color-accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.welcome-message { text-align: center; padding: 20px; }
.welcome-message h2 { font-size: 1.8rem; color: var(--color-accent-text); margin-bottom: 15px; }
.welcome-message p { font-size: 1rem; max-width: 500px; margin: 0 auto; line-height: 1.6; }
.form-container { flex-shrink: 0; }

/* Menu Button (hamburger) */
.menu-button {
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    margin-right: 10px;
}
.menu-button span {
    display: block;
    width: 22px;
    height: 2px;
    background-color: var(--text-secondary);
    margin: 3px 0;
    transition: all 0.3s;
    border-radius: 2px;
}
.menu-button:hover span { background-color: var(--color-accent-text); }

/* Overlay */
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.6);
    z-index: 998;
    opacity: 1;
    transition: opacity 0.3s;
}

/* Desktop Styles */
@media (min-width: 769px) {
    .sidebar-container {
        position: relative;
        transform: translateX(0);
        flex-shrink: 0;
    }
    .menu-button { display: none; }
    .overlay { display: none !important; }
    .welcome-message h2 { font-size: 2.5rem; }
    .welcome-message p { font-size: 1.2rem; }
    .chat-container { padding: 20px; }
}
</style>