import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import { requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const query: any = {};
    if (department && department !== 'all') query.department = department;

    const employees = await Employee.find(query).sort({ name: 1 });
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

    body.email = cleanEmail;
    body.status = (body.status || 'active').toLowerCase();

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

    const newEmp = await Employee.create(body);

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
