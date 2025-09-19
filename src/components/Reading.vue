<script setup>
import { ref, onMounted, computed } from 'vue';
import { tarotDeck } from '../data/tarotDeck.js';

const props = defineProps({
    readingData: {
        type: Object,
        required: true
    }
});

const selectedCards = ref([]);
const interpretation = ref('');
const isLoadingInterpretation = ref(false);
const interpretationError = ref('');
const isDrawing = ref(false);

const cardBackImg = '/img/sm_RWSa-X-BA.webp';
const cardTitles = ['Pasado', 'Presente', 'Futuro'];

const formattedInterpretation = computed(() => {
    return interpretation.value.replace(/\n/g, '<br>');
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getTarotInterpretation = async () => {
    isLoadingInterpretation.value = true;
    interpretation.value = '';
    interpretationError.value = '';

    const promptData = {
        pregunta: props.readingData.question,
        cartas: selectedCards.value.map((card, index) => ({
            nombre: card.name,
            orientacion: card.upright ? 'Derecha' : 'Invertida',
            posicion: cardTitles[index]
        }))
    };

    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tarot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(promptData),
        });

        if (!response.ok) {
            throw new Error('No se pudo obtener la interpretación del servidor.');
        }

        const data = await response.json();
        interpretation.value = data.interpretation;

    } catch (error) {
        console.error('Error fetching interpretation:', error);
        interpretationError.value = 'Hubo un problema al conectar con el oráculo. Inténtalo de nuevo.';
    } finally {
        isLoadingInterpretation.value = false;
    }
};

const drawCards = async () => {
    isDrawing.value = true;

    const placeholders = Array(3).fill().map((_, i) => ({
        key: `p-${Date.now()}-${i}`,
        revealed: false,
        isFlipped: false,
        image: ''
    }));
    selectedCards.value = placeholders;

    for (let i = 0; i < 3; i++) {
        await delay(200);
        if(selectedCards.value[i]) selectedCards.value[i].revealed = true;
    }

    await delay(500);

    const shuffledDeck = [...tarotDeck].sort(() => Math.random() - 0.5);
    const drawnCardsData = shuffledDeck.slice(0, 3);

    for (let i = 0; i < 3; i++) {
        await delay(400);
        const realCard = {
            ...drawnCardsData[i],
            upright: Math.random() > 0.5,
            revealed: true,
            isFlipped: false,
            key: `card-${Date.now()}-${i}`
        };
        selectedCards.value[i] = realCard;
        await delay(20);
        if(selectedCards.value[i]) selectedCards.value[i].isFlipped = true;
    }

    isDrawing.value = false;

    await delay(1000);

    await getTarotInterpretation();
};

onMounted(() => {
    drawCards();
});

</script>

<template>
    <div class="reading-container">
        <div class="user-message">
            <p>{{ readingData.question }}</p>
        </div>

        <div class="bot-message">
            <div v-if="selectedCards.length > 0" class="cards-container">
                 <div v-for="(card, index) in selectedCards" :key="card.key" class="card"
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

            <div v-if="isLoadingInterpretation" class="interpretation-loading">
                El oráculo está meditando sobre tu destino...
            </div>
            <div v-if="interpretationError" class="interpretation-error">
                {{ interpretationError }}
            </div>
            <div v-if="interpretation" class="interpretation-container" v-html="formattedInterpretation">
            </div>
        </div>
    </div>
</template>

<style scoped>
.reading-container {
    margin-bottom: 30px;
}

.user-message {
    background-color: #2c3e50;
    padding: 15px;
    border-radius: 15px 15px 0 15px;
    max-width: 70%;
    margin-left: auto;
    margin-bottom: 15px;
    color: #ecf0f1;
    font-size: 1.1rem;
}

.bot-message {
    background-color: #1a1a2e;
    padding: 20px;
    border-radius: 15px;
}

.cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 30px;
    perspective: 1000px;
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

.card-visual-wrapper {
    position: relative;
    width: 100%;
    padding-top: 170%;
    border-radius: 15px;
    margin-bottom: 16px;
}

.card-inner {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: transform 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    transform-style: preserve-3d;
    margin-bottom: 16px;
}

.card-inner.is-flipped {
    transform: rotateY(180deg);
}

.card-face {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    background: #1f1f32;
    border-radius: 15px;
    border: 2px solid white;
    overflow: hidden;
    background-color: white;
}

.card-face--front {
    transform: rotateY(180deg);
}

.card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.5s ease;
}

.card-image.is-inverted {
    transform: rotate(180deg);
}

@keyframes fadeInTitle {
    from {
        opacity: 0;
        transform: translateY(-15px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeInAfterFlip {

    0%,
    60% {
        opacity: 0;
        transform: translateY(-15px);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

.card-info {
    background: linear-gradient(145deg, #2a2a3e, #1f1f32);
    border: none;
    border-radius: 25px;
    padding: 20px;
    opacity: 0;
    animation: fadeInAfterFlip 1.3s ease-out forwards;
}

.card-name {
    font-size: 1.2rem;
    font-weight: bold;
    color: #ffd700;
    margin-bottom: 10px;
    text-align: center;
    line-height: 1.4;
}

.card-orientation.card-orientation_invertida {
    color: #ff6b6b;
    font-size: 1rem;
    font-weight: normal;
    font-style: italic;
}

.card-description {
    font-size: 0.9rem;
    line-height: 1.6;
    color: #ddd;
    text-align: justify;
}

.interpretation-loading,
.interpretation-error {
    text-align: center;
    font-size: 1.1rem;
    color: #ffd700;
    margin: 30px auto;
    max-width: 90%;
    padding: 20px;
    background: rgba(22, 33, 62, 0.5);
    border-radius: 8px;
}

.interpretation-error {
    color: #ff6b6b;
}

.interpretation-container {
    margin: 30px auto 0;
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
