/**
 * Tenant Context API
 * GET /api/tenant?slug=acme — Resolve a company slug to its public context
 *
 * Used by the frontend login page to load company branding.
 * Returns only public-safe fields (no sensitive data).
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') || req.headers.get('x-tenant-slug') || '';

  if (!slug) {
    return NextResponse.json(
      { success: false, reason: 'not_found', message: 'No slug provided.' },
      { status: 400 }
    );
  }

  const result = await resolveTenant(slug);

  if (!result.success) {
    const statusMap: Record<string, number> = {
      not_found: 404,
      suspended: 403,
      expired: 402,
      error: 500,
    };
    return NextResponse.json(result, { status: statusMap[result.reason] || 500 });
  }

  return NextResponse.json({ success: true, tenant: result.tenant });
}
