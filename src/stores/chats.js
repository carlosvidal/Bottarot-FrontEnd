import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '../lib/supabase';

export const useChatStore = defineStore('chats', () => {
  const chatList = ref([]);
  const isLoading = ref(false);

  const fetchChatList = async (userId) => {
    if (!userId) return;
    isLoading.value = true;
    try {
      const { data, error } = await supabase.rpc('get_chat_list', { p_user_id: userId });
      if (error) throw error;
      chatList.value = data || [];
    } catch (error) {
      console.error('Error fetching chat list:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const deleteChat = async (chatId, userId) => {
    if (!userId) throw new Error('User not authenticated');

    // Optimistically remove from UI
    const index = chatList.value.findIndex(c => c.id === chatId);
    if (index === -1) return; // Not found in list
    const deletedChat = chatList.value.splice(index, 1)[0];

    try {
      const { error } = await supabase.rpc('delete_chat', {
        p_chat_id: chatId,
        p_user_id: userId
      });
      if (error) {
        // If the delete fails, revert the change in the UI
        chatList.value.splice(index, 0, deletedChat);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      // Re-throw to notify the component
      throw error;
    }
  };

  const renameChat = async (chatId, newTitle, userId) => {
    if (!userId) throw new Error('User not authenticated');
    if (!newTitle || !newTitle.trim()) return;

    const index = chatList.value.findIndex(c => c.id === chatId);
    if (index === -1) return;

    const oldTitle = chatList.value[index].title;
    // Optimistically update UI
    chatList.value[index].title = newTitle;

    try {
      const { error } = await supabase.rpc('update_chat_title', {
        p_chat_id: chatId,
        p_user_id: userId,
        p_new_title: newTitle
      });
      if (error) {
        // Revert on error
        chatList.value[index].title = oldTitle;
        throw error;
      }
    } catch (error) {
      console.error('Error renaming chat:', error);
      throw error;
    }
  };

  const toggleFavorite = async (chatId, userId) => {
    if (!userId) throw new Error('User not authenticated');

    const chat = chatList.value.find(c => c.id === chatId);
    if (!chat) return;

    // Optimistically update UI
    const oldStatus = chat.is_favorite;
    chat.is_favorite = !oldStatus;

    // Re-sort the list to show favorites at the top
    chatList.value.sort((a, b) => {
      const favDiff = (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0);
      if (favDiff !== 0) return favDiff;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    try {
      const { error } = await supabase.rpc('toggle_chat_favorite', {
        p_chat_id: chatId,
        p_user_id: userId
      });
      if (error) {
        // Revert on error
        chat.is_favorite = oldStatus;
        throw error;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  };

  return {
    chatList,
    isLoading,
    fetchChatList,
    deleteChat,
    renameChat,
    toggleFavorite,
  };
});
