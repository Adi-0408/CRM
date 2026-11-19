/**
 * Next.js Edge Middleware — Multi-Tenant Subdomain Detection
 *
 * Runs on every request. Extracts the company slug from the hostname,
 * validates it, and injects company context headers for downstream routes.
 *
 * Security note: subdomain is NOT a trust boundary. The company lookup
 * result is injected as an internal header; API routes must validate
 * the JWT companyId independently.
 */
import { NextRequest, NextResponse } from 'next/server';

// Routes that bypass tenant detection entirely
const PUBLIC_PATHS = [
  '/_next',
  '/favicon.ico',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register',
  '/api/payments/webhook',  // Razorpay webhook (future)
  '/superadmin',            // Super admin portal (path-based)
  '/register',              // Company self-registration
  '/login',                 // Generic login fallback
];

// Known non-tenant subdomains
const RESERVED_SLUGS = new Set(['www', 'admin', 'api', 'mail', 'smtp', 'ftp', 'cdn', 'static']);

function extractSlug(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];

  // Local development patterns:
  // - localhost → no tenant
  // - acme.localhost → slug = "acme"
  // - 127.0.0.1 → no tenant
  if (host === 'localhost' || host === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return null;
  }

  // Vercel preview URLs: *-*.vercel.app → no tenant
  if (host.endsWith('.vercel.app') && host.split('.').length <= 3) {
    return null;
  }

  // For local testing with subdomains: acme.localhost
  if (host.endsWith('.localhost')) {
    const slug = host.replace('.localhost', '');
    return RESERVED_SLUGS.has(slug) ? null : slug;
  }

  // Production: acme.prismcrm.com → slug = "acme"
  const parts = host.split('.');
  if (parts.length >= 3) {
    const slug = parts[0];
    return RESERVED_SLUGS.has(slug) ? null : slug;
  }

  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for static/public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const hostname = req.headers.get('host') || req.headers.get('x-forwarded-host') || 'localhost';
  const slug = extractSlug(hostname);

  const response = NextResponse.next();

  if (slug) {
    // Inject tenant slug as header for API routes and pages
    response.headers.set('x-tenant-slug', slug);
    response.headers.set('x-tenant-hostname', hostname);
  } else {
    // No subdomain — main domain or localhost
    response.headers.set('x-tenant-slug', '');
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
