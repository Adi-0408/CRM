import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Invoice from '@/models/Invoice';
import { getAuthUser, requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');

    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (projectId) query.projectId = projectId;

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Only Admin (Manager) and Accounts can generate invoices
    const authResult = await requireRoles(req, ['admin_manager', 'accounts']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const body = await req.json();

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
