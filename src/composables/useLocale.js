import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

export function useLocale() {
  const { locale } = useI18n()
  const auth = useAuthStore()

  // Load language preference on mount
  onMounted(async () => {
    // First check localStorage (most recent/reliable source)
    const validLangs = ['es', 'en', 'it', 'pt', 'fr']
    const savedLang = localStorage.getItem('language')
    if (savedLang && validLangs.includes(savedLang)) {
      locale.value = savedLang
      return
    }

    // If user is logged in, fetch their profile language
    if (auth.user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', auth.user.id)
          .maybeSingle()

        if (profile?.language && validLangs.includes(profile.language)) {
          locale.value = profile.language
          localStorage.setItem('language', profile.language)
        }
      } catch (error) {
        console.error('Error loading user language:', error)
      }
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
