/**
 * Super Admin — Audit Logs API
 * GET /api/admin/audit-logs — Retrieve platform audit logs
 */
import { NextRequest, NextResponse } from 'next/server';
import { AuditLog } from '@/models/AuditLog';
import { getAuthUser } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isSuperAdmin(user: any): boolean {
  return (
    user?.platformRole === 'super_admin' ||
    user?.email === (process.env.SUPER_ADMIN_EMAIL || 'admin@crm.com')
  );
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: any = {};
    if (companyId) {
      query.companyId = companyId;
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);

    return NextResponse.json({ success: true, logs: logs || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
