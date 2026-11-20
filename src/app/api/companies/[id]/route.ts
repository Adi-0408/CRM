import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Company from '@/models/Company';
import { requireRoles, requireTenantAuth, DEFAULT_COMPANY_ID } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    let targetId = params.id;
    if (targetId === 'current') {
      targetId = authResult.companyId || DEFAULT_COMPANY_ID;
    }

    // IDOR Protection: Tenant users can only retrieve their own company
    if (!authResult.isSuperAdmin && targetId !== authResult.companyId && targetId !== (authResult.companyId || DEFAULT_COMPANY_ID)) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = (await Company.findById(targetId)) || (await Company.findOne({ slug: targetId }));
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    let targetId = params.id;
    if (targetId === 'current') {
      targetId = authResult.companyId || DEFAULT_COMPANY_ID;
    }

    // IDOR Protection: Company admins can only update their own company
    if (!authResult.isSuperAdmin && targetId !== authResult.companyId && targetId !== (authResult.companyId || DEFAULT_COMPANY_ID)) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await req.json();

    // Security check: Only platform_super_admin can change company status (suspend/active) or slug
    if (!authResult.isSuperAdmin) {
      delete body.status;
      delete body.slug;
    }

    body.updatedAt = new Date();

    const updated = await Company.findByIdAndUpdate(targetId, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const PATCH = PUT;

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only platform super admin can delete a company
    const authResult = await requireRoles(req, ['platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const deleted = await Company.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Company deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
