import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import User from '@/models/User';
import { getAuthUser, requireRoles } from '@/lib/apiAuth';
import { hashPassword } from '@/lib/authCrypto';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }
    if (authUser.isCompanySuspended) {
      return NextResponse.json({ error: 'Forbidden: Organization suspended' }, { status: 403 });
    }

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(context.params);
    const existing = await Employee.findById(resolvedParams.id);
    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // IDOR check: cannot modify employee of another tenant
    if (!authUser.isDemo && authUser.role !== 'platform_super_admin' && existing.company_id && existing.company_id !== authUser.company_id) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const body = await req.json();
    delete body.company_id; // Never let client alter company_id

    const isSelf = authUser.id === resolvedParams.id || authUser.email === existing.email;
    const isAdminOrHR =
      authUser.role === 'admin_manager' ||
      authUser.role === 'company_admin' ||
      authUser.role === 'platform_super_admin' ||
      authUser.role === 'hr';

    // If updating sensitive fields (role, status, salary, baseSalary), must be admin or hr
    const hasSensitiveFields =
      body.role !== undefined ||
      body.status !== undefined ||
      body.salary !== undefined ||
      body.baseSalary !== undefined;

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
        { error: 'Forbidden: Only HR and Admin can update employee credentials, status, and role.' },
        { status: 403 }
      );
    }

    if (!isSelf && !isAdminOrHR) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges.' },
        { status: 403 }
      );
    }

    // If changing password, hash it and mark must_change_password false
    if (body.password) {
      body.password = await hashPassword(String(body.password).trim());
      body.must_change_password = false;
    }

    const updated = await Employee.findByIdAndUpdate(resolvedParams.id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Sync to User collection
    try {
      await User.updateOne(
        { email: existing.email },
        {
          $set: {
            name: updated.name,
            email: updated.email,
            role: updated.role,
            department: updated.department,
            status: updated.status,
            phone: updated.phone,
            ...(body.password ? { password: body.password, must_change_password: false } : {}),
            updatedAt: new Date(),
          },
        }
      );
    } catch (e) {
      console.warn('Sync to user error on employee update:', e);
    }

    const sanitized = { ...updated };
    delete (sanitized as any).password;
    return NextResponse.json(sanitized);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
): Promise<NextResponse> {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(context.params);
    const existing = await Employee.findById(resolvedParams.id);
    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // IDOR Guard
    if (!authResult.isSuperAdmin && existing.company_id && existing.company_id !== authResult.companyId) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const deleted = await Employee.findByIdAndDelete(resolvedParams.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    try {
      await User.deleteMany({ email: existing.email });
    } catch (e) {
      // Non-fatal
    }

    return NextResponse.json({ message: 'Employee deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
