import createMiddleware from 'next-intl/middleware';
import {NextRequest} from 'next/server';
 
const intlMiddleware = createMiddleware({
  locales: ['en', 'de', 'it', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'as-needed'
});

export default function middleware(request: NextRequest) {
  // Check if pathname starts with API routes or static files
  const { pathname } = request.nextUrl;
  
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};