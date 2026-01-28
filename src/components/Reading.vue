<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { marked } from 'marked';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const { t } = useI18n();

const props = defineProps({
    cards: {
        type: Array,
        default: () => []
    },
    interpretation: {
        type: String,
        default: ''
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
    }
});

// Emits for CTA actions
const emit = defineEmits(['unlock-future', 'register']);

// Check if a card is the future card (index 2)
const isFutureCard = (index) => index === 2;

// Handle CTA click
const handleCtaClick = () => {
    if (props.isAnonymous) {
        emit('register');
        router.push('/landing');
    } else {
        emit('unlock-future');
        router.push('/checkout');
    }
};

// Debug logging
watch(() => props.cards, (newCards) => {
    console.log('📋 Reading component received cards:', newCards);
    if (newCards && newCards.length > 0) {
        newCards.forEach((card, index) => {
            console.log(`  Card ${index}:`, card.name, `revealed: ${card.revealed}, isFlipped: ${card.isFlipped}`);
        });
    }
}, { immediate: true, deep: true});

watch(() => props.interpretation, (newInterpretation) => {
    console.log('📝 Reading component received interpretation:', newInterpretation ? 'Yes (' + newInterpretation.length + ' chars)' : 'No');
}, { immediate: true });

const cardBackImg = '/img/sm_RWSa-X-BA.webp';
const cardTitles = computed(() => [t('cards.past'), t('cards.present'), t('cards.future')]);

const formattedInterpretation = computed(() => {
    if (!props.interpretation) return '';
    return marked.parse(props.interpretation);
});

// TTS functionality
const audio = ref(null);
const audioState = ref('idle'); // idle, loading, playing, error

const playAudio = async () => {
    if (!props.interpretation) return;

    if (audioState.value === 'playing') {
        audio.value.pause();
        audio.value.currentTime = 0;
        audioState.value = 'idle';
        return;
    }

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
                text: props.interpretation,
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
                :class="{ 'is-visible': card.revealed, 'future-hidden': futureHidden && isFutureCard(index) }">
                <div class="card-visual-wrapper">
                    <div class="card-inner" :class="{ 'is-flipped': card.isFlipped && !(futureHidden && isFutureCard(index)) }">
                        <div class="card-face card-face--back">
                            <img :src="cardBackImg" alt="Card Back" class="card-image">
                        </div>
                        <div class="card-face card-face--front">
                            <img :src="card.image || ''" :alt="card.name" class="card-image"
                                :class="{ 'is-inverted': !card.upright }">
                        </div>
                    </div>
                    <!-- Mystical overlay for hidden future -->
                    <div v-if="futureHidden && isFutureCard(index) && card.isFlipped" class="future-overlay">
                        <div class="future-overlay-content">
                            <div class="mystical-symbol">🔮</div>
                            <p class="overlay-text">{{ ctaMessage || t('cards.futureAwaits') }}</p>
                            <button @click="handleCtaClick" class="unlock-btn">
                                {{ isAnonymous ? t('cards.claimIdentity') : t('cards.unlockFuture') }}
                            </button>
                        </div>
                    </div>
                </div>
                <div v-if="card.isFlipped && !(futureHidden && isFutureCard(index))" class="card-info">
                    <h4 class="card-position-title">{{ cardTitles[index] }}</h4>
                    <h3 class="card-name">{{ card.name }} <span v-if="!card.upright"
                            class="card-orientation card-orientation_invertida">({{ t('cards.inverted') }})</span></h3>
                    <p class="card-description">{{ card.description }}</p>
                </div>
                <!-- Hidden future card info placeholder -->
                <div v-if="card.isFlipped && futureHidden && isFutureCard(index)" class="card-info card-info--hidden">
                    <h4 class="card-position-title">{{ cardTitles[index] }}</h4>
                    <h3 class="card-name">??? <span class="card-orientation card-orientation_oculta">({{ t('cards.hidden') }})</span></h3>
                    <p class="card-description">{{ t('cards.futureHidden') }}</p>
                </div>
            </div>
        </div>

        <div v-if="isLoading && !interpretation" class="interpretation-loading">
            {{ t('reading.oracleThinking') }}
        </div>

        <div v-if="interpretation" class="interpretation-wrapper">
            <div class="interpretation-header">
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
    display: flex;
    flex-direction: column;
    gap: 20px;
    perspective: 1000px;
    margin-bottom: 20px;
}

.card {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.5s ease, transform 0.5s ease;
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 15px;
    align-items: stretch;
}

.card.is-visible {
    opacity: 1;
    transform: translateY(0);
}

.card-position-title {
    color: var(--color-accent-text);
    text-align: center;
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 10px;
    text-shadow: 1px 1px 3px var(--shadow-sm);
    opacity: 0;
    animation: fadeInTitle 1s ease-out 0.2s forwards;
}

.card-visual-wrapper { position: relative; width: 100%; padding-top: 170%; border-radius: 12px; }
.card-inner { position: absolute; top: 0; left: 0; width: 100%; height: 100%; transition: transform 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55); transform-style: preserve-3d; }
.card-inner.is-flipped { transform: rotateY(180deg); }
.card-face { position: absolute; top: 0; left: 0; width: 100%; height: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; background: var(--bg-elevated); border-radius: 12px; overflow: hidden; background-color: var(--color-white); }
.card-face--front { transform: rotateY(180deg); }
.card-image { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
.card-image.is-inverted { transform: rotate(180deg); }

@keyframes fadeInTitle {
    from { opacity: 0; transform: translateY(-15px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInAfterFlip {
    0%, 60% { opacity: 0; transform: translateY(-15px); }
    100% { opacity: 1; transform: translateY(0); }
}

.card-info {
    background: linear-gradient(145deg, var(--bg-card), var(--bg-elevated));
    border: none;
    border-radius: 12px;
    padding: 15px;
    opacity: 0;
    animation: fadeInAfterFlip 1.3s ease-out forwards;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.card-name { font-size: 1rem; font-weight: 600; color: var(--color-accent-text); margin-bottom: 8px; text-align: center; line-height: 1.3; }
.card-orientation { display: block; margin-top: 4px; }
.card-orientation.card-orientation_invertida { color: var(--color-error); font-size: 0.85rem; font-weight: normal; font-style: italic; }
.card-description { font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary); text-align: center; }

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
    justify-content: flex-end;
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

.card-info--hidden {
    background: linear-gradient(145deg, var(--bg-card), var(--bg-elevated));
    border: 1px dashed var(--accent-dim);
}

.card-orientation.card-orientation_oculta {
    color: var(--text-tertiary);
    font-size: 0.85rem;
    font-weight: normal;
    font-style: italic;
}

/* Tablet and Desktop styles */
@media (min-width: 768px) {
    .cards-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 30px;
        align-items: start;
    }

    .card {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
        gap: 0;
        align-items: stretch;
        height: 100%;
    }

    .card-visual-wrapper {
        border-radius: 15px;
        margin-bottom: 16px;
    }

    .card-inner {
        border-radius: 15px;
    }

    .card-face {
        border-radius: 15px;
    }

    .card-position-title {
        text-align: center;
        font-size: 1.4rem;
        margin-bottom: 15px;
    }

    .card-info {
        border-radius: 15px;
        padding: 20px;
    }

    .card-name {
        font-size: 1.2rem;
        text-align: center;
        margin-bottom: 10px;
    }

    .card-orientation {
        margin-top: 6px;
    }

    .card-orientation.card-orientation_invertida {
        font-size: 1rem;
    }

    .card-orientation.card-orientation_oculta {
        font-size: 1rem;
    }

    .card-description {
        font-size: 0.9rem;
        line-height: 1.6;
        text-align: center;
    }
}
</style>
