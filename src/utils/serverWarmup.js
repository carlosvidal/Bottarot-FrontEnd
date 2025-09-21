/**
 * Server warmup utility for Render.com free tier
 * Helps wake up sleeping servers before making API calls
 */

// Configuration
const WARMUP_TIMEOUT = 15000; // 15 seconds timeout
const SLOW_RESPONSE_THRESHOLD = 3000; // 3 seconds threshold for showing message

/**
 * Wake up the server with a ping request
 * @param {Function} showMessage - Callback to show messages to user
 * @returns {Promise<Object>} - Warmup result with timing information
 */
export async function wakeUpServer(showMessage = null) {
  const start = performance.now();
  const API_URL = import.meta.env.VITE_API_URL;

  if (!API_URL) {
    console.warn('⚠️ API URL not configured for warmup');
    return { success: false, latency: 0, error: 'No API URL configured' };
  }

  console.log('🔥 Iniciando warmup del servidor...');

  try {
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WARMUP_TIMEOUT);

    const response = await fetch(`${API_URL}/ping`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const latency = performance.now() - start;

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Show message if response was slow (server was sleeping)
    if (latency > SLOW_RESPONSE_THRESHOLD && showMessage) {
      showMessage('El oráculo ha despertado ✨');
    }

    console.log(`✅ Servidor despierto en ${Math.round(latency)}ms`);

    return {
      success: true,
      latency: Math.round(latency),
      serverTime: data.time,
      message: data.message
    };

  } catch (error) {
    const latency = performance.now() - start;

    if (error.name === 'AbortError') {
      console.error(`⏰ Warmup timeout después de ${WARMUP_TIMEOUT}ms`);
      if (showMessage) {
        showMessage('El servidor está tardando más de lo esperado...');
      }
      return { success: false, latency, error: 'Timeout' };
    } else {
      console.error('❌ Error en warmup:', error.message);
      if (showMessage) {
        showMessage('No se pudo contactar al oráculo 😕');
      }
      return { success: false, latency, error: error.message };
    }
  }
}

/**
 * Smart warmup - only pings if likely the server is asleep
 * Checks if it's been a while since last activity
 * @param {Function} showMessage - Callback to show messages to user
 * @returns {Promise<Object>} - Warmup result
 */
export async function smartWarmup(showMessage = null) {
  const lastActivity = localStorage.getItem('lastServerActivity');
  const now = Date.now();
  const SLEEP_THRESHOLD = 15 * 60 * 1000; // 15 minutes

  // If we haven't contacted the server in 15+ minutes, do warmup
  if (!lastActivity || (now - parseInt(lastActivity)) > SLEEP_THRESHOLD) {
    console.log('🧠 Smart warmup: servidor probablemente dormido, enviando ping...');
    const result = await wakeUpServer(showMessage);

    if (result.success) {
      localStorage.setItem('lastServerActivity', now.toString());
    }

    return result;
  } else {
    console.log('🧠 Smart warmup: servidor probablemente activo, omitiendo ping');
    return { success: true, latency: 0, skipped: true };
  }
}

/**
 * Update server activity timestamp
 * Call this after successful API requests to track server activity
 */
export function updateServerActivity() {
  localStorage.setItem('lastServerActivity', Date.now().toString());
}

/**
 * Get server activity status
 * @returns {Object} - Activity status information
 */
export function getServerStatus() {
  const lastActivity = localStorage.getItem('lastServerActivity');
  const now = Date.now();
  const SLEEP_THRESHOLD = 15 * 60 * 1000; // 15 minutes

  if (!lastActivity) {
    return { status: 'unknown', lastActivity: null, likelySleeping: true };
  }

  const timeSinceActivity = now - parseInt(lastActivity);
  const likelySleeping = timeSinceActivity > SLEEP_THRESHOLD;

  return {
    status: likelySleeping ? 'sleeping' : 'active',
    lastActivity: parseInt(lastActivity),
    timeSinceActivity,
    likelySleeping
  };
}

/**
 * Warmup with exponential backoff retry
 * Useful for critical operations that need the server to be responsive
 * @param {Function} showMessage - Callback to show messages to user
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Object>} - Final warmup result
 */
export async function reliableWarmup(showMessage = null, maxRetries = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 Warmup attempt ${attempt}/${maxRetries}`);

    const result = await wakeUpServer(showMessage);

    if (result.success) {
      if (attempt > 1) {
        console.log(`✅ Warmup exitoso en intento ${attempt}`);
      }
      return result;
    }

    lastError = result.error;

    // Wait before retry with exponential backoff
    if (attempt < maxRetries) {
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`⏳ Esperando ${waitTime}ms antes del siguiente intento...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  console.error(`❌ Warmup falló después de ${maxRetries} intentos`);
  if (showMessage) {
    showMessage('No se pudo despertar al servidor después de varios intentos');
  }

  return { success: false, latency: 0, error: lastError, maxRetriesReached: true };
}