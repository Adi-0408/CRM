import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getAuthUser } from '@/lib/apiAuth';
import { withTenantScope, stampTenantPayload } from '@/lib/tenantScope';

export const dynamic = 'force-dynamic';
import Ticket from '@/models/Ticket';
import Employee from '@/models/Employee';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;

    const scopedQuery = withTenantScope(query, authUser);
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
    await connectToDatabase();
    const body = await req.json();
    const authUser = await getAuthUser(req);

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

    const payload = stampTenantPayload(body, authUser);
    const newTicket = await Ticket.create(payload);
    const populated = await Ticket.findById(newTicket._id).populate(
      'assignedTo',
      'name email avatar role'
    );

    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
