import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to handle authentication redirects
 * Client-side auth checks are handled by useRequireAuth hook in layouts
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/signin', '/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Check if user data exists in cookies (set by client after login)
  const userCookie = request.cookies.get('user')?.value;
  const isAuthenticated = !!userCookie;

  console.log('🛡️ MIDDLEWARE:', {
    pathname,
    isPublicRoute,
    isAuthenticated,
    hasCookie: !!userCookie
  });

  // If authenticated and trying to access login/signin page, redirect to dashboard
  // BUT: Add check to prevent redirect if we just came from dashboard (prevent loop)
  if (isAuthenticated && (pathname === '/' || pathname === '/signin')) {
    const referer = request.headers.get('referer');
    const isDashboardReferer = referer?.includes('/dashboard');
    
    // Only redirect if NOT coming from dashboard (prevents loop)
    if (!isDashboardReferer) {
      console.log('✅ Authenticated user on login page, redirecting to dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      console.log('⚠️ Skipping redirect - came from dashboard (prevent loop)');
    }
  }

  // Allow all other requests to proceed
  // Protected route checks are handled client-side by useRequireAuth
  return NextResponse.next();
}

/**
 * Matcher configuration - which routes to apply middleware to
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|.*\\..*|api).*)',
  ],
};
