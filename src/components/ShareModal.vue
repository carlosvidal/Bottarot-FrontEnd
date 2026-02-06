<script setup>
import { ref } from 'vue';
import { X, Copy, Check, MessageCircle, Send, Loader2 } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  shareUrl: { type: String, default: '' },
  title: { type: String, default: '' },
  isLoading: { type: Boolean, default: false },
  error: { type: String, default: '' }
});

const emit = defineEmits(['close']);
const { t } = useI18n();
const copied = ref(false);

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(props.shareUrl);
    copied.value = true;
    setTimeout(() => copied.value = false, 2000);
  } catch (e) {
    // Fallback for older browsers
    const input = document.createElement('input');
    input.value = props.shareUrl;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    copied.value = true;
    setTimeout(() => copied.value = false, 2000);
  }
};

const shareVia = (platform) => {
  const url = encodeURIComponent(props.shareUrl);
  const text = encodeURIComponent(props.title || t('share.defaultText'));

  const links = {
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`
  };

  window.open(links[platform], '_blank', 'width=600,height=400');
};

const handleOverlayClick = (e) => {
  if (e.target === e.currentTarget) {
    emit('close');
  }
};
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="handleOverlayClick">
      <div class="share-modal" role="dialog" aria-labelledby="share-title">
        <button class="close-btn" @click="emit('close')" :aria-label="t('common.close')">
          <X :size="20" />
        </button>

        <h3 id="share-title">{{ t('share.title') }}</h3>
        <p class="share-subtitle">{{ t('share.subtitle') }}</p>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-container">
          <Loader2 :size="32" class="spinner" />
          <p class="loading-text">{{ t('share.generating') }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-container">
          <p class="error-text">{{ error }}</p>
          <button @click="emit('close')" class="retry-btn">{{ t('common.close') }}</button>
        </div>

        <!-- Ready State -->
        <template v-else>
          <div class="url-container">
            <input
              :value="shareUrl"
              readonly
              class="url-input"
              @focus="$event.target.select()"
            />
            <button @click="copyUrl" class="copy-btn" :class="{ copied }">
              <Check v-if="copied" :size="18" />
              <Copy v-else :size="18" />
              <span class="btn-text">{{ copied ? t('share.copied') : t('share.copy') }}</span>
            </button>
          </div>

          <div class="share-buttons">
            <button @click="shareVia('whatsapp')" class="share-btn whatsapp" :title="t('share.viaWhatsApp')">
              <MessageCircle :size="22" />
              <span>WhatsApp</span>
            </button>
            <button @click="shareVia('telegram')" class="share-btn telegram" :title="t('share.viaTelegram')">
              <Send :size="22" />
              <span>Telegram</span>
            </button>
          </div>

          <p class="share-note">{{ t('share.note') }}</p>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.share-modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  padding: 28px;
  max-width: 420px;
  width: 100%;
  position: relative;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.1);
}

h3 {
  margin: 0 0 8px;
  color: var(--color-accent-text);
  font-family: 'Cinzel', serif;
  font-size: 1.3rem;
}

.share-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0 0 20px;
}

.url-container {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.url-input {
  flex: 1;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-family: monospace;
  min-width: 0;
}

.url-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  background: var(--color-accent);
  color: var(--bg-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.copy-btn:hover {
  background: var(--color-accent-light);
  transform: translateY(-1px);
}

.copy-btn.copied {
  background: var(--color-success, #22c55e);
}

.share-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.share-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  color: white;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.share-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.whatsapp {
  background: #25D366;
}

.whatsapp:hover {
  background: #20bd5a;
}

.telegram {
  background: #0088cc;
}

.telegram:hover {
  background: #0077b5;
}

.share-note {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin: 0;
  opacity: 0.8;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
}

.spinner {
  color: var(--color-accent);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0;
}

/* Error State */
.error-container {
  text-align: center;
  padding: 20px;
}

.error-text {
  color: var(--color-error, #ef4444);
  margin: 0 0 16px;
}

.retry-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: var(--bg-primary);
}

/* Mobile adjustments */
@media (max-width: 480px) {
  .share-modal {
    padding: 24px 20px;
  }

  .url-container {
    flex-direction: column;
  }

  .copy-btn {
    justify-content: center;
  }

  .share-buttons {
    flex-direction: column;
  }

  .btn-text {
    display: inline;
  }
}
</style>
