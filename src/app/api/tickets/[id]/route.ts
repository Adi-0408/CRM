import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Ticket from '@/models/Ticket';
import { requireRoles } from '@/lib/apiAuth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'tech_support', 'platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const existing = await Ticket.findById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // IDOR Protection: Tenant boundary check
    if (!authResult.isSuperAdmin && existing.company_id && existing.company_id !== authResult.companyId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const body = await req.json();
    delete body.company_id;

    const updated = await Ticket.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).populate('assignedTo', 'name email avatar role');

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
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'tech_support', 'platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const existing = await Ticket.findById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // IDOR Protection: Tenant boundary check
    if (!authResult.isSuperAdmin && existing.company_id && existing.company_id !== authResult.companyId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    await Ticket.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Ticket deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
