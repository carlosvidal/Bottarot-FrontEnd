import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const VALID_LANGS = ['es', 'en', 'it', 'pt', 'fr']

function detectBrowserLanguage() {
  const browserLangs = navigator.languages || [navigator.language]
  for (const lang of browserLangs) {
    const code = lang.split('-')[0].toLowerCase()
    if (VALID_LANGS.includes(code)) {
      return code
    }
  }
  return null
}

export function useLocale() {
  const { locale } = useI18n()
  const auth = useAuthStore()

  // Load language preference on mount
  onMounted(async () => {
    // 1. Check localStorage (most recent/reliable source)
    const savedLang = localStorage.getItem('language')
    if (savedLang && VALID_LANGS.includes(savedLang)) {
      locale.value = savedLang
      return
    }

    // 2. If user is logged in, fetch their profile language
    if (auth.user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', auth.user.id)
          .maybeSingle()

        if (profile?.language && VALID_LANGS.includes(profile.language)) {
          locale.value = profile.language
          localStorage.setItem('language', profile.language)
          return
        }
      } catch (error) {
        console.error('Error loading user language:', error)
      }
    }

    // 3. Detect browser language
    const browserLang = detectBrowserLanguage()
    if (browserLang) {
      locale.value = browserLang
      localStorage.setItem('language', browserLang)
    }
  })

  return {
    locale,
    changeLocale: (newLocale) => {
      locale.value = newLocale
      localStorage.setItem('language', newLocale)
    }
  }
}
