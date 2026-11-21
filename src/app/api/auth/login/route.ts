import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import User from '@/models/User';
import Company from '@/models/Company';
import { DEMO_CREDENTIALS, UserRole } from '@/types/auth';
import { normalizeRole, DEFAULT_COMPANY_ID, isCompanySuspended } from '@/lib/apiAuth';
import { signAuthToken, verifyPassword, hashPassword } from '@/lib/authCrypto';

export const dynamic = 'force-dynamic';

async function createLoginResponse(user: any) {
  const token = await signAuthToken({
    sub: String(user.id),
    email: user.email,
    role: user.role,
    company_id: user.company_id,
    name: user.name,
    department: user.department,
    must_change_password: !!user.must_change_password,
  });

  const response = NextResponse.json({
    success: true,
    token,
    user,
  });

  response.cookies.set({
    name: 'crm_session',
    value: token,
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}

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
    await connectToDatabase();

    // 1. Platform Super Admin Check (company_id: null)
    if (cleanEmail === 'superadmin@crm.com') {
      const superEmp = await Employee.findOne({ email: 'superadmin@crm.com' });
      const storedSuperPass = (superEmp as any)?.password;
      let isSuperMatch = false;
      let needsSuperRehash = false;

      if (storedSuperPass) {
        const v = await verifyPassword(password, storedSuperPass);
        isSuperMatch = v.matches;
        needsSuperRehash = v.needsRehash;
      } else {
        // Fallback for initial unseeded environment
        isSuperMatch = password === 'admin123' || password === 'pass123';
        needsSuperRehash = isSuperMatch;
      }

      if (!isSuperMatch) {
        return NextResponse.json(
          { error: 'Invalid platform super admin password.' },
          { status: 401 }
        );
      }

      // Transparent password rehash on super admin login
      if (needsSuperRehash) {
        hashPassword(password).then(async (h) => {
          try {
            await Employee.updateOne({ email: 'superadmin@crm.com' }, { $set: { password: h } });
            await User.updateOne({ email: 'superadmin@crm.com' }, { $set: { password: h } });
          } catch (e) {
            console.error('Super admin password rehash error:', e);
          }
        });
      }

      return await createLoginResponse({
        id: 'user_superadmin',
        name: 'Platform Super Admin',
        email: 'superadmin@crm.com',
        role: 'platform_super_admin' as UserRole,
        department: 'Platform Engineering',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
        phone: '+91 99999 00000',
        salary: 150000,
        baseSalary: 150000,
        status: 'active',
        company_id: null,
        must_change_password: false,
      });
    }

    // 2. Demo credentials match check
    const demoMatch = DEMO_CREDENTIALS.find(
      (d: any) =>
        (d.email.toLowerCase() === cleanEmail || (d.altEmail && d.altEmail.toLowerCase() === cleanEmail)) &&
        d.password === password
    );

    // 3. Query employee collection
    const employee = await Employee.findOne({
      $or: [
        { email: cleanEmail },
        ...(demoMatch?.email ? [{ email: demoMatch.email.toLowerCase() }] : []),
        ...((demoMatch as any)?.altEmail ? [{ email: (demoMatch as any).altEmail.toLowerCase() }] : []),
      ],
    });

    if (employee) {
      // Check if employee account is individually suspended
      const employeeStatus = String(employee.status || 'active').toLowerCase();
      if (employeeStatus === 'suspended') {
        return NextResponse.json(
          { error: 'Your individual account access has been paused by HR/Admin.' },
          { status: 403 }
        );
      }

      // Check tenant company status
      const companyId = employee.company_id || DEFAULT_COMPANY_ID;
      const suspended = await isCompanySuspended(companyId);
      if (suspended) {
        return NextResponse.json(
          { error: 'Your company access has been suspended by the platform administrator.' },
          { status: 403 }
        );
      }

      // Validate password with transparent upgrade
      const storedPassword = (employee as any).password;
      const { matches, needsRehash } = await verifyPassword(password, storedPassword);

      if (!matches && (!demoMatch || demoMatch.password !== password)) {
        return NextResponse.json(
          { error: 'Invalid email or password. Please check with HR/Admin.' },
          { status: 401 }
        );
      }

      // Transparently re-hash legacy plaintext password to bcrypt
      if (needsRehash) {
        hashPassword(password).then(async (hashed) => {
          try {
            await Employee.updateOne({ _id: employee._id }, { $set: { password: hashed } });
            await User.updateOne({ email: cleanEmail }, { $set: { password: hashed } });
          } catch (e) {
            console.error('Password rehash error:', e);
          }
        });
      }

      const role: UserRole = normalizeRole(employee.role);

      return await createLoginResponse({
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
        company_id: companyId,
        must_change_password: !!employee.must_change_password,
      });
    }

    // 4. Query user collection if employee record not found
    const userDoc = await User.findOne({ email: cleanEmail });
    if (userDoc) {
      const companyId = userDoc.company_id || DEFAULT_COMPANY_ID;
      const suspended = await isCompanySuspended(companyId);
      if (suspended) {
        return NextResponse.json(
          { error: 'Your company access has been suspended by the platform administrator.' },
          { status: 403 }
        );
      }

      const storedPassword = (userDoc as any).password;
      const { matches, needsRehash } = await verifyPassword(password, storedPassword);

      if (!matches && (!demoMatch || demoMatch.password !== password)) {
        return NextResponse.json(
          { error: 'Invalid email or password.' },
          { status: 401 }
        );
      }

      // Transparently re-hash legacy plaintext password to bcrypt
      if (needsRehash) {
        hashPassword(password).then(async (hashed) => {
          try {
            await User.updateOne({ _id: userDoc._id }, { $set: { password: hashed } });
          } catch (e) {
            console.error('User password rehash error:', e);
          }
        });
      }

      const role: UserRole = normalizeRole(userDoc.role);

      return await createLoginResponse({
        id: String(userDoc._id),
        name: userDoc.name,
        email: userDoc.email,
        role: role,
        department: userDoc.department || 'General',
        avatar: userDoc.avatar || '',
        phone: userDoc.phone || '',
        salary: userDoc.baseSalary || 50000,
        baseSalary: userDoc.baseSalary || 50000,
        status: userDoc.status || 'active',
        company_id: companyId,
        must_change_password: !!userDoc.must_change_password,
      });
    }

    // 5. Fallback to demo credentials only if password strictly matches demo credentials
    if (demoMatch) {
      const companyId = demoMatch.company_id !== undefined ? demoMatch.company_id : DEFAULT_COMPANY_ID;
      const suspended = await isCompanySuspended(companyId);
      if (suspended) {
        return NextResponse.json(
          { error: 'Your company access has been suspended by the platform administrator.' },
          { status: 403 }
        );
      }

      return await createLoginResponse({
        id: `demo_${demoMatch.role}`,
        name: demoMatch.name,
        email: demoMatch.email,
        role: demoMatch.role,
        department: demoMatch.department,
        avatar: demoMatch.avatar,
        salary: demoMatch.baseSalary,
        baseSalary: demoMatch.baseSalary,
        status: 'active',
        company_id: companyId,
        must_change_password: false,
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
