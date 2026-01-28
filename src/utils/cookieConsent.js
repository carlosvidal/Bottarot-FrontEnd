import 'vanilla-cookieconsent/dist/cookieconsent.css'
import * as CookieConsent from 'vanilla-cookieconsent'

let isInitialized = false

export const initCookieConsent = () => {
  if (isInitialized) return

  CookieConsent.run({
    guiOptions: {
      consentModal: {
        layout: 'box inline',
        position: 'bottom right'
      },
      preferencesModal: {
        layout: 'box',
        position: 'right',
        equalWeightButtons: true,
        flipButtons: false
      }
    },

    categories: {
      necessary: {
        enabled: true,
        readOnly: true
      },
      analytics: {
        enabled: false,
        autoClear: {
          cookies: [
            {
              name: /^(_ga|_gid|_gat)/
            }
          ]
        }
      }
    },

    language: {
      default: 'es',
      autoDetect: 'browser',
      translations: {
        es: {
          consentModal: {
            title: '🍪 Este sitio usa cookies',
            description: 'Utilizamos cookies esenciales para el funcionamiento del sitio y cookies analíticas para mejorar tu experiencia. Puedes aceptar todas o personalizar tus preferencias.',
            acceptAllBtn: 'Aceptar todas',
            acceptNecessaryBtn: 'Solo necesarias',
            showPreferencesBtn: 'Personalizar',
            footer: '<a href="/privacy">Política de Privacidad</a>\n<a href="/cookies">Política de Cookies</a>'
          },
          preferencesModal: {
            title: 'Preferencias de Cookies',
            acceptAllBtn: 'Aceptar todas',
            acceptNecessaryBtn: 'Rechazar todas',
            savePreferencesBtn: 'Guardar preferencias',
            closeIconLabel: 'Cerrar',
            serviceCounterLabel: 'Servicio|Servicios',
            sections: [
              {
                title: 'Uso de Cookies',
                description: 'Utilizamos cookies para asegurar las funcionalidades básicas del sitio web y para mejorar tu experiencia en línea. Puedes elegir activar/desactivar cada categoría cuando lo desees.'
              },
              {
                title: 'Cookies Estrictamente Necesarias <span class="pm__badge">Siempre Activas</span>',
                description: 'Estas cookies son esenciales para el correcto funcionamiento del sitio. Sin estas cookies, el sitio no funcionaría correctamente. Incluyen cookies de autenticación y sesión.',
                linkedCategory: 'necessary'
              },
              {
                title: 'Cookies Analíticas',
                description: 'Estas cookies nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web recopilando información de forma anónima. Usamos Google Analytics para estos propósitos.',
                linkedCategory: 'analytics'
              },
              {
                title: 'Más información',
                description: 'Para más información sobre el uso de cookies y tus opciones, por favor consulta nuestra <a href="/cookies">Política de Cookies</a> y <a href="/privacy">Política de Privacidad</a>.'
              }
            ]
          }
        },
        en: {
          consentModal: {
            title: '🍪 This site uses cookies',
            description: 'We use essential cookies for site functionality and analytics cookies to improve your experience. You can accept all or customize your preferences.',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Only necessary',
            showPreferencesBtn: 'Customize',
            footer: '<a href="/privacy">Privacy Policy</a>\n<a href="/cookies">Cookie Policy</a>'
          },
          preferencesModal: {
            title: 'Cookie Preferences',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            savePreferencesBtn: 'Save preferences',
            closeIconLabel: 'Close',
            serviceCounterLabel: 'Service|Services',
            sections: [
              {
                title: 'Cookie Usage',
                description: 'We use cookies to ensure the basic functionalities of the website and to enhance your online experience. You can choose to enable/disable each category whenever you want.'
              },
              {
                title: 'Strictly Necessary Cookies <span class="pm__badge">Always Active</span>',
                description: 'These cookies are essential for the proper functioning of the site. Without these cookies, the website would not work properly. They include authentication and session cookies.',
                linkedCategory: 'necessary'
              },
              {
                title: 'Analytics Cookies',
                description: 'These cookies help us understand how visitors interact with our website by collecting information anonymously. We use Google Analytics for these purposes.',
                linkedCategory: 'analytics'
              },
              {
                title: 'More information',
                description: 'For more information about the use of cookies and your options, please see our <a href="/cookies">Cookie Policy</a> and <a href="/privacy">Privacy Policy</a>.'
              }
            ]
          }
        }
      }
    },

    // Callback when user accepts analytics
    onConsent: ({ cookie }) => {
      if (cookie.categories.includes('analytics')) {
        loadGoogleAnalytics()
      }
    },

    // Callback when preferences change
    onChange: ({ cookie, changedCategories }) => {
      if (changedCategories.includes('analytics')) {
        if (cookie.categories.includes('analytics')) {
          loadGoogleAnalytics()
        } else {
          // Reload page to clear analytics if user revokes consent
          window.location.reload()
        }
      }
    }
  })

  isInitialized = true
}

// Load Google Analytics only after consent
const loadGoogleAnalytics = () => {
  if (window.gtag) return // Already loaded

  const script1 = document.createElement('script')
  script1.async = true
  script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-VBKPYRPLW1'
  document.head.appendChild(script1)

  const script2 = document.createElement('script')
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-VBKPYRPLW1');
  `
  document.head.appendChild(script2)
}

// Check if user has accepted analytics
export const hasAnalyticsConsent = () => {
  return CookieConsent.acceptedCategory('analytics')
}

// Show preferences modal programmatically
export const showCookiePreferences = () => {
  CookieConsent.showPreferences()
}

export default CookieConsent
