import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';

// Global in-memory cache for fast payroll reads
export const PAYROLL_CACHE = new Map<string, { data: any; exp: number }>();
export const PAYROLL_CACHE_TTL_MS = 60000; // 60 seconds

export function invalidatePayrollCache(month?: string) {
  if (!month) {
    PAYROLL_CACHE.clear();
    return;
  }
  for (const key of Array.from(PAYROLL_CACHE.keys())) {
    if (key.includes(month)) {
      PAYROLL_CACHE.delete(key);
    }
  }
}

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
 * Extracts and normalizes employee join date info:
 * joinDateStr: "YYYY-MM-DD"
 * joinMonth: "YYYY-MM"
 * joinDay: 1..31
 */
export function getEmployeeJoinDateInfo(emp: any): {
  joinDateStr: string;
  joinMonth: string;
  joinDay: number;
  joinDate: Date;
} | null {
  const raw = emp?.joinDate || emp?.createdAt;
  if (!raw) return null;

  let d: Date;
  if (raw instanceof Date) {
    d = raw;
  } else if (typeof raw === 'object' && raw.seconds) {
    d = new Date(raw.seconds * 1000);
  } else if (typeof raw === 'string' || typeof raw === 'number') {
    d = new Date(raw);
  } else {
    d = new Date(raw);
  }

  if (isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = d.getDate();

  return {
    joinDateStr: `${year}-${month}-${String(day).padStart(2, '0')}`,
    joinMonth: `${year}-${month}`,
    joinDay: day,
    joinDate: d,
  };
}

/**
 * Salary is distributed on the 1st day of the month
 */
export function getSalaryDistributionInfo(month: string) {
  const [yearStr, monthNumStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthNumStr, 10);

  // 1st of the subsequent month is the standard pay disbursement day for this cycle
  const nextMonthDate = new Date(year, monthNum, 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
  const nextMonthName = nextMonthDate.toLocaleDateString('en-US', { month: 'short' });

  return {
    distributionDay: 1,
    distributionDateStr: `${nextYear}-${nextMonth}-01`,
    distributionLabel: `1st ${nextMonthName} ${nextYear}`,
    distributionSchedule: 'Distributed on the 1st day of the month',
  };
}

/**
 * Calculates payroll for an employee in a given month
 */
export async function calculateEmployeePayroll(
  emp: any,
  month: string,
  existingPayroll?: any,
  preloaded?: {
    attendance?: any[];
    leaves?: any[];
  }
) {
  const fullBaseSalary = Number(emp.baseSalary || emp.salary || 45000);
  const joinInfo = getEmployeeJoinDateInfo(emp);

  // Month day bounds
  const [yearStr, monthNumStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthNumStr, 10) - 1;
  const startOfMonth = new Date(year, monthIndex, 1);
  const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Proration Rule for Joining Month:
  // If employee joined during this month, calculate salary from their joining date to end of month.
  // Example: 10,000 base salary, joined 15 Nov -> 15 days worked in 30-day month = ₹5,000.
  const isJoiningMonth = Boolean(joinInfo && joinInfo.joinMonth === month);
  let proratedBaseSalary = fullBaseSalary;
  let payableDays = daysInMonth;

  if (isJoiningMonth && joinInfo) {
    const joinDay = joinInfo.joinDay;
    if (joinDay === 1) {
      payableDays = daysInMonth;
    } else if (joinDay === 15 && daysInMonth === 30) {
      // Exactly 15 days = 50% of monthly salary
      payableDays = 15;
    } else {
      payableDays = Math.max(1, daysInMonth - joinDay + 1);
    }
    const prorationRatio = payableDays / (daysInMonth || 30);
    proratedBaseSalary = Math.round(fullBaseSalary * prorationRatio);
  }

  // Base salary for this payroll document:
  // If existing record has an override, keep it; otherwise use prorated for joining month or full base
  const baseSalary =
    existingPayroll?.baseSalary !== undefined && existingPayroll?.baseSalary !== null
      ? Number(existingPayroll.baseSalary)
      : isJoiningMonth
      ? proratedBaseSalary
      : fullBaseSalary;

  const dailyRate = fullBaseSalary / 30;
  const halfDayRate = dailyRate * 0.5;

  // 1. Query Attendance for the month (use preloaded data if provided)
  let attendanceRecords: any[];
  if (preloaded?.attendance) {
    const empIdStr = String(emp._id || emp.id);
    attendanceRecords = preloaded.attendance.filter((att: any) => {
      const aEmp = typeof att.employee === 'string' ? att.employee : (att.employee?._id || att.employee?.id);
      return String(aEmp) === empIdStr;
    });
  } else {
    attendanceRecords = await Attendance.find({
      employee: emp._id,
      date: { $regex: `^${month}` },
    });
  }

  // 2. Query Leaves overlapping with the month (use preloaded data if provided)
  let leaveRecords: any[];
  if (preloaded?.leaves) {
    const empIdStr = String(emp._id || emp.id);
    leaveRecords = preloaded.leaves.filter((leave: any) => {
      const lEmp = typeof leave.employee === 'string' ? leave.employee : (leave.employee?._id || leave.employee?.id);
      if (String(lEmp) !== empIdStr) return false;
      const sDate = leave.startDate ? new Date(leave.startDate) : null;
      const eDate = leave.endDate ? new Date(leave.endDate) : null;
      if (sDate && sDate > endOfMonth) return false;
      if (eDate && eDate < startOfMonth) return false;
      return true;
    });
  } else {
    leaveRecords = await Leave.find({
      employee: emp._id,
      startDate: { $lte: endOfMonth },
      endDate: { $gte: startOfMonth },
    });
  }

  // If in joining month, only count leaves from joining date onwards
  if (isJoiningMonth && joinInfo) {
    leaveRecords = leaveRecords.filter((leave: any) => {
      const sDate = leave.startDate ? new Date(leave.startDate) : null;
      return !sDate || sDate >= joinInfo.joinDate;
    });
  }

  // Map attendance records by date for fast O(1) daily lookup
  const attMapByDate = new Map<string, any>();
  for (const att of attendanceRecords) {
    if (att.date) {
      attMapByDate.set(att.date, att);
    }
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;
  const todayStr = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentHour = now.getHours();

  let rawHalfDays = 0;
  let rawAbsentDays = 0;
  const absentDates = new Set<string>();

  // Determine working day attendance & absences for each day of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayDate = new Date(year, monthIndex, d);
    const dayOfWeek = dayDate.getDay();
    const isSunday = dayOfWeek === 0;

    // 1. Weekly Off: Sundays are official corporate holidays (not counted as absent)
    if (isSunday) continue;

    // 2. Joining Date: Days before the employee joined are not counted as absent
    if (joinInfo && dateStr < joinInfo.joinDateStr) continue;

    // 3. Future Days: Days after today in current or future months are not absent yet
    if (dateStr > todayStr) continue;

    const att = attMapByDate.get(dateStr);

    if (dateStr === todayStr) {
      // Today: If employee has already clocked in
      if (att) {
        const isHalfDay =
          att.status === 'half_day' ||
          (att.effectiveMinutes > 0 && att.effectiveMinutes < 480 && att.status !== 'present' && att.status !== 'full_day');
        if (isHalfDay) {
          rawHalfDays += 1;
        } else if (att.status === 'absent') {
          rawAbsentDays += 1;
          absentDates.add(dateStr);
        }
      } else {
        // If today has ended (after 18:00 / 6 PM) and employee did not clock in
        if (currentHour >= 18) {
          const hasApprovedLeave = leaveRecords.some((l: any) => {
            const isApp = l.status?.toLowerCase() === 'approved';
            if (!isApp || l.type === 'unpaid') return false;
            const sStr = String(l.startDate || '').slice(0, 10);
            const eStr = String(l.endDate || '').slice(0, 10);
            return dateStr >= sStr && dateStr <= eStr;
          });
          if (!hasApprovedLeave) {
            rawAbsentDays += 1;
            absentDates.add(dateStr);
          }
        }
        // If during working hours (< 18:00), employee can still clock in, so not penalized as absent yet
      }
      continue;
    }

    // Past working days: dateStr < todayStr
    if (att) {
      const isHalfDay =
        att.status === 'half_day' ||
        (att.effectiveMinutes > 0 && att.effectiveMinutes < 480 && att.status !== 'present' && att.status !== 'full_day');
      const isAbsent =
        att.status === 'absent' ||
        (att.effectiveMinutes === 0 && (!att.sessions || att.sessions.length === 0));

      if (isHalfDay) {
        rawHalfDays += 1;
      } else if (isAbsent) {
        rawAbsentDays += 1;
        absentDates.add(dateStr);
      }
    } else {
      // No attendance record found on a past working day!
      // Check if day was covered by an approved paid leave
      const hasApprovedLeave = leaveRecords.some((l: any) => {
        const isApp = l.status?.toLowerCase() === 'approved';
        if (!isApp || l.type === 'unpaid') return false;
        const sStr = String(l.startDate || '').slice(0, 10);
        const eStr = String(l.endDate || '').slice(0, 10);
        return dateStr >= sStr && dateStr <= eStr;
      });

      if (!hasApprovedLeave) {
        rawAbsentDays += 1;
        absentDates.add(dateStr);
      }
    }
  }

  let approvedLeaves = 0;
  let unapprovedLeaveDays = 0;

  for (const leave of leaveRecords) {
    const isApproved = leave.status?.toLowerCase() === 'approved';
    const isUnapproved =
      leave.status?.toLowerCase() === 'rejected' ||
      leave.type === 'unpaid';

    const days = Math.max(1, leave.days || 1);

    if (isApproved && leave.type !== 'unpaid') {
      approvedLeaves += days;
    } else if (isUnapproved) {
      unapprovedLeaveDays += days;
    }
  }

  // Check for overrides from existing payroll document
  const effectiveAbsentDays =
    existingPayroll?.absentDaysOverride !== undefined &&
    existingPayroll?.absentDaysOverride !== null
      ? Number(existingPayroll.absentDaysOverride)
      : rawAbsentDays;

  const effectiveHalfDays =
    existingPayroll?.halfDaysOverride !== undefined &&
    existingPayroll?.halfDaysOverride !== null
      ? Number(existingPayroll.halfDaysOverride)
      : rawHalfDays;

  const effectiveUnapprovedLeaves =
    existingPayroll?.unapprovedLeavesOverride !== undefined &&
    existingPayroll?.unapprovedLeavesOverride !== null
      ? Number(existingPayroll.unapprovedLeavesOverride)
      : unapprovedLeaveDays;

  // Formula per requirements:
  // dailyRate = fullBaseSalary / 30
  // halfDayRate = dailyRate * 0.5
  // absentDeduction = absentDays * dailyRate (Automatically deducted for missing working days)
  // unpaidLeaveDeduction = unapprovedLeaves * dailyRate
  // halfDayDeduction = halfDays * halfDayRate
  // Total Deductions = Math.round(absentDeduction + unpaidLeaveDeduction + halfDayDeduction)
  // Net Salary = Math.max(0, Base Salary - Total Deductions)
  const absentDeduction = effectiveAbsentDays * dailyRate;
  const unpaidLeaveDeduction = effectiveUnapprovedLeaves * dailyRate;
  const halfDayDeduction = effectiveHalfDays * halfDayRate;
  const totalDeductions = Math.round(absentDeduction + unpaidLeaveDeduction + halfDayDeduction);
  const netSalary = Math.max(0, Math.round(baseSalary - totalDeductions));

  const status =
    existingPayroll?.status === 'Paid' || existingPayroll?.status === 'paid'
      ? 'Paid'
      : 'Pending';

  const paidAt = existingPayroll?.paidAt || null;
  const distInfo = getSalaryDistributionInfo(month);

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
      salary: fullBaseSalary,
      joinDate: joinInfo?.joinDateStr,
    },
    month,
    baseSalary,
    fullBaseSalary,
    isProrated: Boolean(isJoiningMonth && joinInfo && joinInfo.joinDay > 1),
    proratedDays: isJoiningMonth ? payableDays : daysInMonth,
    totalDaysInMonth: daysInMonth,
    joinDate: joinInfo?.joinDateStr || null,
    distributionDate: distInfo.distributionLabel,
    distributionSchedule: distInfo.distributionSchedule,
    dailyRate: Math.round(dailyRate),
    halfDayRate: Math.round(halfDayRate),
    approvedLeaves,
    absentDays: effectiveAbsentDays,
    rawAbsentDays,
    absentDaysOverride: existingPayroll?.absentDaysOverride,
    absentDeduction: Math.round(absentDeduction),
    unapprovedLeaves: effectiveUnapprovedLeaves,
    rawUnapprovedLeaves: unapprovedLeaveDays,
    unapprovedLeavesOverride: existingPayroll?.unapprovedLeavesOverride,
    unpaidLeaveDeduction: Math.round(unpaidLeaveDeduction),
    halfDays: effectiveHalfDays,
    rawHalfDays,
    halfDaysOverride: existingPayroll?.halfDaysOverride,
    halfDayDeduction: Math.round(halfDayDeduction),
    totalDeductions,
    netSalary,
    status,
    paidAt,
  };
}
