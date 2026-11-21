import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import User from '@/models/User';
import { getAuthUser } from '@/lib/apiAuth';
import { hashPassword, verifyPassword, signAuthToken } from '@/lib/authCrypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized: Valid session required' }, { status: 401 });
    }

    const body = await req.json();
    const { newPassword, currentPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanNewPass = newPassword.trim();
    await connectToDatabase();

    // Verify current password if provided and not in first-login forced state
    if (currentPassword) {
      const emp = await Employee.findOne({ email: authUser.email.toLowerCase() });
      if (emp && emp.password) {
        const { matches } = await verifyPassword(currentPassword, emp.password);
        if (!matches) {
          return NextResponse.json({ error: 'Current password does not match.' }, { status: 400 });
        }
      }
    }

    const hashedPassword = await hashPassword(cleanNewPass);

    // Update in Employee
    await Employee.updateOne(
      { email: authUser.email.toLowerCase() },
      {
        $set: {
          password: hashedPassword,
          must_change_password: false,
          updatedAt: new Date(),
        },
      }
    );

    // Update in User
    await User.updateOne(
      { email: authUser.email.toLowerCase() },
      {
        $set: {
          password: hashedPassword,
          must_change_password: false,
          updatedAt: new Date(),
        },
      }
    );

    const updatedUser = {
      ...authUser,
      must_change_password: false,
    };

    const token = await signAuthToken({
      sub: String(updatedUser.id),
      email: updatedUser.email,
      role: updatedUser.role,
      company_id: updatedUser.company_id ?? null,
      name: updatedUser.name,
      department: updatedUser.department,
      must_change_password: false,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Password successfully updated.',
      must_change_password: false,
      token,
      user: updatedUser,
    });

    // Refresh the session cookie with signed JWT and HttpOnly
    response.cookies.set({
      name: 'crm_session',
      value: token,
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update password' },
      { status: 500 }
    );
  }
}
