<template>
    <div v-if="!route.meta.hideLayout" class="app-layout">
        <header class="app-header">
            <router-link to="/" class="logo-link">
                <img :src="logoDark" alt="Free Tarot Fun" class="logo logo-dark" />
                <img :src="logoLight" alt="Free Tarot Fun" class="logo logo-light" />
            </router-link>
        </header>
        <main class="app-main">
            <router-view />
        </main>
        <footer class="app-footer">
            <div class="footer-links">
                <router-link to="/terms">{{ t('landing.footer.terms') }}</router-link>
                <span>|</span>
                <router-link to="/privacy">{{ t('landing.footer.privacy') }}</router-link>
                <span>|</span>
                <router-link to="/cookies">{{ t('landing.footer.cookies') }}</router-link>
            </div>
            <div class="lang-switcher">
                <button v-for="lang in availableLangs" :key="lang.code"
                    :class="['lang-btn', { active: locale === lang.code }]"
                    @click="changeLocale(lang.code)">{{ lang.label }}</button>
            </div>
        </footer>
    </div>
    <router-view v-else />
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocale } from './composables/useLocale'
import logoDark from './assets/Free-Tarot-Fun-logo-darkmode.svg'
import logoLight from './assets/Free-Tarot-Fun-logo-lightmode.svg'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { changeLocale: setLocale } = useLocale()

const availableLangs = [
    { code: 'es', label: 'ES' },
    { code: 'en', label: 'EN' },
    { code: 'it', label: 'IT' },
    { code: 'pt', label: 'PT' },
    { code: 'fr', label: 'FR' }
]

const changeLocale = (code) => {
    setLocale(code)
    // Update URL if on the landing page
    if (route.name === 'landing') {
        router.replace({ name: 'landing', params: { lang: code } })
    }
}
</script>

<style>
/* CSS Variables */
:root {
    /* Typography */
    --font-content: 'Lora', serif;
    --font-ui: 'Roboto', sans-serif;

    /* Font Sizes */
    --font-size-base: 14px;
    --font-size-sm: 0.875rem;
    /* 12.25px */
    --font-size-md: 1rem;
    /* 14px */
    --font-size-lg: 1.125rem;
    /* 15.75px */
    --font-size-xl: 1.25rem;
    /* 17.5px */
    --font-size-2xl: 1.5rem;
    /* 21px */

    /* Brand Colors (theme-independent) */
    --color-accent: #ffd700;
    --color-accent-light: #ffed4a;
    --color-error: #ff6b6b;
    --color-success: #2ecc71;
    --color-white: #ffffff;
    --color-black: #000000;

    /* Theme-dependent accent for text (high contrast) */
    --color-accent-text: #ffd700;
    /* Will be overridden by themes */
}

/* Dark Theme (default) */
:root {
    /* Backgrounds */
    --bg-primary: #1a1a2e;
    --bg-secondary: #16213e;
    --bg-tertiary: #0f3460;
    --bg-card: #2a2a3e;
    --bg-elevated: #1f1f32;
    --bg-overlay: rgba(22, 33, 62, 0.5);
    --bg-overlay-light: rgba(15, 52, 96, 0.1);
    --bg-overlay-medium: rgba(15, 52, 96, 0.2);
    --bg-overlay-strong: rgba(22, 33, 62, 0.5);
    --bg-input: rgba(15, 52, 96, 0.7);
    --bg-input-focus: rgba(22, 33, 62, 0.9);

    /* Text */
    --text-primary: #f4f4f4;
    --text-secondary: #ccc;
    --text-tertiary: #aaa;

    /* Accent for text with high contrast */
    --color-accent-text: #ffd700;

    /* Borders */
    --border-primary: #0f3460;
    --border-subtle: rgba(255, 255, 255, 0.1);

    /* Shadows */
    --shadow-sm: rgba(0, 0, 0, 0.3);
    --shadow-md: rgba(0, 0, 0, 0.5);
    --shadow-lg: rgba(0, 0, 0, 0.7);

    /* Accent with opacity */
    --accent-dim: rgba(255, 215, 0, 0.3);
    --accent-glow: rgba(255, 215, 0, 0.4);
    --accent-border: rgba(255, 215, 0, 0.5);

    /* Button shadows with color */
    --shadow-btn-secondary: rgba(102, 126, 234, 0.4);
    --shadow-btn-secondary-hover: rgba(102, 126, 234, 0.6);

    /* Error/Warning shadows */
    --shadow-error: rgba(255, 107, 107, 0.4);

    /* Buttons */
    --btn-primary: #8b4513;
    --btn-primary-hover: #a0522d;
    --btn-secondary: #667eea;
    --btn-secondary-hover: #764ba2;

    /* Future overlay (mystical card effect) */
    --overlay-future-start: rgba(15, 52, 96, 0.95);
    --overlay-future-end: rgba(22, 33, 62, 0.95);
}

/* Light Theme */
:root.light-mode {
    /* Backgrounds */
    --bg-primary: #f5f5f5;
    --bg-secondary: #ffffff;
    --bg-tertiary: #e8e8e8;
    --bg-card: #ffffff;
    --bg-elevated: #f9f9f9;
    --bg-overlay: rgba(255, 255, 255, 0.9);
    --bg-overlay-light: rgba(232, 232, 232, 0.3);
    --bg-overlay-medium: rgba(232, 232, 232, 0.5);
    --bg-overlay-strong: rgba(255, 255, 255, 0.9);
    --bg-input: rgba(255, 255, 255, 0.9);
    --bg-input-focus: rgba(255, 255, 255, 1);

    /* Text */
    --text-primary: #2a2a3e;
    --text-secondary: #555555;
    --text-tertiary: #888888;

    /* Accent for text with high contrast - darker gold for readability */
    --color-accent-text: #8b6914;

    /* Borders */
    --border-primary: #d0d0d0;
    --border-subtle: rgba(0, 0, 0, 0.1);

    /* Shadows */
    --shadow-sm: rgba(0, 0, 0, 0.1);
    --shadow-md: rgba(0, 0, 0, 0.15);
    --shadow-lg: rgba(0, 0, 0, 0.2);

    /* Accent with opacity */
    --accent-dim: rgba(255, 215, 0, 0.2);
    --accent-glow: rgba(255, 215, 0, 0.3);
    --accent-border: rgba(255, 215, 0, 0.4);

    /* Button shadows with color */
    --shadow-btn-secondary: rgba(102, 126, 234, 0.3);
    --shadow-btn-secondary-hover: rgba(102, 126, 234, 0.5);

    /* Error/Warning shadows */
    --shadow-error: rgba(255, 107, 107, 0.3);

    /* Buttons - keep same for brand consistency */
    --btn-primary: #8b4513;
    --btn-primary-hover: #a0522d;
    --btn-secondary: #667eea;
    --btn-secondary-hover: #764ba2;

    /* Future overlay (mystical card effect) */
    --overlay-future-start: rgba(232, 232, 232, 0.95);
    --overlay-future-end: rgba(255, 255, 255, 0.95);
}

/* Global styles */
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    font-family: var(--font-content);
    font-size: var(--font-size-base);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
    transition: background-color 0.3s ease, color 0.3s ease;
}

/* Default heading styles */
h1,
h2,
h3,
h4,
h5,
h6 {
    font-family: var(--font-content);
    margin: 0;
}

/* Button and input base styles */
button,
input,
textarea,
select {
    font-family: inherit;
}

/* App Layout */
.app-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary), var(--bg-tertiary));
    color: var(--text-primary);
    font-family: var(--font-content);
}

.app-header {
    padding: 20px;
    text-align: center;
}

.logo-link {
    display: inline-block;
}

.logo {
    max-width: 240px;
    width: 100%;
    height: auto;
}

.logo-dark {
    display: block;
    margin: 0 auto;
}

.logo-light {
    display: none;
}

.light-mode .logo-dark {
    display: none;
}

.light-mode .logo-light {
    display: block;
    margin: 0 auto;
}

.app-main {
    flex-grow: 1;
}

.app-footer {
    padding: 15px;
    border-top: 1px solid var(--border-primary);
    text-align: center;
}

.app-footer .footer-links {
    margin-bottom: 10px;
}

.app-footer .footer-links a {
    color: var(--text-secondary);
    text-decoration: none;
    margin: 0 15px;
    transition: color 0.3s;
}

.app-footer .footer-links a:hover {
    color: var(--color-accent-text);
}

.app-footer .footer-links span {
    color: var(--text-tertiary);
}

.app-footer .lang-switcher {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
}

.app-footer .lang-btn {
    background: none;
    border: 1px solid transparent;
    color: var(--text-tertiary);
    font-size: 0.85rem;
    padding: 4px 10px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    font-family: inherit;
}

.app-footer .lang-btn:hover {
    color: var(--text-primary);
    border-color: var(--border-primary);
}

.app-footer .lang-btn.active {
    color: var(--color-accent-text);
    border-color: var(--color-accent-text);
    font-weight: bold;
}
</style>
