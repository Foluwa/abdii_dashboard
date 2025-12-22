import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to handle authentication redirects
 * Client-side auth checks are handled by useRequireAuth hook in layouts
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user data exists in cookies (set by client after login)
  const userCookie = request.cookies.get('user')?.value;
  const isAuthenticated = !!userCookie;

  // If authenticated and trying to access root login page, redirect to dashboard
  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
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
