/**
 * Next.js Edge Middleware — Single Address Unified Gateway
 *
 * Runs on incoming requests. Bypasses subdomains completely and ensures
 * unified single-domain routing across all pages and API endpoints.
 */
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Single-domain pass-through: no subdomain interception or redirection
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
