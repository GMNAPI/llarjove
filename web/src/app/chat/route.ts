import { NextResponse, type NextRequest } from 'next/server';

export function GET(_request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    return NextResponse.redirect(apiUrl, 307);
  }
  return NextResponse.redirect(new URL('/', _request.url), 307);
}
