/**
 * Company Self-Registration & Onboarding API
 * POST /api/auth/register
 *
 * Creates:
 * 1. Company
 * 2. CompanyDomain
 * 3. 30-day Trial Subscription
 * 4. Company Admin (Employee)
 * 5. CompanyMember
 * 6. AuditLog
 *
 * Signs the user in with a JWT cookie and returns the company context.
 */
import { NextRequest, NextResponse } from 'next/server';
import { Company } from '@/models/Company';
import { CompanyDomain } from '@/models/CompanyDomain';
import { CompanyMember } from '@/models/CompanyMember';
import { Subscription } from '@/models/Subscription';
import { Plan } from '@/models/Plan';
import { AuditLog } from '@/models/AuditLog';
import Employee from '@/models/Employee';
import { connectToDatabase } from '@/lib/db';
import { signJWT, buildSessionCookie } from '@/lib/jwt';
import { hashPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, slug, adminName, adminEmail, password, industry, phone } = body;

    if (!companyName || !slug || !adminName || !adminEmail || !password) {
      return NextResponse.json(
        { error: 'All fields (companyName, slug, adminName, adminEmail, password) are required.' },
        { status: 400 }
      );
    }

    const cleanSlug = String(slug)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');

    if (cleanSlug.length < 3) {
      return NextResponse.json(
        { error: 'Company code must be at least 3 characters.' },
        { status: 400 }
      );
    }

    const reserved = ['admin', 'superadmin', 'api', 'www', 'mail', 'support', 'help', 'app'];
    if (reserved.includes(cleanSlug)) {
      return NextResponse.json(
        { error: `Company code "${cleanSlug}" is reserved. Please pick another one.` },
        { status: 400 }
      );
    }

    const cleanEmail = String(adminEmail).trim().toLowerCase();

    await connectToDatabase();

    // Check slug uniqueness
    const existingCompany = await Company.findOne({ slug: cleanSlug });
    if (existingCompany) {
      return NextResponse.json(
        { error: `Company code "${cleanSlug}" is already taken.` },
        { status: 409 }
      );
    }

    // Check email uniqueness
    const existingEmp = await Employee.findOne({ email: cleanEmail });
    if (existingEmp) {
      return NextResponse.json(
        { error: `An account with email "${cleanEmail}" already exists. Please log in instead.` },
        { status: 409 }
      );
    }

    // Find default plan or fallback
    let planId = 'plan-enterprise';
    const plan = await Plan.findById(planId);
    if (!plan) {
      const anyPlan = await Plan.findOne();
      if (anyPlan) planId = String(anyPlan._id || anyPlan.id);
    }

    // 1. Create Company
    const company = await Company.create({
      companyName: companyName.trim(),
      slug: cleanSlug,
      ownerUid: '', // updated after employee is created
      status: 'active',
      planId,
      subscriptionStatus: 'trial',
      primaryColor: '#4F46E5',
      industry: industry || 'Technology',
    });
    const companyId = String(company._id || company.id);

    // 2. Create CompanyDomain
    await CompanyDomain.create({
      companyId,
      slug: cleanSlug,
      isActive: true,
    });

    // 3. Create 30-Day Trial Subscription
    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 30);

    await Subscription.create({
      companyId,
      planId,
      status: 'trial',
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      paymentStatus: 'pending',
      autoRenew: false,
    });

    // 4. Create Admin Employee
    const employee = await Employee.create({
      name: adminName.trim(),
      email: cleanEmail,
      password: hashPassword(String(password).trim()),
      phone: phone || '',
      role: 'admin_manager',
      department: 'Executive Management',
      status: 'active',
      salary: 100000,
      baseSalary: 100000,
      companyId,
    });
    const employeeId = String(employee._id || employee.id);

    // Update Company ownerUid
    await Company.findByIdAndUpdate(companyId, { ownerUid: employeeId });

    // 5. Create CompanyMember
    await CompanyMember.create({
      companyId,
      uid: employeeId,
      employeeId,
      role: 'admin_manager',
      isActive: true,
      joinedAt: new Date().toISOString(),
    });

    // 6. AuditLog
    await AuditLog.create({
      actorUid: employeeId,
      actorName: adminName,
      companyId,
      action: 'company.registered',
      description: `New company "${companyName}" self-registered by ${adminEmail} (slug: ${cleanSlug}).`,
      timestamp: new Date().toISOString(),
    });

    // 7. Generate JWT & Set Session Cookie
    const token = await signJWT({
      userId: employeeId,
      email: cleanEmail,
      name: adminName,
      role: 'admin_manager',
      companyId,
      department: 'Executive Management',
      isDemo: false,
    });

    const sessionCookie = buildSessionCookie(token);

    const res = NextResponse.json({
      success: true,
      message: 'Company registered successfully!',
      company: {
        id: companyId,
        companyName: company.companyName,
        slug: cleanSlug,
      },
      user: {
        id: employeeId,
        name: adminName,
        email: cleanEmail,
        role: 'admin_manager',
        department: 'Executive Management',
        companyId,
      },
      token: `token_${employeeId}_${Date.now()}`,
    });

    res.headers.set('Set-Cookie', sessionCookie);
    return res;
  } catch (error: any) {
    console.error('[Register API Error]:', error);
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
