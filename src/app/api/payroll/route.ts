import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import { calculateEmployeePayroll, getCurrentMonthStr } from '@/lib/payrollEngine';
import { getAuthUser, requireRoles, isValidDocId } from '@/lib/apiAuth';
import { triggerAutoClockOutIfDue } from '@/lib/autoClockOutService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    await triggerAutoClockOutIfDue();
    const authUser = await getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || getCurrentMonthStr();
    const employeeId = searchParams.get('employeeId');

    // Build employee query
    const empQuery: any = { status: { $ne: 'suspended' } };

    // DATA SCOPING: Only Admin (Manager) and Accounts can view everyone's payroll.
    // All other roles (hr, sales, developers, support, intern) are strictly limited to their own record.
    const canManage = authUser?.role === 'admin_manager' || authUser?.role === 'accounts';
    if (!canManage && authUser) {
      if (isValidDocId(authUser.id)) {
        empQuery._id = authUser.id;
      } else {
        const found = await Employee.findOne({ email: authUser.email.toLowerCase() });
        if (found) {
          empQuery._id = found._id;
        }
      }
    } else if (employeeId) {
      if (isValidDocId(employeeId)) {
        empQuery._id = employeeId;
      } else {
        const found = await Employee.findOne({
          $or: [{ email: employeeId }, { name: employeeId }],
        });
        if (found) {
          empQuery._id = found._id;
        }
      }
    }

    const employees = await Employee.find(empQuery).sort({ name: 1 });

    // Fetch existing Payroll docs for this month
    const existingPayrolls = await Payroll.find({ month });
    const payrollMap = new Map<string, any>();
    for (const p of existingPayrolls) {
      const empIdStr = (p.employeeId || p.employee)?.toString();
      if (empIdStr) {
        payrollMap.set(empIdStr, p);
      }
    }

    // Calculate & Auto-Upsert Payroll for each employee
    const results = [];
    for (const emp of employees) {
      const existing = payrollMap.get(emp._id.toString());
      const calculated = await calculateEmployeePayroll(emp, month, existing);

      // Auto-upsert into MongoDB so records are permanently synced
      const upsertDoc: any = {
        employeeId: emp._id,
        employee: emp._id,
        month,
        baseSalary: calculated.baseSalary,
        approvedLeaves: calculated.approvedLeaves,
        unapprovedLeaves: calculated.unapprovedLeaves,
        halfDays: calculated.halfDays,
        totalDeductions: calculated.totalDeductions,
        netSalary: calculated.netSalary,
        status: calculated.status,
      };

      if (calculated.paidAt) {
        upsertDoc.paidAt = calculated.paidAt;
      }
      if (calculated.unapprovedLeavesOverride !== undefined) {
        upsertDoc.unapprovedLeavesOverride = calculated.unapprovedLeavesOverride;
      }
      if (calculated.halfDaysOverride !== undefined) {
        upsertDoc.halfDaysOverride = calculated.halfDaysOverride;
      }

      const saved = await Payroll.findOneAndUpdate(
        { employeeId: emp._id, month },
        { $set: upsertDoc },
        { upsert: true, new: true }
      );

      results.push({
        ...calculated,
        _id: saved._id,
      });
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error in GET /api/payroll:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'accounts']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const body = await req.json();

    if (!body.employeeId && !body.employee) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    const empId = body.employeeId || body.employee;
    const month = body.month || getCurrentMonthStr();
    const baseSalary = Number(body.baseSalary || 45000);

    const calculated = await calculateEmployeePayroll(
      { _id: empId, baseSalary },
      month,
      body
    );

    const payroll = await Payroll.findOneAndUpdate(
      { employeeId: empId, month },
      {
        $set: {
          employeeId: empId,
          employee: empId,
          month,
          baseSalary,
          approvedLeaves: calculated.approvedLeaves,
          unapprovedLeaves: calculated.unapprovedLeaves,
          halfDays: calculated.halfDays,
          totalDeductions: calculated.totalDeductions,
          netSalary: calculated.netSalary,
          status: body.status || 'Pending',
          paidAt: body.status === 'Paid' ? new Date() : undefined,
        },
      },
      { upsert: true, new: true }
    ).populate('employee', 'name email role department avatar baseSalary salary');

    return NextResponse.json(payroll, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'accounts']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const body = await req.json();
    const { id, status, employeeId, month } = body;

    const query: any = id ? { _id: id } : { employeeId, month };
    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'Paid' || status === 'paid') {
        updateData.paidAt = new Date();
      }
    }

    const updated = await Payroll.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    ).populate('employee', 'name email role department avatar baseSalary salary');

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
