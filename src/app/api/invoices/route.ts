import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Invoice from '@/models/Invoice';
import { requireRoles, requireTenantAuth, buildTenantFilter, DEFAULT_COMPANY_ID } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');

    let query: any = {};
    if (status && status !== 'all') query.status = status;
    if (projectId) query.projectId = projectId;

    const scopedQuery = buildTenantFilter(authResult.user!, query);
    const invoices = await Invoice.find(scopedQuery).sort({ createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'accounts', 'platform_super_admin']);
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
    const invoiceNumber = body.invoiceNumber || `INV-${new Date().getFullYear()}-${randomSuffix}`;

    const newInvoice = await Invoice.create({
      ...body,
      company_id: companyId,
      invoiceNumber,
      status: body.status || 'issued',
      issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
      dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 15 * 86400000),
      createdAt: new Date(),
    });

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
