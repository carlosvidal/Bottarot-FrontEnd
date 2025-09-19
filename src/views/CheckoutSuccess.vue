<template>
    <div class="legal-container">
        <div class="content success-content">
            <h1>¡Pago Exitoso!</h1>
            <p>Gracias por tu compra. Tu plan de una semana de chats ilimitados ha sido activado.</p>
            <p>Ya puedes disfrutar de lecturas sin límites.</p>
            
            <div class="icon">🎉</div>

            <router-link to="/chat" class="main-cta-button">Ir al Chat</router-link>
        </div>
    </div>
</template>

<style scoped>
.legal-container { font-family: 'Georgia', serif; background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460); color: #f4f4f4; min-height: 100vh; padding: 40px 20px; display: flex; align-items: center; justify-content: center; }
.content { max-width: 600px; margin: 0 auto; background: rgba(22, 33, 62, 0.5); padding: 40px; border-radius: 10px; text-align: center; }
h1 { color: #ffd700; font-size: 2.5rem; margin-bottom: 15px; }
p { font-size: 1.2rem; line-height: 1.7; margin-bottom: 20px; }

.icon {
    font-size: 4rem;
    margin: 20px 0;
}

.main-cta-button {
    background: linear-gradient(45deg, #8b4513, #a0522d);
    color: white;
    text-decoration: none;
    padding: 15px 35px;
    font-size: 1.3rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-block;
    border: none;
}
.main-cta-button:hover { transform: translateY(-2px); }
</style>
