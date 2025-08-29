import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Client component Supabase client (for browser)
export const createClientSupabase = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Direct client for non-SSR contexts
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Database types based on our schema
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  is_guest: boolean
  last_active_at: string
}

export interface Note {
  id: string
  user_id: string
  folder_id?: string
  title: string
  source_type: string
  content_status: string
  created_at: string
  updated_at: string
  url?: string
  transcription?: string
  image_url?: string
  markdown?: string
}