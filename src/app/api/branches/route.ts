import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Branch from '@/models/Branch';
import { getAuthUser } from '@/lib/apiAuth';
import { withTenantScope, stampTenantPayload } from '@/lib/tenantScope';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    await connectToDatabase();
    const scopedQuery = withTenantScope({}, authUser);
    let branches = await Branch.find(scopedQuery).sort({ isHeadOffice: -1, createdAt: 1 });

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
    const authUser = await getAuthUser(req);
    await connectToDatabase();
    const body = await req.json();

    if (!body.name || !body.city || !body.address) {
      return NextResponse.json(
        { error: 'Name, City, and Address are required' },
        { status: 400 }
      );
    }

    if (body.phone) {
      const cleanPhone = String(body.phone).replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return NextResponse.json(
          { error: 'Phone number must be exactly 10 digits.' },
          { status: 400 }
        );
      }
      body.phone = cleanPhone;
    }

    // If marked as head office, unset head office flag on others
    if (body.isHeadOffice || body.status === 'Head Office') {
      body.isHeadOffice = true;
      body.status = 'Head Office';
      await Branch.updateMany({}, { isHeadOffice: false });
    }

    const payload = stampTenantPayload(body, authUser);
    const newBranch = await Branch.create(payload);
    return NextResponse.json(newBranch, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
