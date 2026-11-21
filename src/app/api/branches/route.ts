import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Branch from '@/models/Branch';
import { requireTenantAuth, requireRoles, DEFAULT_COMPANY_ID, buildTenantFilter } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    await connectToDatabase();
    const filter = buildTenantFilter(authResult.user!);
    let branches = await Branch.find(filter).sort({ isHeadOffice: -1, createdAt: 1 });

    // Seed default Head Office if none exist for this tenant
    if (branches.length === 0 && authResult.companyId) {
      const CompanyModel = (await import('@/models/Company')).default;
      const comp = await CompanyModel.findById(authResult.companyId);

      const defaultHeadOffice = await Branch.create({
        company_id: authResult.companyId,
        name: comp?.name ? `${comp.name} HQ` : 'Corporate Head Office',
        city: comp?.address ? comp.address.split(',')[0].trim() : 'Central Office',
        address: comp?.address || 'Corporate Headquarters, Business Park',
        manager: authResult.user?.name || 'Admin',
        email: comp?.support_email || authResult.user?.email || 'admin@crm.com',
        phone: comp?.phone ? String(comp.phone).replace(/\D/g, '').slice(-10) : '9999900000',
        activeEmployees: 'All Core Staff',
        status: 'Head Office',
        isHeadOffice: true,
        lat: 16.84582,
        lng: 74.60055,
        radius_meters: 250,
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
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'platform_super_admin']);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    await connectToDatabase();
    const body = await req.json();

    if (!body.name || !body.city || !body.address) {
      return NextResponse.json(
        { error: 'Name, City, and Address are required' },
        { status: 400 }
      );
    }

    const tenantCompanyId = authResult.companyId || (authResult.isSuperAdmin ? (body.company_id || DEFAULT_COMPANY_ID) : DEFAULT_COMPANY_ID);
    body.company_id = tenantCompanyId;

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

    // Default geofence if not provided
    if (body.lat === undefined) body.lat = 16.84582;
    if (body.lng === undefined) body.lng = 74.60055;
    if (body.radius_meters === undefined) body.radius_meters = 250;

    // If marked as head office, unset head office flag ONLY on this company's branches
    if (body.isHeadOffice || body.status === 'Head Office') {
      body.isHeadOffice = true;
      body.status = 'Head Office';
      await Branch.updateMany({ company_id: tenantCompanyId }, { isHeadOffice: false });
    }

    const newBranch = await Branch.create(body);
    return NextResponse.json(newBranch, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
