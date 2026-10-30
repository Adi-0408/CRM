/**
 * Multi-Session Attendance Engine & Business Rules
 *
 * Rules:
 * 1. Company Work Window: 09:00 AM to 06:00 PM (9-hour window).
 * 2. 9:15 AM Punctuality Rule:
 *    - First check-in <= 09:15:00 AM => On Time
 *    - First check-in > 09:15:00 AM => Late (calculate lateByMinutes)
 * 3. 8-Hour Work Duration Rule:
 *    - Full Day: >= 8 hours (480 minutes) within work window.
 *    - Half Day: Checked in at least once, checked out, < 8 hours (< 480 minutes).
 *    - Working: Active session (checkOut === null).
 *    - Absent: No check-in records for the day.
 */

export interface AttendanceSession {
  _id?: string | any;
  checkIn: string | Date;
  checkOut?: string | Date | null;
  durationMinutes?: number;
  notes?: string;
  isAutoClockOut?: boolean;
}

export interface AttendanceConfig {
  workStartHour: number; // default 9
  workStartMinute: number; // default 0
  workEndHour: number; // default 18 (6 PM)
  workEndMinute: number; // default 0
  lateCutoffHour: number; // default 9
  lateCutoffMinute: number; // default 15
  fullDayMinutes: number; // default 480 (8 hours)
  halfDayMinMinutes?: number; // default 240 (4 hours)
}

export const DEFAULT_ATTENDANCE_CONFIG: AttendanceConfig = {
  workStartHour: 9,
  workStartMinute: 0,
  workEndHour: 18,
  workEndMinute: 0,
  lateCutoffHour: 9,
  lateCutoffMinute: 15,
  fullDayMinutes: 480, // 8 Hours
  halfDayMinMinutes: 240, // 4 Hours
};

export interface EvaluatedDailyAttendance {
  date: string;
  sessions: AttendanceSession[];
  firstCheckIn: Date | null;
  lastCheckOut: Date | null;
  isCurrentlyWorking: boolean;
  totalWorkedMinutes: number;
  effectiveWorkedMinutes: number;
  isLate: boolean;
  lateByMinutes: number;
  isOvertimeCompensated: boolean;
  isAutoClockOut: boolean;
  autoClockOutReason?: string;
  status: 'present' | 'late' | 'half_day' | 'absent' | 'working' | 'full_day';
  statusDisplay: 'Present' | 'Late' | 'Half Day' | 'Absent' | 'Full Day';
  punctualityStatus: 'on_time' | 'late' | 'not_marked';
  progressPercent: number; // 0 - 100
  remainingMinutes: number; // Remaining to achieve Present (480 min)
  formattedWorked: string; // e.g. "7h 45m"
  formattedRemaining: string; // e.g. "15m remaining to reach Present"
  firstPunchInFormatted: string; // e.g. "09:30 AM" or "--"
  lastPunchOutFormatted: string; // e.g. "06:15 PM" or "Active"
}

/**
 * Universal date parser that safely handles Date instances, ISO strings,
 * numbers, and Firestore Timestamp objects ({ seconds, nanoseconds } or { _seconds, _nanoseconds })
 */
export function parseDateInput(input: any): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  if (typeof input === 'object') {
    if (typeof input.toDate === 'function') {
      try {
        const d = input.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d;
      } catch {
        // ignore
      }
    }
    if (typeof input.seconds === 'number') {
      const ms = input.seconds * 1000 + (input.nanoseconds ? Math.round(input.nanoseconds / 1000000) : 0);
      return new Date(ms);
    }
    if (typeof input._seconds === 'number') {
      const ms = input._seconds * 1000 + (input._nanoseconds ? Math.round(input._nanoseconds / 1000000) : 0);
      return new Date(ms);
    }
  }
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format late minutes into hours and minutes
 * e.g. 325m -> "5h 25m (325m)"
 * e.g. 25m -> "25m"
 */
export function formatLateArrival(lateByMinutes: number): string {
  if (lateByMinutes <= 0) return '0m';
  if (lateByMinutes < 60) return `${lateByMinutes}m`;
  const hours = Math.floor(lateByMinutes / 60);
  const mins = lateByMinutes % 60;
  return `${hours}h ${mins > 0 ? `${mins}m ` : ''}(${lateByMinutes}m)`;
}

/**
 * Format minutes into "Xh Ym" or "Ym"
 */
export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0h 00m';
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins.toString().padStart(2, '0')}m`;
}

/**
 * Format Date/ISO to strict 12-hour time "09:15 AM"
 */
export function formatTimeAmPm(dateInput?: any): string {
  if (!dateInput) return '--';
  const d = parseDateInput(dateInput);
  if (!d) return '--';
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');
  return `${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Format live clock to strict 12-hour format "09:15:30 AM"
 */
export function format12HourClock(d: Date = new Date(), withSeconds = true): string {
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');
  if (withSeconds) {
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${formattedHours}:${minutes}:${seconds} ${ampm}`;
  }
  return `${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Parses or normalizes a date into local YYYY-MM-DD
 */
export function getLocalTodayStr(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Construct a Date object for a specific hour and minute on a given date (YYYY-MM-DD)
 */
export function createDateAt(dateStr: string, hour: number, minute: number): Date {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, hour, minute, 0, 0);
  }
  const d = new Date(dateStr);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/**
 * Calculates the exact 12:01 AM timestamp on the calendar day immediately following the workday.
 * For example: for '2026-10-29', 12:01 AM is '2026-10-30 00:01:00' local time.
 */
export function getAutoClockOutTime(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day + 1, 0, 1, 0, 0);
  }
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  d.setHours(0, 1, 0, 0);
  return d;
}

/**
 * Checks whether the current moment has passed 12:01 AM following the workday.
 */
export function isAfterAutoClockOutTime(dateStr: string, now: Date = new Date()): boolean {
  return now.getTime() >= getAutoClockOutTime(dateStr).getTime();
}

/**
 * Calculates effective worked minutes of a single session clamped to the Company Work Window
 */
export function calculateSessionEffectiveMinutes(
  session: AttendanceSession,
  dateStr: string,
  now: Date = new Date(),
  config: AttendanceConfig = DEFAULT_ATTENDANCE_CONFIG
): number {
  const checkIn = parseDateInput(session.checkIn);
  if (!checkIn) return 0;

  const rawCheckOut = parseDateInput(session.checkOut);
  const isToday = dateStr === getLocalTodayStr(now);
  const checkOut = rawCheckOut
    ? (isToday ? new Date(Math.min(rawCheckOut.getTime(), now.getTime())) : rawCheckOut)
    : now;

  // Company work window for that date: 09:00 AM to 06:00 PM
  const windowStart = createDateAt(dateStr, config.workStartHour, config.workStartMinute);
  const windowEnd = createDateAt(dateStr, config.workEndHour, config.workEndMinute);

  const startMillis = Math.max(checkIn.getTime(), windowStart.getTime());
  const endMillis = Math.min(checkOut.getTime(), windowEnd.getTime());

  if (endMillis <= startMillis) {
    return 0;
  }

  return Math.round((endMillis - startMillis) / 60000);
}

/**
 * Evaluates the entire daily attendance record for an employee
 */
export function evaluateDailyAttendance(
  rawSessions: AttendanceSession[] = [],
  dateStr: string = getLocalTodayStr(),
  now: Date = new Date(),
  config: AttendanceConfig = DEFAULT_ATTENDANCE_CONFIG
): EvaluatedDailyAttendance {
  const REQUIRED_MINUTES = config.fullDayMinutes || 480; // 8 Hours = 480 Minutes

  // Parse and sort sessions chronologically using parseDateInput
  const parsedSessions = (Array.isArray(rawSessions) ? rawSessions : [])
    .map((s) => {
      const cIn = parseDateInput(s?.checkIn);
      const cOut = parseDateInput(s?.checkOut);
      return {
        ...s,
        _parsedCheckIn: cIn,
        _parsedCheckOut: cOut,
      };
    })
    .filter((s) => s._parsedCheckIn !== null);

  const sessions = [...parsedSessions].sort((a, b) => {
    const timeA = a._parsedCheckIn!.getTime();
    const timeB = b._parsedCheckIn!.getTime();
    return timeA - timeB;
  });

  if (sessions.length === 0) {
    return {
      date: dateStr,
      sessions: [],
      firstCheckIn: null,
      lastCheckOut: null,
      isCurrentlyWorking: false,
      totalWorkedMinutes: 0,
      effectiveWorkedMinutes: 0,
      isLate: false,
      lateByMinutes: 0,
      isOvertimeCompensated: false,
      isAutoClockOut: false,
      status: 'absent',
      statusDisplay: 'Absent',
      punctualityStatus: 'not_marked',
      progressPercent: 0,
      remainingMinutes: REQUIRED_MINUTES,
      formattedWorked: '0h 00m',
      formattedRemaining: '8h 00m remaining to reach Present',
      firstPunchInFormatted: '--',
      lastPunchOutFormatted: '--',
    };
  }

  // First check-in / punch in
  const firstSession = sessions[0];
  const firstCheckIn = firstSession._parsedCheckIn!;

  // 1. Punctuality Check: 09:15:00 AM Cutoff
  const cutoffTime = createDateAt(dateStr, config.lateCutoffHour, config.lateCutoffMinute);
  const isLate = firstCheckIn.getTime() > cutoffTime.getTime();
  const lateByMinutes = isLate
    ? Math.max(1, Math.round((firstCheckIn.getTime() - cutoffTime.getTime()) / 60000))
    : 0;
  const punctualityStatus: 'on_time' | 'late' = isLate ? 'late' : 'on_time';

  // 2. Auto Clock-Out Check (Triggered automatically at 12:01 AM next day if employee forgot to clock out)
  const autoClockOutTime = getAutoClockOutTime(dateStr);
  const isPastAutoClockOutTime = now.getTime() >= autoClockOutTime.getTime();

  let hasAutoClockOutSession = false;

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    const isExplicitAuto = Boolean(s.isAutoClockOut);
    const isUnclosedPast1201 = (s._parsedCheckOut === null || s._parsedCheckOut === undefined) && isPastAutoClockOutTime;

    if (isExplicitAuto || isUnclosedPast1201) {
      hasAutoClockOutSession = true;
      s.isAutoClockOut = true;
      if (s._parsedCheckOut === null || s._parsedCheckOut === undefined) {
        s._parsedCheckOut = autoClockOutTime;
      }
      if (!s.notes || !s.notes.includes('Auto Clock-out')) {
        s.notes = (s.notes ? `${s.notes} • ` : '') + 'Auto Clock-out at 12:01 AM (Forgot to clock out)';
      }
    }
  }

  // Latest session & working state
  const lastSession = sessions[sessions.length - 1];
  const isCurrentlyWorking = !hasAutoClockOutSession && (lastSession._parsedCheckOut === null || lastSession._parsedCheckOut === undefined);
  const lastCheckOut = lastSession._parsedCheckOut || null;
  const isAutoClockOut = hasAutoClockOutSession;

  // 3. Sum up Total Worked Minutes across all daily sessions
  // Overtime worked past evening hours is fully counted so late employees can cover missed morning time
  let totalRawMinutes = 0;
  const isToday = dateStr === getLocalTodayStr(now);
  for (const s of sessions) {
    const cIn = s._parsedCheckIn!.getTime();
    let cOut: number;
    if (s._parsedCheckOut) {
      cOut = (isToday && !s.isAutoClockOut)
        ? Math.min(s._parsedCheckOut.getTime(), now.getTime())
        : s._parsedCheckOut.getTime();
    } else {
      cOut = now.getTime();
    }
    if (cOut > cIn) {
      totalRawMinutes += Math.round((cOut - cIn) / 60000);
    }
  }

  const is8HoursCompleted = totalRawMinutes >= REQUIRED_MINUTES;
  const isOvertimeCompensated = isLate && is8HoursCompleted;

  // 4. Strict Status Rules:
  // - If employee forgot to clock out and was auto clocked out at 12:01 AM:
  //    * If first clock-in is on or before 9:15 AM -> Consider FULL DAY (credited 480 min)
  //    * If first clock-in is after 9:15 AM -> Consider HALF DAY (credited 240 min)
  // - Otherwise:
  //    * Completed >= 480 mins (8 hours) -> 'present' (Overtime compensated if late)
  //    * If currently working and late -> 'late'
  //    * If currently working and on-time -> 'working'
  //    * Completed shift < 480 mins -> 'half_day'
  let status: 'present' | 'late' | 'half_day' | 'absent' | 'working' | 'full_day';
  let statusDisplay: 'Present' | 'Late' | 'Half Day' | 'Absent' | 'Full Day';
  let autoClockOutReason: string | undefined = undefined;

  let effectiveMinutes = totalRawMinutes;

  if (isAutoClockOut) {
    if (!isLate) {
      status = 'full_day';
      statusDisplay = 'Full Day';
      effectiveMinutes = Math.max(REQUIRED_MINUTES, totalRawMinutes);
      autoClockOutReason = 'Auto clocked out at 12:01 AM: Clock-in on or before 9:15 AM -> Considered Full Day';
    } else {
      status = 'half_day';
      statusDisplay = 'Half Day';
      effectiveMinutes = 240; // Credited 4h Half Day
      autoClockOutReason = 'Auto clocked out at 12:01 AM: Clock-in after 9:15 AM -> Considered Half Day';
    }
  } else if (is8HoursCompleted) {
    status = 'present';
    statusDisplay = 'Present';
  } else if (isCurrentlyWorking) {
    if (isLate) {
      status = 'late';
      statusDisplay = 'Late';
    } else {
      status = 'working';
      statusDisplay = 'Present';
    }
  } else {
    // Shift ended without completing required 8 hours
    status = 'half_day';
    statusDisplay = 'Half Day';
  }

  const remainingMinutes = Math.max(0, REQUIRED_MINUTES - effectiveMinutes);
  const progressPercent = Math.min(100, Math.round((effectiveMinutes / REQUIRED_MINUTES) * 100));

  const formattedWorked = formatMinutes(effectiveMinutes);
  let formattedRemaining = `${formatMinutes(remainingMinutes)} remaining to reach Present`;

  if (isAutoClockOut) {
    formattedRemaining = status === 'full_day'
      ? 'Full Day (Auto Clock-out at 12:01 AM • Punctual Arrival)'
      : 'Half Day (Auto Clock-out at 12:01 AM • Late Arrival)';
  } else if (is8HoursCompleted) {
    formattedRemaining = isOvertimeCompensated
      ? 'Present (Late Covered via Overtime)'
      : 'Present (8h Completed)';
  }

  const firstPunchInFormatted = formatTimeAmPm(firstCheckIn);
  const lastPunchOutFormatted = isCurrentlyWorking
    ? 'Active'
    : lastCheckOut
    ? (isAutoClockOut ? `${formatTimeAmPm(lastCheckOut)} (Auto)` : formatTimeAmPm(lastCheckOut))
    : '--';

  return {
    date: dateStr,
    sessions: sessions.map((s) => ({
      checkIn: s._parsedCheckIn || s.checkIn,
      checkOut: s._parsedCheckOut || (s.checkOut ?? null),
      notes: s.notes || '',
      durationMinutes: s.durationMinutes,
      isAutoClockOut: Boolean(s.isAutoClockOut),
    })),
    firstCheckIn,
    lastCheckOut,
    isCurrentlyWorking,
    totalWorkedMinutes: totalRawMinutes,
    effectiveWorkedMinutes: effectiveMinutes,
    isLate,
    lateByMinutes,
    isOvertimeCompensated,
    isAutoClockOut,
    autoClockOutReason,
    status,
    statusDisplay,
    punctualityStatus,
    progressPercent,
    remainingMinutes,
    formattedWorked,
    formattedRemaining,
    firstPunchInFormatted,
    lastPunchOutFormatted,
  };
}
