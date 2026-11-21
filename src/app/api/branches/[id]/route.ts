import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Branch from '@/models/Branch';
import { requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'platform_super_admin']);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(context.params);
    const branch = await Branch.findById(resolvedParams.id);
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // IDOR Protection: Check tenant match
    if (!authResult.isSuperAdmin && branch.company_id && branch.company_id !== authResult.companyId) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    const body = await req.json();
    delete body.company_id; // Never let client change tenant association

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
      await Branch.updateMany(
        { company_id: branch.company_id, _id: { $ne: resolvedParams.id } },
        { isHeadOffice: false }
      );
    }

    const updated = await Branch.findByIdAndUpdate(resolvedParams.id, body, { new: true });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'platform_super_admin']);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(context.params);
    const branch = await Branch.findById(resolvedParams.id);

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // IDOR Protection: Check tenant match
    if (!authResult.isSuperAdmin && branch.company_id && branch.company_id !== authResult.companyId) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Safety check: ensure at least one office remains in this company
    const totalCount = await Branch.countDocuments({ company_id: branch.company_id });
    if (totalCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the only office location for this company. Please edit it instead.' },
        { status: 400 }
      );
    }

    await Branch.findByIdAndDelete(resolvedParams.id);
    return NextResponse.json({ success: true, message: 'Branch deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
