<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { supabase } from '../lib/supabase.js'

const auth = useAuthStore();
const router = useRouter();
const userProfile = ref(null)

const logout = () => {
    auth.logout();
    router.push('/');
};

// Get user's display name and avatar
const userName = computed(() => {
    if (userProfile.value?.name) {
        return userProfile.value.name
    }
    if (auth.user?.email) {
        return auth.user.email.split('@')[0]
    }
    return 'Usuario'
})

const userAvatar = computed(() => {
    if (userProfile.value?.name) {
        return userProfile.value.name.charAt(0).toUpperCase()
    }
    if (auth.user?.email) {
        return auth.user.email.charAt(0).toUpperCase()
    }
    return 'U'
})

// Load user profile
const loadUserProfile = async () => {
    if (!auth.user) return

    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', auth.user.id)
            .maybeSingle()

        if (profile) {
            userProfile.value = profile
        }
    } catch (error) {
        console.error('Error loading user profile:', error)
    }
}

onMounted(() => {
    if (auth.isLoggedIn) {
        loadUserProfile()
    }
})

// Placeholder data
const previousChats = [
    { id: 1, title: 'Sobre mi carrera profesional' },
    { id: 2, title: '¿Debería mudarme de ciudad?' },
    { id: 3, title: 'Mi relación con... ' },
];
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
                <ul>
                    <li v-for="chat in previousChats" :key="chat.id">
                        <a href="#" class="history-link">{{ chat.title }}</a>
                    </li>
                </ul>
            </nav>

            <div class="sidebar-actions">
                <router-link to="/checkout" class="action-button upgrade-btn">Upgrade a Premium</router-link>
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
.sidebar-content { flex-grow: 1; padding: 20px; }

/* Profile */
.profile-section { display: flex; align-items: center; gap: 15px; padding-bottom: 20px; border-bottom: 1px solid #0f3460; }
.avatar { width: 40px; height: 40px; border-radius: 50%; background: #0f3460; color: #ffd700; display: flex; align-items: center; justify-content: center; font-weight: bold; }
.username { font-weight: bold; }
.profile-link { font-size: 0.9rem; color: #ffd700; text-decoration: none; }

/* Chat History */
.chat-history { margin-top: 20px; }
.history-title { font-size: 1rem; text-transform: uppercase; color: #aaa; margin-bottom: 10px; }
.chat-history ul { list-style: none; padding: 0; margin: 0; }
.history-link { color: #ccc; text-decoration: none; display: block; padding: 8px 0; border-radius: 4px; transition: background-color 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.history-link:hover { background-color: #0f3460; }

/* Actions */
.sidebar-actions { margin-top: 30px; display: flex; flex-direction: column; gap: 10px; }
.action-button { padding: 12px; border: none; border-radius: 5px; cursor: pointer; text-align: center; text-decoration: none; font-weight: bold; }
.upgrade-btn { background: linear-gradient(45deg, #8b4513, #a0522d); color: white; }
.logout-btn { background-color: #333; color: #ccc; }

/* Footer */
.sidebar-footer { padding: 20px; text-align: center; font-size: 0.9rem; border-top: 1px solid #0f3460; }
.sidebar-footer a { color: #aaa; text-decoration: none; }
.sidebar-footer span { margin: 0 5px; }
</style>
