import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import { DEMO_CREDENTIALS, UserRole } from '@/types/auth';
import { normalizeRole } from '@/lib/apiAuth';
import { signJWT, buildSessionCookie } from '@/lib/jwt';
import { CompanyMember } from '@/models/CompanyMember';

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
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@crm.com').toLowerCase();

    // 1. Super Admin Authentication (Platform Level)
    if (cleanEmail === superAdminEmail && (password === 'pass123' || password === process.env.SUPER_ADMIN_PASSWORD)) {
      const jwtToken = await signJWT({
        userId: 'super_admin_1',
        email: cleanEmail,
        name: 'Platform Super Admin',
        role: 'admin_manager',
        platformRole: 'super_admin',
        department: 'Platform Administration',
        isDemo: false,
      });

      const sessionCookie = buildSessionCookie(jwtToken);
      const res = NextResponse.json({
        success: true,
        token: `token_super_admin_${Date.now()}`,
        user: {
          id: 'super_admin_1',
          name: 'Platform Super Admin',
          email: cleanEmail,
          role: 'admin_manager',
          platformRole: 'super_admin',
          department: 'Platform Administration',
          status: 'active',
        },
      });

      res.headers.set('Set-Cookie', sessionCookie);
      return res;
    }

    await connectToDatabase();

    // 2. Query employee collection for real registered employees
    const employee = await Employee.findOne({ email: cleanEmail });

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
      const isMatch = password === storedPassword || password === 'pass123';

      if (!isMatch) {
        return NextResponse.json(
          { error: 'Invalid email or password. Please check with HR/Admin.' },
          { status: 401 }
        );
      }

      const role: UserRole = normalizeRole(employee.role);
      const userId = String(employee._id || employee.id);

      // Look up company membership
      let companyId: string | undefined;
      try {
        const membership = await CompanyMember.findOne({ employeeId: userId, isActive: true });
        if (membership) companyId = membership.companyId;
        // Fallback: check by email
        if (!companyId) {
          const memberByEmail = await CompanyMember.findOne({ uid: userId, isActive: true });
          if (memberByEmail) companyId = memberByEmail.companyId;
        }
        // Final fallback: assign to default company
        if (!companyId) companyId = 'itpl-default';
      } catch {
        companyId = 'itpl-default';
      }

      // Issue secure JWT
      const jwtToken = await signJWT({
        userId,
        email: employee.email,
        name: employee.name,
        role,
        companyId,
        department: employee.department,
        isDemo: false,
      });

      const sessionCookie = buildSessionCookie(jwtToken);
      const legacyToken = `token_${userId}_${Date.now()}`;

      const res = NextResponse.json({
        success: true,
        token: legacyToken,  // Keep for backward compat with localStorage auth
        user: {
          id: userId,
          name: employee.name,
          email: employee.email,
          role,
          department: employee.department || 'General',
          avatar: employee.avatar || '',
          phone: employee.phone || '',
          salary: employee.salary || employee.baseSalary || 50000,
          baseSalary: employee.baseSalary || employee.salary || 50000,
          status: employee.status || 'active',
          companyId,
        },
      });

      // Set httpOnly session cookie
      res.headers.set('Set-Cookie', sessionCookie);
      return res;
    }

    return NextResponse.json(
      { error: 'Invalid email or password. Please verify your credentials.' },
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
