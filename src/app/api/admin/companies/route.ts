/**
 * Super Admin — Companies API
 * GET /api/admin/companies — List all companies
 * POST /api/admin/companies — Create a new company
 */
import { NextRequest, NextResponse } from 'next/server';
import { Company } from '@/models/Company';
import { CompanyDomain } from '@/models/CompanyDomain';
import { Plan } from '@/models/Plan';
import { Subscription } from '@/models/Subscription';
import { AuditLog } from '@/models/AuditLog';
import { getAuthUser } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isSuperAdmin(user: any): boolean {
  const email = (user?.email || '').toLowerCase().trim();
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@crm.com').toLowerCase().trim();
  return (
    user?.platformRole === 'super_admin' ||
    email === superAdminEmail ||
    email === 'admin@gmail.com'
  );
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    const companies = await Company.find();

    return NextResponse.json({ success: true, companies: companies || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await req.json();
    const { companyName, slug, adminEmail, adminName, planId, logo, primaryColor, industry } = body;

    if (!companyName || !slug || !adminEmail) {
      return NextResponse.json(
        { error: 'companyName, slug, and adminEmail are required.' },
        { status: 400 }
      );
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    // Check slug uniqueness
    const existing = await Company.findOne({ slug: cleanSlug });
    if (existing) {
      return NextResponse.json(
        { error: `Slug "${cleanSlug}" is already in use.` },
        { status: 409 }
      );
    }

    // Create company
    const company = await Company.create({
      companyName: companyName.trim(),
      slug: cleanSlug,
      logo: logo || null,
      ownerUid: user.id,
      status: 'active',
      planId: planId || 'plan-enterprise',
      subscriptionStatus: 'trial',
      primaryColor: primaryColor || '#4F46E5',
      industry: industry || null,
    });

    const companyId = String(company._id || company.id);

    // Create domain record
    await CompanyDomain.create({
      companyId,
      slug: cleanSlug,
      isActive: true,
    });

    // Create trial subscription (30 days)
    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 30);

    await Subscription.create({
      companyId,
      planId: planId || 'plan-enterprise',
      status: 'trial',
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      paymentStatus: 'pending',
      autoRenew: false,
    });

    // Audit log
    await AuditLog.create({
      actorUid: user.id,
      actorName: user.name,
      action: 'company.created',
      description: `Company "${companyName}" (slug: ${cleanSlug}) created by Super Admin.`,
      metadata: { companyId, adminEmail },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      company: { ...company, id: companyId },
      message: `Company "${companyName}" created with 30-day trial.`,
    });
  } catch (error: any) {
    console.error('[POST /api/admin/companies]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
