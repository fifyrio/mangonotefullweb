import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const origin = requestUrl.origin

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })

    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${origin}/auth/signin?error=${encodeURIComponent(error.message)}`)
      }

      if (data.user) {
        // User successfully authenticated, redirect to the intended page
        console.log('User authenticated:', data.user.email)
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.error('Error during auth callback:', error)
      return NextResponse.redirect(`${origin}/auth/signin?error=Authentication failed`)
    }
  }

  // No code provided or authentication failed
  return NextResponse.redirect(`${origin}/auth/signin?error=Invalid authentication`)
}