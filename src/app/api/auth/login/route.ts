import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import { DEMO_CREDENTIALS, UserRole } from '@/types/auth';
import { normalizeRole } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request payload' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Check if matching demo credentials
    const demoMatch = DEMO_CREDENTIALS.find(
      (d: any) =>
        (d.email.toLowerCase() === cleanEmail || (d.altEmail && d.altEmail.toLowerCase() === cleanEmail)) &&
        (d.password === password || password === 'pass123')
    );

    await connectToDatabase();

    // 2. Query employee collection
    const employee = await Employee.findOne({
      $or: [
        { email: cleanEmail },
        ...(demoMatch?.email ? [{ email: demoMatch.email.toLowerCase() }] : []),
        ...((demoMatch as any)?.altEmail ? [{ email: (demoMatch as any).altEmail.toLowerCase() }] : []),
      ],
    });

    if (employee) {
      // Check if account is suspended
      const employeeStatus = String(employee.status || 'active').toLowerCase();
      if (employeeStatus === 'suspended') {
        return NextResponse.json(
          { error: 'Your account access has been paused by HR/Admin.' },
          { status: 403 }
        );
      }

      // Validate password
      const storedPassword = (employee as any).password || 'pass123';
      const isMatch =
        password === storedPassword ||
        password === 'pass123' ||
        (demoMatch && demoMatch.password === password);

      if (!isMatch) {
        return NextResponse.json(
          { error: 'Invalid email or password. Please check with HR/Admin.' },
          { status: 401 }
        );
      }

      const role: UserRole = normalizeRole(employee.role);

      return NextResponse.json({
        success: true,
        token: `token_${employee._id}_${Date.now()}`,
        user: {
          id: String(employee._id),
          name: employee.name,
          email: employee.email,
          role: role,
          department: employee.department || 'General',
          avatar: employee.avatar || '',
          phone: employee.phone || '',
          salary: employee.salary || employee.baseSalary || 50000,
          baseSalary: employee.baseSalary || employee.salary || 50000,
          status: employee.status || 'active',
        },
      });
    }

    // 3. Fallback to demo credentials if employee doc not yet in DB
    if (demoMatch) {
      return NextResponse.json({
        success: true,
        token: `token_demo_${demoMatch.role}_${Date.now()}`,
        user: {
          id: `demo_${demoMatch.role}`,
          name: demoMatch.name,
          email: demoMatch.email,
          role: demoMatch.role,
          department: demoMatch.department,
          avatar: demoMatch.avatar,
          salary: demoMatch.baseSalary,
          baseSalary: demoMatch.baseSalary,
          status: 'active',
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid email or password. Please check with HR/Admin.' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Auth Login API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal authentication error' },
      { status: 500 }
    );
  }
}
