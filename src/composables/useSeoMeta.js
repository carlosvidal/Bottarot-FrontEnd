import { useHead } from '@unhead/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const SITE_URL = 'https://freetarot.fun'
const SUPPORTED_LANGS = ['en', 'es', 'it', 'pt', 'fr']

/**
 * Sets SEO meta tags dynamically based on route and locale.
 * @param {string} page - The seo translation key (e.g. 'landing', 'chat', 'checkout')
 */
export function useSeoMeta(page) {
  const { t, locale } = useI18n()
  const route = useRoute()

  const title = computed(() => t(`seo.${page}.title`))
  const description = computed(() => t(`seo.${page}.description`))
  const currentLang = computed(() => locale.value)
  const canonicalUrl = computed(() => {
    const path = route.path === '/' ? '' : route.path
    return `${SITE_URL}${path}`
  })

  const hreflangLinks = computed(() => {
    const links = SUPPORTED_LANGS.map(lang => ({
      rel: 'alternate',
      hreflang: lang,
      href: `${SITE_URL}/landing/${lang}`
    }))
    links.push({
      rel: 'alternate',
      hreflang: 'x-default',
      href: `${SITE_URL}/landing/en`
    })
    return links
  })

  useHead({
    title,
    htmlAttrs: { lang: currentLang },
    meta: [
      { name: 'description', content: description },
      { name: 'keywords', content: computed(() =>
        currentLang.value === 'es' ? 'tarot gratis, tarot online, lectura de tarot, tarot con IA, consulta tarot, cartas de tarot' :
        currentLang.value === 'it' ? 'tarocchi gratis, tarocchi online, lettura tarocchi, tarocchi con IA, consulta tarocchi' :
        currentLang.value === 'pt' ? 'tarot gratis, tarot online, leitura de tarot, tarot com IA, consulta tarot, cartas de tarot' :
        currentLang.value === 'fr' ? 'tarot gratuit, tarot en ligne, tirage de tarot, tarot avec IA, consultation tarot' :
        'free tarot, tarot online, tarot reading, AI tarot, tarot cards, tarot consultation'
      )},
      // Open Graph
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: `${SITE_URL}/og-image.png` },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'Free Tarot Fun - AI Tarot Readings' },
      { property: 'og:locale', content: computed(() => {
        const localeMap = { en: 'en_US', es: 'es_ES', it: 'it_IT', pt: 'pt_BR', fr: 'fr_FR' }
        return localeMap[currentLang.value] || 'en_US'
      })},
      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: `${SITE_URL}/og-image.png` },
    ],
    link: [
      { rel: 'canonical', href: canonicalUrl },
      ...hreflangLinks.value
    ]
  })
}
