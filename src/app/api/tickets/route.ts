import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Ticket from '@/models/Ticket';
import { requireTenantAuth, buildTenantFilter, DEFAULT_COMPANY_ID } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    let query: any = {};
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;

    const scopedQuery = buildTenantFilter(authResult.user!, query);
    const tickets = await Ticket.find(scopedQuery)
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name email avatar role');

    return NextResponse.json(tickets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const authUser = authResult.user!;

    await connectToDatabase();
    const body = await req.json();

    const companyId = authResult.companyId || (authResult.isSuperAdmin ? (body.company_id || DEFAULT_COMPANY_ID) : DEFAULT_COMPANY_ID);
    body.company_id = companyId;

    if (!body.customerName) {
      body.customerName = authUser?.name || 'Staff Member';
    }
    if (!body.customerEmail) {
      body.customerEmail = authUser?.email || 'staff@company.com';
    }

    if (!body.title) {
      return NextResponse.json(
        { error: 'Ticket title is required' },
        { status: 400 }
      );
    }

    const newTicket = await Ticket.create(body);
    const populated = await Ticket.findById(newTicket._id).populate(
      'assignedTo',
      'name email avatar role'
    );

    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
