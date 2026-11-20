import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import User from '@/models/User';
import { getAuthUser } from '@/lib/apiAuth';

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
      if (emp && emp.password && emp.password !== currentPassword && emp.password !== 'pass123') {
        return NextResponse.json({ error: 'Current password does not match.' }, { status: 400 });
      }
    }

    // Update in Employee
    await Employee.updateOne(
      { email: authUser.email.toLowerCase() },
      {
        $set: {
          password: cleanNewPass,
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
          password: cleanNewPass,
          must_change_password: false,
          updatedAt: new Date(),
        },
      }
    );

    const updatedUser = {
      ...authUser,
      must_change_password: false,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Password successfully updated.',
      must_change_password: false,
      user: updatedUser,
    });

    // Refresh the session cookie with must_change_password cleared
    response.cookies.set({
      name: 'crm_session',
      value: encodeURIComponent(JSON.stringify(updatedUser)),
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
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
