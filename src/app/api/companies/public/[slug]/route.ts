import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Company from '@/models/Company';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectToDatabase();
    const slug = String(params.slug || '').trim().toLowerCase();

    if (!slug) {
      return NextResponse.json({ error: 'Company slug required' }, { status: 400 });
    }

    const company =
      (await Company.findOne({ slug })) ||
      (await Company.findById(slug));

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Return only non-sensitive public branding attributes
    return NextResponse.json({
      name: company.name,
      slug: company.slug,
      brand_name: company.brand_name || company.name,
      logo_url: company.logo_url || '',
      favicon_url: company.favicon_url || '',
      primary_color: company.primary_color || '#635BFF',
      accent_color: company.accent_color || '#00D4B2',
      currency_code: company.currency_code || 'INR',
      currency_symbol: company.currency_symbol || '₹',
      timezone: company.timezone || 'Asia/Kolkata',
      support_email: company.support_email || '',
      phone: company.phone || '',
      address: company.address || '',
      status: company.status || 'active',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
