import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    return NextResponse.redirect(apiUrl, 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/chat',
};
