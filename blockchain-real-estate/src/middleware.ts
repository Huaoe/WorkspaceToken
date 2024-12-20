import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only process API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const requestId = Math.random().toString(36).substring(7);

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
