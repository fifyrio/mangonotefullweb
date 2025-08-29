'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClientSupabase } from './supabase-client'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientSupabase()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle auth events
        if (event === 'SIGNED_IN') {
          // User signed in - sync with our users table
          if (session?.user) {
            try {
              await syncUserWithDatabase(session.user)
            } catch (error) {
              console.error('Error syncing user:', error)
            }
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const syncUserWithDatabase = async (authUser: User) => {
    try {
      // Check if user exists in our users table
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.email!)
        .single()

      if (fetchError && fetchError.code === 'PGRST116') {
        // User doesn't exist, create them
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            email: authUser.email!,
            full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name,
            avatar_url: authUser.user_metadata?.avatar_url,
            is_guest: false,
            last_active_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error creating user in database:', insertError)
        }
      } else if (!fetchError) {
        // User exists, update last active
        const { error: updateError } = await supabase
          .from('users')
          .update({
            last_active_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            // Update profile info if changed
            full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name,
            avatar_url: authUser.user_metadata?.avatar_url,
          })
          .eq('email', authUser.email!)

        if (updateError) {
          console.error('Error updating user in database:', updateError)
        }
      }
    } catch (error) {
      console.error('Error syncing user with database:', error)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}