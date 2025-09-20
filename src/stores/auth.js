import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const needsRegistration = ref(false)
  const userSubscription = ref(null)

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
    loading.value = true
    try {
      console.log('🔄 Initializing auth...')
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user || null
      console.log('🔑 Session loaded:', !!session?.user)

      // If we have a user, check their profile and subscription
      if (session?.user) {
        await checkUserProfile(session.user)
        await loadUserSubscription()
      }
    } catch (error) {
      console.error('Error getting session:', error)
    } finally {
      loading.value = false
      console.log('✅ Auth initialization complete')
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
        await checkUserProfile(session.user)
        console.log('✅ Profile check complete. needsRegistration:', needsRegistration.value)
      }
    })
  }

  // Handle post-login redirect
  const handlePostLoginRedirect = async (router) => {
    if (isLoggedIn.value && !needsRegistration.value) {
      router.push('/chat')
    }
  }

  // Check if user needs to complete profile
  const checkUserProfile = async (user) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error checking user profile:', error)
        return
      }

      if (!profile) {
        // Profile doesn't exist, user needs to complete registration
        needsRegistration.value = true
      } else {
        needsRegistration.value = false
      }
    } catch (error) {
      console.error('Error checking user profile:', error)
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
    if (!user.value?.id) return

    try {
      const API_URL = import.meta.env.VITE_API_URL
      const response = await fetch(`${API_URL}/api/user/subscription/${user.value.id}`)

      if (response.ok) {
        const data = await response.json()
        userSubscription.value = data
      } else {
        console.error('Error loading subscription:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading user subscription:', error)
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
    recordQuestion
  }
})
