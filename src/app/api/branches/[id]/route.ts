import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Branch from '@/models/Branch';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (body.isHeadOffice || body.status === 'Head Office') {
      body.isHeadOffice = true;
      body.status = 'Head Office';
      await Branch.updateMany({ _id: { $ne: params.id } }, { isHeadOffice: false });
    }

    const updated = await Branch.findByIdAndUpdate(params.id, body, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
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
    await connectToDatabase();
    const branch = await Branch.findById(params.id);

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Safety check: ensure at least one office remains
    const totalCount = await Branch.countDocuments();
    if (totalCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the only office location. Please edit it instead.' },
        { status: 400 }
      );
    }

    await Branch.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: 'Branch deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
