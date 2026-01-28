<script setup>
import { onMounted, computed, watch, ref, nextTick } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chats';
import { useRouter } from 'vue-router';
import { PlusCircle, LogOut, Crown, Moon, Sun } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

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

const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
};

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
        <div class="sidebar-content">
            <!-- Profile Section -->
            <div class="profile-section">
                <div class="avatar">{{ userAvatar }}</div>
                <div class="profile-info">
                    <span class="username">{{ userName }}</span>
                    <router-link to="/profile" class="profile-link">{{ t('nav.profile') }}</router-link>
                </div>
                <button @click="toggleTheme" class="theme-toggle-btn" :title="isDarkMode ? t('sidebar.changeToLightMode') : t('sidebar.changeToDarkMode')">
                    <Moon v-if="isDarkMode" :size="20" />
                    <Sun v-else :size="20" />
                </button>
            </div>

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
            <div v-if="!auth.isPremiumUser" class="weekly-limit">
                <span v-if="canCreateNewChat">{{ t('sidebar.chatsThisWeek', { count: remainingChatsThisWeek }, remainingChatsThisWeek) }}</span>
                <span v-else class="limit-reached">{{ t('sidebar.weeklyLimitReached') }}</span>
            </div>

            <!-- Chat History -->
            <nav class="chat-history">
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

            <!-- Actions -->
            <div class="sidebar-actions">
                <router-link v-if="!auth.isPremiumUser" to="/checkout" class="action-button upgrade-btn">
                    <Crown :size="18" />
                    <span>{{ t('nav.upgradeToPremium') }}</span>
                </router-link>
                <div v-else class="premium-badge-sidebar">
                    <Crown :size="18" />
                    <span>{{ t('sidebar.premiumActive') }}</span>
                </div>
                <button @click="logout" class="action-button logout-btn">
                    <LogOut :size="18" />
                    <span>{{ t('nav.logout') }}</span>
                </button>
            </div>
        </div>

        <footer class="sidebar-footer">
            <router-link to="/terms">{{ t('nav.terms') }}</router-link>
            <span>·</span>
            <router-link to="/privacy">{{ t('nav.privacy') }}</router-link>
        </footer>
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
}

/* Profile Section */
.profile-section {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-primary);
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--bg-tertiary);
    color: var(--color-accent-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    flex-shrink: 0;
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
}

.profile-link {
    font-size: 0.85rem;
    color: var(--color-accent-text);
    text-decoration: none;
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
    margin-top: 16px;
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
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 20px;
    border-top: 1px solid var(--border-primary);
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

.logout-btn {
    background-color: var(--bg-card);
    color: var(--text-secondary);
}

.logout-btn:hover {
    background-color: var(--bg-elevated);
}

.premium-badge-sidebar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    border-radius: 6px;
    background: linear-gradient(145deg, rgba(255, 215, 0, 0.15), rgba(255, 237, 74, 0.1));
    border: 1px solid var(--color-accent);
    color: var(--color-accent-text);
    font-weight: bold;
    font-size: 0.9rem;
}

/* Sidebar Footer */
.sidebar-footer {
    padding: 16px 20px;
    text-align: center;
    font-size: 0.85rem;
    border-top: 1px solid var(--border-primary);
    flex-shrink: 0;
}

.sidebar-footer a {
    color: var(--text-tertiary);
    text-decoration: none;
}

.sidebar-footer a:hover {
    color: var(--text-secondary);
}

.sidebar-footer span {
    margin: 0 8px;
    color: var(--text-tertiary);
}
</style>
