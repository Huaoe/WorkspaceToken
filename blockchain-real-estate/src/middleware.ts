import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only process API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[Middleware] [${requestId}] Processing API request:`, {
    url: request.url,
    method: request.method,
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString()
  });

  // Add request ID to response headers for tracking
  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);

  return response;
}

// Only run middleware for API routes
export const config = {
  matcher: [
    '/api/:path*'
  ]
}
