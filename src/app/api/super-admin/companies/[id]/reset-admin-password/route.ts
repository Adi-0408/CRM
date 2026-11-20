import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Company from '@/models/Company';
import Employee from '@/models/Employee';
import User from '@/models/User';
import { requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Prism@${rand}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRoles(req, ['platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const company = (await Company.findById(params.id)) || (await Company.findOne({ slug: params.id }));
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const compId = company._id || company.id;

    // Find the company admin
    let admin = await Employee.findOne({
      company_id: compId,
      role: { $in: ['company_admin', 'admin_manager', 'admin'] },
    });

    if (!admin) {
      // Fallback: look in User collection
      admin = await User.findOne({
        company_id: compId,
        role: { $in: ['company_admin', 'admin_manager', 'admin'] },
      });
    }

    if (!admin) {
      return NextResponse.json(
        { error: `No administrator account found for company '${company.name}'.` },
        { status: 404 }
      );
    }

    const newTempPassword = generateRandomPassword();

    // Update in Employee
    await Employee.updateOne(
      { email: admin.email },
      {
        $set: {
          password: newTempPassword,
          must_change_password: true,
          updatedAt: new Date(),
        },
      }
    );

    // Update in User
    await User.updateOne(
      { email: admin.email },
      {
        $set: {
          password: newTempPassword,
          must_change_password: true,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${admin.name} (${admin.email}).`,
      adminName: admin.name,
      adminEmail: admin.email,
      newPassword: newTempPassword,
      must_change_password: true,
    });
  } catch (error: any) {
    console.error('Reset admin password error:', error);
    return NextResponse.json({ error: error.message || 'Failed to reset admin password' }, { status: 500 });
  }
}
