import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';
import Ticket from '@/models/Ticket';
import Employee from '@/models/Employee';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;

    const tickets = await Ticket.find(query)
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

    if (!body.title || !body.customerName || !body.customerEmail) {
      return NextResponse.json(
        { error: 'Title, customerName and customerEmail are required' },
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
