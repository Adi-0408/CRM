import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Quotation from '@/models/Quotation';
import Lead from '@/models/Lead';
import { requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'sales', 'platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(context.params);
    const existing = await Quotation.findById(resolvedParams.id);
    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // IDOR Protection: Tenant boundary check
    if (!authResult.isSuperAdmin && existing.company_id && existing.company_id !== authResult.companyId) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const body = await req.json();
    delete body.company_id;

    const updated = await Quotation.findByIdAndUpdate(resolvedParams.id, body, {
      new: true,
      runValidators: true,
    });

    // If quotation status was changed to accepted or rejected, sync linked lead in the same company
    const leadId = body.leadId || existing.leadId;
    if (leadId && body.status) {
      try {
        const lead = await Lead.findById(leadId);
        if (lead && (authResult.isSuperAdmin || lead.company_id === existing.company_id)) {
          if (body.status === 'accepted') {
            await Lead.findByIdAndUpdate(leadId, {
              status: 'won',
              value: updated?.totalAmount || existing.totalAmount,
            });
          } else if (body.status === 'rejected') {
            await Lead.findByIdAndUpdate(leadId, {
              status: 'lost',
            });
          }
        }
      } catch (leadSyncErr) {
        console.warn('Failed to sync lead status on quotation update:', leadSyncErr);
      }
    }

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
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'sales', 'platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(context.params);
    const existing = await Quotation.findById(resolvedParams.id);
    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // IDOR Protection: Tenant boundary check
    if (!authResult.isSuperAdmin && existing.company_id && existing.company_id !== authResult.companyId) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    await Quotation.findByIdAndDelete(resolvedParams.id);
    return NextResponse.json({ message: 'Quotation deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
