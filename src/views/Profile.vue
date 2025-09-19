<template>
    <div class="legal-container">
        <div class="content">
            <h1>Mi Perfil</h1>
            <p>Aquí podrás ver y editar la información de tu perfil.</p>
            
            <div class="profile-details">
                <p><strong>Nombre:</strong> Usuario de Ejemplo</p>
                <p><strong>Email:</strong> usuario@ejemplo.com</p>
                <p><strong>Plan:</strong> Premium</p>
            </div>

            <router-link to="/chat" class="back-button">Volver al Chat</router-link>
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
p {
    font-size: 1.1rem;
    line-height: 1.7;
    margin-bottom: 15px;
}
.profile-details {
    margin-top: 30px;
    padding: 20px;
    border: 1px solid #0f3460;
    border-radius: 8px;
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
