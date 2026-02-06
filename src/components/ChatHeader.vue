<script setup>
import { ref, computed, nextTick } from 'vue';
import { useChatStore } from '../stores/chats';
import { useAuthStore } from '../stores/auth';
import { useRoute, useRouter } from 'vue-router';
import { Star, Share2, Trash2, Pencil, Check, X, CheckCircle, Lock } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import { useAnalytics } from '../composables/useAnalytics.js';

const props = defineProps({
    readingComplete: {
        type: Boolean,
        default: false
    },
    isClosed: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['share-chat', 'close-chat']);
const { t } = useI18n();
const { trackTarotReadingShare, trackTarotReadingFavorite } = useAnalytics();

const chatStore = useChatStore();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const isRenaming = ref(false);
const newTitle = ref('');
const titleInput = ref(null);

const currentChat = computed(() => {
    return chatStore.chatList.find(c => c.id === route.params.chatId);
});

const startRename = async () => {
    if (!currentChat.value) return;
    isRenaming.value = true;
    newTitle.value = currentChat.value.title;
    await nextTick();
    titleInput.value?.focus();
};

const saveRename = async () => {
    if (!isRenaming.value || !currentChat.value || !auth.user) return;
    try {
        await chatStore.renameChat(currentChat.value.id, newTitle.value, auth.user.id);
    } catch (error) {
        console.error('Failed to rename chat:', error);
        alert(t('chat.renameError'));
    } finally {
        isRenaming.value = false;
    }
};

const cancelRename = () => {
    isRenaming.value = false;
    newTitle.value = '';
};

const deleteCurrentChat = async () => {
    const chatId = route.params.chatId;
    if (!chatId || !auth.user) return;
    if (window.confirm(t('chat.deleteConfirm'))) {
        try {
            await chatStore.deleteChat(chatId, auth.user.id);
            router.push({ name: 'new-chat' });
        } catch (error) {
            console.error('Failed to delete chat:', error);
            alert(t('chat.deleteError'));
        }
    }
};

const handleShare = () => {
    if (currentChat.value) {
        trackTarotReadingShare(currentChat.value.id);
    }
    emit('share-chat');
};

const toggleFavorite = () => {
    if (!currentChat.value || !auth.user) return;
    const willBeFavorite = !currentChat.value.is_favorite;
    chatStore.toggleFavorite(currentChat.value.id, auth.user.id)
        .then(() => {
            // Track favorite action
            trackTarotReadingFavorite(willBeFavorite);
        })
        .catch(error => {
            alert(t('chat.favoriteError'));
        });
};

const handleClose = () => {
    if (window.confirm(t('chat.finalizeConfirm'))) {
        emit('close-chat');
    }
};
</script>

<template>
    <header class="chat-header">
        <div class="header-left">
            <slot name="menu-button"></slot>
            <div v-if="currentChat" class="title-container">
                <template v-if="!isRenaming">
                    <h2 class="chat-title">{{ currentChat.title || t('chat.untitled') }}</h2>
                    <button @click="startRename" class="icon-btn rename-btn" :title="t('chat.rename')">
                        <Pencil :size="16" />
                    </button>
                </template>
                <template v-else>
                    <input
                        ref="titleInput"
                        v-model="newTitle"
                        class="title-input"
                        @keyup.enter="saveRename"
                        @keyup.esc="cancelRename"
                    />
                    <button @click="saveRename" class="icon-btn save-btn" :title="t('common.save')">
                        <Check :size="16" />
                    </button>
                    <button @click="cancelRename" class="icon-btn cancel-btn" :title="t('common.cancel')">
                        <X :size="16" />
                    </button>
                </template>
            </div>
        </div>
        <div v-if="readingComplete" class="header-right">
            <!-- Finalize button (only if not closed) -->
            <button
                v-if="!isClosed"
                @click="handleClose"
                class="header-action finalize-btn"
                :title="t('chat.finalize')"
            >
                <CheckCircle :size="18" />
                <span class="btn-text">{{ t('chat.finalize') }}</span>
            </button>

            <!-- Closed indicator -->
            <span v-if="isClosed" class="closed-badge">
                <Lock :size="14" />
                <span>{{ t('chat.finalized') }}</span>
            </span>

            <button
                @click="toggleFavorite"
                class="header-action favorite-btn"
                :class="{ 'is-favorite': currentChat?.is_favorite }"
                :title="t('chat.favorite')"
            >
                <Star :size="18" :fill="currentChat?.is_favorite ? 'currentColor' : 'none'" />
                <span class="btn-text">{{ t('chat.favorite') }}</span>
            </button>
            <button v-if="!isClosed" @click="handleShare" class="header-action" :title="t('chat.share')">
                <Share2 :size="18" />
                <span class="btn-text">{{ t('chat.share') }}</span>
            </button>
            <button @click="deleteCurrentChat" class="header-action delete-btn" :title="t('common.delete')">
                <Trash2 :size="18" />
                <span class="btn-text">{{ t('common.delete') }}</span>
            </button>
        </div>
    </header>
</template>

<style scoped>
/* Mobile First */
.chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-primary);
    flex-shrink: 0;
    gap: 8px;
    font-family: 'Roboto', sans-serif;
}

.header-left,
.header-right {
    display: flex;
    align-items: center;
}

.header-left {
    flex-grow: 1;
    min-width: 0;
    gap: 8px;
}

.header-right {
    gap: 4px;
    flex-shrink: 0;
}

/* Title */
.title-container {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-grow: 1;
    min-width: 0;
}

.chat-title {
    font-size: 0.95rem;
    color: var(--text-primary);
    font-weight: 500;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.title-input {
    background: var(--bg-tertiary);
    border: 1px solid var(--color-accent);
    color: var(--color-white);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 0.9rem;
    flex-grow: 1;
    min-width: 80px;
}

/* Icon Buttons */
.icon-btn {
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
}

.icon-btn:hover {
    color: var(--color-white);
    background: rgba(255,255,255,0.1);
}

.save-btn:hover {
    color: var(--color-success);
}

.cancel-btn:hover {
    color: var(--color-error);
}

/* Action Buttons */
.header-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: none;
    border: 1px solid var(--border-primary);
    color: var(--text-secondary);
    padding: 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.header-action:hover {
    background-color: var(--bg-tertiary);
    color: var(--color-accent-text);
}

/* Hide text on mobile */
.btn-text {
    display: none;
}

/* Favorite Button */
.favorite-btn.is-favorite {
    color: var(--color-accent-text);
    border-color: var(--color-accent-text);
}

/* Finalize Button */
.finalize-btn {
    border-color: rgba(74, 222, 128, 0.5);
    color: #4ade80;
}

.finalize-btn:hover {
    background-color: rgba(74, 222, 128, 0.2);
    border-color: #4ade80;
}

/* Closed Badge */
.closed-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: rgba(74, 222, 128, 0.15);
    border: 1px solid rgba(74, 222, 128, 0.3);
    border-radius: 6px;
    color: #4ade80;
    font-size: 0.85rem;
}

/* Delete Button */
.delete-btn {
    border-color: rgba(192, 57, 43, 0.5);
    color: var(--color-error);
}

.delete-btn:hover {
    background-color: var(--color-error);
    border-color: var(--color-error);
    color: var(--color-white);
}

/* Desktop styles */
@media (min-width: 769px) {
    .chat-header {
        padding: 12px 20px;
        gap: 15px;
    }

    .header-left {
        gap: 12px;
    }

    .header-right {
        gap: 8px;
    }

    .title-container {
        gap: 10px;
    }

    .chat-title {
        font-size: 1.1rem;
    }

    .title-input {
        font-size: 1rem;
        min-width: 150px;
    }

    .header-action {
        padding: 8px 14px;
    }

    /* Show text on desktop */
    .btn-text {
        display: inline;
        font-size: 0.9rem;
    }
}
</style>
