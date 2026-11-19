/**
 * Plans API
 * GET /api/admin/plans — List all plans (super admin only)
 * POST /api/admin/plans — Create a new plan (super admin only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { Plan } from '@/models/Plan';
import { getAuthUser } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isSuperAdmin(user: any): boolean {
  return (
    user?.platformRole === 'super_admin' ||
    user?.email === (process.env.SUPER_ADMIN_EMAIL || 'admin@crm.com')
  );
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    // Plans are readable by anyone (needed for pricing/registration pages)
    const plans = await Plan.find({ isActive: true });
    return NextResponse.json({ success: true, plans: plans || [] });
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
    const { name, description, price, billingCycle, maxUsers, maxLeads, storageLimit, enabledModules, sortOrder } = body;

    if (!name || price === undefined || !billingCycle) {
      return NextResponse.json(
        { error: 'name, price, and billingCycle are required.' },
        { status: 400 }
      );
    }

    const plan = await Plan.create({
      name: name.trim(),
      description: description || '',
      price: Number(price),
      billingCycle,
      maxUsers: maxUsers ?? -1,
      maxLeads: maxLeads ?? -1,
      storageLimit: storageLimit ?? -1,
      enabledModules: enabledModules || [],
      isActive: true,
      sortOrder: sortOrder ?? 1,
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
