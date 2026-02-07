import { NextResponse, type NextRequest } from 'next/server';

// CHAT_REDIRECT_URL is read at runtime (set in Railway). Fallback: NEXT_PUBLIC_API_URL.
export function GET(request: NextRequest) {
  const apiUrl =
    process.env.CHAT_REDIRECT_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    return NextResponse.redirect(apiUrl, 307);
  }
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost';
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  const base = `${proto}://${host}`;
  return NextResponse.redirect(new URL('/', base), 307);
}
