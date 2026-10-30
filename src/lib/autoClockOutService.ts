import { connectToDatabase } from '@/lib/db';
import Attendance from '@/models/Attendance';
import {
  getAutoClockOutTime,
  createDateAt,
  parseDateInput,
  evaluateDailyAttendance,
  AttendanceSession,
} from '@/lib/attendanceEngine';

// Global guard so background timer starts at most once per Node server process
declare global {
  // eslint-disable-next-line no-var
  var __autoClockOutJobStarted: boolean | undefined;
}

let lastCheckTimestamp = 0;

/**
 * Scans all attendance records across the system and processes automatic clock-outs
 * for any employee who forgot to clock out at the end of their shift.
 *
 * Rules:
 * 1. Automatic clock-out happens at 12:01 AM on the day following the shift date.
 * 2. If the employee's first check-in was ON or BEFORE 9:15 AM -> Marked as Full Day (full_day).
 * 3. If the employee's first check-in was AFTER 9:15 AM -> Marked as Half Day (half_day).
 */
export async function processAutoClockOuts(now: Date = new Date()): Promise<{
  success: boolean;
  checkedCount: number;
  updatedCount: number;
  timestamp: string;
}> {
  try {
    await connectToDatabase();

    // Auto clock-out only applies to unclosed shifts ('working') or shifts from the past 3 days.
    // Targeted querying prevents downloading entire historical attendance collections every 60s.
    const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
    const dayBeforeYesterdayStr = new Date(now.getTime() - 172800000).toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    const [workingRecords, recentRecords] = await Promise.all([
      Attendance.find({ status: 'working' }),
      Attendance.find({ date: { $in: [dayBeforeYesterdayStr, yesterdayStr, todayStr] } }),
    ]);

    const seenIds = new Set<string>();
    const allRecords: any[] = [];
    for (const r of [...workingRecords, ...recentRecords]) {
      const rId = String(r._id || r.id);
      if (!seenIds.has(rId)) {
        seenIds.add(rId);
        allRecords.push(r);
      }
    }
    let updatedCount = 0;

    for (const record of allRecords) {
      const dateStr = record.date;
      if (!dateStr) continue;

      const autoClockOutTime = getAutoClockOutTime(dateStr);
      // Auto clock-out triggers only if the current moment has reached or passed 12:01 AM of the next day
      if (now.getTime() < autoClockOutTime.getTime()) {
        continue;
      }

      let sessions: AttendanceSession[] = (record.sessions || []) as any;

      // Backward compatibility: If no sessions but record.checkIn exists without checkOut
      if (sessions.length === 0 && record.checkIn && !record.checkOut) {
        sessions = [
          {
            checkIn: record.checkIn,
            checkOut: null,
            notes: record.notes || '',
          },
        ];
      }

      if (sessions.length === 0) continue;

      // Check if any session is unclosed (checkOut is null or missing)
      const hasUnclosedSession = sessions.some(
        (s) => s.checkOut === null || s.checkOut === undefined
      );

      // Or if record status was left as 'working'
      const isRecordWorking = record.status === 'working' || !record.checkOut;

      if (!hasUnclosedSession && !isRecordWorking && record.isAutoClockOut) {
        continue; // Already processed
      }

      if (hasUnclosedSession || isRecordWorking) {
        // Find first check-in to evaluate punctuality rule (9:15 AM cutoff)
        const sortedSessions = [...sessions].sort((a, b) => {
          const tA = parseDateInput(a.checkIn)?.getTime() || 0;
          const tB = parseDateInput(b.checkIn)?.getTime() || 0;
          return tA - tB;
        });

        const firstCheckIn = parseDateInput(sortedSessions[0].checkIn);
        const cutoffTime = createDateAt(dateStr, 9, 15);

        // Rule: Before or on 9:15 AM vs After 9:15 AM
        const isBeforeOrAt915 = firstCheckIn ? firstCheckIn.getTime() <= cutoffTime.getTime() : false;

        // Close all open sessions with 12:01 AM timestamp
        const updatedSessions = sessions.map((s) => {
          if (s.checkOut === null || s.checkOut === undefined) {
            return {
              ...s,
              checkIn: s.checkIn,
              checkOut: autoClockOutTime,
              isAutoClockOut: true,
              notes: (s.notes ? `${s.notes} • ` : '') + 'Auto Clock-out at 12:01 AM (Forgot to clock out)',
            };
          }
          return s;
        });

        // Run complete daily evaluation
        const evalResult = evaluateDailyAttendance(updatedSessions, dateStr, now);

        record.sessions = updatedSessions as any;
        record.checkOut = autoClockOutTime;
        record.isAutoClockOut = true;

        if (isBeforeOrAt915) {
          // Rule 1: Clocked in <= 9:15 AM -> Considered Full Day
          record.status = 'full_day';
          record.totalMinutes = Math.max(480, evalResult.totalWorkedMinutes);
          record.effectiveMinutes = 480; // 8 hours credited
          record.isLate = false;
          record.lateByMinutes = 0;
          record.autoClockOutReason = 'Auto clocked out at 12:01 AM: Clock-in on or before 9:15 AM -> Considered Full Day';
        } else {
          // Rule 2: Clocked in > 9:15 AM -> Considered Half Day
          record.status = 'half_day';
          record.totalMinutes = 240;
          record.effectiveMinutes = 240; // 4 hours credited
          record.isLate = true;
          record.lateByMinutes = evalResult.lateByMinutes || 1;
          record.autoClockOutReason = 'Auto clocked out at 12:01 AM: Clock-in after 9:15 AM -> Considered Half Day';
        }

        await record.save();
        updatedCount++;
      }
    }

    lastCheckTimestamp = Date.now();
    return {
      success: true,
      checkedCount: allRecords.length,
      updatedCount,
      timestamp: now.toISOString(),
    };
  } catch (error: any) {
    console.error('Error processing auto clock-outs:', error);
    return {
      success: false,
      checkedCount: 0,
      updatedCount: 0,
      timestamp: now.toISOString(),
    };
  }
}

/**
 * Throttle helper so processAutoClockOuts is not called more than once every 10 seconds per worker
 */
export async function triggerAutoClockOutIfDue(force = false): Promise<void> {
  const now = Date.now();
  if (force || now - lastCheckTimestamp > 10000) {
    await processAutoClockOuts();
  }
}

/**
 * Starts the background auto clock-out runner in Node.js server environment.
 * Checks every 60 seconds so forgotten clock-outs are immediately resolved when 12:01 AM passes.
 */
export function initAutoClockOutJob(): void {
  if (typeof window !== 'undefined') return;
  if (global.__autoClockOutJobStarted) return;

  global.__autoClockOutJobStarted = true;

  // Run on startup
  processAutoClockOuts().catch(console.error);

  // Interval check every 60 seconds
  setInterval(() => {
    processAutoClockOuts().catch(console.error);
  }, 60000);
}
