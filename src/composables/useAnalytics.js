/**
 * Composable para tracking de eventos de Google Analytics
 * Proporciona funciones consistentes para trackear eventos en toda la aplicación
 */

import { hasAnalyticsConsent } from '@/utils/cookieConsent.js'

export function useAnalytics() {
  // Verificar si gtag está disponible y el usuario ha dado consentimiento
  const isGtagAvailable = () => {
    return typeof window !== 'undefined' && typeof window.gtag === 'function' && hasAnalyticsConsent()
  }

  // Función base para enviar eventos
  const trackEvent = (eventName, eventParams = {}) => {
    if (!isGtagAvailable()) {
      console.warn('Google Analytics no está disponible')
      return
    }

    window.gtag('event', eventName, eventParams)
  }

  // ========== AUTENTICACIÓN ==========

  const trackSignUp = (method = 'email') => {
    trackEvent('sign_up', {
      method // 'email', 'google', 'facebook'
    })
  }

  const trackLogin = (method = 'email') => {
    trackEvent('login', {
      method // 'email', 'google', 'facebook'
    })
  }

  const trackLogout = () => {
    trackEvent('logout')
  }

  // ========== TAROT / CORE BUSINESS ==========

  const trackTarotReadingStart = (questionLength = 0) => {
    trackEvent('tarot_reading_start', {
      question_length: questionLength
    })
  }

  const trackTarotReadingComplete = (cardsDrawn = 3) => {
    trackEvent('tarot_reading_complete', {
      cards_drawn: cardsDrawn
    })
  }

  const trackTarotCardsRevealed = (cardNames = []) => {
    trackEvent('tarot_cards_revealed', {
      cards: cardNames.join(', ')
    })
  }

  const trackTarotTTSPlay = () => {
    trackEvent('tarot_tts_play')
  }

  const trackTarotReadingShare = (chatId = '') => {
    trackEvent('tarot_reading_share', {
      chat_id: chatId
    })
  }

  const trackTarotReadingFavorite = (isFavorite = true) => {
    trackEvent('tarot_reading_favorite', {
      action: isFavorite ? 'add' : 'remove'
    })
  }

  // ========== CONVERSIÓN / MONETIZACIÓN ==========

  const trackViewCheckout = (plan = '') => {
    trackEvent('view_checkout', {
      plan // 'monthly', 'annual'
    })
  }

  const trackBeginCheckout = (plan = '', value = 0) => {
    trackEvent('begin_checkout', {
      plan,
      currency: 'USD',
      value
    })
  }

  const trackPurchase = (plan = '', value = 0, transactionId = '') => {
    trackEvent('purchase', {
      transaction_id: transactionId,
      plan,
      currency: 'USD',
      value,
      items: [{
        item_id: plan,
        item_name: `${plan} subscription`,
        price: value,
        quantity: 1
      }]
    })
  }

  const trackUpgradePromptView = (source = '') => {
    trackEvent('upgrade_prompt_view', {
      source // 'weekly_limit', 'future_card', 'sidebar', etc.
    })
  }

  // ========== LÍMITES DE USO ==========

  const trackWeeklyLimitReached = (chatsUsed = 0) => {
    trackEvent('weekly_limit_reached', {
      chats_used: chatsUsed
    })
  }

  const trackWeeklyLimitModalView = () => {
    trackEvent('weekly_limit_modal_view')
  }

  const trackUpgradeFromLimit = () => {
    trackEvent('upgrade_from_limit')
  }

  // ========== ENGAGEMENT / RETENCIÓN ==========

  const trackFirstReading = () => {
    trackEvent('first_reading')
  }

  const trackProfileComplete = (fieldsCompleted = []) => {
    trackEvent('profile_complete', {
      fields: fieldsCompleted.join(', ')
    })
  }

  const trackLanguageChange = (from = '', to = '') => {
    trackEvent('language_change', {
      from_language: from,
      to_language: to
    })
  }

  const trackGeolocationGranted = () => {
    trackEvent('geolocation_granted')
  }

  const trackGeolocationDenied = () => {
    trackEvent('geolocation_denied')
  }

  // ========== NAVEGACIÓN ==========

  const trackPageView = (pagePath = '', pageTitle = '') => {
    if (!isGtagAvailable()) return

    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle
    })
  }

  // ========== ERRORES ==========

  const trackError = (errorType = '', errorMessage = '') => {
    trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage
    })
  }

  return {
    // Auth
    trackSignUp,
    trackLogin,
    trackLogout,

    // Tarot Core
    trackTarotReadingStart,
    trackTarotReadingComplete,
    trackTarotCardsRevealed,
    trackTarotTTSPlay,
    trackTarotReadingShare,
    trackTarotReadingFavorite,

    // Conversion
    trackViewCheckout,
    trackBeginCheckout,
    trackPurchase,
    trackUpgradePromptView,

    // Limits
    trackWeeklyLimitReached,
    trackWeeklyLimitModalView,
    trackUpgradeFromLimit,

    // Engagement
    trackFirstReading,
    trackProfileComplete,
    trackLanguageChange,
    trackGeolocationGranted,
    trackGeolocationDenied,

    // Navigation
    trackPageView,

    // Errors
    trackError,

    // Base function for custom events
    trackEvent
  }
}
