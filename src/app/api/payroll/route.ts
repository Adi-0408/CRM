import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';
import {
  calculateEmployeePayroll,
  getCurrentMonthStr,
  getEmployeeJoinDateInfo,
  PAYROLL_CACHE,
  PAYROLL_CACHE_TTL_MS,
  invalidatePayrollCache,
} from '@/lib/payrollEngine';
import { getAuthUser, requireRoles, isValidDocId } from '@/lib/apiAuth';
import { triggerAutoClockOutIfDue } from '@/lib/autoClockOutService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const authUser = await getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || getCurrentMonthStr();
    const employeeId = searchParams.get('employeeId');

    const cacheKey = `${authUser?.id || 'all'}_${month}_${employeeId || ''}`;
    const cached = PAYROLL_CACHE.get(cacheKey);
    if (cached && Date.now() < cached.exp) {
      return NextResponse.json(cached.data);
    }

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

    const allEmployees = await Employee.find(empQuery).sort({ name: 1 });

    // Strict Rule: An employee only appears in payroll from the month they joined onward!
    // If an employee joined in Nov (e.g. 15 Nov), they will not appear in Oct or earlier.
    const employees = allEmployees.filter((emp: any) => {
      const joinInfo = getEmployeeJoinDateInfo(emp);
      if (!joinInfo) return true;
      return joinInfo.joinMonth <= month;
    });

    // Fetch existing Payroll docs, Month Attendance, and Leaves in parallel
    const [existingPayrolls, monthAttendance, monthLeaves] = await Promise.all([
      Payroll.find({ month }),
      Attendance.find({ date: { $regex: `^${month}` } }),
      Leave.find({ status: 'approved' }),
    ]);

    const preloaded = {
      attendance: monthAttendance,
      leaves: monthLeaves,
    };

    const payrollMap = new Map<string, any>();
    for (const p of existingPayrolls) {
      const empIdStr = (p.employeeId || p.employee)?.toString();
      if (empIdStr) {
        payrollMap.set(empIdStr, p);
      }
    }

    // Calculate & Auto-Upsert Payroll for each employee in parallel
    const results = await Promise.all(
      employees.map(async (emp: any) => {
        const existing = payrollMap.get(emp._id.toString());
        const calculated = await calculateEmployeePayroll(emp, month, existing, preloaded);

        return {
          ...calculated,
          _id: existing?._id || existing?.id || `payroll_${emp._id}_${month}`,
        };
      })
    );

    PAYROLL_CACHE.set(cacheKey, { data: results, exp: Date.now() + PAYROLL_CACHE_TTL_MS });
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
    const targetEmployee = (await Employee.findById(empId)) || { _id: empId, baseSalary: Number(body.baseSalary || 45000) };

    const calculated = await calculateEmployeePayroll(
      targetEmployee,
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
          baseSalary: calculated.baseSalary,
          fullBaseSalary: calculated.fullBaseSalary,
          isProrated: calculated.isProrated,
          proratedDays: calculated.proratedDays,
          totalDaysInMonth: calculated.totalDaysInMonth,
          joinDate: calculated.joinDate,
          distributionDate: calculated.distributionDate,
          distributionSchedule: calculated.distributionSchedule,
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

    invalidatePayrollCache(month);
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

    invalidatePayrollCache(month);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
