<script setup>
import { ref, computed, nextTick } from 'vue';
import { useChatStore } from '../stores/chats';
import { useAuthStore } from '../stores/auth';
import { useRoute, useRouter } from 'vue-router';

defineEmits(['new-chat', 'share-chat']);

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
                <h2 v-if="!isRenaming" class="chat-title">{{ currentChat.title || 'Chat sin título' }}</h2>
                <input 
                    v-else
                    ref="titleInput"
                    v-model="newTitle"
                    class="title-input"
                    @blur="saveRename"
                    @keyup.enter="saveRename"
                    @keyup.esc="isRenaming = false"
                />
                <button @click="startRename" v-if="!isRenaming" class="rename-btn" title="Renombrar chat">✏️</button>
            </div>
        </div>
        <div class="header-right">
            <button @click="$emit('new-chat')" class="header-action">Nuevo</button>
            <button @click="toggleFavorite" class="header-action favorite-btn" :class="{ 'is-favorite': currentChat?.is_favorite }" title="Añadir a favoritos">
                <span v-if="currentChat?.is_favorite">★</span>
                <span v-else>☆</span>
            </button>
            <button @click="$emit('share-chat')" class="header-action">Compartir</button>
            <button @click="deleteCurrentChat" class="header-action delete-btn">Eliminar</button>
        </div>
    </header>
</template>

<style scoped>
.chat-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; background: #1a1a2e; border-bottom: 1px solid #0f3460; flex-shrink: 0; }
.header-left, .header-right { display: flex; align-items: center; gap: 15px; }
.header-left { flex-grow: 1; min-width: 0; }

.title-container { display: flex; align-items: center; gap: 10px; flex-grow: 1; min-width: 0; }
.chat-title { font-size: 1.1rem; color: #fff; font-weight: 500; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.title-input { background: #0f3460; border: 1px solid #1abc9c; color: white; border-radius: 4px; padding: 4px 8px; font-size: 1.1rem; width: 100%; }

.rename-btn { background: none; border: none; color: #777; cursor: pointer; font-size: 1rem; padding: 0 5px; }
.rename-btn:hover { color: #fff; }

.header-action { background: none; border: 1px solid #0f3460; color: #ccc; padding: 8px 15px; border-radius: 5px; cursor: pointer; transition: all 0.3s ease; }
.header-action:hover { background-color: #0f3460; color: #ffd700; }

.favorite-btn.is-favorite { color: #ffd700; border-color: #ffd700; }

.delete-btn { border-color: #c0392b; color: #c0392b; }
.delete-btn:hover { background-color: #c0392b; color: white; }
</style>