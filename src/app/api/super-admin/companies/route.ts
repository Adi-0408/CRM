import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Company from '@/models/Company';
import Employee from '@/models/Employee';
import User from '@/models/User';
import Branch from '@/models/Branch';
import { requireRoles, generateSlug } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Prism@${rand}`;
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, ['platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase().trim() || '';
    const status = searchParams.get('status')?.toLowerCase().trim() || 'all';

    const allCompanies = await Company.find().sort({ createdAt: -1 });

    // Filter companies in memory
    const filteredCompanies = allCompanies.filter((c: any) => {
      if (status !== 'all' && String(c.status).toLowerCase() !== status) {
        return false;
      }
      if (search) {
        const compName = (c.name || c.companyName || c.brand_name || '').toLowerCase();
        const slugMatch = (c.slug || '').toLowerCase().includes(search);
        const emailMatch = (c.support_email || '').toLowerCase().includes(search);
        const brandMatch = (c.brand_name || '').toLowerCase().includes(search);
        if (!compName.includes(search) && !slugMatch && !emailMatch && !brandMatch) {
          return false;
        }
      }
      return true;
    });

    // Populate user counts, branch counts, and admin details in parallel
    const enrichedCompanies = await Promise.all(
      filteredCompanies.map(async (comp: any) => {
        const compId = comp._id || comp.id;
        const compData = typeof comp.toObject === 'function' ? comp.toObject() : comp;
        const normalizedName = compData.name || compData.companyName || compData.brand_name || compData.slug || 'Company';
        const normalizedBrandName = compData.brand_name || normalizedName;

        const [userCount, branchCount, adminEmp] = await Promise.all([
          Employee.countDocuments({ company_id: compId }),
          Branch.countDocuments({ company_id: compId }),
          Employee.findOne({
            company_id: compId,
            role: { $in: ['company_admin', 'admin_manager', 'admin'] },
          }),
        ]);

        return {
          ...compData,
          id: compId,
          _id: compId,
          name: normalizedName,
          companyName: normalizedName,
          brand_name: normalizedBrandName,
          slug: compData.slug || compId,
          status: compData.status || 'active',
          userCount,
          branchCount,
          admin: adminEmp
            ? {
                id: adminEmp._id || adminEmp.id,
                name: adminEmp.name,
                email: adminEmp.email,
                phone: adminEmp.phone || '',
                must_change_password: !!adminEmp.must_change_password,
              }
            : null,
        };
      })
    );

    // Compute platform-wide KPI statistics
    const totalCompanies = allCompanies.length;
    const activeCompanies = allCompanies.filter((c: any) => String(c.status).toLowerCase() === 'active').length;
    const suspendedCompanies = allCompanies.filter((c: any) => String(c.status).toLowerCase() === 'suspended').length;
    const totalPlatformUsers = await Employee.countDocuments({ role: { $ne: 'platform_super_admin' } });

    return NextResponse.json({
      success: true,
      companies: enrichedCompanies,
      stats: {
        totalCompanies,
        activeCompanies,
        suspendedCompanies,
        totalPlatformUsers,
      },
    });
  } catch (error: any) {
    console.error('Super Admin GET companies error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, ['platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const body = await req.json();

    const {
      name,
      slug: customSlug,
      adminName,
      adminEmail,
      adminPassword,
      phone,
      address,
      brand_name,
      primary_color,
      accent_color,
      currency_code,
      currency_symbol,
      timezone,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Company Name is required' }, { status: 400 });
    }
    if (!adminEmail || !adminEmail.trim()) {
      return NextResponse.json({ error: 'Company Admin Email is required' }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanAdminEmail = adminEmail.trim().toLowerCase();
    const cleanAdminName = adminName?.trim() || `${cleanName} Admin`;
    const cleanPassword = (adminPassword && adminPassword.trim()) ? adminPassword.trim() : generateRandomPassword();

    // Generate and validate slug
    let candidateSlug = customSlug?.trim()
      ? customSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-')
      : cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/^-+|-+$/g, '');

    if (!candidateSlug) {
      candidateSlug = `company-${Date.now().toString(36)}`;
    }

    const existingSlug = await Company.findOne({ slug: candidateSlug });
    if (existingSlug) {
      return NextResponse.json(
        { error: `The slug '${candidateSlug}' is already taken by another company. Please specify a unique slug.` },
        { status: 400 }
      );
    }

    // Check if admin email already exists
    const existingEmployee = await Employee.findOne({ email: cleanAdminEmail });
    if (existingEmployee) {
      return NextResponse.json(
        { error: `An account with email '${cleanAdminEmail}' already exists in the system.` },
        { status: 400 }
      );
    }

    const newCompanyId = `company_${candidateSlug.replace(/[^a-z0-9_]/g, '_')}`;

    // 1. Create Company Document
    const newCompany = await Company.create({
      _id: newCompanyId,
      id: newCompanyId,
      name: cleanName,
      slug: candidateSlug,
      status: 'active',
      brand_name: brand_name?.trim() || cleanName,
      logo_url: body.logo_url || '',
      favicon_url: body.favicon_url || '',
      primary_color: primary_color || '#635BFF',
      accent_color: accent_color || '#00D4B2',
      currency_code: currency_code || 'INR',
      currency_symbol: currency_symbol || '₹',
      timezone: timezone || 'Asia/Kolkata',
      support_email: cleanAdminEmail,
      phone: phone?.trim() || '',
      address: address?.trim() || 'Central Office',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 2. Create Default Central HQ Branch for Company
    const branchId = `branch_${candidateSlug}_hq`;
    await Branch.create({
      _id: branchId,
      id: branchId,
      company_id: newCompanyId,
      name: `${cleanName} HQ`,
      city: 'Headquarters',
      address: address?.trim() || 'Main Office',
      manager: cleanAdminName,
      email: cleanAdminEmail,
      phone: phone?.trim() || '',
      activeEmployees: '1 active staff',
      status: 'Head Office',
      isHeadOffice: true,
      lat: 16.84582,
      lng: 74.60055,
      radius_meters: 250,
      createdAt: new Date(),
    });

    // 3. Atomically Create Company Admin in Employee and User
    const adminId = `emp_${candidateSlug}_admin`;
    const newAdminEmp = await Employee.create({
      _id: adminId,
      id: adminId,
      company_id: newCompanyId,
      name: cleanAdminName,
      email: cleanAdminEmail,
      password: cleanPassword,
      role: 'company_admin',
      department: 'Executive Management',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanAdminName)}`,
      salary: 100000,
      baseSalary: 100000,
      status: 'active',
      must_change_password: true,
      phone: phone?.trim() || '',
      joinDate: new Date().toISOString(),
      createdAt: new Date(),
    });

    await User.create({
      _id: adminId,
      id: adminId,
      company_id: newCompanyId,
      name: cleanAdminName,
      email: cleanAdminEmail,
      password: cleanPassword,
      role: 'company_admin',
      department: 'Executive Management',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanAdminName)}`,
      salary: 100000,
      baseSalary: 100000,
      status: 'active',
      must_change_password: true,
      phone: phone?.trim() || '',
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: `Company '${cleanName}' and Admin account provisioned successfully.`,
        company: newCompany,
        admin: {
          id: adminId,
          name: cleanAdminName,
          email: cleanAdminEmail,
          password: cleanPassword,
          role: 'company_admin',
          must_change_password: true,
        },
        loginUrl: '/login',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Super Admin POST companies error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create company' }, { status: 500 });
  }
}
