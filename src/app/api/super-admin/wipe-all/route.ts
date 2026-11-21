import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireRoles, DEFAULT_COMPANY_ID } from '@/lib/apiAuth';
import { hashPassword } from '@/lib/authCrypto';
import Company from '@/models/Company';
import Employee from '@/models/Employee';
import User from '@/models/User';
import Branch from '@/models/Branch';
import Task from '@/models/Task';
import Lead from '@/models/Lead';
import Quotation from '@/models/Quotation';
import Invoice from '@/models/Invoice';
import Project from '@/models/Project';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';
import Payroll from '@/models/Payroll';
import Ticket from '@/models/Ticket';
import Standup from '@/models/Standup';
import Notification from '@/models/Notification';
import { DEMO_CREDENTIALS } from '@/types/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, ['platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    if (body.confirm_token !== 'PERMANENT_WIPE_ALL_CONFIRM') {
      return NextResponse.json(
        {
          error:
            'Confirmation token required: You must provide { confirm_token: "PERMANENT_WIPE_ALL_CONFIRM" } to execute a full platform reset.',
        },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const superAdminHashedPassword = await hashPassword('admin123');

    // 1. Delete all operational data across all tenants
    await Promise.all([
      Task.deleteMany({}),
      Lead.deleteMany({}),
      Quotation.deleteMany({}),
      Invoice.deleteMany({}),
      Project.deleteMany({}),
      Attendance.deleteMany({}),
      Leave.deleteMany({}),
      Payroll.deleteMany({}),
      Ticket.deleteMany({}),
      Standup.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // 2. Delete all companies except master default company
    await Company.deleteMany({ _id: { $ne: DEFAULT_COMPANY_ID }, id: { $ne: DEFAULT_COMPANY_ID } });

    // 3. Delete all branches except master default branch
    await Branch.deleteMany({});

    // 4. Delete all users and employees except Platform Super Admin
    await Promise.all([
      Employee.deleteMany({ email: { $ne: 'superadmin@crm.com' } }),
      User.deleteMany({ email: { $ne: 'superadmin@crm.com' } }),
    ]);

    // 5. Ensure Platform Super Admin exists in Employee and User
    await Employee.findOneAndUpdate(
      { email: 'superadmin@crm.com' },
      {
        $set: {
          _id: 'emp_superadmin',
          id: 'emp_superadmin',
          name: 'Platform Super Admin',
          email: 'superadmin@crm.com',
          role: 'platform_super_admin',
          department: 'Platform Engineering',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
          phone: '+91 99999 00000',
          salary: 150000,
          baseSalary: 150000,
          status: 'active',
          company_id: null,
          must_change_password: false,
          password: superAdminHashedPassword,
        },
      },
      { upsert: true, new: true }
    );

    await User.findOneAndUpdate(
      { email: 'superadmin@crm.com' },
      {
        $set: {
          _id: 'user_superadmin',
          id: 'user_superadmin',
          name: 'Platform Super Admin',
          email: 'superadmin@crm.com',
          role: 'platform_super_admin',
          department: 'Platform Engineering',
          company_id: null,
          must_change_password: false,
          password: superAdminHashedPassword,
        },
      },
      { upsert: true, new: true }
    );

    // 6. Ensure Master Default Tenant exists in clean active state
    await Company.findOneAndUpdate(
      { _id: DEFAULT_COMPANY_ID },
      {
        $set: {
          _id: DEFAULT_COMPANY_ID,
          id: DEFAULT_COMPANY_ID,
          name: 'Unique Digital Services',
          companyName: 'Unique Digital Services',
          slug: 'unique-digital-services',
          status: 'active',
          brand_name: 'Unique Digital Services',
          logo_url: '',
          favicon_url: '',
          primary_color: '#635BFF',
          accent_color: '#00D4B2',
          currency_code: 'INR',
          currency_symbol: '₹',
          timezone: 'Asia/Kolkata',
          support_email: 'support@uniquedigital.com',
          phone: '+91 98765 43210',
          address: 'Sangli Central HQ, ITPL Tower, Maharashtra, India',
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // 7. Seed Default HQ Branch for Master Tenant
    await Branch.create({
      _id: 'branch_uds_hq',
      id: 'branch_uds_hq',
      company_id: DEFAULT_COMPANY_ID,
      name: 'Sangli Central HQ',
      city: 'Sangli',
      address: 'Pearl Enclave, MSEB Rd, Vishrambag, Sangli',
      manager: 'Aditya Varma',
      email: 'aditya@uniquedigital.com',
      phone: '9999900000',
      activeEmployees: '12 active staff',
      status: 'Head Office',
      isHeadOffice: true,
      lat: 16.84582,
      lng: 74.60055,
      radius_meters: 250,
      createdAt: new Date(),
    });

    // 8. Re-seed clean demo accounts for Master Tenant
    for (const d of DEMO_CREDENTIALS) {
      if (d.role === 'platform_super_admin') continue;
      const empId = `emp_${d.role}`;
      const hashedDemoPass = await hashPassword(d.password);
      await Employee.create({
        _id: empId,
        id: empId,
        company_id: DEFAULT_COMPANY_ID,
        name: d.name,
        email: d.email.toLowerCase(),
        password: hashedDemoPass,
        role: d.role,
        department: d.department,
        avatar: d.avatar,
        phone: (d as any).phone || '+91 98765 00000',
        baseSalary: d.baseSalary,
        salary: d.baseSalary,
        status: 'active',
        must_change_password: false,
        createdAt: new Date(),
      });

      await User.create({
        _id: `user_${d.role}`,
        id: `user_${d.role}`,
        company_id: DEFAULT_COMPANY_ID,
        name: d.name,
        email: d.email.toLowerCase(),
        password: hashedDemoPass,
        role: d.role,
        department: d.department,
        avatar: d.avatar,
        must_change_password: false,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'All platform test data successfully wiped. Master Super Admin and default company initialized to clean baseline.',
      retained: {
        superAdmin: 'superadmin@crm.com',
        defaultCompany: 'Unique Digital Services (unique-digital-services)',
      },
    });
  } catch (error: any) {
    console.error('Super Admin wipe-all error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to wipe platform database' },
      { status: 500 }
    );
  }
}
