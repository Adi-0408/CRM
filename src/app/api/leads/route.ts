import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Lead from '@/models/Lead';
import { requireRoles, requireTenantAuth, buildTenantFilter, DEFAULT_COMPANY_ID } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    let query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const scopedQuery = buildTenantFilter(authResult.user!, query);
    const leads = await Lead.find(scopedQuery)
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name email avatar role');

    return NextResponse.json(leads);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'sales', 'platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const body = await req.json();

    const companyId = authResult.companyId || (authResult.isSuperAdmin ? (body.company_id || DEFAULT_COMPANY_ID) : DEFAULT_COMPANY_ID);
    body.company_id = companyId;

    if (!body.name || !body.company || !body.email) {
      return NextResponse.json(
        { error: 'Name, company and email are required' },
        { status: 400 }
      );
    }

    if (body.phone) {
      const cleanPhone = String(body.phone).replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return NextResponse.json(
          { error: 'Mobile number must be exactly 10 digits.' },
          { status: 400 }
        );
      }
      body.phone = cleanPhone;
    }

    if (body.value !== undefined) {
      body.value = Number(String(body.value).replace(/\D/g, '')) || 0;
    }

    const newLead = await Lead.create(body);
    const populated = await Lead.findById(newLead._id).populate(
      'assignedTo',
      'name email avatar role'
    );
    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
