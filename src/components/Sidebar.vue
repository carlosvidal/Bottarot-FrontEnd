<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { supabase } from '../lib/supabase.js'

const auth = useAuthStore();
const router = useRouter();
const userProfile = ref(null);
const chatList = ref([]);
const isLoadingChats = ref(true);

const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
};

const userName = computed(() => userProfile.value?.name || auth.user?.email?.split('@')[0] || 'Usuario');
const userAvatar = computed(() => (userProfile.value?.name || auth.user?.email || 'U').charAt(0).toUpperCase());

const loadUserProfile = async () => {
    if (!auth.user) return;
    try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', auth.user.id).maybeSingle();
        if (profile) userProfile.value = profile;
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
};

const fetchChatList = async () => {
    if (!auth.user) return;
    isLoadingChats.value = true;
    try {
        console.log('sidebar fetching chat list')
        const { data, error } = await supabase.rpc('get_chat_list', { p_user_id: auth.user.id });
        if (error) throw error;
        chatList.value = data;
        console.log('sidebar chat list loaded', data)
    } catch (error) {
        console.error('Error fetching chat list:', error);
    } finally {
        isLoadingChats.value = false;
    }
};

onMounted(() => {
    // Use a watcher to ensure auth is initialized before fetching data
    const unwatch = watch(() => auth.isInitialized, (isInitialized) => {
        if (isInitialized && auth.isLoggedIn) {
            loadUserProfile();
            fetchChatList();
            unwatch(); // Stop watching once we've loaded the data
        }
    }, { immediate: true });
});

// Watch for route changes to potentially refresh the list
watch(() => router.currentRoute.value.name, (newName) => {
    // Refresh chat list if we navigate away from a chat, for example after creating a new one
    if (newName === 'chat') {
        // A small delay might be needed to allow the new chat to be created before fetching
        setTimeout(fetchChatList, 500);
    }
});

</script>

<template>
    <aside class="sidebar">
        <div class="sidebar-content">
            <div class="profile-section">
                <div class="avatar">{{ userAvatar }}</div>
                <div class="profile-info">
                    <span class="username">{{ userName }}</span>
                    <router-link to="/profile" class="profile-link">Ver Perfil</router-link>
                </div>
            </div>

            <nav class="chat-history">
                <h3 class="history-title">Chats Anteriores</h3>
                <div v-if="isLoadingChats">Cargando chats...</div>
                <ul v-else-if="chatList.length > 0">
                    <li v-for="chat in chatList" :key="chat.id">
                        <router-link :to="{ name: 'chat', params: { chatId: chat.id } }" class="history-link">{{ chat.title || 'Chat sin título' }}</router-link>
                    </li>
                </ul>
                <div v-else>No hay chats recientes.</div>
            </nav>

            <div class="sidebar-actions">
                <router-link v-if="!auth.isPremiumUser" to="/checkout" class="action-button upgrade-btn">Upgrade a Premium</router-link>
                <div v-else class="premium-badge-sidebar">✨ Premium Activo</div>
                <button @click="logout" class="action-button logout-btn">Logout</button>
            </div>
        </div>
        <footer class="sidebar-footer">
            <router-link to="/terms">Términos</router-link>
            <span>·</span>
            <router-link to="/privacy">Privacidad</router-link>
        </footer>
    </aside>
</template>

<style scoped>
.sidebar { display: flex; flex-direction: column; height: 100%; background: #16213e; color: #ccc; border-right: 1px solid #0f3460; }
.sidebar-content { flex-grow: 1; padding: 20px; overflow-y: auto; }
.profile-section { display: flex; align-items: center; gap: 15px; padding-bottom: 20px; border-bottom: 1px solid #0f3460; }
.avatar { width: 40px; height: 40px; border-radius: 50%; background: #0f3460; color: #ffd700; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; }
.username { font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.profile-link { font-size: 0.9rem; color: #ffd700; text-decoration: none; }
.chat-history { margin-top: 20px; }
.history-title { font-size: 1rem; text-transform: uppercase; color: #aaa; margin-bottom: 10px; }
.chat-history ul { list-style: none; padding: 0; margin: 0; }
.history-link { color: #ccc; text-decoration: none; display: block; padding: 8px 5px; border-radius: 4px; transition: background-color 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.history-link:hover, .router-link-exact-active { background-color: #0f3460; }
.sidebar-actions { margin-top: 30px; display: flex; flex-direction: column; gap: 10px; padding-top: 20px; border-top: 1px solid #0f3460; }
.action-button { padding: 12px; border: none; border-radius: 5px; cursor: pointer; text-align: center; text-decoration: none; font-weight: bold; }
.upgrade-btn { background: linear-gradient(45deg, #8b4513, #a0522d); color: white; }
.logout-btn { background-color: #333; color: #ccc; }
.sidebar-footer { padding: 20px; text-align: center; font-size: 0.9rem; border-top: 1px solid #0f3460; flex-shrink: 0; }
.sidebar-footer a { color: #aaa; text-decoration: none; }
.sidebar-footer span { margin: 0 5px; }
.premium-badge-sidebar { padding: 12px; border-radius: 5px; background: linear-gradient(145deg, rgba(255, 215, 0, 0.15), rgba(255, 237, 74, 0.1)); border: 1px solid #ffd700; color: #ffd700; text-align: center; font-weight: bold; font-size: 0.9rem; }
</style>