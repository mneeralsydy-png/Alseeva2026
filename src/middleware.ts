import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// CORS middleware for API routes - allows the Capacitor APK to communicate with the server
export function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, X-Client-Info, Prefer')
    response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
    return response
  }

  // For all other requests to API routes, add CORS headers to the response
  const response = NextResponse.next()
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, X-Client-Info, Prefer')
  return response
}

export const config = {
  matcher: '/api/:path*',
}
