import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase.js'
import { smartWarmup, updateServerActivity } from '../utils/serverWarmup.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const needsRegistration = ref(false)
  const userSubscription = ref(null)
  const isInitialized = ref(false)
  const warmupMessage = ref('')

  const isLoggedIn = computed(() => !!user.value)
  const isFullyRegistered = computed(() => isLoggedIn.value && !needsRegistration.value)

  // Subscription related computed properties
  const isSubscriptionActive = computed(() => {
    if (!userSubscription.value) return false
    const now = new Date()
    const endDate = new Date(userSubscription.value.subscription_end_date)
    return userSubscription.value.has_active_subscription && endDate > now
  })

  const isPremiumUser = computed(() => isSubscriptionActive.value)

  const canAskQuestion = computed(() => {
    return userSubscription.value?.can_ask_question || false
  })

  const questionsRemaining = computed(() => {
    return userSubscription.value?.questions_remaining || 0
  })

  const currentPlan = computed(() => {
    return userSubscription.value?.plan_name || 'Gratuito'
  })

  // Initialize auth state
  const initAuth = async () => {
    if (isInitialized.value) {
      console.log('🔄 Auth already initialized, skipping...')
      return
    }

    loading.value = true
    try {
      console.log('🔄 Initializing auth...')

      // Check localStorage for existing session first
      const storedSession = localStorage.getItem('supabase.auth.token')
      console.log('💾 Stored session in localStorage:', !!storedSession)

      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('❌ Error getting session:', error)
        // Clear potentially corrupted session
        await supabase.auth.signOut()
      }

      user.value = session?.user || null
      console.log('🔑 Session loaded:', !!session?.user, session?.user?.email)

      // If we have a user, check their profile and subscription
      if (session?.user) {
        console.log('👤 Loading user profile and subscription...')
        await checkUserProfile(session.user)
        await loadUserSubscription()
        console.log('✅ User data loaded successfully')
      }

      isInitialized.value = true
    } catch (error) {
      console.error('❌ Error during auth initialization:', error)
      // Mark as initialized even if there's an error to prevent infinite loops
      isInitialized.value = true
    } finally {
      loading.value = false
      console.log('✅ Auth initialization complete, isInitialized:', isInitialized.value)
    }
  }

  // Function to show warmup messages
  const showWarmupMessage = (message) => {
    warmupMessage.value = message
    console.log('🔥 Warmup:', message)
    // Clear message after 3 seconds
    setTimeout(() => {
      warmupMessage.value = ''
    }, 3000)
  }

  // Perform server warmup when user logs in
  const performWarmup = async () => {
    try {
      const result = await smartWarmup(showWarmupMessage)
      if (result.success && !result.skipped) {
        console.log(`🔥 Servidor despierto (${result.latency}ms)`)
      }
    } catch (error) {
      console.warn('⚠️ Warmup failed:', error)
    }
  }

  // Listen for auth changes
  const setupAuthListener = () => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state change:', event, !!session?.user)
      user.value = session?.user || null

      // If user just signed in and doesn't have profile data, they need to complete registration
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('👤 User signed in, checking profile...')

        // Perform server warmup as soon as user logs in
        performWarmup()

        try {
          // Run profile check and subscription loading in parallel with timeouts
          const profilePromise = checkUserProfile(session.user)
          const subscriptionPromise = loadUserSubscription()

          // Wait for both with a reasonable timeout
          await Promise.race([
            Promise.all([profilePromise, subscriptionPromise]),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile loading timeout')), 15000)
            )
          ])

          console.log('✅ Profile check complete. needsRegistration:', needsRegistration.value)
          console.log('🔍 Auth state after profile check:', {
            isLoggedIn: isLoggedIn.value,
            isFullyRegistered: isFullyRegistered.value,
            needsRegistration: needsRegistration.value,
            user: !!user.value
          })
        } catch (error) {
          console.error('⚠️ Profile loading timed out or failed:', error)
          // Continue with defaults to not block auth initialization
          needsRegistration.value = false
        }
      }

      // Mark as initialized after any auth state change
      if (!isInitialized.value) {
        console.log('✅ Auth initialization complete via auth state change')
        isInitialized.value = true
      }
    })
  }

  // Handle post-login redirect - only redirect from landing page
  const handlePostLoginRedirect = async (router) => {
    const currentRoute = router.currentRoute.value
    if (isLoggedIn.value && !needsRegistration.value && currentRoute.name === 'landing') {
      router.push('/chat')
    }
  }

  // Check if user needs to complete profile
  const checkUserProfile = async (user) => {
    try {
      console.log('🔍 Checking user profile for:', user.id)

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('❌ Error checking user profile:', error)
        // Don't block initialization for profile errors
        needsRegistration.value = false
        return
      }

      if (!profile) {
        console.log('❌ Profile not found, user needs registration')
        needsRegistration.value = true
      } else {
        console.log('✅ Profile found, user is fully registered')
        needsRegistration.value = false
      }
    } catch (error) {
      console.error('❌ Exception checking user profile:', error)
      // Default to no registration needed to prevent blocking
      needsRegistration.value = false
    }
  }

  // Login with Google
  const loginWithGoogle = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error logging in with Google:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  // Login with Facebook
  const loginWithFacebook = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error logging in with Facebook:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  // Login with email/password
  const loginWithEmail = async (email, password) => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error logging in with email:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  // Sign up with email/password
  const signUpWithEmail = async (email, password) => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error signing up with email:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  // Complete user registration
  const completeRegistration = async (profileData) => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.value.id,
            email: user.value.email,
            name: profileData.name,
            gender: profileData.gender,
            date_of_birth: profileData.dateOfBirth,
            timezone: profileData.timezone || 'America/Mexico_City',
            language: profileData.language || 'es',
            created_at: new Date().toISOString()
          }
        ])

      if (error) throw error

      needsRegistration.value = false
      return { data, error: null }
    } catch (error) {
      console.error('Error completing registration:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  // Update user profile
  const updateProfile = async (profileData) => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          gender: profileData.gender,
          date_of_birth: profileData.dateOfBirth,
          timezone: profileData.timezone,
          language: profileData.language
        })
        .eq('id', user.value.id)

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  // Load user subscription info
  const loadUserSubscription = async () => {
    if (!user.value?.id) {
      console.log('⚠️ No user ID available for subscription loading')
      return
    }

    try {
      console.log('💳 Loading user subscription for:', user.value.id)
      const API_URL = import.meta.env.VITE_API_URL

      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(`${API_URL}/api/user/subscription/${user.value.id}`, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        userSubscription.value = data
        console.log('✅ Subscription loaded successfully:', data.plan_name || 'Gratuito')
      } else {
        console.error('❌ Error loading subscription:', response.status, response.statusText)
        // Set default subscription to prevent blocking
        userSubscription.value = { plan_name: 'Gratuito', has_active_subscription: false }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ Subscription loading timed out after 10 seconds')
      } else {
        console.error('❌ Exception loading user subscription:', error)
      }
      // Set default subscription to prevent blocking
      userSubscription.value = { plan_name: 'Gratuito', has_active_subscription: false }
    }
  }

  // Check if user can ask a question
  const checkCanAskQuestion = async () => {
    if (!user.value?.id) return false

    try {
      const API_URL = import.meta.env.VITE_API_URL
      const response = await fetch(`${API_URL}/api/user/can-ask/${user.value.id}`)

      if (response.ok) {
        const data = await response.json()
        return data.canAsk
      }
    } catch (error) {
      console.error('Error checking question permission:', error)
    }
    return false
  }

  // Record a user question
  const recordQuestion = async (question, response, cards = [], isPremium = false) => {
    if (!user.value?.id) return

    try {
      const API_URL = import.meta.env.VITE_API_URL
      await fetch(`${API_URL}/api/user/question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.value.id,
          question,
          response,
          cards,
          isPremium
        })
      })

      // Reload subscription info to update question count
      await loadUserSubscription()
    } catch (error) {
      console.error('Error recording question:', error)
    }
  }

  // Logout
  const logout = async () => {
    loading.value = true
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      user.value = null
      needsRegistration.value = false
      userSubscription.value = null
    } catch (error) {
      console.error('Error logging out:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    isLoggedIn,
    isFullyRegistered,
    needsRegistration,
    loading,
    isInitialized,
    warmupMessage,
    // Subscription properties
    userSubscription,
    isSubscriptionActive,
    isPremiumUser,
    canAskQuestion,
    questionsRemaining,
    currentPlan,
    // Auth functions
    initAuth,
    setupAuthListener,
    handlePostLoginRedirect,
    loginWithGoogle,
    loginWithFacebook,
    loginWithEmail,
    signUpWithEmail,
    completeRegistration,
    updateProfile,
    logout,
    // Subscription functions
    loadUserSubscription,
    checkCanAskQuestion,
    recordQuestion,
    // Warmup functions
    performWarmup,
    showWarmupMessage
  }
})
