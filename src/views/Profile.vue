<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase.js'

const auth = useAuthStore()
const router = useRouter()
const userProfile = ref(null)
const loading = ref(true)
const editing = ref(false)
const editForm = ref({
  name: '',
  gender: '',
  dateOfBirth: '',
  timezone: '',
  language: ''
})
const saving = ref(false)

// Redirect if not logged in
if (!auth.isLoggedIn) {
    router.push('/')
}

const formattedDate = computed(() => {
    if (!userProfile.value?.date_of_birth) return 'No especificada'

    const date = new Date(userProfile.value.date_of_birth)
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
})

const genderLabel = computed(() => {
    const genderMap = {
        'male': 'Masculino',
        'female': 'Femenino',
        'non-binary': 'No binario',
        'prefer-not-to-say': 'Prefiero no decir',
        'other': 'Otro'
    }
    return genderMap[userProfile.value?.gender] || 'No especificado'
})

const loadUserProfile = async () => {
    if (!auth.user) {
        console.log('Profile: No user available yet, waiting...')
        return
    }

    console.log('Profile: Loading user profile for:', auth.user.id)
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', auth.user.id)
            .maybeSingle()

        if (error) {
            console.error('Error fetching profile:', error)
        }

        if (profile) {
            console.log('Profile: Data loaded successfully:', profile)
            userProfile.value = profile
            // Initialize edit form with current data
            editForm.value = {
                name: profile.name || '',
                gender: profile.gender || '',
                dateOfBirth: profile.date_of_birth || '',
                timezone: profile.timezone || 'America/Mexico_City',
                language: profile.language || 'es'
            }
        } else {
            console.log('Profile: No profile found, user may need to complete registration')
        }
    } catch (error) {
        console.error('Error loading user profile:', error)
    } finally {
        loading.value = false
    }
}

const startEditing = () => {
    editing.value = true
}

const cancelEditing = () => {
    editing.value = false
    // Reset form to original values
    if (userProfile.value) {
        editForm.value = {
            name: userProfile.value.name || '',
            gender: userProfile.value.gender || '',
            dateOfBirth: userProfile.value.date_of_birth || '',
            timezone: userProfile.value.timezone || 'America/Mexico_City',
            language: userProfile.value.language || 'es'
        }
    }
}

const saveProfile = async () => {
    saving.value = true

    const { error } = await auth.updateProfile(editForm.value)

    if (error) {
        console.error('Error updating profile:', error)
        // You could show an error message here
    } else {
        // Reload profile to get updated data
        await loadUserProfile()
        editing.value = false
    }

    saving.value = false
}

// Watch for auth user changes
watch(() => auth.user, (newUser) => {
    if (newUser) {
        console.log('Profile: Auth user available, loading profile...')
        loadUserProfile()
    }
}, { immediate: true })

// Also try on mounted
onMounted(() => {
    console.log('Profile: Component mounted, auth.user:', !!auth.user)
    if (auth.user) {
        loadUserProfile()
    }
})
</script>

<template>
    <div class="legal-container">
        <div class="content">
            <h1>Mi Perfil</h1>
            <p>Información de tu cuenta y preferencias.</p>

            <div v-if="loading" class="loading">
                Cargando perfil...
            </div>

            <!-- View Mode -->
            <div v-else-if="!editing" class="profile-details">
                <div class="profile-field">
                    <strong>Nombre:</strong> {{ userProfile?.name || 'No especificado' }}
                </div>
                <div class="profile-field">
                    <strong>Email:</strong> {{ auth.user?.email || 'No disponible' }}
                </div>
                <div class="profile-field">
                    <strong>Género:</strong> {{ genderLabel }}
                </div>
                <div class="profile-field">
                    <strong>Fecha de nacimiento:</strong> {{ formattedDate }}
                </div>
                <div class="profile-field">
                    <strong>Zona horaria:</strong> {{ userProfile?.timezone || 'No especificada' }}
                </div>
                <div class="profile-field">
                    <strong>Idioma:</strong> {{ userProfile?.language === 'es' ? 'Español' : userProfile?.language === 'en' ? 'English' : 'No especificado' }}
                </div>
                <div class="profile-field">
                    <strong>Miembro desde:</strong> {{ userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('es-ES') : 'No disponible' }}
                </div>
                <div class="profile-field">
                    <strong>Plan:</strong> Gratuito
                </div>
            </div>

            <!-- Edit Mode -->
            <div v-else class="edit-form">
                <h2>Editar Perfil</h2>
                <form @submit.prevent="saveProfile" class="profile-form">
                    <div class="form-group">
                        <label for="edit-name">Nombre</label>
                        <input type="text" id="edit-name" v-model="editForm.name" required>
                    </div>

                    <div class="form-group">
                        <label for="edit-gender">Género</label>
                        <select id="edit-gender" v-model="editForm.gender">
                            <option value="male">Masculino</option>
                            <option value="female">Femenino</option>
                            <option value="non-binary">No binario</option>
                            <option value="prefer-not-to-say">Prefiero no decir</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="edit-dob">Fecha de Nacimiento</label>
                        <input type="date" id="edit-dob" v-model="editForm.dateOfBirth">
                    </div>

                    <div class="form-group">
                        <label for="edit-timezone">Zona Horaria</label>
                        <select id="edit-timezone" v-model="editForm.timezone">
                            <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                            <option value="America/New_York">Nueva York (GMT-5)</option>
                            <option value="America/Los_Angeles">Los Ángeles (GMT-8)</option>
                            <option value="America/Chicago">Chicago (GMT-6)</option>
                            <option value="America/Denver">Denver (GMT-7)</option>
                            <option value="Europe/Madrid">Madrid (GMT+1)</option>
                            <option value="Europe/London">Londres (GMT+0)</option>
                            <option value="America/Bogota">Bogotá (GMT-5)</option>
                            <option value="America/Lima">Lima (GMT-5)</option>
                            <option value="America/Santiago">Santiago (GMT-3)</option>
                            <option value="America/Buenos_Aires">Buenos Aires (GMT-3)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="edit-language">Idioma</label>
                        <select id="edit-language" v-model="editForm.language">
                            <option value="es">Español</option>
                            <option value="en">English</option>
                        </select>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="save-button" :disabled="saving">
                            {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
                        </button>
                        <button type="button" @click="cancelEditing" class="cancel-button" :disabled="saving">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>

            <div class="actions">
                <router-link to="/chat" class="back-button">Volver al Chat</router-link>
                <button v-if="!editing" @click="startEditing" class="edit-button">Editar Perfil</button>
                <router-link to="/checkout" class="upgrade-button">Upgrade a Premium</router-link>
            </div>
        </div>
    </div>
</template>

<style scoped>
.legal-container {
    font-family: 'Georgia', serif;
    background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
    color: #f4f4f4;
    min-height: 100vh;
    padding: 40px 20px;
}
.content {
    max-width: 800px;
    margin: 0 auto;
    background: rgba(22, 33, 62, 0.5);
    padding: 30px;
    border-radius: 10px;
}
h1 {
    color: #ffd700;
    font-size: 2.5rem;
    margin-bottom: 20px;
}
p {
    font-size: 1.1rem;
    line-height: 1.7;
    margin-bottom: 15px;
}
.loading {
    text-align: center;
    color: #ffd700;
    font-size: 1.1rem;
    margin: 40px 0;
}

.profile-details {
    margin-top: 30px;
    padding: 20px;
    border: 1px solid #0f3460;
    border-radius: 8px;
    background: rgba(15, 52, 96, 0.2);
}

.profile-field {
    margin-bottom: 15px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(15, 52, 96, 0.3);
    font-size: 1.1rem;
}

.profile-field:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.profile-field strong {
    color: #ffd700;
    display: inline-block;
    min-width: 180px;
}

.actions {
    margin-top: 30px;
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
}

.back-button {
    background: linear-gradient(45deg, #8b4513, #a0522d);
    color: white;
    text-decoration: none;
    padding: 12px 25px;
    border-radius: 8px;
    transition: all 0.3s ease;
    display: inline-block;
}

.back-button:hover {
    transform: translateY(-2px);
}

.upgrade-button {
    background: linear-gradient(145deg, #ffd700, #ffed4a);
    color: #1a1a2e;
    text-decoration: none;
    padding: 12px 25px;
    border-radius: 8px;
    transition: all 0.3s ease;
    display: inline-block;
    font-weight: 600;
}

.upgrade-button:hover {
    background: linear-gradient(145deg, #ffed4a, #ffd700);
    transform: translateY(-2px);
}

.edit-button {
    background: rgba(255, 215, 0, 0.1);
    color: #ffd700;
    border: 1px solid #ffd700;
    text-decoration: none;
    padding: 12px 25px;
    border-radius: 8px;
    transition: all 0.3s ease;
    cursor: pointer;
    font-size: 1rem;
}

.edit-button:hover {
    background: rgba(255, 215, 0, 0.2);
    transform: translateY(-2px);
}

/* Edit Form */
.edit-form {
    margin-top: 30px;
    padding: 30px;
    border: 1px solid #0f3460;
    border-radius: 8px;
    background: rgba(15, 52, 96, 0.1);
}

.edit-form h2 {
    color: #ffd700;
    font-size: 1.8rem;
    margin-bottom: 25px;
}

.profile-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group label {
    color: #ffd700;
    font-weight: 500;
    font-size: 1rem;
}

.form-group input,
.form-group select {
    padding: 12px 16px;
    border: 1px solid #0f3460;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    color: #f4f4f4;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #ffd700;
    background: rgba(255, 255, 255, 0.08);
}

.form-actions {
    display: flex;
    gap: 15px;
    margin-top: 20px;
    flex-wrap: wrap;
}

.save-button {
    background: linear-gradient(145deg, #ffd700, #ffed4a);
    color: #1a1a2e;
    border: none;
    padding: 12px 25px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.save-button:hover:not(:disabled) {
    background: linear-gradient(145deg, #ffed4a, #ffd700);
    transform: translateY(-2px);
}

.save-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.cancel-button {
    background: rgba(255, 107, 107, 0.1);
    color: #ff6b6b;
    border: 1px solid #ff6b6b;
    padding: 12px 25px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.cancel-button:hover:not(:disabled) {
    background: rgba(255, 107, 107, 0.2);
    transform: translateY(-2px);
}

.cancel-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}
</style>
