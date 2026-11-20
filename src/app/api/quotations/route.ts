import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Quotation from '@/models/Quotation';
import Lead from '@/models/Lead';
import { requireRoles, requireTenantAuth, buildTenantFilter, DEFAULT_COMPANY_ID } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const leadId = searchParams.get('leadId');

    let query: any = {};
    if (status && status !== 'all') query.status = status;
    if (leadId) query.leadId = leadId;

    const scopedQuery = buildTenantFilter(authResult.user!, query);
    const quotations = await Quotation.find(scopedQuery).sort({ createdAt: -1 });
    return NextResponse.json(quotations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'sales', 'platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    const tenantCompanyId = authResult.companyId || DEFAULT_COMPANY_ID;
    await connectToDatabase();

    const deleteFilter = authResult.isSuperAdmin ? {} : { company_id: tenantCompanyId };
    await Quotation.deleteMany(deleteFilter);

    return NextResponse.json({ success: true, message: 'Quotations cleared for organization' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'sales', 'platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const body = await req.json();

    const companyId = authResult.companyId || (authResult.isSuperAdmin ? (body.company_id || DEFAULT_COMPANY_ID) : DEFAULT_COMPANY_ID);
    body.company_id = companyId;

    if (!body.clientCompany) {
      return NextResponse.json(
        { error: 'Client company name is required' },
        { status: 400 }
      );
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const quotationNumber =
      body.quotationNumber || `QT-${new Date().getFullYear()}-${randomSuffix}`;

    const newQuotation = await Quotation.create({
      ...body,
      company_id: companyId,
      quotationNumber,
      status: body.status || 'sent',
      issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
      validUntil: body.validUntil
        ? new Date(body.validUntil)
        : new Date(Date.now() + 30 * 86400000), // Default 30 days validity
      createdBy: authResult.user?.name || 'Sales Representative',
      createdAt: new Date(),
    });

    // If linked to a lead in the same company, update lead quotation info & advance stage to 'proposal'
    if (body.leadId) {
      try {
        const lead = await Lead.findById(body.leadId);
        if (lead && (authResult.isSuperAdmin || lead.company_id === companyId)) {
          const updates: any = {
            quotationId: newQuotation._id || newQuotation.id,
            quotationNumber,
          };
          if (!lead.value || lead.value === 0) {
            updates.value = body.totalAmount || 0;
          }
          if (lead.status === 'new' || lead.status === 'contacted' || lead.status === 'qualified') {
            updates.status = 'proposal';
          }
          await Lead.findByIdAndUpdate(body.leadId, updates);
        }
      } catch (leadErr) {
        console.warn('Failed to update linked lead with quotation info:', leadErr);
      }
    }

    return NextResponse.json(newQuotation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
