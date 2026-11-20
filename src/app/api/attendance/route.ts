import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import { requireTenantAuth, buildTenantFilter, DEFAULT_COMPANY_ID } from '@/lib/apiAuth';
import {
  evaluateDailyAttendance,
  getLocalTodayStr,
  AttendanceSession,
} from '@/lib/attendanceEngine';
import { triggerAutoClockOutIfDue, initAutoClockOutJob } from '@/lib/autoClockOutService';
import { evaluateGeofence, ITPL_OFFICE_LOCATION } from '@/lib/geoFence';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { triggerPhotoCleanupIfDue } from '@/lib/attendancePhotoCleanupService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const authUser = authResult.user!;

    await connectToDatabase();
    initAutoClockOutJob();
    // Run auto clock-out and 30-day expired photo cleanup in background without blocking response
    triggerAutoClockOutIfDue().catch(() => {});
    triggerPhotoCleanupIfDue().catch(() => {});

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const monthParam = searchParams.get('month');
    const employeeId = searchParams.get('employeeId');

    const query: any = {};
    if (monthParam && monthParam !== 'all') {
      query.date = { $regex: `^${monthParam}` };
    } else if (dateParam && dateParam !== 'all') {
      if (/^\d{4}-\d{2}$/.test(dateParam)) {
        query.date = { $regex: `^${dateParam}` };
      } else {
        query.date = dateParam;
      }
    }

    // DATA SCOPING: Admin and HR can view all logs in tenant; others view ONLY their own attendance
    const isAdminOrHR =
      authUser.role === 'admin_manager' ||
      authUser.role === 'company_admin' ||
      authUser.role === 'platform_super_admin' ||
      authUser.role === 'hr';

    if (!isAdminOrHR) {
      query.employee = authUser.id;
    } else if (employeeId) {
      query.employee = employeeId;
    }

    const scopedQuery = buildTenantFilter(authUser, query);
    const records = await Attendance.find(scopedQuery)
      .populate('employee', 'name email role department avatar')
      .populate('overriddenBy', 'name email')
      .sort({ date: -1, updatedAt: -1 });

    const now = new Date();

    // Ensure all records have evaluated session stats
    const evaluatedRecords = records.map((record: any) => {
      let sessions: AttendanceSession[] = (record.sessions || []) as any;

      if (sessions.length === 0 && record.checkIn) {
        sessions = [
          {
            checkIn: record.checkIn,
            checkOut: record.checkOut || null,
            notes: record.notes || '',
            isAutoClockOut: record.isAutoClockOut,
          },
        ];
      }

      const evaluation = evaluateDailyAttendance(sessions, record.date, now);

      const isAuto = Boolean(record.isAutoClockOut || evaluation.isAutoClockOut);
      const finalStatus = record.status || evaluation.status;

      return {
        ...record.toObject(),
        sessions: evaluation.sessions,
        evaluation,
        totalMinutes: isAuto ? (record.totalMinutes || evaluation.totalWorkedMinutes) : evaluation.totalWorkedMinutes,
        effectiveMinutes: isAuto ? (record.effectiveMinutes || evaluation.effectiveWorkedMinutes) : evaluation.effectiveWorkedMinutes,
        isLate: isAuto ? Boolean(record.isLate) : evaluation.isLate,
        lateByMinutes: evaluation.lateByMinutes,
        status: finalStatus,
        isAutoClockOut: isAuto,
        autoClockOutReason: record.autoClockOutReason || evaluation.autoClockOutReason,
      };
    });

    return NextResponse.json(evaluatedRecords);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireTenantAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;
    const authUser = authResult.user!;

    await connectToDatabase();
    initAutoClockOutJob();
    triggerAutoClockOutIfDue().catch(() => {});
    triggerPhotoCleanupIfDue().catch(() => {});

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
      photo,
      location,
    } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const companyId = authUser.company_id || DEFAULT_COMPANY_ID;

    // Resolve employeeId to a valid employee
    let targetEmployeeId = employeeId;
    const isAdminOrHR =
      authUser.role === 'admin_manager' ||
      authUser.role === 'company_admin' ||
      authUser.role === 'platform_super_admin' ||
      authUser.role === 'hr';

    if (!isAdminOrHR) {
      targetEmployeeId = authUser.id;
    } else {
      const found = await Employee.findOne({
        $or: [
          { email: employeeId },
          { name: employeeId },
          ...(typeof employeeId === 'string' && employeeId.startsWith('demo_') ? [{ role: employeeId.replace('demo_', '') }] : []),
          ...(typeof employeeId === 'string' && employeeId.startsWith('user_') ? [{ role: employeeId.replace('user_', '') }] : []),
        ],
        company_id: companyId,
      });
      if (found) {
        targetEmployeeId = String(found._id || found.id);
      }
    }

    let validOverriddenById: string | undefined = undefined;
    if (overriddenById) {
      validOverriddenById = String(overriddenById);
    } else {
      const adminEmp = await Employee.findOne({
        role: { $in: ['admin_manager', 'company_admin'] },
        company_id: companyId,
      });
      if (adminEmp) {
        validOverriddenById = String(adminEmp._id || adminEmp.id);
      }
    }

    const todayStr = reqDate || getLocalTodayStr();
    const now = new Date();

    // 1. ADMIN / HR REGULARIZATION & OVERRIDE
    if (action === 'regularize' || action === 'override') {
      if (!isAdminOrHR) {
        return NextResponse.json(
          { error: 'Forbidden: Only HR and Admin can regularize attendance.' },
          { status: 403 }
        );
      }

      let record = await Attendance.findOne({
        employee: targetEmployeeId,
        date: todayStr,
        company_id: companyId,
      });

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
          company_id: companyId,
          employee: targetEmployeeId,
          date: todayStr,
        });
      }

      record.company_id = companyId;
      record.sessions = newSessions as any;
      record.checkIn = evaluation.firstCheckIn || null;
      record.checkOut = evaluation.lastCheckOut || null;
      record.totalMinutes = evaluation.totalWorkedMinutes || 0;
      record.effectiveMinutes = evaluation.effectiveWorkedMinutes || 0;
      record.isLate = Boolean(evaluation.isLate);
      record.lateByMinutes = evaluation.lateByMinutes || 0;
      record.status = reqStatus || evaluation.status || 'working';
      record.overrideReason = overrideReason ? String(overrideReason).trim() : '';
      record.overriddenBy = validOverriddenById || null;
      record.notes = notes ? String(notes).trim() : '';

      await record.save();

      const populated = await Attendance.findById(record._id)
        .populate('employee', 'name email role department avatar')
        .populate('overriddenBy', 'name email');

      return NextResponse.json({
        ...(populated ? populated.toObject() : record.toObject()),
        sessions: evaluation.sessions,
        evaluation,
      });
    }

    // 2. CLOCK IN / OUT FLOW
    let record = await Attendance.findOne({
      employee: targetEmployeeId,
      date: todayStr,
      company_id: companyId,
    });

    if (action === 'clock_out' || action === 'punch_out') {
      if (!record || !record.sessions || record.sessions.length === 0) {
        return NextResponse.json(
          { error: 'Cannot clock out: No clock-in session found for today.' },
          { status: 400 }
        );
      }

      const lastSessionIndex = record.sessions.length - 1;
      const lastSession = record.sessions[lastSessionIndex];

      if (lastSession.checkOut) {
        return NextResponse.json(
          { error: 'Already clocked out. Click Clock In to start a new session.' },
          { status: 400 }
        );
      }

      if (!photo || typeof photo !== 'string' || !photo.startsWith('data:image/')) {
        return NextResponse.json(
          { error: 'Live photo verification is required. Please capture a live selfie to clock out.' },
          { status: 400 }
        );
      }

      if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        return NextResponse.json(
          { error: 'GPS coordinates are required to verify the office perimeter before clocking out.' },
          { status: 400 }
        );
      }

      const customOffice =
        location.calibratedOffice?.latitude && location.calibratedOffice?.longitude
          ? {
              latitude: Number(location.calibratedOffice.latitude),
              longitude: Number(location.calibratedOffice.longitude),
            }
          : undefined;

      let geoCheck = evaluateGeofence(location.latitude, location.longitude, customOffice);
      if (!geoCheck.isWithinPerimeter && customOffice) {
        const fallbackCheck = evaluateGeofence(location.latitude, location.longitude);
        if (fallbackCheck.isWithinPerimeter) {
          geoCheck = fallbackCheck;
        }
      }

      if (!geoCheck.isWithinPerimeter) {
        return NextResponse.json(
          {
            error: `Location verification failed: You are ${geoCheck.distanceMeters}m away from the office. You must be within ${geoCheck.allowedRadiusMeters}m of ${geoCheck.officeAddress || 'the office perimeter'} to clock out.`,
            distanceMeters: geoCheck.distanceMeters,
            allowedRadiusMeters: geoCheck.allowedRadiusMeters,
          },
          { status: 403 }
        );
      }

      let uploadedCheckOutPhoto = photo;
      let checkOutPhotoPublicId: string | undefined = undefined;
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      let employeeName = authUser?.name || 'Employee';
      try {
        const empDoc = await Employee.findById(targetEmployeeId);
        if (empDoc && empDoc.name) {
          employeeName = empDoc.name;
        }
      } catch {}

      try {
        const uploadRes = await uploadToCloudinary(photo, 'attendance', {
          employeeName,
          date: todayStr,
          action: 'clock_out',
        });
        uploadedCheckOutPhoto = uploadRes.secureUrl || photo;
        checkOutPhotoPublicId = uploadRes.publicId;
      } catch (err) {
        console.warn('Cloudinary upload warning:', err);
      }

      lastSession.checkOut = now;
      lastSession.checkOutPhoto = uploadedCheckOutPhoto;
      lastSession.checkOutPhotoPublicId = checkOutPhotoPublicId;
      lastSession.checkOutPhotoExpiresAt = thirtyDaysFromNow;
      lastSession.checkOutLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        distanceMeters: geoCheck.distanceMeters,
        address: geoCheck.officeAddress,
        isWithinPerimeter: true,
      };
      if (notes) lastSession.notes = notes;
      record.checkOut = now;
      record.company_id = companyId;

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
        sessions: evaluation.sessions,
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

      if (!photo || typeof photo !== 'string' || !photo.startsWith('data:image/')) {
        return NextResponse.json(
          { error: 'Live photo verification is required. Please capture a live selfie to clock in.' },
          { status: 400 }
        );
      }

      if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        return NextResponse.json(
          { error: 'GPS coordinates are required to verify the office perimeter before clocking in.' },
          { status: 400 }
        );
      }

      const customOffice =
        location.calibratedOffice?.latitude && location.calibratedOffice?.longitude
          ? {
              latitude: Number(location.calibratedOffice.latitude),
              longitude: Number(location.calibratedOffice.longitude),
            }
          : undefined;

      let geoCheck = evaluateGeofence(location.latitude, location.longitude, customOffice);
      if (!geoCheck.isWithinPerimeter && customOffice) {
        const fallbackCheck = evaluateGeofence(location.latitude, location.longitude);
        if (fallbackCheck.isWithinPerimeter) {
          geoCheck = fallbackCheck;
        }
      }

      if (!geoCheck.isWithinPerimeter) {
        return NextResponse.json(
          {
            error: `Location verification failed: You are ${geoCheck.distanceMeters}m away from the office. You must be within ${geoCheck.allowedRadiusMeters}m of ${geoCheck.officeAddress || 'the office perimeter'} to clock in.`,
            distanceMeters: geoCheck.distanceMeters,
            allowedRadiusMeters: geoCheck.allowedRadiusMeters,
          },
          { status: 403 }
        );
      }

      let uploadedCheckInPhoto = photo;
      let checkInPhotoPublicId: string | undefined = undefined;
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      let employeeName = authUser?.name || 'Employee';
      try {
        const empDoc = await Employee.findById(targetEmployeeId);
        if (empDoc && empDoc.name) {
          employeeName = empDoc.name;
        }
      } catch {}

      try {
        const uploadRes = await uploadToCloudinary(photo, 'attendance', {
          employeeName,
          date: todayStr,
          action: 'clock_in',
        });
        uploadedCheckInPhoto = uploadRes.secureUrl || photo;
        checkInPhotoPublicId = uploadRes.publicId;
      } catch (err) {
        console.warn('Cloudinary upload warning:', err);
      }

      if (!record) {
        record = new Attendance({
          company_id: companyId,
          employee: targetEmployeeId,
          date: todayStr,
          sessions: [],
        });
      }

      record.company_id = companyId;

      record.sessions.push({
        checkIn: now,
        checkOut: null,
        notes: notes || '',
        checkInPhoto: uploadedCheckInPhoto,
        checkInPhotoPublicId,
        checkInPhotoExpiresAt: thirtyDaysFromNow,
        checkInLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
          distanceMeters: geoCheck.distanceMeters,
          address: geoCheck.officeAddress,
          isWithinPerimeter: true,
        },
      } as any);

      if (!record.checkIn) {
        record.checkIn = now;
      }

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

      return NextResponse.json(
        {
          ...(populated ? populated.toObject() : record.toObject()),
          sessions: evaluation.sessions,
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
