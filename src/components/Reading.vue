<script setup>
import { computed, ref, watch } from 'vue';
import { marked } from 'marked';

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
    }
});

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
const cardTitles = ['Pasado', 'Presente', 'Futuro'];

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
                :class="{ 'is-visible': card.revealed }">
                <h4 v-if="card.isFlipped" class="card-position-title">{{ cardTitles[index] }}</h4>
                <div class="card-visual-wrapper">
                    <div class="card-inner" :class="{ 'is-flipped': card.isFlipped }">
                        <div class="card-face card-face--back">
                            <img :src="cardBackImg" alt="Card Back" class="card-image">
                        </div>
                        <div class="card-face card-face--front">
                            <img :src="card.image || ''" :alt="card.name" class="card-image"
                                :class="{ 'is-inverted': !card.upright }">
                        </div>
                    </div>
                </div>
                <div v-if="card.isFlipped" class="card-info">
                    <h3 class="card-name">{{ card.name }} <span v-if="!card.upright"
                            class="card-orientation card-orientation_invertida">(Invertida)</span></h3>
                    <p class="card-description">{{ card.description }}</p>
                </div>
            </div>
        </div>

        <div v-if="isLoading && !interpretation" class="interpretation-loading">
            El oráculo está meditando sobre tu destino...
        </div>

        <div v-if="interpretation" class="interpretation-wrapper">
            <div class="interpretation-header">
                <button @click="playAudio" class="tts-button" :disabled="audioState === 'loading'">
                    <span v-if="audioState === 'idle' || audioState === 'error'">🔊 Escuchar</span>
                    <span v-if="audioState === 'loading'">⏳ Cargando...</span>
                    <span v-if="audioState === 'playing'">⏸️ Pausar</span>
                </button>
            </div>
            <div class="interpretation-container" v-html="formattedInterpretation"></div>
        </div>
    </div>
</template>

<style scoped>
.cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 30px;
    perspective: 1000px;
    margin-bottom: 20px;
}

.card {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.5s ease, transform 0.5s ease;
}

.card.is-visible {
    opacity: 1;
    transform: translateY(0);
}

.card-position-title {
    color: #ffd700;
    text-align: center;
    font-size: 1.4rem;
    font-weight: bold;
    margin-bottom: 15px;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7);
    opacity: 0;
    animation: fadeInTitle 1s ease-out 0.2s forwards;
}

.card-visual-wrapper { position: relative; width: 100%; padding-top: 170%; border-radius: 15px; margin-bottom: 16px; }
.card-inner { position: absolute; top: 0; left: 0; width: 100%; height: 100%; transition: transform 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55); transform-style: preserve-3d; }
.card-inner.is-flipped { transform: rotateY(180deg); }
.card-face { position: absolute; top: 0; left: 0; width: 100%; height: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; background: #1f1f32; border-radius: 15px; border: 2px solid white; overflow: hidden; background-color: white; }
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
    background: linear-gradient(145deg, #2a2a3e, #1f1f32);
    border: none;
    border-radius: 25px;
    padding: 20px;
    opacity: 0;
    animation: fadeInAfterFlip 1.3s ease-out forwards;
}

.card-name { font-size: 1.2rem; font-weight: bold; color: #ffd700; margin-bottom: 10px; text-align: center; line-height: 1.4; }
.card-orientation.card-orientation_invertida { color: #ff6b6b; font-size: 1rem; font-weight: normal; font-style: italic; }
.card-description { font-size: 0.9rem; line-height: 1.6; color: #ddd; text-align: justify; }

.interpretation-loading, .interpretation-error {
    text-align: center;
    font-size: 1.1rem;
    color: #ffd700;
    margin: 30px auto;
    max-width: 90%;
    padding: 20px;
    background: rgba(22, 33, 62, 0.5);
    border-radius: 8px;
}

.interpretation-error { color: #ff6b6b; }

.interpretation-wrapper {
    margin: 20px auto 0;
}

.interpretation-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 10px;
}

.tts-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
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
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.tts-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.interpretation-container {
    max-width: 100%;
    background: linear-gradient(145deg, #2a2a3e, #1f1f32);
    border-radius: 15px;
    padding: 25px;
    font-family: 'Georgia', serif;
    font-size: 1.05rem;
    line-height: 1.8;
    color: #f4f4f4;
}
</style>
