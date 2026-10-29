import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, department, salary, phone, avatar } = body;

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

    await connectToDatabase();

    // Upsert into Employee collection
    const employee = await Employee.findOneAndUpdate(
      { email: cleanEmail },
      {
        $set: {
          name,
          email: cleanEmail,
          password: cleanPassword,
          role: cleanRole,
          department: department || 'Engineering',
          salary: Number(salary) || 50000,
          phone: phone || '',
          avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
          status: cleanStatus,
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
          name,
          email: cleanEmail,
          password: cleanPassword,
          role: cleanRole,
          department: department || 'Engineering',
          designation: cleanRole,
          status: cleanStatus,
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
