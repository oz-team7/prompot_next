import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // API 호출 로깅
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    // 요청 정보 저장
    console.log(`[API Request] ${request.method} ${request.nextUrl.pathname}`, {
      requestId,
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent'),
    });
    
    // Response 처리를 위한 헤더 추가
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-request-id', requestId);
    requestHeaders.set('x-start-time', startTime.toString());
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};