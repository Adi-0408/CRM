import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Branch from '@/models/Branch';
import { requireRoles } from '@/lib/apiAuth';
import { hasTenantAccess } from '@/lib/tenantScope';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['admin_manager']);
    if (authResult.errorResponse) return authResult.errorResponse;
    const authUser = authResult.user!;

    await connectToDatabase();
    const existing = await Branch.findById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    if (!hasTenantAccess(existing, authUser)) {
      return NextResponse.json({ error: 'Forbidden: Cross-tenant access denied.' }, { status: 403 });
    }

    const body = await req.json();

    if (body.phone) {
      const cleanPhone = String(body.phone).replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return NextResponse.json(
          { error: 'Phone number must be exactly 10 digits.' },
          { status: 400 }
        );
      }
      body.phone = cleanPhone;
    }

    if (body.isHeadOffice || body.status === 'Head Office') {
      body.isHeadOffice = true;
      body.status = 'Head Office';
      await Branch.updateMany({ _id: { $ne: params.id }, companyId: authUser.companyId }, { isHeadOffice: false });
    }

    const updated = await Branch.findByIdAndUpdate(params.id, body, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['admin_manager']);
    if (authResult.errorResponse) return authResult.errorResponse;
    const authUser = authResult.user!;

    await connectToDatabase();
    const branch = await Branch.findById(params.id);

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    if (!hasTenantAccess(branch, authUser)) {
      return NextResponse.json({ error: 'Forbidden: Cross-tenant access denied.' }, { status: 403 });
    }

    // Safety check: ensure at least one office remains
    const totalCount = await Branch.countDocuments({ companyId: authUser.companyId });
    if (totalCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the only office location. Please edit it instead.' },
        { status: 400 }
      );
    }

    await Branch.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Branch removed successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
