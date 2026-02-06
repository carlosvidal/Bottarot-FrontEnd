<template>
    <div class="legal-container">
        <div class="content">
            <h1>Políticas de Cookies</h1>
            <p class="update-date">Última actualización: 6 de Febrero de 2026</p>

            <p>Esta página describe qué son las cookies y cómo las utilizamos en Free Tarot Fun (freetarot.fun).</p>

            <h2>¿Qué son las Cookies?</h2>
            <p>Una cookie es un pequeño archivo que pide permiso para ser colocado en el disco duro de tu ordenador. Una vez que aceptas, el archivo se añade y la cookie ayuda a analizar el tráfico web o te permite saber cuándo visitas un sitio en particular.</p>

            <h2>Cómo Usamos las Cookies</h2>
            <p>Utilizamos cookies de registro de tráfico para identificar qué páginas se están utilizando. Esto nos ayuda a analizar datos sobre el tráfico de la página web y mejorar nuestro sitio para adaptarlo a las necesidades del cliente. Solo utilizamos esta información para fines de análisis estadístico.</p>
            <p>En general, las cookies nos ayudan a ofrecerte un mejor sitio web, al permitirnos supervisar qué páginas encuentras útiles y cuáles no. Una cookie de ninguna manera nos da acceso a tu ordenador o a cualquier información sobre ti, aparte de los datos que eliges compartir con nosotros.</p>

            <h2>Cookies que Utilizamos</h2>

            <h3>Cookies Estrictamente Necesarias</h3>
            <p>Estas cookies son esenciales para el funcionamiento del sitio y no pueden ser desactivadas:</p>
            <table class="cookies-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Proveedor</th>
                        <th>Propósito</th>
                        <th>Duración</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>cc_cookie</td>
                        <td>Free Tarot Fun</td>
                        <td>Almacena tus preferencias de cookies</td>
                        <td>6 meses</td>
                    </tr>
                    <tr>
                        <td>sb-*-auth-token</td>
                        <td>Supabase (autenticación)</td>
                        <td>Mantiene tu sesión de usuario iniciada</td>
                        <td>1 semana</td>
                    </tr>
                    <tr>
                        <td>sb-*-auth-token-code-verifier</td>
                        <td>Supabase (autenticación)</td>
                        <td>Seguridad del proceso de autenticación</td>
                        <td>Sesión</td>
                    </tr>
                </tbody>
            </table>

            <h3>Cookies Analíticas (Opcional - Requiere Consentimiento)</h3>
            <p>Estas cookies nos ayudan a entender cómo utilizas el sitio y solo se activan con tu consentimiento:</p>
            <table class="cookies-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Proveedor</th>
                        <th>Propósito</th>
                        <th>Duración</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>_ga</td>
                        <td>Google Analytics</td>
                        <td>Identifica visitantes únicos de forma anónima</td>
                        <td>2 años</td>
                    </tr>
                    <tr>
                        <td>_gid</td>
                        <td>Google Analytics</td>
                        <td>Identifica visitantes únicos de forma anónima</td>
                        <td>24 horas</td>
                    </tr>
                    <tr>
                        <td>_gat_gtag_*</td>
                        <td>Google Analytics</td>
                        <td>Limita la frecuencia de solicitudes</td>
                        <td>1 minuto</td>
                    </tr>
                </tbody>
            </table>

            <h2>Almacenamiento Local (localStorage)</h2>
            <p>Además de cookies, utilizamos el almacenamiento local de tu navegador para mejorar tu experiencia:</p>
            <ul>
                <li><strong>Preferencia de idioma:</strong> Para recordar tu idioma preferido (español o inglés)</li>
                <li><strong>Datos de geolocalización:</strong> Para personalizar las lecturas según tu ubicación (solo si lo autorizas)</li>
            </ul>

            <h2>Gestionar tus Preferencias de Cookies</h2>
            <p>Puedes cambiar tus preferencias de cookies en cualquier momento haciendo clic en el botón a continuación:</p>
            <button @click="showCookieSettings" class="cookie-settings-button">Gestionar Cookies</button>

            <h2>Cómo Desactivar las Cookies</h2>
            <p>Puedes configurar tu navegador para que rechace todas las cookies o para que te avise cuando se envía una cookie. Sin embargo, si lo haces, es posible que algunas partes del sitio no funcionen correctamente.</p>
            <p>Para más información sobre cómo gestionar las cookies en tu navegador:</p>
            <ul>
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">Chrome</a></li>
                <li><a href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-" target="_blank" rel="noopener">Firefox</a></li>
                <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener">Safari</a></li>
                <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener">Edge</a></li>
            </ul>

            <h2>Más Información</h2>
            <p>Si tienes preguntas sobre nuestra política de cookies, consulta también nuestra <router-link to="/privacy">Política de Privacidad</router-link> o <router-link to="/terms">Términos y Condiciones</router-link>.</p>

            <router-link to="/" class="back-button">Volver al Inicio</router-link>
        </div>
    </div>
</template>

<script setup>
import { showCookiePreferences } from '@/utils/cookieConsent.js'

const showCookieSettings = () => {
  showCookiePreferences()
}
</script>

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
p, ul {
    font-size: 1.1rem;
    line-height: 1.7;
    margin-bottom: 15px;
}
ul {
    padding-left: 25px;
}
ul li {
    margin-bottom: 8px;
}
h3 {
    color: var(--color-accent-text);
    font-size: 1.5rem;
    margin-top: 25px;
    margin-bottom: 12px;
}
.cookies-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    background: var(--bg-overlay-light);
    border-radius: 8px;
    overflow: hidden;
}
.cookies-table thead {
    background: var(--bg-overlay-strong);
}
.cookies-table th,
.cookies-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.cookies-table th {
    font-weight: 600;
    color: var(--color-accent-text);
    font-size: 0.95rem;
}
.cookies-table td {
    font-size: 0.95rem;
}
.cookies-table tbody tr:last-child td {
    border-bottom: none;
}
.cookies-table tbody tr:hover {
    background: var(--bg-overlay-medium);
}
.cookie-settings-button {
    display: inline-block;
    margin: 20px 0;
    background: linear-gradient(45deg, var(--btn-primary), var(--btn-primary-hover));
    color: var(--color-white);
    border: none;
    padding: 12px 25px;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}
.cookie-settings-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}
a {
    color: var(--color-accent-text);
    text-decoration: underline;
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
