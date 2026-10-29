import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Branch from '@/models/Branch';

export async function GET() {
  try {
    await connectToDatabase();
    let branches = await Branch.find({}).sort({ isHeadOffice: -1, createdAt: 1 });

    // Seed default Sangli Head Office if none exist
    if (branches.length === 0) {
      const defaultHeadOffice = await Branch.create({
        name: 'Sangli Head Office (Central HQ)',
        city: 'Sangli, Maharashtra',
        address: 'Unique Digital Services Complex, Chandani Chowk, Sangli, Maharashtra 416416',
        manager: 'Aditya Patil',
        email: 'headoffice@uniquedigital.com',
        phone: '+91 98230 41320',
        activeEmployees: 'All Core Staff (4+ Members)',
        status: 'Head Office',
        isHeadOffice: true,
      });
      branches = [defaultHeadOffice];
    }

    return NextResponse.json(branches);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.name || !body.city || !body.address) {
      return NextResponse.json(
        { error: 'Name, City, and Address are required' },
        { status: 400 }
      );
    }

    // If marked as head office, unset head office flag on others
    if (body.isHeadOffice || body.status === 'Head Office') {
      body.isHeadOffice = true;
      body.status = 'Head Office';
      await Branch.updateMany({}, { isHeadOffice: false });
    }

    const newBranch = await Branch.create(body);
    return NextResponse.json(newBranch, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
