<script setup>
import { ref, computed, nextTick } from 'vue';
import { useChatStore } from '../stores/chats';
import { useAuthStore } from '../stores/auth';
import { useRoute, useRouter } from 'vue-router';
import { Star, Share2, Trash2, Pencil, Check, X } from 'lucide-vue-next';

defineEmits(['share-chat']);

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
        alert('No se pudo renombrar el chat.');
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
    if (window.confirm('¿Estás seguro de que quieres eliminar este chat? Esta acción no se puede deshacer.')) {
        try {
            await chatStore.deleteChat(chatId, auth.user.id);
            router.push({ name: 'new-chat' });
        } catch (error) {
            console.error('Failed to delete chat:', error);
            alert('No se pudo eliminar el chat.');
        }
    }
};

const toggleFavorite = () => {
    if (!currentChat.value || !auth.user) return;
    chatStore.toggleFavorite(currentChat.value.id, auth.user.id).catch(error => {
        alert('No se pudo actualizar el estado de favorito.');
    });
};
</script>

<template>
    <header class="chat-header">
        <div class="header-left">
            <slot name="menu-button"></slot>
            <div v-if="currentChat" class="title-container">
                <template v-if="!isRenaming">
                    <h2 class="chat-title">{{ currentChat.title || 'Chat sin título' }}</h2>
                    <button @click="startRename" class="icon-btn rename-btn" title="Renombrar chat">
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
                    <button @click="saveRename" class="icon-btn save-btn" title="Guardar">
                        <Check :size="16" />
                    </button>
                    <button @click="cancelRename" class="icon-btn cancel-btn" title="Cancelar">
                        <X :size="16" />
                    </button>
                </template>
            </div>
        </div>
        <div class="header-right">
            <button
                @click="toggleFavorite"
                class="header-action favorite-btn"
                :class="{ 'is-favorite': currentChat?.is_favorite }"
                title="Añadir a favoritos"
            >
                <Star :size="18" :fill="currentChat?.is_favorite ? 'currentColor' : 'none'" />
                <span class="btn-text">Favorito</span>
            </button>
            <button @click="$emit('share-chat')" class="header-action" title="Compartir">
                <Share2 :size="18" />
                <span class="btn-text">Compartir</span>
            </button>
            <button @click="deleteCurrentChat" class="header-action delete-btn" title="Eliminar">
                <Trash2 :size="18" />
                <span class="btn-text">Eliminar</span>
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
    background: #1a1a2e;
    border-bottom: 1px solid #0f3460;
    flex-shrink: 0;
    gap: 8px;
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
    color: #fff;
    font-weight: 500;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.title-input {
    background: #0f3460;
    border: 1px solid #ffd700;
    color: white;
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
    color: #777;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
}

.icon-btn:hover {
    color: #fff;
    background: rgba(255,255,255,0.1);
}

.save-btn:hover {
    color: #2ecc71;
}

.cancel-btn:hover {
    color: #e74c3c;
}

/* Action Buttons */
.header-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: none;
    border: 1px solid #0f3460;
    color: #ccc;
    padding: 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.header-action:hover {
    background-color: #0f3460;
    color: #ffd700;
}

/* Hide text on mobile */
.btn-text {
    display: none;
}

/* Favorite Button */
.favorite-btn.is-favorite {
    color: #ffd700;
    border-color: #ffd700;
}

/* Delete Button */
.delete-btn {
    border-color: rgba(192, 57, 43, 0.5);
    color: #c0392b;
}

.delete-btn:hover {
    background-color: #c0392b;
    border-color: #c0392b;
    color: white;
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
