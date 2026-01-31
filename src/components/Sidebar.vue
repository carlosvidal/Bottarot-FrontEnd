<script setup>
import { onMounted, computed, watch, ref, nextTick } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chats';
import { useRouter } from 'vue-router';
import { PlusCircle, Crown, Moon, Sun, UserPlus } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import AuthModal from './AuthModal.vue';
import logoDark from '../assets/Free-Tarot-Fun-sidebar-logo-darkmode.svg';
import logoLight from '../assets/Free-Tarot-Fun-sidebar-logo-lightmode.svg';

const emit = defineEmits(['close-sidebar']);
const router = useRouter();
const { t } = useI18n();

const FREE_CHAT_LIMIT = 5;
const FREE_CHATS_PER_WEEK = 1;

// Delay store initialization to avoid circular dependency issues
const auth = ref(null);
const chatStore = ref(null);

onMounted(async () => {
    await nextTick();
    auth.value = useAuthStore();
    chatStore.value = useChatStore();
});

// Computed: lista de chats visible (limitada para usuarios gratuitos)
const visibleChats = computed(() => {
    if (!chatStore.value?.chatList) return [];
    const allChats = chatStore.value.chatList;
    if (auth.value?.isPremiumUser) {
        return allChats;
    }
    return allChats.slice(0, FREE_CHAT_LIMIT);
});

// Computed: cantidad de chats ocultos
const hiddenChatsCount = computed(() => {
    if (!chatStore.value?.chatList || auth.value?.isPremiumUser) return 0;
    return Math.max(0, chatStore.value.chatList.length - FREE_CHAT_LIMIT);
});

// Computed: chats creados esta semana (para usuarios gratuitos)
const chatsThisWeek = computed(() => {
    if (!chatStore.value?.chatList) return 0;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return chatStore.value.chatList.filter(chat => {
        const chatDate = new Date(chat.created_at);
        return chatDate >= oneWeekAgo;
    }).length;
});

// Computed: puede crear nuevo chat
const canCreateNewChat = computed(() => {
    if (auth.value?.isPremiumUser) return true;
    return chatsThisWeek.value < FREE_CHATS_PER_WEEK;
});

// Computed: chats restantes esta semana
const remainingChatsThisWeek = computed(() => {
    if (auth.value?.isPremiumUser) return Infinity;
    return Math.max(0, FREE_CHATS_PER_WEEK - chatsThisWeek.value);
});

const createNewChat = () => {
    if (!canCreateNewChat.value) {
        alert(t('sidebar.weeklyLimitReached') + '. ' + t('nav.upgradeToPremium') + '.');
        return;
    }
    router.push({ name: 'new-chat' });
    emit('close-sidebar');
};

const showAuthModal = ref(false);

// Theme toggle functionality
const isDarkMode = ref(true);

onMounted(() => {
    // Initialize theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme');
    isDarkMode.value = savedTheme !== 'light';

    // Apply the theme class
    if (!isDarkMode.value) {
        document.documentElement.classList.add('light-mode');
    }
});

const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value;

    if (isDarkMode.value) {
        document.documentElement.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    }
};

// Computed properties for user display
const userName = computed(() => auth.value?.user?.email?.split('@')[0] || 'Usuario');
const userAvatar = computed(() => (auth.value?.user?.email || 'U').charAt(0).toUpperCase());

// Watch for auth initialization after stores are loaded
watch(() => auth.value?.isInitialized, (isInitialized) => {
    if (isInitialized && auth.value?.isLoggedIn && auth.value?.user && chatStore.value) {
        console.log('Sidebar: Auth is ready, fetching chat list.');
        try {
            chatStore.value.fetchChatList(auth.value.user.id);
        } catch (error) {
            console.error('Error fetching chat list:', error);
        }
    }
}, { immediate: true });

// Watch route changes to refresh chat list
watch(() => router.currentRoute.value.fullPath, (newPath, oldPath) => {
    if (router.currentRoute.value.name === 'chat' && newPath !== oldPath && chatStore.value && auth.value?.user) {
        console.log('Sidebar: Route changed, refreshing chat list.');
        setTimeout(() => {
            try {
                chatStore.value.fetchChatList(auth.value.user.id);
            } catch (error) {
                console.error('Error fetching chat list:', error);
            }
        }, 1500);
    }
});
</script>

<template>
    <aside class="sidebar" v-if="auth && chatStore">
        <!-- Header: Logo + Dark Mode Toggle -->
        <div class="sidebar-header">
            <router-link to="/landing" class="sidebar-logo-link" @click="emit('close-sidebar')">
                <img :src="logoDark" alt="Free Tarot Fun" class="sidebar-logo logo-dark" />
                <img :src="logoLight" alt="Free Tarot Fun" class="sidebar-logo logo-light" />
            </router-link>
            <button @click="toggleTheme" class="theme-toggle-btn" :title="isDarkMode ? t('sidebar.changeToLightMode') : t('sidebar.changeToDarkMode')">
                <Moon v-if="isDarkMode" :size="20" />
                <Sun v-else :size="20" />
            </button>
        </div>

        <div class="sidebar-content">
            <!-- New Chat Button -->
            <button
                @click="createNewChat"
                class="new-chat-btn"
                :class="{ 'disabled': !canCreateNewChat }"
                :disabled="!canCreateNewChat"
            >
                <PlusCircle :size="20" />
                <span>{{ t('nav.newChat') }}</span>
            </button>

            <!-- Límite semanal para usuarios gratuitos -->
            <div v-if="auth.isLoggedIn && !auth.isPremiumUser" class="weekly-limit">
                <span v-if="canCreateNewChat">{{ t('sidebar.chatsThisWeek', { count: remainingChatsThisWeek }, remainingChatsThisWeek) }}</span>
                <span v-else class="limit-reached">{{ t('sidebar.weeklyLimitReached') }}</span>
            </div>

            <!-- Chat History -->
            <nav v-if="auth.isLoggedIn" class="chat-history">
                <h3 class="history-title">{{ t('sidebar.history') }}</h3>
                <div v-if="chatStore.isLoading" class="loading-text">{{ t('sidebar.loadingChats') }}</div>
                <ul v-else-if="visibleChats.length > 0">
                    <li v-for="chat in visibleChats" :key="chat.id">
                        <router-link
                            :to="{ name: 'chat', params: { chatId: chat.id } }"
                            class="history-link"
                            @click="emit('close-sidebar')"
                        >
                            <span v-if="chat.is_favorite" class="favorite-icon">⭐</span>
                            <span class="chat-title-text">{{ chat.title || t('chat.untitled') }}</span>
                        </router-link>
                    </li>
                </ul>
                <div v-else class="no-chats">{{ t('sidebar.noChats') }}</div>

                <!-- Premium upsell for hidden chats -->
                <div v-if="hiddenChatsCount > 0" class="premium-upsell">
                    <p>{{ t('sidebar.hiddenChats', { count: hiddenChatsCount }) }}</p>
                    <router-link to="/checkout" class="unlock-link">
                        {{ t('sidebar.unlockFullHistory') }}
                    </router-link>
                </div>
            </nav>
        </div>

        <!-- Actions -->
        <div class="sidebar-actions">
            <!-- Upgrade button for non-premium users (logged in or anonymous) -->
            <router-link v-if="!auth.isPremiumUser" to="/checkout" class="action-button upgrade-btn">
                <Crown :size="18" />
                <span>{{ t('nav.upgradeToPremium') }}</span>
            </router-link>

            <template v-if="auth.isLoggedIn">
                <!-- Profile info at bottom -->
                <router-link to="/profile" class="profile-bottom" @click="emit('close-sidebar')">
                    <div class="avatar">{{ userAvatar }}</div>
                    <div class="profile-info">
                        <span class="username">{{ userName }}</span>
                        <span class="profile-link-text">{{ t('nav.profile') }}</span>
                    </div>
                </router-link>
            </template>
            <template v-else>
                <button @click="showAuthModal = true" class="action-button signup-btn">
                    <UserPlus :size="18" />
                    <span>{{ t('auth.signup') }}</span>
                </button>
            </template>
        </div>

        <Teleport to="body">
            <AuthModal :isOpen="showAuthModal" @close="showAuthModal = false" />
        </Teleport>
    </aside>
</template>

<style scoped>
.sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-secondary);
    color: var(--text-secondary);
    border-right: 1px solid var(--border-primary);
    font-family: 'Roboto', sans-serif;
}

.sidebar-content {
    flex-grow: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

/* Sidebar Header */
.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid var(--border-primary);
    flex-shrink: 0;
}

.sidebar-logo-link {
    display: inline-block;
}

.sidebar-logo {
    height: 28px;
    width: auto;
}

.sidebar-logo.logo-dark {
    display: block;
}

.sidebar-logo.logo-light {
    display: none;
}

:global(.light-mode) .sidebar-logo.logo-dark {
    display: none;
}

:global(.light-mode) .sidebar-logo.logo-light {
    display: block;
}

/* Profile Bottom */
.profile-bottom {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 6px;
    text-decoration: none;
    color: var(--text-secondary);
    transition: background-color 0.2s ease;
}

.profile-bottom:hover {
    background-color: var(--bg-tertiary);
}

.avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--bg-tertiary);
    color: var(--color-accent-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    flex-shrink: 0;
    font-size: 0.9rem;
}

.profile-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.username {
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.9rem;
}

.profile-link-text {
    font-size: 0.8rem;
    color: var(--color-accent-text);
}

/* Theme Toggle Button */
.theme-toggle-btn {
    background: none;
    border: 1px solid var(--border-primary);
    color: var(--text-secondary);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    flex-shrink: 0;
    margin-left: auto;
}

.theme-toggle-btn:hover {
    background: var(--bg-tertiary);
    color: var(--color-accent-text);
    border-color: var(--color-accent-text);
}

/* New Chat Button */
.new-chat-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    background: linear-gradient(45deg, var(--btn-primary), var(--btn-primary-hover));
    color: var(--color-white);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.3s ease;
}

.new-chat-btn:hover:not(.disabled) {
    background: linear-gradient(45deg, var(--btn-primary-hover), var(--btn-primary-hover));
    transform: translateY(-1px);
}

.new-chat-btn.disabled {
    background: var(--bg-elevated);
    cursor: not-allowed;
    opacity: 0.6;
}

/* Weekly Limit */
.weekly-limit {
    text-align: center;
    font-size: 0.8rem;
    color: var(--text-tertiary);
    margin-top: 8px;
    padding: 6px;
    background: rgba(0,0,0,0.2);
    border-radius: 4px;
}

.weekly-limit .limit-reached {
    color: var(--color-error);
}

/* Chat History */
.chat-history {
    margin-top: 20px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.history-title {
    font-size: 0.85rem;
    text-transform: uppercase;
    color: var(--text-tertiary);
    margin-bottom: 10px;
    letter-spacing: 0.5px;
}

.chat-history ul {
    list-style: none;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    flex-grow: 1;
}

.history-link {
    color: var(--text-secondary);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 8px;
    border-radius: 6px;
    transition: background-color 0.2s;
}

.history-link:hover,
.router-link-exact-active {
    background-color: var(--bg-tertiary);
}

.favorite-icon {
    flex-shrink: 0;
}

.chat-title-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.loading-text,
.no-chats {
    color: var(--text-tertiary);
    font-size: 0.9rem;
    padding: 10px 0;
}

/* Premium Upsell */
.premium-upsell {
    margin-top: 15px;
    padding: 12px;
    background: rgba(255, 215, 0, 0.08);
    border: 1px dashed var(--accent-dim);
    border-radius: 8px;
    text-align: center;
}

.premium-upsell p {
    margin: 0 0 8px 0;
    color: var(--text-secondary);
    font-size: 0.85rem;
}

.unlock-link {
    color: var(--color-accent-text);
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: bold;
}

.unlock-link:hover {
    text-decoration: underline;
}

/* Sidebar Actions */
.sidebar-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px;
    border-top: 1px solid var(--border-primary);
    flex-shrink: 0;
}

.action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    text-align: center;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95rem;
    transition: all 0.3s ease;
}

.upgrade-btn {
    background: linear-gradient(45deg, var(--btn-primary), var(--btn-primary-hover));
    color: var(--color-white);
}

.upgrade-btn:hover {
    background: linear-gradient(45deg, var(--btn-primary-hover), var(--btn-primary-hover));
}

.signup-btn {
    background: linear-gradient(45deg, var(--btn-primary), var(--btn-primary-hover));
    color: var(--color-white);
}

.signup-btn:hover {
    background: linear-gradient(45deg, var(--btn-primary-hover), var(--btn-primary-hover));
    transform: translateY(-1px);
}

</style>
