import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Company from '@/models/Company';
import { requireRoles, requireTenantAuth, DEFAULT_COMPANY_ID } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(context.params);
    let targetId = resolvedParams.id;
    if (targetId === 'current') {
      targetId = authResult.companyId || DEFAULT_COMPANY_ID;
    }

    // IDOR Protection: Tenant users can only retrieve their own company
    if (!authResult.isSuperAdmin && targetId !== authResult.companyId && targetId !== (authResult.companyId || DEFAULT_COMPANY_ID)) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    let company =
      (await Company.findById(targetId)) ||
      (await Company.findOne({ slug: targetId })) ||
      (await Company.findOne({ id: targetId })) ||
      (await Company.findOne({ _id: targetId }));

    if (!company) {
      const all = await Company.find();
      company = all.find(
        (c: any) =>
          String(c._id || c.id || '').toLowerCase() === String(targetId).toLowerCase() ||
          String(c.slug || '').toLowerCase() === String(targetId).toLowerCase() ||
          String(c.name || c.companyName || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-') === String(targetId).toLowerCase()
      );
    }

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
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(context.params);
    let targetId = resolvedParams.id;
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

    // Robust company resolution before update
    let targetCompany =
      (await Company.findById(targetId)) ||
      (await Company.findOne({ slug: targetId })) ||
      (await Company.findOne({ id: targetId })) ||
      (await Company.findOne({ _id: targetId }));

    if (!targetCompany) {
      const all = await Company.find();
      targetCompany = all.find(
        (c: any) =>
          String(c._id || c.id || '').toLowerCase() === String(targetId).toLowerCase() ||
          String(c.slug || '').toLowerCase() === String(targetId).toLowerCase() ||
          String(c.name || c.companyName || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-') === String(targetId).toLowerCase()
      );
    }

    if (!targetCompany) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const docId = String(targetCompany._id || targetCompany.id || targetId);
    const updated = await Company.findByIdAndUpdate(docId, body, {
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
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Only platform super admin can delete a company
    const authResult = await requireRoles(req, ['platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(context.params);
    const deleted = await Company.findByIdAndDelete(resolvedParams.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Company deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
