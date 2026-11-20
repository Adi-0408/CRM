import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Leave from '@/models/Leave';
import Employee from '@/models/Employee';
import { requireTenantAuth, buildTenantFilter, DEFAULT_COMPANY_ID, isValidDocId } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const authUser = authResult.user!;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const employeeParam = searchParams.get('employeeId');

    let query: any = {};
    const isAdminOrHR =
      authUser.role === 'admin_manager' ||
      authUser.role === 'company_admin' ||
      authUser.role === 'platform_super_admin' ||
      authUser.role === 'hr';

    // Data Scoping: If user is neither admin nor hr, restrict strictly to their own leave requests
    if (!isAdminOrHR) {
      if (isValidDocId(authUser.id)) {
        query.employee = authUser.id;
      } else {
        const found = await Employee.findOne({ email: authUser.email.toLowerCase(), company_id: authUser.company_id });
        if (found) {
          query.employee = found._id;
        }
      }
    } else if (employeeParam) {
      if (isValidDocId(employeeParam)) {
        query.employee = employeeParam;
      }
    }

    const scopedQuery = buildTenantFilter(authUser, query);
    const leaves = await Leave.find(scopedQuery)
      .populate('employee', 'name email role department avatar')
      .populate('approvedBy', 'name email role')
      .sort({ createdAt: -1 });

    return NextResponse.json(leaves);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const authUser = authResult.user!;

    await connectToDatabase();
    const body = await req.json();

    if (!body.startDate || !body.endDate || !body.reason) {
      return NextResponse.json(
        { error: 'Start date, end date, and reason are required' },
        { status: 400 }
      );
    }

    const companyId = authUser.company_id || DEFAULT_COMPANY_ID;
    const isAdmin =
      authUser.role === 'admin_manager' ||
      authUser.role === 'company_admin' ||
      authUser.role === 'platform_super_admin';

    let targetEmployeeId = body.employee;

    if (!isAdmin) {
      if (isValidDocId(authUser.id)) {
        targetEmployeeId = authUser.id;
      } else {
        const found = await Employee.findOne({ email: authUser.email.toLowerCase(), company_id: companyId });
        if (found) targetEmployeeId = found._id;
      }
    } else if (!targetEmployeeId) {
      targetEmployeeId = authUser.id;
    }

    if (!targetEmployeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    if (!isValidDocId(targetEmployeeId)) {
      const found = await Employee.findOne({
        $or: [
          { email: authUser.email.toLowerCase() },
          { role: authUser.role },
        ],
        company_id: companyId,
      });
      if (found) targetEmployeeId = found._id;
    }

    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const newLeave = await Leave.create({
      company_id: companyId,
      employee: targetEmployeeId,
      type: body.type || 'casual',
      startDate: start,
      endDate: end,
      days: body.days || days,
      reason: body.reason,
      status: 'pending',
    });

    const populated = await Leave.findById(newLeave._id).populate(
      'employee',
      'name email role department avatar'
    );

    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const authUser = authResult.user!;

    await connectToDatabase();
    const body = await req.json();
    const { id, status, remarks } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const leave = await Leave.findById(id).populate('employee', 'name email role');
    if (!leave) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    // IDOR Protection: Tenant boundary check
    if (!authResult.isSuperAdmin && leave.company_id && leave.company_id !== authUser.company_id) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    const normalizedStatus = status.toLowerCase();

    // 1. CANCELLATION FLOW: An employee can cancel ONLY their own pending request
    if (normalizedStatus === 'cancelled') {
      const empIdStr = (leave.employee as any)?._id?.toString() || (leave.employee ? String(leave.employee) : '');
      const isOwner =
        empIdStr === authUser.id ||
        (leave.employee as any)?.email?.toLowerCase() === authUser.email?.toLowerCase();

      const isAdminOrHR =
        authUser.role === 'admin_manager' ||
        authUser.role === 'company_admin' ||
        authUser.role === 'platform_super_admin' ||
        authUser.role === 'hr';

      if (!isOwner && !isAdminOrHR) {
        return NextResponse.json(
          { error: 'Forbidden: You can only cancel your own leave requests.' },
          { status: 403 }
        );
      }

      if (leave.status !== 'pending') {
        return NextResponse.json(
          { error: `Cannot cancel a leave that is already ${leave.status}.` },
          { status: 400 }
        );
      }

      leave.status = 'cancelled';
      if (remarks) leave.remarks = remarks;
      await leave.save();

      return NextResponse.json(leave);
    }

    // 2. APPROVAL / REJECTION FLOW: Strictly restricted to Admin & HR
    if (normalizedStatus === 'approved' || normalizedStatus === 'rejected') {
      const isAdminOrHR =
        authUser.role === 'admin_manager' ||
        authUser.role === 'company_admin' ||
        authUser.role === 'platform_super_admin' ||
        authUser.role === 'hr';

      if (!isAdminOrHR) {
        return NextResponse.json(
          { error: 'Forbidden: Only HR and Admin can approve or reject leave requests.' },
          { status: 403 }
        );
      }

      // SELF-APPROVAL GUARD: Even HR cannot approve their own personal leave
      const empIdStr = (leave.employee as any)?._id?.toString() || (leave.employee ? String(leave.employee) : '');
      const isSelf =
        empIdStr === authUser.id ||
        (leave.employee as any)?.email?.toLowerCase() === authUser.email?.toLowerCase();

      const isExecutiveAdmin =
        authUser.role === 'admin_manager' ||
        authUser.role === 'company_admin' ||
        authUser.role === 'platform_super_admin';

      if (isSelf && !isExecutiveAdmin) {
        return NextResponse.json(
          {
            error:
              'Forbidden: Self-approval is strictly prohibited. HR leave requests must be approved by Admin.',
          },
          { status: 403 }
        );
      }

      leave.status = normalizedStatus;
      if (remarks) leave.remarks = remarks;

      let approverId: string | undefined = authUser.id;
      if (!approverId || !isValidDocId(approverId)) {
        const found = await Employee.findOne({ email: authUser.email.toLowerCase(), company_id: authUser.company_id });
        if (found) approverId = String(found._id);
      }
      if (approverId && isValidDocId(approverId)) {
        leave.approvedBy = approverId;
      }

      await leave.save();

      const updated = await Leave.findById(leave._id)
        .populate('employee', 'name email role department avatar')
        .populate('approvedBy', 'name email role');

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Invalid status update action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const authUser = authResult.user!;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return NextResponse.json({ error: 'Leave not found' }, { status: 404 });
    }

    // IDOR Protection: Tenant boundary check
    if (!authResult.isSuperAdmin && leave.company_id && leave.company_id !== authUser.company_id) {
      return NextResponse.json({ error: 'Leave not found' }, { status: 404 });
    }

    const empIdStr = (leave.employee as any)?._id?.toString() || (leave.employee ? String(leave.employee) : '');
    const isOwner =
      empIdStr === authUser.id ||
      (leave.employee as any)?.email?.toLowerCase() === authUser.email?.toLowerCase();

    const isAdminOrHR =
      authUser.role === 'admin_manager' ||
      authUser.role === 'company_admin' ||
      authUser.role === 'platform_super_admin' ||
      authUser.role === 'hr';

    if (!isOwner && !isAdminOrHR) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isExecutiveAdmin =
      authUser.role === 'admin_manager' ||
      authUser.role === 'company_admin' ||
      authUser.role === 'platform_super_admin';

    if (leave.status !== 'pending' && !isExecutiveAdmin) {
      return NextResponse.json(
        { error: 'Cannot delete processed leave request.' },
        { status: 400 }
      );
    }

    await Leave.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Leave request removed.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
