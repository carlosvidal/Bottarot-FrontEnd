import { useAuthStore } from '../stores/auth'

/**
 * Genera contexto personalizado para las interpretaciones de IA
 * Incluye información demográfica, temporal y fechas especiales
 */

// Obtener perfil del usuario
const getUserProfile = async () => {
  const auth = useAuthStore()

  if (!auth.user?.id) {
    return null
  }

  try {
    const { supabase } = await import('../lib/supabase.js')
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', auth.user.id)
      .maybeSingle()

    if (error || !profile) {
      console.warn('No se pudo obtener el perfil del usuario:', error)
      return null
    }

    return profile
  } catch (error) {
    console.error('Error obteniendo perfil:', error)
    return null
  }
}

// Parse date-of-birth string safely (avoids UTC-to-local timezone shift)
// Input: "YYYY-MM-DD" → returns { year, month (1-12), day }
const parseDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) return null
  const parts = String(dateOfBirth).split('T')[0].split('-')
  if (parts.length < 3) return null
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),  // 1-12
    day: parseInt(parts[2], 10)
  }
}

// Calcular edad basada en fecha de nacimiento
const calculateAge = (dateOfBirth) => {
  const dob = parseDateOfBirth(dateOfBirth)
  if (!dob) return null

  const today = new Date()
  let age = today.getFullYear() - dob.year
  const monthDiff = (today.getMonth() + 1) - dob.month

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.day)) {
    age--
  }

  return age
}

// Calcular signo zodiacal basado en fecha de nacimiento
const getZodiacSign = (dateOfBirth) => {
  const dob = parseDateOfBirth(dateOfBirth)
  if (!dob) return null

  const month = dob.month // 1-12
  const day = dob.day

  // Zodiac date ranges
  const zodiacSigns = [
    { sign: 'Capricornio', start: [12, 22], end: [1, 19] },
    { sign: 'Acuario', start: [1, 20], end: [2, 18] },
    { sign: 'Piscis', start: [2, 19], end: [3, 20] },
    { sign: 'Aries', start: [3, 21], end: [4, 19] },
    { sign: 'Tauro', start: [4, 20], end: [5, 20] },
    { sign: 'Géminis', start: [5, 21], end: [6, 20] },
    { sign: 'Cáncer', start: [6, 21], end: [7, 22] },
    { sign: 'Leo', start: [7, 23], end: [8, 22] },
    { sign: 'Virgo', start: [8, 23], end: [9, 22] },
    { sign: 'Libra', start: [9, 23], end: [10, 22] },
    { sign: 'Escorpio', start: [10, 23], end: [11, 21] },
    { sign: 'Sagitario', start: [11, 22], end: [12, 21] }
  ]

  for (const zodiac of zodiacSigns) {
    const [startMonth, startDay] = zodiac.start
    const [endMonth, endDay] = zodiac.end

    if (startMonth === endMonth) {
      // Same month range
      if (month === startMonth && day >= startDay && day <= endDay) {
        return zodiac.sign
      }
    } else {
      // Cross-month range
      if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
        return zodiac.sign
      }
    }
  }

  return null
}

// Solicitar y obtener ubicación del usuario
const getUserLocation = async () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocalización no disponible en este navegador')
      resolve(null)
      return
    }

    // Intentar obtener de localStorage primero (cache)
    const cachedLocation = localStorage.getItem('userLocation')
    if (cachedLocation) {
      try {
        const location = JSON.parse(cachedLocation)
        // Verificar que el cache no sea muy antiguo (más de 24 horas)
        if (location.timestamp && (Date.now() - location.timestamp) < 24 * 60 * 60 * 1000) {
          resolve(location)
          return
        }
      } catch (e) {
        console.error('Error parseando ubicación cacheada:', e)
      }
    }

    // Solicitar ubicación con timeout
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now()
        }
        // Guardar en localStorage
        localStorage.setItem('userLocation', JSON.stringify(location))

        // Track geolocation granted
        import('../composables/useAnalytics.js').then(({ useAnalytics }) => {
          const { trackGeolocationGranted } = useAnalytics()
          trackGeolocationGranted()
        })

        resolve(location)
      },
      (error) => {
        console.warn('No se pudo obtener la ubicación:', error.message)

        // Track geolocation denied
        import('../composables/useAnalytics.js').then(({ useAnalytics }) => {
          const { trackGeolocationDenied } = useAnalytics()
          trackGeolocationDenied()
        })

        resolve(null)
      },
      {
        timeout: 5000,
        maximumAge: 24 * 60 * 60 * 1000 // Cache de 24 horas
      }
    )
  })
}

// Determinar hemisferio basado en latitud
const getHemisphere = (latitude) => {
  return latitude >= 0 ? 'norte' : 'sur'
}

// Obtener información temporal basada en zona horaria y ubicación
const getTimeContext = async (timezone = 'America/Mexico_City', location = null) => {
  const now = new Date()

  // Crear fecha en la zona horaria del usuario
  const userTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }))
  const hours = userTime.getHours()

  // Determinar saludo según la hora
  let greeting = 'Buenos días'
  if (hours >= 12 && hours < 18) {
    greeting = 'Buenas tardes'
  } else if (hours >= 18 || hours < 6) {
    greeting = 'Buenas noches'
  }

  // Determinar estación del año basada en hemisferio
  const month = userTime.getMonth() + 1
  let hemisphere = 'norte' // Default

  // Intentar obtener ubicación si no se proporcionó
  if (!location) {
    location = await getUserLocation()
  }

  if (location && location.latitude !== undefined) {
    hemisphere = getHemisphere(location.latitude)
  }

  // Estaciones según hemisferio
  let season = 'invierno'
  if (hemisphere === 'norte') {
    // Hemisferio Norte
    if (month >= 3 && month <= 5) {
      season = 'primavera'
    } else if (month >= 6 && month <= 8) {
      season = 'verano'
    } else if (month >= 9 && month <= 11) {
      season = 'otoño'
    }
  } else {
    // Hemisferio Sur (estaciones invertidas)
    if (month >= 3 && month <= 5) {
      season = 'otoño'
    } else if (month >= 6 && month <= 8) {
      season = 'invierno'
    } else if (month >= 9 && month <= 11) {
      season = 'primavera'
    } else {
      season = 'verano'
    }
  }

  return {
    greeting,
    season,
    hemisphere,
    hour: hours,
    date: userTime.toLocaleDateString('es-ES'),
    time: userTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    location: location ? {
      latitude: location.latitude,
      longitude: location.longitude
    } : null
  }
}

// Detectar fechas especiales próximas
const getSpecialDates = (dateOfBirth, timezone = 'America/Mexico_City') => {
  const now = new Date()
  const userTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }))
  const currentYear = userTime.getFullYear()
  const specialDates = []

  // Cumpleaños
  if (dateOfBirth) {
    const dob = parseDateOfBirth(dateOfBirth)
    if (dob) {
    const thisYearBirthday = new Date(currentYear, dob.month - 1, dob.day)
    const nextYearBirthday = new Date(currentYear + 1, dob.month - 1, dob.day)

    const daysUntilBirthday = Math.ceil((thisYearBirthday - userTime) / (1000 * 60 * 60 * 24))
    const daysUntilNextYearBirthday = Math.ceil((nextYearBirthday - userTime) / (1000 * 60 * 60 * 24))

    if (daysUntilBirthday === 0) {
      specialDates.push('¡Hoy es tu cumpleaños!')
    } else if (daysUntilBirthday > 0 && daysUntilBirthday <= 7) {
      specialDates.push(`Tu cumpleaños está muy cerca (en ${daysUntilBirthday} días)`)
    } else if (daysUntilBirthday < 0 && daysUntilNextYearBirthday <= 7) {
      specialDates.push(`Tu cumpleaños está muy cerca (en ${daysUntilNextYearBirthday} días)`)
    }
    }
  }

  // Fechas festivas importantes
  const holidays = [
    { name: 'Navidad', month: 12, day: 25 },
    { name: 'Año Nuevo', month: 1, day: 1 },
    { name: 'Día de la Madre', month: 5, day: 10 }, // México
    { name: 'Día del Padre', month: 6, day: 15 }, // México
    { name: 'Día de San Valentín', month: 2, day: 14 },
    { name: 'Halloween', month: 10, day: 31 },
    { name: 'Día de Muertos', month: 11, day: 2 }
  ]

  holidays.forEach(holiday => {
    const holidayDate = new Date(currentYear, holiday.month - 1, holiday.day)
    const nextYearHoliday = new Date(currentYear + 1, holiday.month - 1, holiday.day)

    const daysUntilHoliday = Math.ceil((holidayDate - userTime) / (1000 * 60 * 60 * 24))
    const daysUntilNextYearHoliday = Math.ceil((nextYearHoliday - userTime) / (1000 * 60 * 60 * 24))

    if (daysUntilHoliday === 0) {
      specialDates.push(`¡Hoy es ${holiday.name}!`)
    } else if (daysUntilHoliday > 0 && daysUntilHoliday <= 7) {
      specialDates.push(`Se acerca ${holiday.name} (en ${daysUntilHoliday} días)`)
    } else if (daysUntilHoliday < 0 && daysUntilNextYearHoliday <= 7) {
      specialDates.push(`Se acerca ${holiday.name} (en ${daysUntilNextYearHoliday} días)`)
    }
  })

  return specialDates
}

// Generar contexto completo para la IA
export const generatePersonalContext = async () => {
  try {
    const profile = await getUserProfile()

    if (!profile) {
      return {
        hasProfile: false,
        context: 'El usuario no tiene perfil completo disponible.'
      }
    }

    const age = calculateAge(profile.date_of_birth)
    const zodiacSign = getZodiacSign(profile.date_of_birth)

    // Obtener ubicación del usuario
    const location = await getUserLocation()

    // Obtener contexto temporal (ahora es async)
    const timeContext = await getTimeContext(profile.timezone, location)
    const specialDates = getSpecialDates(profile.date_of_birth, profile.timezone)

    // Construir contexto personalizado
    let context = `INFORMACIÓN PERSONAL DEL CONSULTANTE:
- Nombre: ${profile.name}
- Edad: ${age ? `${age} años` : 'No especificada'}
- Signo Zodiacal: ${zodiacSign || 'No especificado'}
- Género: ${profile.gender || 'No especificado'}
- Idioma preferido: ${profile.language || 'español'}
- Zona horaria: ${profile.timezone || 'No especificada'}
${timeContext.location ? `- Ubicación: Hemisferio ${timeContext.hemisphere}` : ''}

CONTEXTO TEMPORAL:
- ${timeContext.greeting}, son las ${timeContext.time}
- Fecha actual: ${timeContext.date}
- Estación del año: ${timeContext.season} (Hemisferio ${timeContext.hemisphere})

${specialDates.length > 0 ? `FECHAS ESPECIALES:
${specialDates.map(date => `- ${date}`).join('\n')}
` : ''}

INSTRUCCIONES PARA LA INTERPRETACIÓN:
- Saluda al consultante por su nombre usando el saludo apropiado para la hora
- Considera su edad y signo zodiacal para ajustar el tono y los consejos
- Incorpora elementos del signo zodiacal en la interpretación cuando sea relevante
- Ten en cuenta las fechas especiales si son relevantes para la consulta
- Usa un lenguaje apropiado para su género y edad
- Mantén un tono místico pero personal y cercano`

    return {
      hasProfile: true,
      context,
      profile: {
        name: profile.name,
        age,
        zodiacSign,
        gender: profile.gender,
        language: profile.language,
        timezone: profile.timezone
      },
      timeContext,
      specialDates
    }
  } catch (error) {
    console.error('Error generando contexto personal:', error)
    return {
      hasProfile: false,
      context: 'Error obteniendo información personal del usuario.'
    }
  }
}

// Función específica para obtener solo el saludo personalizado
export const getPersonalizedGreeting = async () => {
  const personalContext = await generatePersonalContext()

  if (!personalContext.hasProfile) {
    return 'Bienvenido a Free Tarot Fun'
  }

  const { profile, timeContext, specialDates } = personalContext
  let greeting = `${timeContext.greeting}, ${profile.name}`

  if (specialDates.length > 0) {
    greeting += `. ${specialDates[0]}`
  }

  return greeting
}

// Función para obtener contexto resumido para logs
export const getContextSummary = async () => {
  const personalContext = await generatePersonalContext()

  if (!personalContext.hasProfile) {
    return 'Sin perfil personal'
  }

  const { profile, timeContext, specialDates } = personalContext
  return `${profile.name}, ${profile.age}años, ${timeContext.greeting.toLowerCase()}, ${specialDates.length} fechas especiales`
}