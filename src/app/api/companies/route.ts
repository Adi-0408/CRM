import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Company from '@/models/Company';
import { requireRoles, requireTenantAuth, DEFAULT_COMPANY_ID } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();

    // Super Admin gets all companies; Tenant users get only their own company
    if (authResult.isSuperAdmin) {
      const companies = await Company.find().sort({ createdAt: -1 });
      return NextResponse.json(companies);
    }

    const companyId = authResult.companyId || DEFAULT_COMPANY_ID;
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json([company]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Only platform super admin can provision new companies in Phase 1
    const authResult = await requireRoles(req, ['platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const body = await req.json();

    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Company name and unique slug are required' },
        { status: 400 }
      );
    }

    const cleanSlug = String(body.slug).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const existing = await Company.findOne({ slug: cleanSlug });
    if (existing) {
      return NextResponse.json(
        { error: 'A company with this slug already exists.' },
        { status: 400 }
      );
    }

    const newCompany = await Company.create({
      name: body.name.trim(),
      slug: cleanSlug,
      status: body.status || 'active',
      brand_name: body.brand_name || body.name,
      logo_url: body.logo_url || '',
      favicon_url: body.favicon_url || '',
      primary_color: body.primary_color || '#635BFF',
      accent_color: body.accent_color || '#00D4B2',
      currency_code: body.currency_code || 'INR',
      currency_symbol: body.currency_symbol || '₹',
      timezone: body.timezone || 'Asia/Kolkata',
      support_email: body.support_email || '',
      phone: body.phone || '',
      address: body.address || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
