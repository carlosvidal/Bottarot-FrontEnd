<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase.js'
import { useI18n } from 'vue-i18n'
import { useAnalytics } from '../composables/useAnalytics.js'

const auth = useAuthStore()
const router = useRouter()
const { locale, t } = useI18n()
const { trackProfileComplete, trackLanguageChange } = useAnalytics()
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
    if (!userProfile.value?.date_of_birth) return t('profile.notSpecified')

    // Parse date as local date to avoid timezone conversion issues
    const [year, month, day] = userProfile.value.date_of_birth.split('-')
    const date = new Date(year, month - 1, day)
    const localeCode = locale.value === 'es' ? 'es-ES' : 'en-US'
    return date.toLocaleDateString(localeCode, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
})

const genderLabel = computed(() => {
    const genderMap = {
        'male': t('profile.genders.male'),
        'female': t('profile.genders.female'),
        'non-binary': t('profile.genders.nonBinary'),
        'prefer-not-to-say': t('profile.genders.preferNotToSay'),
        'other': t('profile.genders.other')
    }
    return genderMap[userProfile.value?.gender] || t('profile.notSpecified')
})

// Calculate zodiac sign from date of birth
const getZodiacSign = (dateString) => {
    if (!dateString) return null

    const [year, month, day] = dateString.split('-').map(Number)

    // Zodiac date ranges (month, day)
    const zodiacSigns = [
        { sign: 'capricorn', start: [12, 22], end: [1, 19] },
        { sign: 'aquarius', start: [1, 20], end: [2, 18] },
        { sign: 'pisces', start: [2, 19], end: [3, 20] },
        { sign: 'aries', start: [3, 21], end: [4, 19] },
        { sign: 'taurus', start: [4, 20], end: [5, 20] },
        { sign: 'gemini', start: [5, 21], end: [6, 20] },
        { sign: 'cancer', start: [6, 21], end: [7, 22] },
        { sign: 'leo', start: [7, 23], end: [8, 22] },
        { sign: 'virgo', start: [8, 23], end: [9, 22] },
        { sign: 'libra', start: [9, 23], end: [10, 22] },
        { sign: 'scorpio', start: [10, 23], end: [11, 21] },
        { sign: 'sagittarius', start: [11, 22], end: [12, 21] }
    ]

    for (const zodiac of zodiacSigns) {
        const [startMonth, startDay] = zodiac.start
        const [endMonth, endDay] = zodiac.end

        if (startMonth === endMonth) {
            // Same month range
            if (month === startMonth && day >= startDay && day <= endDay) {
                return zodiac.sign
            }
        } else {
            // Cross-month range
            if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
                return zodiac.sign
            }
        }
    }

    return null
}

const zodiacSign = computed(() => {
    const sign = getZodiacSign(userProfile.value?.date_of_birth)
    return sign ? t(`profile.zodiacSigns.${sign}`) : null
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

    // Track language change if language was changed
    const oldLanguage = userProfile.value?.language
    const newLanguage = editForm.value.language
    if (oldLanguage && newLanguage && oldLanguage !== newLanguage) {
        trackLanguageChange(oldLanguage, newLanguage)
    }

    const { error } = await auth.updateProfile(editForm.value)

    if (error) {
        console.error('Error updating profile:', error)
        // You could show an error message here
    } else {
        // Track profile completion with fields that are filled
        const filledFields = []
        if (editForm.value.name) filledFields.push('name')
        if (editForm.value.gender) filledFields.push('gender')
        if (editForm.value.dateOfBirth) filledFields.push('dateOfBirth')
        if (editForm.value.timezone) filledFields.push('timezone')
        if (editForm.value.language) filledFields.push('language')
        if (filledFields.length > 0) {
            trackProfileComplete(filledFields)
        }

        // Update locale immediately
        locale.value = editForm.value.language
        localStorage.setItem('language', editForm.value.language)

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

// Format date function
const formatDate = (dateString) => {
    if (!dateString) return t('profile.notAvailable')
    try {
        const localeCode = locale.value === 'es' ? 'es-ES' : 'en-US'
        return new Date(dateString).toLocaleDateString(localeCode, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    } catch (error) {
        return t('profile.notAvailable')
    }
}

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
            <h1>{{ t('profile.title') }}</h1>
            <p>{{ t('profile.subtitle') }}</p>

            <div v-if="loading" class="loading">
                {{ t('profile.loadingProfile') }}
            </div>

            <!-- View Mode -->
            <div v-else-if="!editing" class="profile-details">
                <div class="profile-field">
                    <strong>{{ t('profile.name') }}:</strong> {{ userProfile?.name || t('profile.notSpecified') }}
                </div>
                <div class="profile-field">
                    <strong>{{ t('profile.email') }}:</strong> {{ auth.user?.email || t('profile.notAvailable') }}
                </div>
                <div class="profile-field">
                    <strong>{{ t('profile.gender') }}:</strong> {{ genderLabel }}
                </div>
                <div class="profile-field">
                    <strong>{{ t('profile.dateOfBirth') }}:</strong> {{ formattedDate }}
                    <span v-if="zodiacSign" class="zodiac-sign">♈ {{ zodiacSign }}</span>
                </div>
                <div class="profile-field">
                    <strong>{{ t('profile.timezone') }}:</strong> {{ userProfile?.timezone || t('profile.notSpecified') }}
                </div>
                <div class="profile-field">
                    <strong>{{ t('profile.language') }}:</strong> {{ t('profile.languages.' + (userProfile?.language || 'es')) }}
                </div>
                <div class="profile-field">
                    <strong>{{ t('profile.memberSince') }}:</strong> {{ userProfile?.created_at ? formatDate(userProfile.created_at) : t('profile.notAvailable') }}
                </div>
                <div class="profile-field">
                    <strong>{{ t('profile.plan') }}:</strong> {{ auth.currentPlan }}
                    <span v-if="auth.isPremiumUser && auth.userSubscription?.subscription_end_date" class="subscription-info">
                        ({{ t('profile.renewal') }}: {{ formatDate(auth.userSubscription.subscription_end_date) }})
                    </span>
                </div>
            </div>

            <!-- Edit Mode -->
            <div v-else class="edit-form">
                <h2>{{ t('profile.editProfile') }}</h2>
                <form @submit.prevent="saveProfile" class="profile-form">
                    <div class="form-group">
                        <label for="edit-name">{{ t('profile.name') }}</label>
                        <input type="text" id="edit-name" v-model="editForm.name" required>
                    </div>

                    <div class="form-group">
                        <label for="edit-gender">{{ t('profile.gender') }}</label>
                        <select id="edit-gender" v-model="editForm.gender">
                            <option value="male">{{ t('profile.genders.male') }}</option>
                            <option value="female">{{ t('profile.genders.female') }}</option>
                            <option value="non-binary">{{ t('profile.genders.nonBinary') }}</option>
                            <option value="prefer-not-to-say">{{ t('profile.genders.preferNotToSay') }}</option>
                            <option value="other">{{ t('profile.genders.other') }}</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="edit-dob">{{ t('profile.dateOfBirth') }}</label>
                        <input type="date" id="edit-dob" v-model="editForm.dateOfBirth">
                    </div>

                    <div class="form-group">
                        <label for="edit-timezone">{{ t('profile.timezone') }}</label>
                        <select id="edit-timezone" v-model="editForm.timezone">
                            <option value="America/Mexico_City">{{ t('profile.timezones.mexicoCity') }}</option>
                            <option value="America/New_York">{{ t('profile.timezones.newYork') }}</option>
                            <option value="America/Los_Angeles">{{ t('profile.timezones.losAngeles') }}</option>
                            <option value="America/Chicago">{{ t('profile.timezones.chicago') }}</option>
                            <option value="America/Denver">{{ t('profile.timezones.denver') }}</option>
                            <option value="Europe/Madrid">{{ t('profile.timezones.madrid') }}</option>
                            <option value="Europe/London">{{ t('profile.timezones.london') }}</option>
                            <option value="America/Bogota">{{ t('profile.timezones.bogota') }}</option>
                            <option value="America/Lima">{{ t('profile.timezones.lima') }}</option>
                            <option value="America/Santiago">{{ t('profile.timezones.santiago') }}</option>
                            <option value="America/Buenos_Aires">{{ t('profile.timezones.buenosAires') }}</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="edit-language">{{ t('profile.language') }}</label>
                        <select id="edit-language" v-model="editForm.language">
                            <option value="es">{{ t('profile.languages.es') }}</option>
                            <option value="en">{{ t('profile.languages.en') }}</option>
                        </select>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="save-button" :disabled="saving">
                            {{ saving ? t('profile.saving') : t('profile.saveChanges') }}
                        </button>
                        <button type="button" @click="cancelEditing" class="cancel-button" :disabled="saving">
                            {{ t('common.cancel') }}
                        </button>
                    </div>
                </form>
            </div>

            <div class="actions">
                <router-link to="/chat" class="back-button">{{ t('profile.backToChat') }}</router-link>
                <button v-if="!editing" @click="startEditing" class="edit-button">{{ t('profile.editProfile') }}</button>
                <router-link v-if="!auth.isPremiumUser" to="/checkout" class="upgrade-button">{{ t('nav.upgradeToPremium') }}</router-link>
                <div v-else class="premium-status">
                    <span class="premium-badge">✨ {{ t('profile.premiumUser') }}</span>
                    <p class="renewal-info">{{ t('profile.renewal') }}: {{ formatDate(auth.userSubscription?.subscription_end_date) }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.legal-container {
    font-family: var(--font-content);
    background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary), var(--bg-tertiary));
    color: var(--text-primary);
    min-height: 100vh;
    padding: 40px 20px;
}
.content {
    max-width: 800px;
    margin: 0 auto;
    background: var(--bg-overlay-strong);
    padding: 30px;
    border-radius: 10px;
}
h1 {
    color: var(--color-accent-text);
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
    color: var(--color-accent-text);
    font-size: 1.1rem;
    margin: 40px 0;
}

.profile-details {
    margin-top: 30px;
    padding: 20px;
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    background: var(--bg-overlay-medium);
}

.profile-field {
    margin-bottom: 15px;
    padding: 10px 0;
    border-bottom: 1px solid var(--border-subtle);
    font-size: 1.1rem;
}

.profile-field:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.profile-field strong {
    color: var(--color-accent-text);
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
    background: linear-gradient(45deg, var(--btn-primary), var(--btn-primary-hover));
    color: var(--color-white);
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
    background: linear-gradient(145deg, var(--color-accent), var(--color-accent-light));
    color: var(--bg-primary);
    text-decoration: none;
    padding: 12px 25px;
    border-radius: 8px;
    transition: all 0.3s ease;
    display: inline-block;
    font-weight: 600;
}

.upgrade-button:hover {
    background: linear-gradient(145deg, var(--color-accent-light), var(--color-accent));
    transform: translateY(-2px);
}

.edit-button {
    background: rgba(255, 215, 0, 0.1);
    color: var(--color-accent-text);
    border: 1px solid var(--color-accent);
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
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    background: var(--bg-overlay-light);
}

.edit-form h2 {
    color: var(--color-accent-text);
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
    color: var(--color-accent-text);
    font-weight: 500;
    font-size: 1rem;
}

.form-group input,
.form-group select {
    padding: 12px 16px;
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
    font-size: 1rem;
    transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: var(--color-accent-text);
    background: rgba(255, 255, 255, 0.08);
}

.form-actions {
    display: flex;
    gap: 15px;
    margin-top: 20px;
    flex-wrap: wrap;
}

.save-button {
    background: linear-gradient(145deg, var(--color-accent), var(--color-accent-light));
    color: var(--bg-primary);
    border: none;
    padding: 12px 25px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.save-button:hover:not(:disabled) {
    background: linear-gradient(145deg, var(--color-accent-light), var(--color-accent));
    transform: translateY(-2px);
}

.save-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.cancel-button {
    background: rgba(255, 107, 107, 0.1);
    color: var(--color-error);
    border: 1px solid var(--color-error);
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

.premium-status {
    text-align: center;
    padding: 15px;
    border-radius: 12px;
    background: linear-gradient(145deg, rgba(255, 215, 0, 0.15), rgba(255, 237, 74, 0.1));
    border: 2px solid var(--color-accent);
}

.premium-badge {
    color: var(--color-accent-text);
    font-size: 1.2rem;
    font-weight: bold;
    display: block;
    margin-bottom: 8px;
}

.renewal-info {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin: 0;
}

.subscription-info {
    color: var(--color-accent-text);
    font-size: 0.85rem;
    font-style: italic;
    margin-left: 8px;
}

.zodiac-sign {
    display: inline-block;
    margin-left: 12px;
    padding: 4px 10px;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 237, 74, 0.1));
    border: 1px solid var(--color-accent);
    border-radius: 6px;
    color: var(--color-accent-text);
    font-size: 0.9rem;
    font-weight: 500;
}
</style>
