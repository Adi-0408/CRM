import { NextRequest, NextResponse } from 'next/server';
import { wipeAndSeedDatabase } from '@/lib/seedData';
import { connectToDatabase } from '@/lib/db';
import { requireTenantAuth, DEFAULT_COMPANY_ID } from '@/lib/apiAuth';
import Employee from '@/models/Employee';
import User from '@/models/User';
import Lead from '@/models/Lead';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Ticket from '@/models/Ticket';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';
import Payroll from '@/models/Payroll';
import Branch from '@/models/Branch';
import Invoice from '@/models/Invoice';
import Quotation from '@/models/Quotation';
import Notification from '@/models/Notification';
import Standup from '@/models/Standup';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req, ['admin_manager', 'company_admin', 'platform_super_admin']);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    let targetCompanyId = authResult.companyId || DEFAULT_COMPANY_ID;

    // Platform Super Admin may optionally seed a specific company if provided in query
    if (authResult.isSuperAdmin) {
      const url = new URL(req.url);
      const queryCompany = url.searchParams.get('company_id');
      if (queryCompany) {
        targetCompanyId = queryCompany;
      }
    }

    const result = await wipeAndSeedDatabase(targetCompanyId, authResult.isSuperAdmin);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed database' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req, ['admin_manager', 'company_admin', 'platform_super_admin']);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    let targetCompanyId = authResult.companyId || DEFAULT_COMPANY_ID;

    if (authResult.isSuperAdmin) {
      const url = new URL(req.url);
      const queryCompany = url.searchParams.get('company_id');
      if (queryCompany) {
        targetCompanyId = queryCompany;
      }
    }

    await connectToDatabase();
    const filter = { company_id: targetCompanyId };

    // Scoped strictly to target company
    await Promise.all([
      Employee.deleteMany(filter),
      User.deleteMany(filter),
      Lead.deleteMany(filter),
      Project.deleteMany(filter),
      Task.deleteMany(filter),
      Ticket.deleteMany(filter),
      Attendance.deleteMany(filter),
      Leave.deleteMany(filter),
      Payroll.deleteMany(filter),
      Branch.deleteMany(filter),
      Invoice.deleteMany(filter),
      Quotation.deleteMany(filter),
      Notification.deleteMany(filter),
      Standup.deleteMany(filter),
    ]);

    return NextResponse.json({
      success: true,
      company_id: targetCompanyId,
      message: `Database collections successfully wiped clean for tenant '${targetCompanyId}'.`,
    });
  } catch (error: any) {
    console.error('Error clearing database:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear database' },
      { status: 500 }
    );
  }
}
