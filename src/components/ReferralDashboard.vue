<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useI18n } from 'vue-i18n';
import { Copy, Check, Users, Gift, Share2 } from 'lucide-vue-next';

const { t } = useI18n();
const auth = useAuthStore();
const API_URL = import.meta.env.VITE_API_URL;

const referralCode = ref('');
const stats = ref(null);
const loading = ref(true);
const copied = ref(false);

const referralUrl = computed(() => {
  return `https://freetarot.fun/?ref=${referralCode.value}`;
});

const loadReferralData = async () => {
  if (!auth.user?.id) return;

  try {
    // Load code and stats in parallel
    const [codeRes, statsRes] = await Promise.all([
      fetch(`${API_URL}/api/referral/code`, {
        headers: { 'x-user-id': auth.user.id }
      }),
      fetch(`${API_URL}/api/referral/stats`, {
        headers: { 'x-user-id': auth.user.id }
      })
    ]);

    const codeData = await codeRes.json();
    const statsData = await statsRes.json();

    referralCode.value = codeData.code;
    stats.value = statsData;
  } catch (error) {
    console.error('Failed to load referral data:', error);
  } finally {
    loading.value = false;
  }
};

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(referralUrl.value);
    copied.value = true;
    setTimeout(() => copied.value = false, 2000);
  } catch (e) {
    // Fallback for older browsers
    const input = document.createElement('input');
    input.value = referralUrl.value;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    copied.value = true;
    setTimeout(() => copied.value = false, 2000);
  }
};

const shareLink = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: t('referral.shareTitle'),
        text: t('referral.shareText'),
        url: referralUrl.value
      });
    } catch (e) {
      if (e.name !== 'AbortError') {
        copyLink();
      }
    }
  } else {
    copyLink();
  }
};

onMounted(loadReferralData);
</script>

<template>
  <div class="referral-dashboard">
    <div class="referral-header">
      <Gift :size="24" class="icon" />
      <h3>{{ t('referral.title') }}</h3>
    </div>

    <p class="referral-description">{{ t('referral.description') }}</p>

    <div v-if="loading" class="loading">
      {{ t('common.loading') }}
    </div>

    <template v-else>
      <!-- Referral Link -->
      <div class="referral-link-section">
        <label>{{ t('referral.yourLink') }}</label>
        <div class="link-container">
          <input :value="referralUrl" readonly class="link-input" @focus="$event.target.select()" />
          <button @click="copyLink" class="copy-btn" :class="{ copied }" :title="t('share.copy')">
            <Check v-if="copied" :size="18" />
            <Copy v-else :size="18" />
          </button>
          <button @click="shareLink" class="share-btn" :title="t('chat.share')">
            <Share2 :size="18" />
          </button>
        </div>
      </div>

      <!-- Statistics -->
      <div class="stats-grid">
        <div class="stat-card">
          <Users :size="20" />
          <div class="stat-value">{{ stats?.total_referrals || 0 }}</div>
          <div class="stat-label">{{ t('referral.totalReferrals') }}</div>
        </div>
        <div class="stat-card">
          <Gift :size="20" />
          <div class="stat-value">{{ stats?.completed_referrals || 0 }}</div>
          <div class="stat-label">{{ t('referral.completedReferrals') }}</div>
        </div>
      </div>

      <!-- Earned Rewards -->
      <div v-if="stats?.total_rewards && (stats.total_rewards.bonus_readings > 0 || stats.total_rewards.subscription_days > 0)" class="rewards-section">
        <h4>{{ t('referral.rewardsEarned') }}</h4>
        <div class="rewards-list">
          <div v-if="stats.total_rewards.bonus_readings > 0" class="reward-item">
            <span class="reward-value">{{ stats.total_rewards.bonus_readings }}</span>
            <span class="reward-label">{{ t('referral.bonusReadings') }}</span>
          </div>
          <div v-if="stats.total_rewards.subscription_days > 0" class="reward-item">
            <span class="reward-value">{{ stats.total_rewards.subscription_days }}</span>
            <span class="reward-label">{{ t('referral.bonusDays') }}</span>
          </div>
        </div>
      </div>

      <!-- Rules -->
      <div class="rules-section">
        <h4>{{ t('referral.howItWorks') }}</h4>
        <ul>
          <li>{{ t('referral.rule1') }}</li>
          <li>{{ t('referral.rule2') }}</li>
          <li>{{ t('referral.rule3') }}</li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style scoped>
.referral-dashboard {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 24px;
  margin-top: 24px;
}

.referral-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.referral-header .icon {
  color: var(--color-accent);
}

.referral-header h3 {
  margin: 0;
  color: var(--color-accent-text);
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
}

.referral-description {
  color: var(--text-secondary);
  margin-bottom: 20px;
  font-size: 0.9rem;
  line-height: 1.5;
}

.referral-link-section {
  margin-bottom: 24px;
}

.referral-link-section label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.link-container {
  display: flex;
  gap: 8px;
}

.link-input {
  flex: 1;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  padding: 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-family: monospace;
  min-width: 0;
}

.link-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.copy-btn, .share-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  color: var(--text-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.copy-btn:hover, .share-btn:hover {
  background: var(--color-accent);
  color: var(--bg-primary);
  border-color: var(--color-accent);
}

.copy-btn.copied {
  background: var(--color-success, #22c55e);
  border-color: var(--color-success, #22c55e);
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.stat-card svg {
  color: var(--color-accent);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.rewards-section, .rules-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-primary);
}

.rewards-section h4, .rules-section h4 {
  margin: 0 0 12px;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.rewards-list {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.reward-item {
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid var(--color-accent);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.reward-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-accent);
}

.reward-label {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.rules-section ul {
  margin: 0;
  padding-left: 20px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.8;
}

.rules-section li {
  margin-bottom: 4px;
}

.loading {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px;
}

/* Mobile adjustments */
@media (max-width: 480px) {
  .referral-dashboard {
    padding: 20px 16px;
  }

  .link-container {
    flex-direction: column;
  }

  .copy-btn, .share-btn {
    flex-direction: row;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .rewards-list {
    flex-direction: column;
  }
}
</style>
