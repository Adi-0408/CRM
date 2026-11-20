import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import {
  calculateEmployeePayroll,
  getCurrentMonthStr,
  getEmployeeJoinDateInfo,
  invalidatePayrollCache,
} from '@/lib/payrollEngine';
import { requireRoles, DEFAULT_COMPANY_ID } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'accounts', 'platform_super_admin']);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const tenantCompanyId = authResult.companyId || DEFAULT_COMPANY_ID;

    await connectToDatabase();
    const body = await req.json().catch(() => ({}));
    const month = body.month || getCurrentMonthStr();
    const paidAt = new Date();

    // 1. Fetch active employees strictly belonging to caller's company
    const empFilter: any = { status: { $ne: 'suspended' } };
    if (!authResult.isSuperAdmin) {
      empFilter.company_id = tenantCompanyId;
    }

    const allEmployees = await Employee.find(empFilter);
    const employees = allEmployees.filter((emp: any) => {
      const joinInfo = getEmployeeJoinDateInfo(emp);
      if (!joinInfo) return true;
      return joinInfo.joinMonth <= month;
    });

    // 2. Fetch existing payrolls for month within this company
    const payrollFilter: any = { month };
    if (!authResult.isSuperAdmin) {
      payrollFilter.company_id = tenantCompanyId;
    }
    const existingPayrolls = await Payroll.find(payrollFilter);
    const existingMap = new Map<string, any>();
    for (const p of existingPayrolls) {
      const empId = (p.employeeId || p.employee)?.toString();
      if (empId) existingMap.set(empId, p);
    }

    // 3. Prepare bulk operations scoped with company_id
    const bulkOps = [];
    const updatedPayrolls = [];

    for (const emp of employees) {
      const existing = existingMap.get(emp._id.toString());
      const calculated = await calculateEmployeePayroll(emp, month, existing);

      const updateFields: any = {
        company_id: tenantCompanyId,
        employeeId: emp._id,
        employee: emp._id,
        month,
        baseSalary: calculated.baseSalary,
        fullBaseSalary: calculated.fullBaseSalary,
        isProrated: calculated.isProrated,
        proratedDays: calculated.proratedDays,
        totalDaysInMonth: calculated.totalDaysInMonth,
        joinDate: calculated.joinDate,
        distributionDate: calculated.distributionDate,
        distributionSchedule: calculated.distributionSchedule,
        approvedLeaves: calculated.approvedLeaves,
        absentDays: calculated.absentDays,
        absentDeduction: calculated.absentDeduction,
        unapprovedLeaves: calculated.unapprovedLeaves,
        halfDays: calculated.halfDays,
        halfDayDeduction: calculated.halfDayDeduction,
        unpaidLeaveDeduction: calculated.unpaidLeaveDeduction,
        totalDeductions: calculated.totalDeductions,
        netSalary: calculated.netSalary,
        status: 'Paid',
        paidAt: existing?.paidAt || paidAt,
      };

      if (calculated.absentDaysOverride !== undefined) {
        updateFields.absentDaysOverride = calculated.absentDaysOverride;
      }

      if (calculated.unapprovedLeavesOverride !== undefined) {
        updateFields.unapprovedLeavesOverride = calculated.unapprovedLeavesOverride;
      }
      if (calculated.halfDaysOverride !== undefined) {
        updateFields.halfDaysOverride = calculated.halfDaysOverride;
      }

      bulkOps.push({
        updateOne: {
          filter: { employeeId: emp._id, month, company_id: tenantCompanyId },
          update: { $set: updateFields },
          upsert: true,
        },
      });

      updatedPayrolls.push({
        ...calculated,
        company_id: tenantCompanyId,
        status: 'Paid',
        paidAt: updateFields.paidAt,
      });
    }

    if (bulkOps.length > 0) {
      await Payroll.bulkWrite(bulkOps);
    }

    invalidatePayrollCache(month);

    return NextResponse.json({
      success: true,
      message: `All ${bulkOps.length} payroll records disbursed and marked Paid.`,
      company_id: tenantCompanyId,
      month,
      count: bulkOps.length,
      payrolls: updatedPayrolls,
    });
  } catch (error: any) {
    console.error('Error in pay-all:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
