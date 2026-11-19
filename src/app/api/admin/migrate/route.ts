/**
 * Data Migration API — Phase 3
 *
 * POST /api/admin/migrate
 * - Creates the default "ITPL" company if it doesn't exist
 * - Creates the default subscription plan
 * - Assigns all existing employees to the default company
 * - Creates CompanyDomain record for slug "itpl"
 *
 * This is ADDITIVE only. No data is deleted or renamed.
 * Idempotent — safe to run multiple times.
 *
 * Access: Only the SUPER_ADMIN_EMAIL from environment can run this.
 */
import { NextRequest, NextResponse } from 'next/server';
import { Company } from '@/models/Company';
import { CompanyDomain } from '@/models/CompanyDomain';
import { CompanyMember } from '@/models/CompanyMember';
import { Plan } from '@/models/Plan';
import { Subscription } from '@/models/Subscription';
import Employee from '@/models/Employee';
import { connectToDatabase } from '@/lib/db';
import { getAuthUser } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@crm.com';
const DEFAULT_COMPANY_ID = 'itpl-default';
const DEFAULT_COMPANY_SLUG = 'itpl';

export async function POST(req: NextRequest) {
  try {
    // Only super admin can run migration
    const user = await getAuthUser(req);
    if (!user || (user.email !== SUPER_ADMIN_EMAIL && user.platformRole !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Only Super Admin can run data migration.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    let body: any = {};
    try { body = await req.json(); } catch {}

    const targetCompanyName = body.companyName?.trim() || 'Primary Enterprise';
    const targetSlug = (body.slug?.trim() || 'primary').toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const targetCompanyId = `company-${targetSlug}`;

    const results: string[] = [];

    // ── Step 1: Create default Plan ───────────────────────────────────────────
    const existingPlan = await Plan.findById('plan-enterprise');
    if (!existingPlan) {
      await Plan.create({
        _id: 'plan-enterprise',
        name: 'Enterprise',
        description: 'Full access to all CRM modules — unlimited users and leads.',
        price: 0,
        billingCycle: 'monthly',
        maxUsers: -1,
        maxLeads: -1,
        storageLimit: -1,
        enabledModules: [
          'tasks', 'leads', 'projects', 'attendance', 'payroll',
          'leave', 'support', 'employees', 'management', 'branches',
          'standups', 'notifications', 'invoices', 'quotations',
        ],
        isActive: true,
        sortOrder: 3,
      });
      results.push('✅ Created default Enterprise plan.');
    } else {
      results.push('⏭️ Enterprise plan already exists.');
    }

    // ── Step 2: Create default Company ────────────────────────────────────────
    const existingCompany = await Company.findById(targetCompanyId);
    if (!existingCompany) {
      await Company.create({
        _id: targetCompanyId,
        companyName: targetCompanyName,
        slug: targetSlug,
        ownerUid: user.id,
        status: 'active',
        planId: 'plan-enterprise',
        subscriptionStatus: 'active',
        primaryColor: '#4F46E5',
      });
      results.push(`✅ Created company "${targetCompanyName}".`);
    } else {
      results.push(`⏭️ Company "${targetCompanyName}" already exists.`);
    }

    // ── Step 3: Create CompanyDomain record ───────────────────────────────────
    const existingDomain = await CompanyDomain.findOne({ slug: targetSlug });
    if (!existingDomain) {
      await CompanyDomain.create({
        companyId: targetCompanyId,
        slug: targetSlug,
        isActive: true,
      });
      results.push(`✅ Created CompanyDomain for slug "${targetSlug}".`);
    } else {
      results.push(`⏭️ CompanyDomain "${targetSlug}" already exists.`);
    }

    // ── Step 4: Create default Subscription ──────────────────────────────────
    const existingSub = await Subscription.findOne({ companyId: targetCompanyId });
    if (!existingSub) {
      const start = new Date();
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 10); // 10-year "lifetime" plan for internal use
      await Subscription.create({
        companyId: targetCompanyId,
        planId: 'plan-enterprise',
        status: 'active',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        paymentStatus: 'paid',
        autoRenew: false,
      });
      results.push(`✅ Created active subscription for "${targetCompanyName}".`);
    } else {
      results.push(`⏭️ Subscription already exists for "${targetCompanyName}".`);
    }

    // ── Step 5: Assign all existing employees to the default company ──────────
    let migratedCount = 0;
    let skippedCount = 0;

    const allEmployees = await Employee.find();
    for (const emp of (allEmployees || [])) {
      const empId = String(emp._id || emp.id);

      // Check if already has companyId
      if ((emp as any).companyId) {
        skippedCount++;
        continue;
      }

      // Add companyId to the employee document
      await Employee.findByIdAndUpdate(empId, { companyId: targetCompanyId });

      // Create CompanyMember record if not exists
      const existingMember = await CompanyMember.findOne({ employeeId: empId });
      if (!existingMember) {
        await CompanyMember.create({
          companyId: targetCompanyId,
          uid: empId,
          employeeId: empId,
          role: emp.role || 'intern',
          isActive: true,
          joinedAt: emp.createdAt || new Date().toISOString(),
        });
        migratedCount++;
      } else {
        skippedCount++;
      }
    }

    results.push(`✅ Migrated ${migratedCount} employees to "${targetCompanyName}". ${skippedCount} already migrated.`);

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully.',
      results,
    });
  } catch (error: any) {
    console.error('[Migration] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed.' },
      { status: 500 }
    );
  }
}
