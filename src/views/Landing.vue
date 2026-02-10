<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import { useSeoMeta } from '../composables/useSeoMeta';
const auth = useAuthStore();
useSeoMeta('landing');
const router = useRouter();
const route = useRoute();
const { t, locale } = useI18n();

const validLangs = ['es', 'en', 'it', 'pt', 'fr'];

// Set locale from route param
const setLangFromRoute = (lang) => {
  if (lang && validLangs.includes(lang)) {
    locale.value = lang;
    localStorage.setItem('language', lang);
  }
};

onMounted(() => {
  setLangFromRoute(route.params.lang);
});

// Watch route param changes (clicking lang links doesn't remount)
watch(() => route.params.lang, (newLang) => {
  setLangFromRoute(newLang);
});

// Watch for auth state changes and redirect when user becomes fully registered
watch(
  () => auth.isFullyRegistered,
  (isFullyRegistered) => {
    console.log('👀 Watcher: isFullyRegistered changed to:', isFullyRegistered)
    if (isFullyRegistered) {
      console.log('🚀 Redirecting to chat...')
      router.push('/chat');
    }
  }
);

// State for the new sign-up flow
const showSignupForm = ref(false);
const acceptedTerms = ref(false);

// State for disclaimer
const isDisclaimerExpanded = ref(false);

// Removed startChat - no longer needed

const handleGoogleLogin = async () => {
    console.log('📱 Starting Google login...')
    const { error } = await auth.loginWithGoogle();
    if (error) {
        console.error('❌ Error with Google login:', error);
    } else {
        console.log('✅ Google login successful. Current auth state:', {
            isLoggedIn: auth.isLoggedIn,
            needsRegistration: auth.needsRegistration,
            isFullyRegistered: auth.isFullyRegistered
        })
        // Check if user is fully registered after a short delay to allow auth state to update
        setTimeout(() => {
            console.log('⏰ Timeout check - isFullyRegistered:', auth.isFullyRegistered)
            if (auth.isFullyRegistered) {
                console.log('🚀 Redirecting to chat from timeout...')
                router.push('/chat');
            }
        }, 1000);
    }
};

const handleFacebookLogin = async () => {
    const { error } = await auth.loginWithFacebook();
    if (error) {
        console.error('Error with Facebook login:', error);
    } else {
        // Check if user is fully registered after a short delay to allow auth state to update
        setTimeout(() => {
            if (auth.isFullyRegistered) {
                router.push('/chat');
            }
        }, 1000);
    }
};

const displaySignupForm = () => {
    showSignupForm.value = true;
};

const handleSignup = async (event) => {
    if (!acceptedTerms.value) return;

    // Get form data
    const formData = new FormData(event.target);
    const profileData = {
        name: formData.get('name'),
        gender: formData.get('gender'),
        dateOfBirth: formData.get('dob')
    };

    // Complete registration in Supabase
    const { error } = await auth.completeRegistration(profileData);

    if (error) {
        console.error('Error completing registration:', error);
        // You could show an error message here
    } else {
        showSignupForm.value = false;
        // Redirect to chat after successful registration
        router.push('/chat');
    }
};

</script>

<template>
    <main class="landing-container">

        <div class="main-content">
            <!-- Default Logged-out View -->
            <section v-if="!showSignupForm && !auth.needsRegistration">
                <h1 class="landing-title">{{ t('landing.title') }}</h1>
                <p class="subtitle">{{ t('landing.subtitle') }}</p>

                <!-- Try anonymously first -->
                <div class="try-section">
                    <router-link to="/chat" class="try-button">
                        {{ t('landing.tryFreeReading') }}
                    </router-link>
                    <p class="try-note">{{ t('landing.tryNote') }}</p>
                </div>

                <div class="divider-section">
                    <span class="divider-line"></span>
                    <span class="divider-text">{{ t('landing.or') }}</span>
                    <span class="divider-line"></span>
                </div>

                <div class="social-login">
                    <p class="register-title">{{ t('landing.claimIdentity') }}</p>
                    <p class="register-benefit">{{ t('landing.trialBenefit') }}</p>
                    <div class="social-buttons">
                        <button @click="handleGoogleLogin" class="social-btn google" :disabled="auth.loading">
                            <svg class="social-icon" viewBox="0 0 24 24" width="20" height="20">
                                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            {{ auth.loading ? t('landing.connecting') : t('landing.signInWithGoogle') }}
                        </button>
                        <button @click="handleFacebookLogin" class="social-btn facebook" :disabled="auth.loading">
                            <svg class="social-icon" viewBox="0 0 24 24" width="20" height="20">
                                <path fill="#fff" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            {{ auth.loading ? t('landing.connecting') : t('landing.signInWithFacebook') }}
                        </button>
                    </div>
                </div>

                <div class="offer-section">
                    <h2>{{ t('landing.spiritualPath') }}</h2>
                    <div class="offers">
                        <div class="offer-card free-tier">
                            <div class="offer-icon">🌙</div>
                            <h3>{{ t('landing.offers.seeker') }}</h3>
                            <p class="offer-price">{{ t('landing.offers.seekerPrice') }}</p>
                            <ul class="offer-features">
                                <li>{{ t('landing.offers.seekerFeature1') }}</li>
                                <li>{{ t('landing.offers.seekerFeature2') }}</li>
                                <li>{{ t('landing.offers.seekerFeature3') }}</li>
                            </ul>
                        </div>
                        <router-link to="/checkout" class="offer-card-link">
                            <div class="offer-card premium">
                                <div class="offer-badge">{{ t('landing.offers.specialOffer') }}</div>
                                <div class="offer-icon">🔮</div>
                                <h3>{{ t('landing.offers.initiation') }}</h3>
                                <p class="offer-price"><strong>{{ t('landing.offers.initiationPrice') }}</strong> <span class="price-period">{{ t('landing.offers.initiationPeriod') }}</span></p>
                                <ul class="offer-features">
                                    <li>{{ t('landing.offers.initiationFeature1') }}</li>
                                    <li>{{ t('landing.offers.initiationFeature2') }}</li>
                                    <li>{{ t('landing.offers.initiationFeature3') }}</li>
                                </ul>
                            </div>
                        </router-link>
                        <router-link to="/checkout" class="offer-card-link">
                            <div class="offer-card">
                                <div class="offer-icon">⭐</div>
                                <h3>{{ t('landing.offers.monthly') }}</h3>
                                <p class="offer-price"><strong>{{ t('landing.offers.monthlyPrice') }}</strong> <span class="price-period">{{ t('landing.offers.monthlyPeriod') }}</span></p>
                                <ul class="offer-features">
                                    <li>{{ t('landing.offers.monthlyFeature1') }}</li>
                                    <li>{{ t('landing.offers.monthlyFeature2') }}</li>
                                    <li>{{ t('landing.offers.monthlyFeature3') }}</li>
                                </ul>
                            </div>
                        </router-link>
                    </div>
                </div>

                <!-- Launch Badges -->
                <div class="badges-section">
                    <a href="https://www.producthunt.com/products/free-tarot-fun?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-free-tarot-fun" target="_blank" rel="noopener noreferrer">
                        <img alt="Free Tarot Fun - AI-assisted tarot readings for reflection, not predictions | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1075344&theme=light&t=1770660410773">
                    </a>
                    <a href="https://launchigniter.com/product/free-tarot-fun?ref=badge-free-tarot-fun" target="_blank" rel="noopener noreferrer">
                        <img src="https://launchigniter.com/api/badge/free-tarot-fun?theme=light" alt="Featured on LaunchIgniter" width="212" height="55" />
                    </a>
                </div>
            </section>

            <!-- Sign-up Form View -->
            <div v-if="showSignupForm || auth.needsRegistration" class="signup-form-container">
                <h2 class="signup-title">{{ t('landing.signup.almostDone') }}</h2>
                <p class="subtitle">{{ t('landing.signup.completeProfile') }}</p>
                <form @submit.prevent="handleSignup" class="signup-form">
                    <div class="form-group">
                        <label for="name">{{ t('landing.signup.name') }}</label>
                        <input type="text" id="name" name="name" :placeholder="t('landing.signup.namePlaceholder')" required>
                    </div>
                    <div class="form-group">
                        <label for="gender">{{ t('landing.signup.gender') }}</label>
                        <select id="gender" name="gender" required>
                            <option value="" disabled selected>{{ t('landing.signup.genderPlaceholder') }}</option>
                            <option value="male">{{ t('landing.signup.male') }}</option>
                            <option value="female">{{ t('landing.signup.female') }}</option>
                            <option value="non-binary">{{ t('landing.signup.nonBinary') }}</option>
                            <option value="prefer-not-to-say">{{ t('landing.signup.preferNotToSay') }}</option>
                            <option value="other">{{ t('landing.signup.other') }}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="dob">{{ t('landing.signup.dateOfBirth') }}</label>
                        <input type="date" id="dob" name="dob" required>
                    </div>
                    <div class="form-group terms">
                        <input type="checkbox" id="terms" v-model="acceptedTerms">
                        <label for="terms">{{ t('landing.signup.acceptTerms') }} <router-link to="/terms" target="_blank">{{ t('landing.signup.termsLink') }}</router-link>.</label>
                    </div>
                    <button type="submit" class="main-cta-button" :disabled="!acceptedTerms">{{ t('landing.signup.finishRegistration') }}</button>
                </form>
            </div>

            <div class="disclaimer">
                <p>{{ t('landing.disclaimer.text') }} <button @click="isDisclaimerExpanded = !isDisclaimerExpanded" class="disclaimer-button">{{ isDisclaimerExpanded ? t('landing.disclaimer.showLess') : t('landing.disclaimer.showMore') }}</button></p>
                <div v-if="isDisclaimerExpanded" class="disclaimer-more">
                    <p>{{ t('landing.disclaimer.extended') }}</p>
                </div>
            </div>
        </div>

    </main>
</template>

<style scoped>
.landing-container { display: flex; flex-direction: column; flex-grow: 1; font-family: var(--font-content); color: var(--text-primary); text-align: center; padding: 20px; }
.main-content { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; max-width: 800px; margin: 0 auto; }
.landing-title { font-size: 2.5rem; color: var(--color-accent-text); margin-bottom: 15px; font-weight: 700; }
.subtitle { font-size: 1.3rem; color: var(--text-secondary); font-style: italic; margin-bottom: 40px; line-height: 1.6; }


/* CTA */
.main-cta-button { background: linear-gradient(45deg, var(--btn-primary), var(--btn-primary-hover)); color: var(--color-white); text-decoration: none; padding: 18px 40px; font-size: 1.4rem; border-radius: 10px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4); display: inline-block; border: none; }
.main-cta-button:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5); }
.main-cta-button:disabled { opacity: 0.5; cursor: not-allowed; }

/* Try Section */
.try-section {
    margin-bottom: 30px;
    text-align: center;
}

.try-button {
    display: inline-block;
    background: linear-gradient(45deg, var(--btn-secondary), var(--btn-secondary-hover));
    color: var(--color-white);
    text-decoration: none;
    padding: 18px 40px;
    font-size: 1.3rem;
    border-radius: 30px;
    transition: all 0.3s ease;
    box-shadow: 0 5px 25px var(--shadow-btn-secondary);
    font-weight: bold;
}

.try-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 30px var(--shadow-btn-secondary-hover);
}

.try-note {
    margin-top: 12px;
    font-size: 0.9rem;
    color: var(--text-tertiary);
    font-style: italic;
}

/* Divider */
.divider-section {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 25px 0;
    gap: 15px;
}

.divider-line {
    width: 80px;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--accent-dim), transparent);
}

.divider-text {
    color: var(--text-tertiary);
    font-size: 0.9rem;
}

/* Social Login */
.social-login { margin-bottom: 40px; }
.register-title {
    font-size: 1.3rem;
    color: var(--color-accent-text);
    margin-bottom: 8px;
    font-weight: bold;
}
.register-benefit {
    font-size: 1rem;
    color: var(--text-secondary);
    margin-bottom: 20px;
    font-style: italic;
}
.social-buttons { display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; }
.social-btn { border: none; padding: 12px 28px; border-radius: 8px; font-size: 1rem; cursor: pointer; transition: all 0.3s; color: var(--color-white); font-weight: 500; display: inline-flex; align-items: center; gap: 10px; }
.social-icon { flex-shrink: 0; }
.social-btn.google { background-color: #DB4437; }
.social-btn.facebook { background-color: #4267B2; }
.social-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-2px); }
.social-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Offers */
.offer-section { margin-bottom: 40px; }
.offer-section h2 { font-size: 2rem; color: var(--color-accent-text); margin-bottom: 25px; }
.offers { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
.offer-card {
    background: var(--bg-overlay);
    padding: 25px 20px;
    border-radius: 15px;
    border: 2px solid var(--border-primary);
    width: 220px;
    text-align: center;
    position: relative;
    transition: all 0.3s ease;
}
.offer-card:hover {
    transform: translateY(-5px);
    border-color: var(--accent-border);
}
.offer-card.free-tier {
    border-color: var(--text-tertiary);
}
.offer-card.premium {
    border-color: var(--color-error);
    box-shadow: 0 0 25px var(--shadow-error);
}
.offer-badge {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, var(--color-error), var(--color-error));
    color: var(--color-white);
    padding: 5px 15px;
    border-radius: 15px;
    font-size: 0.7rem;
    font-weight: bold;
    white-space: nowrap;
}
.offer-icon {
    font-size: 2.5rem;
    margin-bottom: 10px;
}
.offer-card h3 { font-size: 1.3rem; margin-bottom: 8px; color: var(--text-primary); }
.offer-price {
    font-size: 1.8rem;
    color: var(--color-accent-text);
    margin-bottom: 15px;
}
.offer-price strong { font-size: 2rem; }
.price-period {
    font-size: 0.9rem;
    color: var(--text-secondary);
}
.offer-features {
    list-style: none;
    padding: 0;
    margin: 0;
    text-align: left;
}
.offer-features li {
    padding: 5px 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.offer-features li:last-child {
    border-bottom: none;
}
.offer-card-link { text-decoration: none; color: inherit; }


/* Launch Badges */
.badges-section {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
    margin: 40px 0;
}
.badges-section a {
    transition: transform 0.3s ease, opacity 0.3s ease;
    opacity: 0.85;
}
.badges-section a:hover {
    transform: translateY(-2px);
    opacity: 1;
}

/* Sign-up Form */
.signup-form-container { max-width: 500px; margin: 0 auto; }
.signup-title { font-size: 2.5rem; color: var(--color-accent-text); margin-bottom: 10px; }
.signup-form { display: flex; flex-direction: column; gap: 20px; text-align: left; }
.form-group { display: flex; flex-direction: column; }
.form-group label { margin-bottom: 8px; font-size: 1rem; color: var(--text-secondary); }
.form-group input[type="text"], .form-group input[type="date"], .form-group select { width: 100%; padding: 12px; font-size: 1rem; background-color: var(--bg-input); border: 1px solid var(--border-primary); border-radius: 5px; color: var(--text-primary); }
.form-group.terms { flex-direction: row; align-items: center; gap: 10px; justify-content: center; }
.form-group.terms label { margin-bottom: 0; }
.form-group.terms a { color: var(--color-accent-text); text-decoration: none; }
.form-group.terms a:hover { text-decoration: underline; }

/* Disclaimer & Footer */
.disclaimer { font-size: 0.9rem; color: var(--text-secondary); max-width: 600px; margin: 40px auto; font-style: italic; line-height: 1.6; }
.disclaimer-button { background: none; border: none; color: var(--color-accent-text); cursor: pointer; font-style: italic; text-decoration: underline; padding: 0 5px; font-size: 0.9rem; }
.disclaimer-more { margin-top: 15px; text-align: justify; }


</style>