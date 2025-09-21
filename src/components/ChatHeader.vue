<template>
    <header class="chat-header">
        <div class="header-left">
            <slot name="menu-button"></slot>
        </div>
        <div class="header-right">
            <button @click="$emit('new-chat')" class="header-action">Nuevo</button>
            <button @click="$emit('add-to-favorites')" class="header-action">Añadir a favoritos</button>
            <button @click="$emit('share-chat')" class="header-action">Compartir</button>
        </div>
    </header>
</template>

<script setup>
defineEmits(['new-chat', 'add-to-favorites', 'share-chat']);
</script>

<style scoped>
.chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background: #1a1a2e;
    border-bottom: 1px solid #0f3460;
    flex-shrink: 0;
}

.header-left, .header-right {
    display: flex;
    align-items: center;
    gap: 15px;
}

.header-action {
    background: none;
    border: 1px solid #0f3460;
    color: #ccc;
    padding: 8px 15px;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.header-action:hover {
    background-color: #0f3460;
    color: #ffd700;
}

</style>
