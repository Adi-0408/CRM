import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import { User } from '@/models/User';
import { requireRoles, DEFAULT_COMPANY_ID } from '@/lib/apiAuth';
import { hashPassword } from '@/lib/authCrypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'hr']);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const companyId = authResult.companyId || DEFAULT_COMPANY_ID;

    const body = await req.json();
    const { name, email, password, role, department, salary, phone, avatar, must_change_password } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Name and email are required to create credentials' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password ? password.trim() : 'crm@123';
    const cleanRole = role || 'employee';
    const cleanStatus = (body.status || 'active').toLowerCase();

    let cleanPhone = '';
    if (phone) {
      cleanPhone = String(phone).replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return NextResponse.json(
          { error: 'Mobile number must be exactly 10 digits.' },
          { status: 400 }
        );
      }
    }

    await connectToDatabase();
    const hashedPassword = await hashPassword(cleanPassword);

    // Guard against modifying employee belonging to a different tenant
    const existing = await Employee.findOne({ email: cleanEmail });
    if (existing && existing.company_id && existing.company_id !== companyId && !authResult.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot manage credentials for another tenant organization.' },
        { status: 403 }
      );
    }

    // Upsert into Employee collection
    const employee = await Employee.findOneAndUpdate(
      { email: cleanEmail },
      {
        $set: {
          company_id: companyId,
          name,
          email: cleanEmail,
          password: hashedPassword,
          role: cleanRole,
          department: department || 'Engineering',
          salary: Number(salary) || 50000,
          baseSalary: Number(salary) || 50000,
          phone: cleanPhone,
          avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
          status: cleanStatus,
          must_change_password: must_change_password !== undefined ? !!must_change_password : true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
          joinDate: new Date(),
          completedTasksCount: 0,
        },
      },
      { upsert: true, new: true }
    );

    // Also sync to User collection
    await User.findOneAndUpdate(
      { email: cleanEmail },
      {
        $set: {
          company_id: companyId,
          name,
          email: cleanEmail,
          password: hashedPassword,
          role: cleanRole,
          department: department || 'Engineering',
          designation: cleanRole,
          status: cleanStatus,
          phone: cleanPhone,
          must_change_password: must_change_password !== undefined ? !!must_change_password : true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
          joiningDate: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: `Credentials successfully saved for ${name} (${cleanEmail})`,
      user: {
        id: String(employee._id),
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        company_id: companyId,
        must_change_password: employee.must_change_password,
      },
    });
  } catch (error: any) {
    console.error('Credentials API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update credentials' },
      { status: 500 }
    );
  }
}
