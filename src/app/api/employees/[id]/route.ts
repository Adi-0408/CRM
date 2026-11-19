import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import { getAuthUser, requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    const body = await req.json();

    const isSelf = authUser && (authUser.id === params.id || authUser.email === body.email);
    const isAdminOrHR = authUser?.role === 'admin_manager' || authUser?.role === 'hr';

    // If updating sensitive fields (role, status, salary, baseSalary, password), must be admin or hr
    const hasSensitiveFields =
      body.role !== undefined ||
      body.status !== undefined ||
      body.salary !== undefined ||
      body.baseSalary !== undefined ||
      body.password !== undefined;

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

    if (hasSensitiveFields && !isAdminOrHR) {
      return NextResponse.json(
        { error: 'Forbidden: Only HR and Admin (Manager) can update employee credentials, status, and role.' },
        { status: 403 }
      );
    }

    if (!isSelf && !isAdminOrHR) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const updated = await Employee.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Only Admin (Manager) can delete an employee account
    const authResult = await requireRoles(req, ['admin_manager']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const deleted = await Employee.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Employee deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
