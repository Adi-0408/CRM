import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import { requireRoles, getAuthUser } from '@/lib/apiAuth';
import { withTenantScope, stampTenantPayload } from '@/lib/tenantScope';
import { CompanyMember } from '@/models/CompanyMember';
import { checkPlanLimit } from '@/lib/subscriptionGating';
import { hashPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const query: any = {};
    if (department && department !== 'all') query.department = department;

    const scopedQuery = withTenantScope(query, user);
    const employees = await Employee.find(scopedQuery).sort({ name: 1 });
    return NextResponse.json(employees);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'hr']);
    if (authResult.errorResponse) return authResult.errorResponse;
    const authUser = authResult.user!;

    await connectToDatabase();
    const body = await req.json();

    // Privilege check: HR can only create staff roles (accounts, sales, developers, support, intern)
    if (authUser.role === 'hr') {
      const targetRole = String(body.role || '').toLowerCase();
      if (targetRole === 'admin_manager' || targetRole === 'hr') {
        return NextResponse.json(
          {
            error:
              'Forbidden: HR can only issue credentials for staff roles. Only Admin (Manager) can create HR or Admin accounts.',
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
    const existing = await Employee.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { error: 'An employee account with this email address already exists.' },
        { status: 400 }
      );
    }

    // Check Plan Limits (maxUsers)
    const currentEmpCount = await Employee.countDocuments(withTenantScope({}, authUser));
    const limitCheck = await checkPlanLimit(authUser, 'users', currentEmpCount);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.error || 'User limit reached for your subscription plan.' },
        { status: 403 }
      );
    }

    if (body.password) {
      body.password = hashPassword(String(body.password).trim());
    } else {
      body.password = hashPassword('pass123');
    }

    body.email = cleanEmail;
    body.status = (body.status || 'active').toLowerCase();

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

    const payload = stampTenantPayload(body, authUser);
    const newEmp = await Employee.create(payload);
    const empId = String(newEmp._id || newEmp.id);

    // Create CompanyMember link
    try {
      await CompanyMember.create({
        companyId: authUser.companyId || 'itpl-default',
        uid: empId,
        employeeId: empId,
        role: newEmp.role,
        isActive: true,
        joinedAt: new Date().toISOString(),
      });
    } catch (mErr) {
      console.warn('CompanyMember creation warning:', mErr);
    }

    // Also sync credentials into User collection
    try {
      const { User } = await import('@/models/User');
      await User.updateOne(
        { email: newEmp.email },
        {
          $set: {
            name: newEmp.name,
            email: newEmp.email,
            password: (newEmp as any).password || 'crm@123',
            role: newEmp.role,
            department: newEmp.department,
            designation: newEmp.role,
            status: 'active',
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
