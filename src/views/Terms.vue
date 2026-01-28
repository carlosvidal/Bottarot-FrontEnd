<template>
    <div class="legal-container">
        <div class="content">
            <h1>Términos y Condiciones</h1>
            <p>Última actualización: 27 de Enero de 2026</p>

            <p>Bienvenido a Free Tarot Fun (freetarot.fun). Al acceder y utilizar nuestro servicio, aceptas cumplir y estar sujeto a los siguientes términos y condiciones de uso, que junto con nuestra política de privacidad gobiernan la relación de Free Tarot Fun contigo en relación a este sitio web.</p>

            <h2>Uso del Servicio</h2>
            <p>El contenido de las páginas de este sitio web es para tu información general y uso exclusivo. Está sujeto a cambios sin previo aviso.</p>
            <p>El uso de cualquier información o material en este sitio web es bajo tu propio riesgo, para lo cual no seremos responsables. Será tu propia responsabilidad asegurar que cualquier producto, servicio o información disponible a través de este sitio web cumpla con tus requisitos específicos.</p>

            <h2>Suscripciones</h2>
            <p>Ofrecemos un plan gratuito y suscripciones de pago. Los detalles de cada plan están descritos en nuestra página de inicio. Nos reservamos el derecho de cambiar los precios y características de nuestros planes en cualquier momento.</p>

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
