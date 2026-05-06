import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabaseClient } from '@/services/supabase/client'
import { pullInitialData, clearLocalDatabase } from '@/services/sync/pull'

interface AuthState {
  userId: string | null
  email: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      email: null,
      isLoading: false,
      isAuthenticated: false,

      checkAuth: async () => {
        set({ isLoading: true })
        try {
          const {
            data: { user },
          } = await supabaseClient.auth.getUser()
          if (user) {
            set({
              userId: user.id,
              email: user.email || null,
              isAuthenticated: true,
            })
          } else {
            set({
              userId: null,
              email: null,
              isAuthenticated: false,
            })
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          set({
            userId: null,
            email: null,
            isAuthenticated: false,
          })
        } finally {
          set({ isLoading: false })
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
          })
          if (error) throw error
          if (data.user) {
            // Pull initial data before setting as authenticated
            await pullInitialData(data.user.id)
            
            set({
              userId: data.user.id,
              email: data.user.email || null,
              isAuthenticated: true,
            })
          }
        } catch (error) {
          console.error('Login failed:', error)
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await supabaseClient.auth.signOut()
          await clearLocalDatabase()
          set({
            userId: null,
            email: null,
            isAuthenticated: false,
          })
        } catch (error) {
          console.error('Logout failed:', error)
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      signUp: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
          })
          if (error) throw error
          if (data.user) {
            set({
              userId: data.user.id,
              email: data.user.email || null,
              isAuthenticated: true,
            })
          }
        } catch (error) {
          console.error('Sign up failed:', error)
          throw error
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        userId: state.userId,
        email: state.email,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
