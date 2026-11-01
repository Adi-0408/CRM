import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Quotation from '@/models/Quotation';
import Lead from '@/models/Lead';
import { requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'sales']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const body = await req.json();

    const existing = await Quotation.findById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const updated = await Quotation.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    // If quotation status was changed to accepted or rejected, sync linked lead
    const leadId = body.leadId || existing.leadId;
    if (leadId && body.status) {
      try {
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
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'sales']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const deleted = await Quotation.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Quotation deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
