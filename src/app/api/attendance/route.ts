import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import { getAuthUser } from '@/lib/apiAuth';
import {
  evaluateDailyAttendance,
  getLocalTodayStr,
  AttendanceSession,
} from '@/lib/attendanceEngine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const authUser = await getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const employeeId = searchParams.get('employeeId');

    const query: any = {};
    if (dateParam && dateParam !== 'all') {
      query.date = dateParam;
    }

    // DATA SCOPING: Admin (Manager) and HR can view all logs; others view ONLY their own attendance
    const isAdminOrHR = authUser?.role === 'admin_manager' || authUser?.role === 'hr';
    if (!isAdminOrHR && authUser) {
      query.employee = authUser.id;
    } else if (employeeId) {
      query.employee = employeeId;
    }

    const records = await Attendance.find(query)
      .populate('employee', 'name email role department avatar')
      .populate('overriddenBy', 'name email')
      .sort({ date: -1, updatedAt: -1 });

    const now = new Date();

    // Ensure all records have evaluated session stats
    const evaluatedRecords = records.map((record: any) => {
      let sessions: AttendanceSession[] = (record.sessions || []) as any;

      // Backward compatibility: If no sessions but checkIn exists, synthesize 1 session
      if (sessions.length === 0 && record.checkIn) {
        sessions = [
          {
            checkIn: record.checkIn,
            checkOut: record.checkOut || null,
            notes: record.notes || '',
          },
        ];
      }

      const evaluation = evaluateDailyAttendance(sessions, record.date, now);

      return {
        ...record.toObject(),
        sessions: evaluation.sessions,
        evaluation,
        totalMinutes: evaluation.totalWorkedMinutes,
        effectiveMinutes: evaluation.effectiveWorkedMinutes,
        isLate: evaluation.isLate,
        lateByMinutes: evaluation.lateByMinutes,
        status: evaluation.status,
      };
    });

    return NextResponse.json(evaluatedRecords);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const authUser = await getAuthUser(req);
    const body = await req.json();
    const {
      employeeId,
      action, // 'clock_in' | 'clock_out' | 'punch_in' | 'punch_out' | 'regularize'
      date: reqDate,
      sessions: reqSessions,
      status: reqStatus,
      overrideReason,
      overriddenById,
      notes,
    } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    // Resolve employeeId to a valid MongoDB ObjectId if a string or email was provided
    let targetEmployeeId = employeeId;

    if (authUser && authUser.role !== 'admin_manager' && authUser.role !== 'hr') {
      // Non-HR staff can only clock in/out for themselves
      targetEmployeeId = authUser.id;
    } else {
      const found = await Employee.findOne({
        $or: [
          { email: employeeId },
          { name: employeeId },
          ...(typeof employeeId === 'string' && employeeId.startsWith('demo_') ? [{ role: employeeId.replace('demo_', '') }] : []),
          ...(typeof employeeId === 'string' && employeeId.startsWith('user_') ? [{ role: employeeId.replace('user_', '') }] : []),
        ],
      });
      if (found) {
        targetEmployeeId = String(found._id || found.id);
      }
    }

    let validOverriddenById: string | undefined = undefined;
    if (overriddenById) {
      validOverriddenById = String(overriddenById);
    } else {
      const adminEmp = await Employee.findOne({ role: 'admin_manager' });
      if (adminEmp) {
        validOverriddenById = String(adminEmp._id || adminEmp.id);
      }
    }

    const todayStr = reqDate || getLocalTodayStr();
    const now = new Date();

    // 1. ADMIN / HR REGULARIZATION & OVERRIDE
    if (action === 'regularize' || action === 'override') {
      if (!authUser || (authUser.role !== 'admin_manager' && authUser.role !== 'hr')) {
        return NextResponse.json(
          { error: 'Forbidden: Only HR and Admin (Manager) can regularize attendance.' },
          { status: 403 }
        );
      }

      let record = await Attendance.findOne({ employee: targetEmployeeId, date: todayStr });

      const newSessions: AttendanceSession[] = Array.isArray(reqSessions)
        ? reqSessions
            .filter((s: any) => s && s.checkIn)
            .map((s: any) => ({
              checkIn: new Date(s.checkIn),
              checkOut: s.checkOut ? new Date(s.checkOut) : null,
              notes: s.notes || '',
            }))
        : [];

      const evaluation = evaluateDailyAttendance(newSessions, todayStr, now);

      if (!record) {
        record = new Attendance({
          employee: targetEmployeeId,
          date: todayStr,
        });
      }

      record.sessions = newSessions as any;
      record.checkIn = evaluation.firstCheckIn || undefined;
      record.checkOut = evaluation.lastCheckOut || undefined;
      record.totalMinutes = evaluation.totalWorkedMinutes;
      record.effectiveMinutes = evaluation.effectiveWorkedMinutes;
      record.isLate = evaluation.isLate;
      record.lateByMinutes = evaluation.lateByMinutes;
      record.status = reqStatus || evaluation.status;
      if (overrideReason) record.overrideReason = overrideReason;
      if (validOverriddenById) record.overriddenBy = validOverriddenById;
      if (notes) record.notes = notes;

      await record.save();

      const populated = await Attendance.findById(record._id)
        .populate('employee', 'name email role department avatar')
        .populate('overriddenBy', 'name email');

      return NextResponse.json({
        ...(populated ? populated.toObject() : record.toObject()),
        evaluation,
      });
    }

    // 2. CLOCK IN / OUT FLOW
    let record = await Attendance.findOne({ employee: targetEmployeeId, date: todayStr });

    if (action === 'clock_out' || action === 'punch_out') {
      if (!record || !record.sessions || record.sessions.length === 0) {
        return NextResponse.json(
          { error: 'Cannot clock out: No clock-in session found for today.' },
          { status: 400 }
        );
      }

      // Find active session (checkOut is null or missing)
      const lastSessionIndex = record.sessions.length - 1;
      const lastSession = record.sessions[lastSessionIndex];

      if (lastSession.checkOut) {
        return NextResponse.json(
          { error: 'Already clocked out. Click Clock In to start a new session.' },
          { status: 400 }
        );
      }

      // Close the active session
      lastSession.checkOut = now;
      if (notes) lastSession.notes = notes;
      record.checkOut = now;

      // Re-evaluate
      const evaluation = evaluateDailyAttendance(record.sessions, todayStr, now);
      record.totalMinutes = evaluation.totalWorkedMinutes;
      record.effectiveMinutes = evaluation.effectiveWorkedMinutes;
      record.isLate = evaluation.isLate;
      record.lateByMinutes = evaluation.lateByMinutes;
      record.status = evaluation.status;

      await record.save();

      const populated = await Attendance.findById(record._id).populate(
        'employee',
        'name email role department avatar'
      );

      return NextResponse.json({
        ...(populated ? populated.toObject() : record.toObject()),
        evaluation,
      });
    }

    // Clock In / Punch In
    if (action === 'clock_in' || action === 'punch_in') {
      if (record && record.sessions && record.sessions.length > 0) {
        const lastSession = record.sessions[record.sessions.length - 1];
        if (!lastSession.checkOut) {
          return NextResponse.json(
            { error: 'You are already clocked in. Please clock out before starting a new session.' },
            { status: 400 }
          );
        }
      }

      if (!record) {
        record = new Attendance({
          employee: targetEmployeeId,
          date: todayStr,
          sessions: [],
        });
      }

      // Push new active session
      record.sessions.push({
        checkIn: now,
        checkOut: null,
        notes: notes || '',
      } as any);

      if (!record.checkIn) {
        record.checkIn = now;
      }

      // Evaluate
      const evaluation = evaluateDailyAttendance(record.sessions, todayStr, now);
      record.totalMinutes = evaluation.totalWorkedMinutes;
      record.effectiveMinutes = evaluation.effectiveWorkedMinutes;
      record.isLate = evaluation.isLate;
      record.lateByMinutes = evaluation.lateByMinutes;
      record.status = 'working';

      await record.save();

      const populated = await Attendance.findById(record._id).populate(
        'employee',
        'name email role department avatar'
      );

      return NextResponse.json(
        {
          ...(populated ? populated.toObject() : record.toObject()),
          evaluation,
        },
        { status: 201 }
      );
    }

    return NextResponse.json({ error: 'Invalid action provided' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
