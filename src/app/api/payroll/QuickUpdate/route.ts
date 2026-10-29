import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import { calculateEmployeePayroll } from '@/lib/payrollEngine';
import { requireRoles, isValidDocId } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    // SECURITY ENFORCEMENT: Only Admin (Manager) and Accounts can modify payroll
    const authResult = await requireRoles(req, ['admin_manager', 'accounts']);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    await connectToDatabase();
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid or empty JSON body' },
        { status: 400 }
      );
    }

    const {
      employeeId,
      month,
      baseSalary,
      unapprovedLeavesOverride,
      halfDaysOverride,
      status,
      paidAt,
    } = body;

    if (!employeeId || !month) {
      return NextResponse.json(
        { error: 'employeeId and month are required' },
        { status: 400 }
      );
    }

    // 1. If baseSalary is provided, update Employee.baseSalary & Employee.salary in DB
    let targetEmployee = null;
    if (isValidDocId(employeeId)) {
      if (baseSalary !== undefined && baseSalary !== null) {
        targetEmployee = await Employee.findByIdAndUpdate(
          employeeId,
          {
            $set: {
              baseSalary: Number(baseSalary),
              salary: Number(baseSalary),
            },
          },
          { new: true }
        );
      } else {
        targetEmployee = await Employee.findById(employeeId);
      }
    } else {
      // Find by email or name if demo ID passed
      const found = await Employee.findOne({
        $or: [{ email: employeeId }, { name: employeeId }],
      });
      if (found) {
        if (baseSalary !== undefined && baseSalary !== null) {
          targetEmployee = await Employee.findByIdAndUpdate(
            found._id,
            {
              $set: {
                baseSalary: Number(baseSalary),
                salary: Number(baseSalary),
              },
            },
            { new: true }
          );
        } else {
          targetEmployee = found;
        }
      }
    }

    if (!targetEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // 2. Fetch existing Payroll document to preserve existing fields/overrides
    const existing = await Payroll.findOne({
      employeeId: targetEmployee._id,
      month,
    });

    const mergeData: any = {
      ...(existing ? existing.toObject() : {}),
    };

    if (baseSalary !== undefined && baseSalary !== null) {
      mergeData.baseSalary = Number(baseSalary);
    }
    if (unapprovedLeavesOverride !== undefined) {
      mergeData.unapprovedLeavesOverride = Number(unapprovedLeavesOverride);
    }
    if (halfDaysOverride !== undefined) {
      mergeData.halfDaysOverride = Number(halfDaysOverride);
    }
    if (status !== undefined) {
      mergeData.status = status;
      if (status === 'Paid' || status === 'paid') {
        mergeData.paidAt = paidAt ? new Date(paidAt) : new Date();
      }
    }

    // 3. Recalculate with formula
    const calculated = await calculateEmployeePayroll(
      targetEmployee,
      month,
      mergeData
    );

    // 4. Update or upsert monthly Payroll document
    const updateDoc: any = {
      employeeId: targetEmployee._id,
      employee: targetEmployee._id,
      month,
      baseSalary: calculated.baseSalary,
      approvedLeaves: calculated.approvedLeaves,
      unapprovedLeaves: calculated.unapprovedLeaves,
      halfDays: calculated.halfDays,
      totalDeductions: calculated.totalDeductions,
      netSalary: calculated.netSalary,
      status: mergeData.status || calculated.status,
    };

    if (calculated.unapprovedLeavesOverride !== undefined) {
      updateDoc.unapprovedLeavesOverride = calculated.unapprovedLeavesOverride;
    }
    if (calculated.halfDaysOverride !== undefined) {
      updateDoc.halfDaysOverride = calculated.halfDaysOverride;
    }
    if (mergeData.status === 'Paid' || mergeData.status === 'paid') {
      updateDoc.status = 'Paid';
      updateDoc.paidAt = mergeData.paidAt || new Date();
    } else if (mergeData.status === 'Pending' || mergeData.status === 'pending') {
      updateDoc.status = 'Pending';
      updateDoc.paidAt = null;
    }

    const updatedPayroll = await Payroll.findOneAndUpdate(
      { employeeId: targetEmployee._id, month },
      { $set: updateDoc },
      { upsert: true, new: true }
    ).populate('employee', 'name email role department avatar baseSalary salary');

    return NextResponse.json({
      success: true,
      data: {
        ...calculated,
        _id: updatedPayroll._id,
        status: updateDoc.status,
        paidAt: updateDoc.paidAt,
      },
    });
  } catch (error: any) {
    console.error('Error in QuickUpdate:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return PATCH(req);
}
export async function PUT(req: NextRequest) {
  return PATCH(req);
}
