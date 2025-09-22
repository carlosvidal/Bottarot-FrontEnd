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

// Helper function to wait for auth initialization (copied from router)
async function waitForAuthInitialization(auth) {
  if (auth.isInitialized) return true;
  const maxWait = 8000; // 8 seconds max wait
  const startTime = Date.now();
  while (!auth.isInitialized && (Date.now() - startTime) < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return auth.isInitialized;
}

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
    if (!chatId || !authStore.isLoggedIn) return;
    isLoadingHistory.value = true;
    conversationLog.value = [];
    console.log(`📚 Cargando historial para el chat: ${chatId}`);
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const history = await response.json();

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
    if (!authStore.isLoggedIn) return;
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
    if (!authStore.isLoggedIn) return;
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
    await loadPersonalizedGreeting();
    const authReady = await waitForAuthInitialization(authStore);

    if (authReady) {
        const chatId = initializeChatId();
        if (chatId) {
            await loadChatHistory(chatId);
        }

        if (conversationLog.value.length === 0) {
            const initialQuestion = route.query.q;
            if (initialQuestion && typeof initialQuestion === 'string') {
                handleQuestionSubmitted(initialQuestion);
                router.replace({ name: 'chat', params: { chatId }, query: {} });
            }
        }
    } else {
        console.error("Auth no se inicializó a tiempo en Chat.vue");
    }
});

watch(() => route.params.chatId, async (newChatId, oldChatId) => {
    if (newChatId && newChatId !== oldChatId) {
        const authReady = await waitForAuthInitialization(authStore);
        if(authReady) {
            loadChatHistory(newChatId);
        }
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
    if (isThinking.value || !authStore.isLoggedIn) return;
    isThinking.value = true;

    const isFirstQuestionInChat = conversationLog.value.length === 0;

    const userMessage = {
        id: Date.now(),
        role: 'user',
        content: question,
        chatId: currentChatId.value,
        userId: authStore.user.id
    };
    conversationLog.value.push(userMessage);
    await nextTick();

    if (isFirstQuestionInChat) {
        await createChatInDB(currentChatId.value, authStore.user.id, question.substring(0, 50));
    }
    await saveMessage(userMessage);

    let cardsForInterpretation;
    if (isFirstQuestionInChat) {
        cardsForInterpretation = await drawCardsAnimation();
    } else {
        try {
            const historyForCheck = conversationLog.value.map(msg => ({ role: msg.role, content: msg.content }));
            const payloadForCheck = { history: historyForCheck.slice(0, -1), current_question: question };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tarot/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadForCheck),
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
