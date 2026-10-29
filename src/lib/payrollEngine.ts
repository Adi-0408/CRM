import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';

/**
 * Helper to get current YYYY-MM
 */
export function getCurrentMonthStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Calculates payroll for an employee in a given month
 */
export async function calculateEmployeePayroll(
  emp: any,
  month: string,
  existingPayroll?: any
) {
  const baseSalary =
    existingPayroll?.baseSalary !== undefined
      ? Number(existingPayroll.baseSalary)
      : Number(emp.baseSalary || emp.salary || 45000);

  const dailyRate = baseSalary / 30;
  const halfDayRate = dailyRate * 0.5;

  // 1. Query Attendance for the month
  const attendanceRecords = await Attendance.find({
    employee: emp._id,
    date: { $regex: `^${month}` },
  });

  let rawHalfDays = 0;
  let rawAbsentAttendance = 0;
  const absentDates = new Set<string>();

  for (const att of attendanceRecords) {
    const isHalfDay =
      att.status === 'half_day' ||
      (att.effectiveMinutes > 0 && att.effectiveMinutes < 480 && att.status !== 'present' && att.status !== 'full_day');

    if (isHalfDay) {
      rawHalfDays += 1;
    } else if (att.status === 'absent') {
      rawAbsentAttendance += 1;
      absentDates.add(att.date);
    }
  }

  // 2. Query Leaves overlapping with the month
  const [yearStr, monthNumStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthNumStr, 10) - 1;
  const startOfMonth = new Date(year, monthIndex, 1);
  const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

  const leaveRecords = await Leave.find({
    employee: emp._id,
    startDate: { $lte: endOfMonth },
    endDate: { $gte: startOfMonth },
  });

  let approvedLeaves = 0;
  let unapprovedLeaveDays = 0;

  for (const leave of leaveRecords) {
    const isApproved =
      leave.status?.toLowerCase() === 'approved';
    const isUnapproved =
      leave.status?.toLowerCase() === 'rejected' ||
      leave.status?.toLowerCase() === 'pending' ||
      leave.type === 'unpaid';

    const days = Math.max(1, leave.days || 1);

    if (isApproved) {
      approvedLeaves += days;
    } else if (isUnapproved) {
      unapprovedLeaveDays += days;
    }
  }

  // Total unapproved leaves = absent attendance days + unapproved/unpaid leave requests
  const rawUnapprovedLeaves = rawAbsentAttendance + unapprovedLeaveDays;

  // Check for overrides from existing payroll document
  const effectiveHalfDays =
    existingPayroll?.halfDaysOverride !== undefined &&
    existingPayroll?.halfDaysOverride !== null
      ? Number(existingPayroll.halfDaysOverride)
      : rawHalfDays;

  const effectiveUnapprovedLeaves =
    existingPayroll?.unapprovedLeavesOverride !== undefined &&
    existingPayroll?.unapprovedLeavesOverride !== null
      ? Number(existingPayroll.unapprovedLeavesOverride)
      : rawUnapprovedLeaves;

  // Formula per requirements:
  // dailyRate = baseSalary / 30
  // halfDayRate = dailyRate * 0.5
  // unpaidLeaveDeduction = unapprovedLeaves * dailyRate
  // halfDayDeduction = halfDays * halfDayRate
  // Total Deductions = Math.round(unpaidLeaveDeduction + halfDayDeduction)
  // Net Salary = Math.max(0, Base Salary - Total Deductions)
  const unpaidLeaveDeduction = effectiveUnapprovedLeaves * dailyRate;
  const halfDayDeduction = effectiveHalfDays * halfDayRate;
  const totalDeductions = Math.round(unpaidLeaveDeduction + halfDayDeduction);
  const netSalary = Math.max(0, Math.round(baseSalary - totalDeductions));

  const status =
    existingPayroll?.status === 'Paid' || existingPayroll?.status === 'paid'
      ? 'Paid'
      : 'Pending';

  const paidAt = existingPayroll?.paidAt || null;

  return {
    employeeId: emp._id,
    employee: {
      _id: emp._id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      department: emp.department,
      avatar: emp.avatar,
      baseSalary,
      salary: baseSalary,
    },
    month,
    baseSalary,
    dailyRate: Math.round(dailyRate),
    halfDayRate: Math.round(halfDayRate),
    approvedLeaves,
    unapprovedLeaves: effectiveUnapprovedLeaves,
    halfDays: effectiveHalfDays,
    rawHalfDays,
    rawUnapprovedLeaves,
    unapprovedLeavesOverride: existingPayroll?.unapprovedLeavesOverride,
    halfDaysOverride: existingPayroll?.halfDaysOverride,
    unpaidLeaveDeduction: Math.round(unpaidLeaveDeduction),
    halfDayDeduction: Math.round(halfDayDeduction),
    totalDeductions,
    netSalary,
    status,
    paidAt,
  };
}
