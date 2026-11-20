import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Inquiry from '@/models/Inquiry';
import { requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['platform_super_admin', 'company_admin', 'admin_manager']);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const resolvedParams = await Promise.resolve(context.params);
    const id = String(resolvedParams?.id || '').trim();

    if (!id) {
      return NextResponse.json({ error: 'Inquiry ID required' }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await Inquiry.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    const body = await req.json();
    const updates: Record<string, any> = {};

    // Whitelist only status and adminNotes
    if (body.status !== undefined) {
      const validStatuses = ['new', 'contacted', 'closed'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (body.adminNotes !== undefined) {
      updates.adminNotes = String(body.adminNotes || '').trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided to update.' }, { status: 400 });
    }

    updates.updatedAt = new Date().toISOString();

    const updated = await Inquiry.findByIdAndUpdate(id, updates);

    return NextResponse.json({ ok: true, inquiry: updated });
  } catch (error: any) {
    console.error('Super Admin inquiry PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update inquiry' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['platform_super_admin', 'company_admin', 'admin_manager']);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const resolvedParams = await Promise.resolve(context.params);
    const id = String(resolvedParams?.id || '').trim();

    if (!id) {
      return NextResponse.json({ error: 'Inquiry ID required' }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await Inquiry.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    await Inquiry.findByIdAndDelete(id);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Super Admin inquiry DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete inquiry' }, { status: 500 });
  }
}
