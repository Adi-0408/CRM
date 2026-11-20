import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Company from '@/models/Company';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    await connectToDatabase();
    // Next.js 14/15 compatibility: params may be a Promise on Vercel
    const resolvedParams = await Promise.resolve(context.params);
    const slug = String(resolvedParams?.slug || '').trim().toLowerCase();

    if (!slug) {
      return NextResponse.json({ error: 'Company slug required' }, { status: 400 });
    }

    let company: any =
      (await Company.findOne({ slug })) ||
      (await Company.findById(slug)) ||
      (await Company.findOne({ id: slug })) ||
      (await Company.findById(`company_${slug.replace(/[^a-z0-9_]/g, '_')}`));

    // In-memory fallback if direct query didn't catch due to subtle indexing/casing
    if (!company) {
      const all = await Company.find();
      company = all.find(
        (c: any) =>
          String(c.slug || '').toLowerCase() === slug ||
          String(c._id || c.id || '').toLowerCase() === slug ||
          String(c.name || c.companyName || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-') === slug
      );
    }

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const compData = typeof company.toObject === 'function' ? company.toObject() : company;
    const name = compData.name || compData.companyName || compData.brand_name || compData.slug || 'Company';
    const brandName = compData.brand_name || name;

    // Return only non-sensitive public branding attributes
    return NextResponse.json({
      id: compData._id || compData.id,
      name,
      slug: compData.slug || slug,
      brand_name: brandName,
      logo_url: compData.logo_url || '',
      favicon_url: compData.favicon_url || '',
      primary_color: compData.primary_color || '#635BFF',
      accent_color: compData.accent_color || '#00D4B2',
      currency_code: compData.currency_code || 'INR',
      currency_symbol: compData.currency_symbol || '₹',
      timezone: compData.timezone || 'Asia/Kolkata',
      support_email: compData.support_email || '',
      phone: compData.phone || '',
      address: compData.address || '',
      status: compData.status || 'active',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
