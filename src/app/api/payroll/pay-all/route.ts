import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import { calculateEmployeePayroll, getCurrentMonthStr } from '@/lib/payrollEngine';
import { requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // SECURITY ENFORCEMENT: Only Admin (Manager) and Accounts can trigger bulk disbursal
    const authResult = await requireRoles(req, ['admin_manager', 'accounts']);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    await connectToDatabase();
    const body = await req.json().catch(() => ({}));
    const month = body.month || getCurrentMonthStr();
    const paidAt = new Date();

    // 1. Fetch all active employees
    const employees = await Employee.find({ status: { $ne: 'suspended' } });

    // 2. Fetch existing payrolls for month
    const existingPayrolls = await Payroll.find({ month });
    const existingMap = new Map<string, any>();
    for (const p of existingPayrolls) {
      const empId = (p.employeeId || p.employee)?.toString();
      if (empId) existingMap.set(empId, p);
    }

    // 3. Prepare bulk operations for atomic single-call write
    const bulkOps = [];
    const updatedPayrolls = [];

    for (const emp of employees) {
      const existing = existingMap.get(emp._id.toString());
      const calculated = await calculateEmployeePayroll(emp, month, existing);

      const updateFields: any = {
        employeeId: emp._id,
        employee: emp._id,
        month,
        baseSalary: calculated.baseSalary,
        approvedLeaves: calculated.approvedLeaves,
        unapprovedLeaves: calculated.unapprovedLeaves,
        halfDays: calculated.halfDays,
        totalDeductions: calculated.totalDeductions,
        netSalary: calculated.netSalary,
        status: 'Paid',
        paidAt: existing?.paidAt || paidAt,
      };

      if (calculated.unapprovedLeavesOverride !== undefined) {
        updateFields.unapprovedLeavesOverride = calculated.unapprovedLeavesOverride;
      }
      if (calculated.halfDaysOverride !== undefined) {
        updateFields.halfDaysOverride = calculated.halfDaysOverride;
      }

      bulkOps.push({
        updateOne: {
          filter: { employeeId: emp._id, month },
          update: { $set: updateFields },
          upsert: true,
        },
      });

      updatedPayrolls.push({
        ...calculated,
        status: 'Paid',
        paidAt: updateFields.paidAt,
      });
    }

    if (bulkOps.length > 0) {
      await Payroll.bulkWrite(bulkOps);
    }

    return NextResponse.json({
      success: true,
      message: `All ${bulkOps.length} payroll records disbursed and marked Paid.`,
      month,
      count: bulkOps.length,
      payrolls: updatedPayrolls,
    });
  } catch (error: any) {
    console.error('Error in pay-all:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
