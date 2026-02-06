<script setup>
import { computed, ref, watch, onUnmounted } from 'vue';
import { marked } from 'marked';
import { useI18n } from 'vue-i18n';
import { useAnalytics } from '../composables/useAnalytics.js';

const { t } = useI18n();
const { trackTarotTTSPlay } = useAnalytics();

// Feature flag: disable TTS (ElevenLabs) temporarily
const TTS_ENABLED = false;

const props = defineProps({
    cards: {
        type: Array,
        default: () => []
    },
    interpretation: {
        type: String,
        default: ''
    },
    sections: {
        type: Object,
        default: null
    },
    isLoading: {
        type: Boolean,
        default: false
    },
    futureHidden: {
        type: Boolean,
        default: false
    },
    ctaMessage: {
        type: String,
        default: null
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    readingId: {
        type: String,
        default: null
    },
    animateEntrance: {
        type: Boolean,
        default: false
    }
});

// Emits for CTA actions
const emit = defineEmits(['unlock-future', 'register']);

const sectionOrder = ['saludo', 'pasado', 'presente', 'futuro', 'sintesis', 'consejo'];

// Staggered entrance animation for sections
const visibleSectionCount = ref(0);
let entranceTimer = null;

watch(() => props.animateEntrance, (shouldAnimate) => {
    if (shouldAnimate && props.sections) {
        visibleSectionCount.value = 0;
        const totalSections = sectionOrder.filter(k => props.sections[k]).length;
        let count = 0;
        entranceTimer = setInterval(() => {
            count++;
            visibleSectionCount.value = count;
            if (count >= totalSections) {
                clearInterval(entranceTimer);
            }
        }, 600);
    } else {
        visibleSectionCount.value = 999; // Show all immediately
    }
}, { immediate: true });

onUnmounted(() => {
    if (entranceTimer) clearInterval(entranceTimer);
});

// Check if a card is the future card (index 2)
const isFutureCard = (index) => index === 2;

// Handle CTA click — emit only, parent handles navigation/modals
const handleCtaClick = () => {
    if (props.isAnonymous) {
        emit('register', props.readingId);
    } else {
        emit('unlock-future', props.readingId);
    }
};

// Debug logging
// Subtle rotations: left/right cards tilt one way, center card tilts opposite
const cardRotations = computed(() => {
    if (!props.cards || props.cards.length === 0) return [];
    const presets = [
        { rotation: -1.8, offsetY: -1 },  // Left card: slight counter-clockwise
        { rotation: 1.2, offsetY: 1 },     // Center card: opposite direction
        { rotation: -0.9, offsetY: -1 },   // Right card: subtle counter-clockwise
    ];
    return props.cards.map((_, index) => presets[index] || { rotation: 0, offsetY: 0 });
});


const formattedInterpretation = computed(() => {
    if (!props.interpretation) return '';
    return marked.parse(props.interpretation);
});

// Section-based rendering (v2)
const hasSections = computed(() => props.sections && Object.keys(props.sections).length > 0);

const sectionLabels = computed(() => ({
    saludo: '',
    pasado: t('reading.sectionLabels.pasado'),
    presente: t('reading.sectionLabels.presente'),
    futuro: t('reading.sectionLabels.futuro'),
    sintesis: t('reading.sectionLabels.sintesis'),
    consejo: t('reading.sectionLabels.consejo')
}));

const visibleSections = computed(() => {
    if (!hasSections.value) return [];
    return sectionOrder
        .filter(key => props.sections[key])
        .map(key => {
            const section = props.sections[key];
            const text = section.text || section;
            const isTeaser = section.isTeaser || false;
            return {
                key,
                text,
                isTeaser,
                html: marked.parse(text)
            };
        });
});

// Text for TTS: only read fully visible sections (exclude teasers)
const ttsText = computed(() => {
    if (hasSections.value) {
        return visibleSections.value
            .filter(s => !s.isTeaser)
            .map(s => s.text)
            .join('. ');
    }
    return props.interpretation;
});

// TTS functionality
const audio = ref(null);
const audioState = ref('idle'); // idle, loading, playing, error

const playAudio = async () => {
    if (!ttsText.value) return;

    if (audioState.value === 'playing') {
        audio.value.pause();
        audio.value.currentTime = 0;
        audioState.value = 'idle';
        return;
    }

    // Track TTS play
    trackTarotTTSPlay();

    audioState.value = 'loading';
    try {
        const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
        const VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text: ttsText.value,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('ElevenLabs error:', errorData);
            throw new Error('Failed to generate speech.');
        }

        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        audio.value = new Audio(audioUrl);

        audio.value.onplaying = () => audioState.value = 'playing';
        audio.value.onended = () => audioState.value = 'idle';
        audio.value.onerror = () => audioState.value = 'error';

        audio.value.play();

    } catch (error) {
        console.error('Error playing TTS audio:', error);
        audioState.value = 'error';
    }
};

</script>

<template>
    <div>
        <div v-if="cards && cards.length > 0" class="cards-container">
            <div v-for="(card, index) in cards" :key="card.name" class="card"
                :class="{ 'is-visible': card.revealed, 'future-hidden': futureHidden && isFutureCard(index) }"
                :style="card.revealed && cardRotations[index] ? { '--card-rotation': cardRotations[index].rotation + 'deg', '--card-offset-y': cardRotations[index].offsetY + 'px' } : {}">
                <div class="card-visual-wrapper">
                    <img :src="card.image || ''" :alt="card.name" class="card-image"
                        :class="{ 'is-inverted': !card.upright }">
                    <!-- Mystical overlay for hidden future -->
                    <div v-if="futureHidden && isFutureCard(index) && card.revealed" class="future-overlay">
                        <div class="future-overlay-content">
                            <div class="mystical-symbol">🔮</div>
                            <p class="overlay-text">{{ ctaMessage || t('cards.futureAwaits') }}</p>
                            <button @click="handleCtaClick" class="unlock-btn">
                                {{ isAnonymous ? t('cards.claimIdentity') : t('cards.unlockFuture') }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="isLoading && !interpretation && !hasSections" class="interpretation-loading">
            {{ t('reading.oracleThinking') }}
        </div>

        <!-- V2: Section bubbles -->
        <template v-if="hasSections">
            <div class="sections-wrapper">
                <div v-if="TTS_ENABLED" class="interpretation-header">
                    <button @click="playAudio" class="tts-button" :disabled="audioState === 'loading'">
                        <span v-if="audioState === 'idle' || audioState === 'error'">🔊 {{ t('reading.listen') }}</span>
                        <span v-if="audioState === 'loading'">⏳ {{ t('reading.loading') }}</span>
                        <span v-if="audioState === 'playing'">⏸️ {{ t('reading.pause') }}</span>
                    </button>
                </div>
                <div
                    v-for="(section, sIdx) in visibleSections"
                    :key="section.key"
                    class="interpretation-bubble"
                    :class="[`bubble-${section.key}`, { 'bubble-teaser': section.isTeaser, 'bubble-entering': animateEntrance && sIdx < visibleSectionCount, 'bubble-hidden': animateEntrance && sIdx >= visibleSectionCount }]"
                >
                    <div v-if="sectionLabels[section.key]" class="bubble-label">
                        {{ sectionLabels[section.key] }}
                    </div>
                    <div class="bubble-content" v-html="section.html"></div>
                    <!-- Teaser overlay for truncated future -->
                    <div v-if="section.isTeaser" class="bubble-teaser-overlay">
                        <div class="bubble-teaser-fade"></div>
                        <div class="bubble-teaser-cta">
                            <p class="bubble-teaser-message">{{ ctaMessage || t('reading.futureTeaser') }}</p>
                            <button @click="handleCtaClick" class="unlock-btn">
                                {{ isAnonymous ? t('cards.claimIdentity') : t('cards.unlockFuture') }}
                            </button>
                        </div>
                    </div>
                </div>
                <!-- Message when sections are hidden -->
                <div v-if="futureHidden" class="hidden-sections-notice">
                    <p>{{ t('reading.hiddenSections') }}</p>
                </div>
            </div>
        </template>

        <!-- V1 fallback: single interpretation block -->
        <div v-else-if="interpretation" class="interpretation-wrapper">
            <div v-if="TTS_ENABLED" class="interpretation-header">
                <button @click="playAudio" class="tts-button" :disabled="audioState === 'loading'">
                    <span v-if="audioState === 'idle' || audioState === 'error'">🔊 {{ t('reading.listen') }}</span>
                    <span v-if="audioState === 'loading'">⏳ {{ t('reading.loading') }}</span>
                    <span v-if="audioState === 'playing'">⏸️ {{ t('reading.pause') }}</span>
                </button>
            </div>
            <div class="interpretation-container" v-html="formattedInterpretation"></div>
        </div>
    </div>
</template>

<style scoped>
/* Mobile-first styles */
.cards-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 20px;
}

.card {
    --card-rotation: 0deg;
    --card-offset-y: 0px;
    opacity: 0;
    transform: translateY(30px) rotate(0deg);
    transition: opacity 0.6s ease, transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
    display: flex;
    flex-direction: column;
    align-items: stretch;
}

.card.is-visible {
    opacity: 1;
    transform: translateY(var(--card-offset-y)) rotate(var(--card-rotation));
}

.card.is-visible:hover {
    transform: translateY(calc(var(--card-offset-y) - 4px)) rotate(0deg);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.card-visual-wrapper {
    position: relative;
    width: 100%;
    padding-top: 170%;
    border-radius: 6px;
    overflow: hidden;
    background-color: var(--color-white);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1);
}
.card-image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.card-image.is-inverted { transform: rotate(180deg); }

.interpretation-loading, .interpretation-error {
    text-align: center;
    font-size: 1.1rem;
    color: var(--color-accent-text);
    margin: 30px auto;
    max-width: 90%;
    padding: 20px;
    background: var(--bg-overlay);
    border-radius: 8px;
}

.interpretation-error { color: var(--color-error); }

.interpretation-wrapper {
    margin: 20px auto 0;
}

.interpretation-header {
    display: flex;
    justify-content: center;
    margin-bottom: 10px;
}

.tts-button {
    background: linear-gradient(135deg, var(--btn-secondary) 0%, var(--btn-secondary-hover) 100%);
    color: var(--color-white);
    border: none;
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
}

.tts-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--accent-glow);
}

.tts-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.interpretation-container {
    max-width: 100%;
    background: linear-gradient(145deg, var(--bg-card), var(--bg-elevated));
    border-radius: 15px;
    padding: 25px;
    font-family: var(--font-content);
    font-size: 1.05rem;
    line-height: 1.8;
    color: var(--text-primary);
}

/* Section Bubbles (v2) */
.sections-wrapper {
    margin: 20px auto 0;
}

.interpretation-bubble {
    margin: 12px 0;
    background: linear-gradient(145deg, var(--bg-card), var(--bg-elevated));
    border-radius: 15px;
    padding: 20px 25px;
    position: relative;
    overflow: hidden;
    animation: fadeInBubble 0.5s ease-out forwards;
}

/* Staggered entrance animation */
.interpretation-bubble.bubble-hidden {
    opacity: 0;
    transform: translateY(20px);
    animation: none;
}

.interpretation-bubble.bubble-entering {
    animation: slideInBubble 0.5s ease-out forwards;
}

@keyframes slideInBubble {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.bubble-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--color-accent-text);
    margin-bottom: 8px;
    font-weight: 600;
}

.bubble-content {
    font-family: var(--font-content);
    font-size: 1.05rem;
    line-height: 1.8;
    color: var(--text-primary);
}

.bubble-content :deep(p) {
    margin: 0;
}

.bubble-teaser {
    min-height: 120px;
}

.bubble-teaser .bubble-content {
    mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
}

.bubble-teaser-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 50px 20px 20px;
    text-align: center;
    background: linear-gradient(transparent, var(--bg-card) 40%);
}

.bubble-teaser-message {
    color: var(--color-accent-text);
    font-size: 0.95rem;
    font-style: italic;
    margin-bottom: 12px;
    line-height: 1.4;
}

.hidden-sections-notice {
    text-align: center;
    padding: 16px;
    color: var(--text-tertiary);
    font-style: italic;
    font-size: 0.9rem;
}

@keyframes fadeInBubble {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Future Hidden Styles */
.card.future-hidden .card-visual-wrapper {
    position: relative;
}

.future-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, var(--overlay-future-start), var(--overlay-future-end));
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    animation: mysticalPulse 3s ease-in-out infinite;
}

@keyframes mysticalPulse {
    0%, 100% { box-shadow: 0 0 20px var(--accent-dim); }
    50% { box-shadow: 0 0 40px var(--accent-glow); }
}

.future-overlay-content {
    text-align: center;
    padding: 20px;
}

.mystical-symbol {
    font-size: 3rem;
    margin-bottom: 15px;
    animation: floatSymbol 2s ease-in-out infinite;
}

@keyframes floatSymbol {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

.overlay-text {
    color: var(--color-accent-text);
    font-size: 1rem;
    font-style: italic;
    margin-bottom: 20px;
    line-height: 1.5;
    text-shadow: 1px 1px 3px var(--shadow-lg);
}

.unlock-btn {
    background: linear-gradient(45deg, var(--btn-primary), var(--btn-primary-hover));
    color: var(--color-white);
    border: 2px solid var(--color-accent);
    padding: 12px 24px;
    font-size: 1rem;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: bold;
    text-shadow: 1px 1px 2px var(--shadow-md);
}

.unlock-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 20px var(--accent-glow);
    background: linear-gradient(45deg, var(--btn-primary-hover), var(--btn-primary-hover));
}

/* Tablet and Desktop styles */
@media (min-width: 768px) {
    .cards-container {
        gap: 24px;
    }

    .card-visual-wrapper {
        border-radius: 12px;
    }
}
</style>
