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

// Calcular edad basada en fecha de nacimiento
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null

  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

// Obtener información temporal basada en zona horaria
const getTimeContext = (timezone = 'America/Mexico_City') => {
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

  // Determinar estación del año (hemisferio norte por defecto)
  const month = userTime.getMonth() + 1
  let season = 'invierno'
  if (month >= 3 && month <= 5) {
    season = 'primavera'
  } else if (month >= 6 && month <= 8) {
    season = 'verano'
  } else if (month >= 9 && month <= 11) {
    season = 'otoño'
  }

  return {
    greeting,
    season,
    hour: hours,
    date: userTime.toLocaleDateString('es-ES'),
    time: userTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
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
    const birthDate = new Date(dateOfBirth)
    const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate())
    const nextYearBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate())

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
    const timeContext = getTimeContext(profile.timezone)
    const specialDates = getSpecialDates(profile.date_of_birth, profile.timezone)

    // Construir contexto personalizado
    let context = `INFORMACIÓN PERSONAL DEL CONSULTANTE:
- Nombre: ${profile.name}
- Edad: ${age ? `${age} años` : 'No especificada'}
- Género: ${profile.gender || 'No especificado'}
- Idioma preferido: ${profile.language || 'español'}
- Zona horaria: ${profile.timezone || 'No especificada'}

CONTEXTO TEMPORAL:
- ${timeContext.greeting}, son las ${timeContext.time}
- Fecha actual: ${timeContext.date}
- Estación del año: ${timeContext.season}

${specialDates.length > 0 ? `FECHAS ESPECIALES:
${specialDates.map(date => `- ${date}`).join('\n')}
` : ''}

INSTRUCCIONES PARA LA INTERPRETACIÓN:
- Saluda al consultante por su nombre usando el saludo apropiado para la hora
- Considera su edad para ajustar el tono y los consejos
- Ten en cuenta las fechas especiales si son relevantes para la consulta
- Usa un lenguaje apropiado para su género y edad
- Mantén un tono místico pero personal y cercano`

    return {
      hasProfile: true,
      context,
      profile: {
        name: profile.name,
        age,
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
    return 'Bienvenido al oráculo'
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