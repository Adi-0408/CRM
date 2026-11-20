import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Company from '@/models/Company';
import Employee from '@/models/Employee';
import User from '@/models/User';
import Branch from '@/models/Branch';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Lead from '@/models/Lead';
import Quotation from '@/models/Quotation';
import Invoice from '@/models/Invoice';
import Ticket from '@/models/Ticket';
import Leave from '@/models/Leave';
import Attendance from '@/models/Attendance';
import Payroll from '@/models/Payroll';
import Notification from '@/models/Notification';
import Standup from '@/models/Standup';
import { requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(
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
    const [userCount, branchCount, admin] = await Promise.all([
      Employee.countDocuments({ company_id: compId }),
      Branch.countDocuments({ company_id: compId }),
      Employee.findOne({
        company_id: compId,
        role: { $in: ['company_admin', 'admin_manager', 'admin'] },
      }),
    ]);

    return NextResponse.json({
      ...company.toObject(),
      userCount,
      branchCount,
      admin: admin
        ? {
            id: admin._id || admin.id,
            name: admin.name,
            email: admin.email,
            phone: admin.phone || '',
            must_change_password: !!admin.must_change_password,
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
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

    const body = await req.json();
    const compId = company._id || company.id;

    // Validate slug change if requested
    if (body.slug && body.slug !== company.slug) {
      const cleanSlug = String(body.slug).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const conflict = await Company.findOne({ slug: cleanSlug });
      if (conflict && (conflict._id || conflict.id) !== compId) {
        return NextResponse.json({ error: `Slug '${cleanSlug}' is already taken.` }, { status: 400 });
      }
      body.slug = cleanSlug;
    }

    if (body.status) {
      const s = String(body.status).toLowerCase();
      if (s !== 'active' && s !== 'suspended') {
        return NextResponse.json({ error: "Status must be 'active' or 'suspended'." }, { status: 400 });
      }
      body.status = s;
    }

    body.updatedAt = new Date();

    const updated = await Company.findByIdAndUpdate(compId, body, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({
      success: true,
      company: updated,
      message: `Company '${updated?.name}' updated successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
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
    const filter = { company_id: compId };

    // Safely delete company and ALL scoped data records
    await Promise.all([
      Company.findByIdAndDelete(compId),
      Employee.deleteMany(filter),
      User.deleteMany(filter),
      Branch.deleteMany(filter),
      Project.deleteMany(filter),
      Task.deleteMany(filter),
      Lead.deleteMany(filter),
      Quotation.deleteMany(filter),
      Invoice.deleteMany(filter),
      Ticket.deleteMany(filter),
      Leave.deleteMany(filter),
      Attendance.deleteMany(filter),
      Payroll.deleteMany(filter),
      Notification.deleteMany(filter),
      Standup.deleteMany(filter),
    ]);

    return NextResponse.json({
      success: true,
      message: `Company '${company.name}' and all associated tenant data were successfully removed.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
