import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import { calculateEmployeePayroll, invalidatePayrollCache } from '@/lib/payrollEngine';
import { requireRoles, isValidDocId, DEFAULT_COMPANY_ID } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'accounts', 'platform_super_admin']);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const tenantCompanyId = authResult.companyId || DEFAULT_COMPANY_ID;

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
      absentDaysOverride,
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
      const emp = await Employee.findById(employeeId);
      if (emp && (!authResult.isSuperAdmin && emp.company_id && emp.company_id !== tenantCompanyId)) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }

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
        targetEmployee = emp;
      }
    } else {
      const found = await Employee.findOne({
        $or: [{ email: employeeId }, { name: employeeId }],
        company_id: tenantCompanyId,
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

    // 2. Fetch existing Payroll document with tenant check
    const payrollFilter: any = {
      employeeId: targetEmployee._id,
      month,
    };
    if (!authResult.isSuperAdmin) {
      payrollFilter.company_id = tenantCompanyId;
    }

    const existing = await Payroll.findOne(payrollFilter);

    const mergeData: any = {
      ...(existing ? existing.toObject() : {}),
    };

    if (baseSalary !== undefined && baseSalary !== null) {
      mergeData.baseSalary = Number(baseSalary);
    }
    if (absentDaysOverride !== undefined) {
      mergeData.absentDaysOverride = Number(absentDaysOverride);
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

    // 4. Update or upsert monthly Payroll document scoped to tenant
    const updateDoc: any = {
      company_id: tenantCompanyId,
      employeeId: targetEmployee._id,
      employee: targetEmployee._id,
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
      status: mergeData.status || calculated.status,
    };

    if (calculated.absentDaysOverride !== undefined) {
      updateDoc.absentDaysOverride = calculated.absentDaysOverride;
    }
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
      { employeeId: targetEmployee._id, month, company_id: tenantCompanyId },
      { $set: updateDoc },
      { upsert: true, new: true }
    ).populate('employee', 'name email role department avatar baseSalary salary');

    invalidatePayrollCache(month);

    return NextResponse.json({
      success: true,
      data: {
        ...calculated,
        _id: updatedPayroll._id,
        company_id: tenantCompanyId,
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
