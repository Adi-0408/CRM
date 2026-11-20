import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import { requireRoles, requireTenantAuth, buildTenantFilter, DEFAULT_COMPANY_ID } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    let query: any = {};
    if (department && department !== 'all') query.department = department;

    const scopedQuery = buildTenantFilter(authResult.user!, query);
    const employees = await Employee.find(scopedQuery).sort({ name: 1 });
    return NextResponse.json(employees);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'hr', 'platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;
    const authUser = authResult.user!;

    await connectToDatabase();
    const body = await req.json();

    const companyId = authResult.companyId || (authResult.isSuperAdmin ? (body.company_id || DEFAULT_COMPANY_ID) : DEFAULT_COMPANY_ID);
    body.company_id = companyId;

    // Privilege check: HR can only create staff roles (accounts, sales, developers, support, intern)
    if (authUser.role === 'hr') {
      const targetRole = String(body.role || '').toLowerCase();
      if (targetRole === 'admin_manager' || targetRole === 'company_admin' || targetRole === 'hr' || targetRole === 'platform_super_admin') {
        return NextResponse.json(
          {
            error:
              'Forbidden: HR can only issue credentials for staff roles. Only Admin can create HR or Admin accounts.',
          },
          { status: 403 }
        );
      }
    }

    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const cleanEmail = String(body.email).trim().toLowerCase();
    const existing = await Employee.findOne({ email: cleanEmail, company_id: companyId });
    if (existing) {
      return NextResponse.json(
        { error: 'An employee account with this email address already exists in this organization.' },
        { status: 400 }
      );
    }

    body.email = cleanEmail;
    body.status = (body.status || 'active').toLowerCase();
    body.must_change_password = body.must_change_password !== undefined ? !!body.must_change_password : true;

    if (body.phone) {
      const cleanPhone = String(body.phone).replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return NextResponse.json(
          { error: 'Mobile number must be exactly 10 digits.' },
          { status: 400 }
        );
      }
      body.phone = cleanPhone;
    }

    if (!body.avatar) {
      body.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        body.name
      )}`;
    }

    if (body.salary && !body.baseSalary) {
      body.baseSalary = Number(body.salary);
    } else if (body.baseSalary && !body.salary) {
      body.salary = Number(body.baseSalary);
    } else if (!body.salary && !body.baseSalary) {
      body.salary = 45000;
      body.baseSalary = 45000;
    }

    if (body.joinDate) {
      try {
        body.joinDate = new Date(body.joinDate).toISOString();
      } catch {
        body.joinDate = new Date().toISOString();
      }
    } else {
      body.joinDate = new Date().toISOString();
    }

    const newEmp = await Employee.create(body);

    // Also sync credentials into User collection
    try {
      const { User } = await import('@/models/User');
      await User.updateOne(
        { email: newEmp.email, company_id: companyId },
        {
          $set: {
            company_id: companyId,
            name: newEmp.name,
            email: newEmp.email,
            password: (newEmp as any).password || 'crm@123',
            role: newEmp.role,
            department: newEmp.department,
            designation: newEmp.role,
            status: 'active',
            must_change_password: newEmp.must_change_password,
            avatar: {
              publicId: '',
              url: newEmp.avatar,
              secureUrl: newEmp.avatar,
            },
          },
        },
        { upsert: true }
      );
    } catch (uErr) {
      console.warn('Sync to User collection warning:', uErr);
    }

    return NextResponse.json(newEmp, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
