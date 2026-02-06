<template>
    <div class="legal-container">
        <div class="content">
            <h1>Política de Privacidad</h1>
            <p class="update-date">Última actualización: 6 de Febrero de 2026</p>

            <p>Esta política de privacidad establece cómo Free Tarot Fun (freetarot.fun) recopila, utiliza, protege y comparte tu información cuando utilizas nuestro servicio. Nos comprometemos a proteger tu privacidad y a cumplir con el Reglamento General de Protección de Datos (GDPR) y otras leyes aplicables.</p>

            <h2>1. Información que Recopilamos</h2>

            <h3>Información que nos proporcionas directamente:</h3>
            <ul>
                <li><strong>Datos de registro:</strong> Nombre, dirección de correo electrónico, fecha de nacimiento, género (cuando te registras con email o redes sociales).</li>
                <li><strong>Preguntas al oráculo:</strong> Las preguntas que haces durante las lecturas de tarot.</li>
                <li><strong>Preferencias:</strong> Idioma, zona horaria y otras configuraciones de tu perfil.</li>
            </ul>

            <h3>Información recopilada automáticamente:</h3>
            <ul>
                <li><strong>Datos de uso:</strong> Frecuencia de uso, tipos de lecturas, interacciones con el servicio.</li>
                <li><strong>Información técnica:</strong> Dirección IP, tipo de navegador, dispositivo, sistema operativo.</li>
                <li><strong>Cookies y almacenamiento local:</strong> Ver nuestra <router-link to="/cookies">Política de Cookies</router-link> para más detalles.</li>
            </ul>

            <h3>Información del programa de referidos:</h3>
            <ul>
                <li>Tu código de referido único</li>
                <li>Registro de invitaciones enviadas y completadas</li>
                <li>Recompensas ganadas</li>
            </ul>

            <h3>Usuarios anónimos:</h3>
            <p>Si usas el servicio sin registrarte, almacenamos un identificador de sesión anónimo en tu navegador para limitar el uso según nuestros términos. No podemos identificarte personalmente con este dato.</p>

            <h2>2. Servicios de Terceros que Procesan tus Datos</h2>
            <p>Para proporcionar nuestro servicio, compartimos cierta información con los siguientes proveedores:</p>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>Servicio</th>
                        <th>Datos compartidos</th>
                        <th>Propósito</th>
                        <th>Ubicación</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Supabase</strong></td>
                        <td>Email, perfil, historial de lecturas</td>
                        <td>Autenticación y base de datos</td>
                        <td>UE/EE.UU.</td>
                    </tr>
                    <tr>
                        <td><strong>OpenAI</strong></td>
                        <td>Tus preguntas (sin datos de identificación)</td>
                        <td>Generación de interpretaciones</td>
                        <td>EE.UU.</td>
                    </tr>
                    <tr>
                        <td><strong>ElevenLabs</strong></td>
                        <td>Texto de la interpretación</td>
                        <td>Síntesis de voz (opcional)</td>
                        <td>EE.UU.</td>
                    </tr>
                    <tr>
                        <td><strong>PayPal</strong></td>
                        <td>Email, datos de transacción</td>
                        <td>Procesamiento de pagos</td>
                        <td>Internacional</td>
                    </tr>
                    <tr>
                        <td><strong>Google Analytics</strong></td>
                        <td>Comportamiento anónimo</td>
                        <td>Análisis de uso (con consentimiento)</td>
                        <td>EE.UU.</td>
                    </tr>
                </tbody>
            </table>

            <p>Cada uno de estos proveedores tiene sus propias políticas de privacidad y cumple con estándares de protección de datos.</p>

            <h2>3. Cómo Usamos tu Información</h2>
            <p>Utilizamos tu información para:</p>
            <ul>
                <li><strong>Proporcionar el servicio:</strong> Generar lecturas de tarot personalizadas, mantener tu historial, sincronizar entre dispositivos.</li>
                <li><strong>Procesar pagos:</strong> Gestionar suscripciones, facturación y reembolsos.</li>
                <li><strong>Gestionar el programa de referidos:</strong> Rastrear invitaciones y otorgar recompensas.</li>
                <li><strong>Mejorar el servicio:</strong> Analizar patrones de uso (de forma agregada y anónima) para mejorar la experiencia.</li>
                <li><strong>Comunicaciones:</strong> Enviarte notificaciones importantes sobre tu cuenta. Los emails promocionales solo se envían con tu consentimiento explícito.</li>
                <li><strong>Seguridad:</strong> Detectar y prevenir fraude, abuso o actividades ilegales.</li>
            </ul>

            <h2>4. Retención de Datos</h2>
            <p>Conservamos tu información durante los siguientes períodos:</p>
            <ul>
                <li><strong>Datos de cuenta y perfil:</strong> Mientras tu cuenta esté activa.</li>
                <li><strong>Historial de lecturas:</strong> Mientras tu cuenta esté activa. Puedes solicitar su eliminación en cualquier momento.</li>
                <li><strong>Datos de pago:</strong> Según requisitos legales de facturación (hasta 7 años para registros fiscales).</li>
                <li><strong>Datos de referidos:</strong> Indefinidamente para mantener el historial del programa.</li>
                <li><strong>Tras eliminación de cuenta:</strong> Eliminamos tus datos personales en un máximo de 30 días, excepto cuando la ley requiera retención adicional.</li>
            </ul>

            <h2>5. Seguridad de Datos</h2>
            <p>Implementamos medidas de seguridad para proteger tu información:</p>
            <ul>
                <li><strong>Encriptación en tránsito:</strong> Todas las comunicaciones usan HTTPS/TLS.</li>
                <li><strong>Autenticación segura:</strong> Usamos OAuth 2.0 a través de Supabase. No almacenamos contraseñas directamente.</li>
                <li><strong>Datos de pago:</strong> No almacenamos números de tarjeta. PayPal procesa todos los pagos de forma segura.</li>
                <li><strong>Acceso restringido:</strong> Solo personal autorizado tiene acceso a los sistemas de producción.</li>
            </ul>
            <p>Sin embargo, ningún sistema es 100% seguro. Si descubres una vulnerabilidad, contacta a <a href="mailto:security@freetarot.fun">security@freetarot.fun</a>.</p>

            <h2>6. Transferencias Internacionales</h2>
            <p>Tus datos pueden ser procesados en servidores ubicados fuera de tu país, incluyendo:</p>
            <ul>
                <li><strong>Estados Unidos:</strong> OpenAI, ElevenLabs, parte de la infraestructura de Supabase.</li>
                <li><strong>Unión Europea:</strong> Servidores principales de Supabase.</li>
            </ul>
            <p>Cuando transferimos datos fuera del Espacio Económico Europeo, nos aseguramos de que existan garantías adecuadas, como cláusulas contractuales estándar de la UE o el cumplimiento del marco de protección de datos UE-EE.UU.</p>

            <h2>7. Tus Derechos (GDPR)</h2>
            <p>Como usuario en la Unión Europea (o si el GDPR te aplica), tienes los siguientes derechos:</p>
            <ul>
                <li><strong>Acceso:</strong> Solicitar una copia de todos tus datos personales.</li>
                <li><strong>Rectificación:</strong> Corregir datos incorrectos o incompletos.</li>
                <li><strong>Eliminación:</strong> Solicitar que eliminemos tus datos ("derecho al olvido").</li>
                <li><strong>Portabilidad:</strong> Recibir tus datos en un formato estructurado y legible por máquina.</li>
                <li><strong>Oposición:</strong> Oponerte al procesamiento de tus datos para ciertos fines.</li>
                <li><strong>Limitación:</strong> Restringir cómo procesamos tus datos en ciertas circunstancias.</li>
                <li><strong>Retirar consentimiento:</strong> Si el procesamiento se basa en tu consentimiento, puedes retirarlo en cualquier momento.</li>
            </ul>
            <p><strong>Cómo ejercer tus derechos:</strong></p>
            <ul>
                <li>Algunas opciones están disponibles directamente en tu perfil (editar, eliminar cuenta).</li>
                <li>Para otras solicitudes, contacta a <a href="mailto:privacy@freetarot.fun">privacy@freetarot.fun</a>.</li>
                <li>Responderemos en un máximo de 30 días.</li>
            </ul>
            <p>También tienes derecho a presentar una queja ante tu autoridad de protección de datos local.</p>

            <h2>8. Privacidad de Menores</h2>
            <p><strong>Este servicio está destinado exclusivamente a personas mayores de 18 años.</strong></p>
            <ul>
                <li>No recopilamos conscientemente información de menores de 18 años.</li>
                <li>Si descubrimos que hemos recopilado datos de un menor, los eliminaremos inmediatamente.</li>
                <li>Si eres padre/madre/tutor y crees que tu hijo nos ha proporcionado información, contacta a <a href="mailto:privacy@freetarot.fun">privacy@freetarot.fun</a>.</li>
            </ul>

            <h2>9. Cambios a esta Política</h2>
            <p>Podemos actualizar esta política de privacidad periódicamente. Cuando realicemos cambios significativos:</p>
            <ul>
                <li>Actualizaremos la fecha de "Última actualización" en la parte superior.</li>
                <li>Te notificaremos por email si los cambios son sustanciales.</li>
                <li>Podremos mostrar un aviso en el sitio web.</li>
            </ul>
            <p>Te recomendamos revisar esta política periódicamente.</p>

            <h2>10. Contacto</h2>
            <p>Si tienes preguntas sobre esta política de privacidad o sobre cómo manejamos tus datos:</p>
            <ul>
                <li><strong>Email de privacidad:</strong> <a href="mailto:privacy@freetarot.fun">privacy@freetarot.fun</a></li>
                <li><strong>Soporte general:</strong> <a href="mailto:support@freetarot.fun">support@freetarot.fun</a></li>
            </ul>

            <div class="related-links">
                <p>Consulta también:</p>
                <ul>
                    <li><router-link to="/terms">Términos y Condiciones</router-link></li>
                    <li><router-link to="/cookies">Política de Cookies</router-link></li>
                </ul>
            </div>

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
    margin-bottom: 10px;
}
.update-date {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: 20px;
}
h2 {
    color: var(--color-accent-text);
    font-size: 1.5rem;
    margin-top: 30px;
    margin-bottom: 15px;
    border-bottom: 1px solid var(--border-primary);
    padding-bottom: 8px;
}
h3 {
    color: var(--color-accent-text);
    font-size: 1.2rem;
    margin-top: 20px;
    margin-bottom: 10px;
}
p {
    font-size: 1rem;
    line-height: 1.7;
    margin-bottom: 15px;
}
ul {
    font-size: 1rem;
    line-height: 1.7;
    margin-bottom: 15px;
    padding-left: 25px;
}
ul li {
    margin-bottom: 8px;
}
a {
    color: var(--color-accent-text);
    text-decoration: underline;
}
a:hover {
    color: var(--color-accent);
}
.data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    background: var(--bg-overlay-light);
    border-radius: 8px;
    overflow: hidden;
    font-size: 0.9rem;
}
.data-table thead {
    background: var(--bg-overlay-strong);
}
.data-table th,
.data-table td {
    padding: 12px 10px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.data-table th {
    font-weight: 600;
    color: var(--color-accent-text);
}
.data-table tbody tr:last-child td {
    border-bottom: none;
}
.data-table tbody tr:hover {
    background: var(--bg-overlay-medium);
}
.related-links {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid var(--border-primary);
}
.related-links p {
    font-weight: 600;
    margin-bottom: 10px;
}
.related-links ul {
    list-style: none;
    padding-left: 0;
}
.related-links li {
    margin-bottom: 5px;
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
    color: var(--color-white);
}

@media (max-width: 600px) {
    .content {
        padding: 20px 15px;
    }
    h1 {
        font-size: 1.8rem;
    }
    h2 {
        font-size: 1.3rem;
    }
    .data-table {
        font-size: 0.8rem;
    }
    .data-table th,
    .data-table td {
        padding: 8px 6px;
    }
}
</style>
