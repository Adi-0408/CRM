import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Invoice from '@/models/Invoice';
import { requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'accounts', 'platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(context.params);
    const existing = await Invoice.findById(resolvedParams.id);
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // IDOR Protection: Tenant boundary check
    if (!authResult.isSuperAdmin && existing.company_id && existing.company_id !== authResult.companyId) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const body = await req.json();
    delete body.company_id;

    if (body.status === 'paid' && !body.paidAt) {
      body.paidAt = new Date();
    }

    const updated = await Invoice.findByIdAndUpdate(resolvedParams.id, body, {
      new: true,
      runValidators: true,
    });

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
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'accounts', 'platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(context.params);
    const existing = await Invoice.findById(resolvedParams.id);
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // IDOR Protection: Tenant boundary check
    if (!authResult.isSuperAdmin && existing.company_id && existing.company_id !== authResult.companyId) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    await Invoice.findByIdAndDelete(resolvedParams.id);
    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
