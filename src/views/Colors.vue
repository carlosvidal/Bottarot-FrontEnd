<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth';

const colors = ref([]);
const newColorName = ref('');
const newColorHex = ref('#FFFFFF');
const loading = ref(true);
const errorText = ref(null);

const authStore = useAuthStore();

// READ colors from the database
const fetchColors = async () => {
  console.log('Fetching colors...');
  loading.value = true;
  errorText.value = null;
  try {
    // We select from the table. RLS policy should only return the user's own rows.
    const { data, error } = await supabase
      .from('favorite_colors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // If RLS is configured correctly, this error should not happen.
      // If it does, it will tell us why.
      throw error;
    }

    console.log('Fetched data:', data);
    colors.value = data;
  } catch (err) {
    console.error('Error fetching colors:', err);
    errorText.value = `Error fetching colors: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

// CREATE a new color
const addColor = async () => {
  if (!newColorName.value || !authStore.user) return;

  console.log('Adding new color...');
  errorText.value = null;
  try {
    const newColor = {
      user_id: authStore.user.id, // Ensure user_id is set
      name: newColorName.value,
      hex_code: newColorHex.value,
    };

    const { data, error } = await supabase
      .from('favorite_colors')
      .insert(newColor)
      .select(); // .select() returns the inserted row

    if (error) {
      throw error;
    }

    console.log('Added new color:', data[0]);
    // Add the new color to the top of the local array
    colors.value.unshift(data[0]);

    // Reset form
    newColorName.value = '';
    newColorHex.value = '#FFFFFF';
  } catch (err) {
    console.error('Error adding color:', err);
    errorText.value = `Error adding color: ${err.message}`;
  }
};

// DELETE a color
const deleteColor = async (id) => {
  console.log(`Deleting color with id: ${id}`);
  errorText.value = null;
  try {
    const { error } = await supabase
      .from('favorite_colors')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    console.log('Successfully deleted color.');
    // Remove the color from the local array
    colors.value = colors.value.filter(c => c.id !== id);
  } catch (err) {
    console.error('Error deleting color:', err);
    errorText.value = `Error deleting color: ${err.message}`;
  }
};

// Fetch colors when the component is mounted
onMounted(() => {
  // Wait for auth to be initialized before fetching data
  const unwatch = watch(() => authStore.isInitialized, (isInitialized) => {
    if (isInitialized) {
      fetchColors();
      unwatch(); // Stop watching once initialized
    }
  }, { immediate: true });
});
</script>

<template>
  <div class="colors-crud-container">
    <h1>Color Favoritos (Prueba de CRUD)</h1>
    <p>Esta página es una prueba para diagnosticar problemas con la base de datos y RLS.</p>
    
    <div class="form-container">
      <h3>Añadir Nuevo Color</h3>
      <form @submit.prevent="addColor">
        <input type="text" v-model="newColorName" placeholder="Nombre del color" required />
        <input type="color" v-model="newColorHex" />
        <button type="submit">Añadir</button>
      </form>
    </div>

    <div class="actions">
        <button @click="fetchColors">Refrescar Colores</button>
    </div>

    <div v-if="errorText" class="error-box">
      <p>{{ errorText }}</p>
    </div>

    <div v-if="loading" class="loading-box">
      <p>Cargando colores...</p>
    </div>

    <div v-else class="colors-list-container">
      <h2>Mis Colores</h2>
      <div v-if="colors.length === 0" class="empty-state">
        <p>No has añadido ningún color. Intenta añadir uno nuevo.</p>
      </div>
      <ul v-else class="colors-list">
        <li v-for="color in colors" :key="color.id" class="color-item">
          <div class="color-preview" :style="{ backgroundColor: color.hex_code }"></div>
          <div class="color-details">
            <span class="color-name">{{ color.name }}</span>
            <span class="color-hex">{{ color.hex_code }}</span>
            <span class="color-id">ID: {{ color.id }}</span>
          </div>
          <button @click="deleteColor(color.id)" class="delete-button">Eliminar</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.colors-crud-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #2c3e50;
  color: #ecf0f1;
  border-radius: 8px;
}

h1 {
  text-align: center;
  color: #1abc9c;
}

p {
  text-align: center;
  margin-bottom: 2rem;
}

.form-container {
  background-color: #34495e;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.form-container h3 {
  margin-top: 0;
}

form {
  display: flex;
  gap: 1rem;
  align-items: center;
}

input[type="text"] {
  flex-grow: 1;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #95a5a6;
}

input[type="color"] {
  min-width: 50px;
  height: 38px;
  padding: 0.2rem;
  border-radius: 4px;
  border: none;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #1abc9c;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #16a085;
}

.actions {
    text-align: center;
    margin-bottom: 2rem;
}

.error-box {
  background-color: #c0392b;
  color: white;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.loading-box, .empty-state {
  text-align: center;
  padding: 2rem;
  background-color: #34495e;
  border-radius: 8px;
}

.colors-list {
  list-style: none;
  padding: 0;
}

.color-item {
  display: flex;
  align-items: center;
  background-color: #34495e;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 1rem;
  border: 2px solid #ecf0f1;
}

.color-details {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.color-name {
  font-weight: bold;
}

.color-hex, .color-id {
  font-size: 0.8rem;
  color: #bdc3c7;
}

.delete-button {
  background-color: #e74c3c;
}

.delete-button:hover {
  background-color: #c0392b;
}
</style>
