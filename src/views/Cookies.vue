<template>
    <div class="legal-container">
        <div class="content">
            <h1>Políticas de Cookies</h1>
            <p>Última actualización: 19 de Septiembre de 2025</p>
            
            <p>Esta página describe qué son las cookies y cómo las utilizamos en Oráculo IA.</p>

            <h2>¿Qué son las Cookies?</h2>
            <p>Una cookie es un pequeño archivo que pide permiso para ser colocado en el disco duro de tu ordenador. Una vez que aceptas, el archivo se añade y la cookie ayuda a analizar el tráfico web o te permite saber cuándo visitas un sitio en particular.</p>

            <h2>Cómo Usamos las Cookies</h2>
            <p>Utilizamos cookies de registro de tráfico para identificar qué páginas se están utilizando. Esto nos ayuda a analizar datos sobre el tráfico de la página web y mejorar nuestro sitio para adaptarlo a las necesidades del cliente. Solo utilizamos esta información para fines de análisis estadístico y luego los datos se eliminan del sistema.</p>
            <p>En general, las cookies nos ayudan a ofrecerte un mejor sitio web, al permitirnos supervisar qué páginas encuentras útiles y cuáles no. Una cookie de ninguna manera nos da acceso a tu ordenador o a cualquier información sobre ti, aparte de los datos que eliges compartir con nosotros.</p>

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
p {
    font-size: 1.1rem;
    line-height: 1.7;
    margin-bottom: 15px;
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
