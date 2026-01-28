<template>
    <div class="legal-container">
        <div class="content">
            <h1>Políticas de Cookies</h1>
            <p>Última actualización: 27 de Enero de 2026</p>

            <p>Esta página describe qué son las cookies y cómo las utilizamos en Free Tarot Fun (freetarot.fun).</p>

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
h2 {
    color: var(--color-accent-text);
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
    background: linear-gradient(45deg, var(--btn-primary), var(--btn-primary-hover));
    color: var(--color-white);
    text-decoration: none;
    padding: 12px 25px;
    border-radius: 8px;
    transition: all 0.3s ease;
}
.back-button:hover {
    transform: translateY(-2px);
}
</style>
