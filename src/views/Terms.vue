<template>
    <div class="legal-container">
        <div class="content">
            <h1>Términos y Condiciones</h1>
            <p>Última actualización: 19 de Septiembre de 2025</p>
            
            <p>Bienvenido a Oráculo IA. Al acceder y utilizar nuestro servicio, aceptas cumplir y estar sujeto a los siguientes términos y condiciones de uso, que junto con nuestra política de privacidad gobiernan la relación de Oráculo IA contigo en relación a este sitio web.</p>

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
