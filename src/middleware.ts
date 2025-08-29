import createMiddleware from 'next-intl/middleware';
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {routing} from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Handle internationalization first
  const response = intlMiddleware(request)
  
  // Create supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )
  
  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  
  // Check if accessing protected routes
  const isProtectedRoute = request.nextUrl.pathname.includes('/dashboard') ||
                          request.nextUrl.pathname.includes('/notes') ||
                          request.nextUrl.pathname.includes('/flashcards') ||
                          request.nextUrl.pathname.includes('/processing')
  
  // Check if accessing auth routes
  const isAuthRoute = request.nextUrl.pathname.includes('/auth/signin') ||
                     request.nextUrl.pathname.includes('/auth/signup')
  
  // If accessing protected route without session, redirect to signin
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // If accessing auth routes with active session, redirect to dashboard
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return response
}

export const config = {
  matcher: ['/((?!api|auth/callback|_next|_vercel|.*\\..*).*)']
};