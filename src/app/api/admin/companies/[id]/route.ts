/**
 * Super Admin — Single Company API
 * GET /api/admin/companies/[id] — Get company details
 * PATCH /api/admin/companies/[id] — Update company (name, status, planId, etc.)
 * DELETE /api/admin/companies/[id] — Suspend (soft delete) a company
 */
import { NextRequest, NextResponse } from 'next/server';
import { Company } from '@/models/Company';
import { CompanyMember } from '@/models/CompanyMember';
import { AuditLog } from '@/models/AuditLog';
import { getAuthUser } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isSuperAdmin(user: any): boolean {
  return (
    user?.platformRole === 'super_admin' ||
    user?.email === (process.env.SUPER_ADMIN_EMAIL || 'admin@crm.com')
  );
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    const company = await Company.findById(params.id);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const members = await CompanyMember.find({ companyId: params.id });

    return NextResponse.json({ success: true, company, members: members || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await req.json();
    const allowedFields = ['companyName', 'status', 'planId', 'subscriptionStatus', 'logo', 'primaryColor', 'industry'];
    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    const updated = await Company.findByIdAndUpdate(params.id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    await AuditLog.create({
      actorUid: user.id,
      actorName: user.name,
      companyId: params.id,
      action: 'company.updated',
      description: `Company updated by Super Admin. Fields: ${Object.keys(updateData).join(', ')}`,
      metadata: updateData,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, company: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    // Soft delete — just suspend the company, never hard delete
    const updated = await Company.findByIdAndUpdate(
      params.id,
      { status: 'suspended', subscriptionStatus: 'cancelled' },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    await AuditLog.create({
      actorUid: user.id,
      actorName: user.name,
      companyId: params.id,
      action: 'company.suspended',
      description: `Company "${updated.companyName}" suspended by Super Admin.`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Company suspended.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
