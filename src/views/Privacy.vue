<template>
    <div class="legal-container">
        <div class="content">
            <h1>Políticas de Privacidad</h1>
            <p>Última actualización: 19 de Septiembre de 2025</p>
            
            <p>Esta política de privacidad establece cómo Oráculo IA utiliza y protege cualquier información que nos proporcionas cuando utilizas este sitio web.</p>

            <h2>Información que Recopilamos</h2>
            <p>Podemos recopilar la siguiente información:</p>
            <ul>
                <li>Información de contacto, incluyendo dirección de correo electrónico (si te registras).</li>
                <li>Preguntas que realizas al oráculo para análisis anónimo y mejora del servicio.</li>
                <li>Información demográfica anónima como preferencias e intereses.</li>
            </ul>

            <h2>Cómo Usamos la Información</h2>
            <p>Requerimos esta información para entender tus necesidades y proporcionarte un mejor servicio, y en particular por las siguientes razones:</p>
            <ul>
                <li>Mantenimiento de registros internos.</li>
                <li>Podemos utilizar la información para mejorar nuestros productos y servicios.</li>
                <li>No compartiremos tu información personal con terceros sin tu consentimiento.</li>
            </ul>

            <p>...</p>

            <router-link to="/" class="back-button">Volver al Inicio</router-link>
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
h2 {
    color: #ffd700;
    font-size: 1.8rem;
    margin-top: 30px;
    margin-bottom: 15px;
}
p, ul {
    font-size: 1.1rem;
    line-height: 1.7;
    margin-bottom: 15px;
}
ul {
    padding-left: 25px;
}
.back-button {
    display: inline-block;
    margin-top: 30px;
    background: linear-gradient(45deg, #8b4513, #a0522d);
    color: white;
    text-decoration: none;
    padding: 12px 25px;
    border-radius: 8px;
    transition: all 0.3s ease;
}
.back-button:hover {
    transform: translateY(-2px);
}
</style>
