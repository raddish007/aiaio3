import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  
  console.log('Consumer Middleware - Host:', hostname);
  console.log('Consumer Middleware - URL:', url.pathname);
  
  // Redirect any admin routes to the admin subdomain
  if (url.pathname.startsWith('/admin')) {
    console.log('Redirecting admin route to admin subdomain');
    return NextResponse.redirect('https://admin.hippopolka.com' + url.pathname);
  }
  
  // App subdomain handling  
  if (hostname.includes('app.hippopolka.com')) {
    console.log('App subdomain detected');
    
    // Handle static assets - don't rewrite these
    if (url.pathname.startsWith('/HippoPolkaLogo') || 
        url.pathname.startsWith('/icon_') || 
        url.pathname.startsWith('/marketing/') ||
        url.pathname === '/favicon.ico') {
      console.log('Static asset detected - not rewriting');
      return NextResponse.next();
    }
    
    // Handle authentication pages - don't rewrite these
    if (url.pathname === '/signin' || url.pathname === '/register' || url.pathname.startsWith('/register/')) {
      console.log('Auth page detected - not rewriting');
      return NextResponse.next();
    }
    
    // Rewrite all other requests to /app directory
    if (url.pathname === '/') {
      // Root path goes to dashboard
      url.pathname = '/app/dashboard';
    } else {
      // All other paths get prefixed with /app
      url.pathname = `/app${url.pathname}`;
    }
    
    console.log('Rewriting to:', url.pathname);
    return NextResponse.rewrite(url);
  }
  
  // Main domain handling (hippopolka.com, www.hippopolka.com)
  if (hostname.includes('hippopolka.com') && !hostname.includes('app.')) {
    console.log('Main domain detected - serving marketing pages');
    return NextResponse.next();
  }
  
  // Development environment - allow everything except admin
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.includes('vercel.app')) {
    console.log('Development environment');
    
    // Still redirect admin routes in development
    if (url.pathname.startsWith('/admin')) {
      console.log('Redirecting admin route in development');
      return NextResponse.redirect('https://admin.hippopolka.com' + url.pathname);
    }
    
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
