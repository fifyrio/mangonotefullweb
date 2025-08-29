import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Server component Supabase client (for SSR)
export const createServerSupabase = () => {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Server-side admin client (with service role key)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Auth helper functions
export async function getUser() {
  const supabase = createServerSupabase()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function getSession() {
  const supabase = createServerSupabase()
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

// User management functions
export async function createUser(email: string, fullName?: string, avatarUrl?: string) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        full_name: fullName,
        avatar_url: avatarUrl,
        is_guest: false,
        last_active_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return { user, error: null }
  } catch (error) {
    console.error('Error creating user:', error)
    return { user: null, error }
  }
}

export async function getUserByEmail(email: string) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
    return { user, error: null }
  } catch (error) {
    console.error('Error getting user by email:', error)
    return { user: null, error }
  }
}

export async function updateUserLastActive(userId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error updating user last active:', error)
    return { error }
  }
}