'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Play,
  Square,
  CheckCircle2,
  AlertCircle,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/apiClient';
import {
  AttendanceSession,
  EvaluatedDailyAttendance,
  evaluateDailyAttendance,
  getLocalTodayStr,
  formatMinutes,
  formatTimeAmPm,
  format12HourClock,
  formatLateArrival,
  parseDateInput,
} from '@/lib/attendanceEngine';

interface LiveClockCardProps {
  onPunchSuccess?: () => void;
  className?: string;
  initialRecord?: any;
}

export default function LiveClockCard({
  onPunchSuccess,
  className = '',
  initialRecord,
}: LiveClockCardProps) {
  const { user } = useAuth();
  const [now, setNow] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSessionsDropdown, setShowSessionsDropdown] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const todayStr = useMemo(() => getLocalTodayStr(now), [now]);

  // Live timer tick every second for real-time 12-hour clock
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync / Fetch today's record for logged-in user
  const fetchMyAttendance = async () => {
    if (!user?.id) return;
    try {
      const cacheKey = `attendance_${user.id}_${todayStr}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.sessions)) {
            setSessions(parsed.sessions);
          }
        } catch {
          // ignore cache parse error
        }
      }

      const res = await authFetch(`/api/attendance?date=${todayStr}&employeeId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const rec = data[0];
          const recSessions: AttendanceSession[] = rec.sessions || [];
          setSessions(recSessions);
          localStorage.setItem(cacheKey, JSON.stringify({ sessions: recSessions }));
        } else {
          setSessions([]);
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (err) {
      console.error('Error fetching employee attendance:', err);
    }
  };

  useEffect(() => {
    if (initialRecord && Array.isArray(initialRecord.sessions)) {
      setSessions(initialRecord.sessions);
    } else {
      fetchMyAttendance();
    }
  }, [user?.id, todayStr, initialRecord]);

  // Evaluate daily state live
  const evaluation: EvaluatedDailyAttendance = useMemo(() => {
    return evaluateDailyAttendance(sessions, todayStr, now);
  }, [sessions, todayStr, now]);

  const isClockedIn = evaluation.isCurrentlyWorking;

  // Work shift parameters (09:00 AM to 07:00 PM = 10h = 600m)
  // Calculates accurate shift timeline fill starting from employee check-in time
  const shiftMetrics = useMemo(() => {
    const shiftStartMinutes = 9 * 60; // 09:00 AM = 540 min
    const shiftEndMinutes = 19 * 60; // 07:00 PM = 1140 min
    const totalShiftMinutes = shiftEndMinutes - shiftStartMinutes; // 600 min

    const firstCheckInDate = evaluation.firstCheckIn ? parseDateInput(evaluation.firstCheckIn) : null;

    if (!firstCheckInDate || sessions.length === 0) {
      return {
        hasCheckIn: false,
        checkInOffsetPercent: 0,
        workedWidthPercent: 0,
        checkInFormatted: '--',
        isLate: false,
        lateCutoffPercent: ((9 * 60 + 15 - shiftStartMinutes) / totalShiftMinutes) * 100, // 2.5%
      };
    }

    const checkInTotalMin = firstCheckInDate.getHours() * 60 + firstCheckInDate.getMinutes() + firstCheckInDate.getSeconds() / 60;
    const offsetMinFromStart = Math.max(0, checkInTotalMin - shiftStartMinutes);
    const checkInOffsetPercent = Math.min(95, (offsetMinFromStart / totalShiftMinutes) * 100);

    // Worked width starting from checkInOffsetPercent
    const workedDurationMinutes = evaluation.effectiveWorkedMinutes;
    const workedWidthPercent = Math.min(
      100 - checkInOffsetPercent,
      Math.max(1, (workedDurationMinutes / totalShiftMinutes) * 100)
    );

    return {
      hasCheckIn: true,
      checkInOffsetPercent,
      workedWidthPercent,
      checkInFormatted: evaluation.firstPunchInFormatted,
      isLate: evaluation.isLate,
      lateCutoffPercent: ((9 * 60 + 15 - shiftStartMinutes) / totalShiftMinutes) * 100,
    };
  }, [evaluation, sessions]);

  const handleToggleClock = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const action = isClockedIn ? 'punch_out' : 'punch_in';
      const res = await authFetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user.id,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update attendance session');
      }

      const updatedSessions: AttendanceSession[] = data.sessions || [];
      setSessions(updatedSessions);

      const cacheKey = `attendance_${user.id}_${todayStr}`;
      localStorage.setItem(cacheKey, JSON.stringify({ sessions: updatedSessions }));

      setSuccessMsg(
        isClockedIn
          ? 'Punched out successfully. Session ended!'
          : 'Punched in successfully! Have a productive session.'
      );

      if (onPunchSuccess) {
        onPunchSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording punch');
    } finally {
      setLoading(false);
    }
  };

  const formattedCurrentTime = format12HourClock(now, true);

  const formattedDate = now.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className={`bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/80 p-5 sm:p-7 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.12),0_6px_16px_-3px_rgba(15,23,42,0.06)] hover:shadow-[0_22px_48px_-8px_rgba(15,23,42,0.16)] relative overflow-hidden transition-all ${className}`}
    >
      <div className="space-y-5">
        {/* Top Header: Clock, Shift Window, and Primary Clock Button (Matching Image 5) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors shadow-xs ${
                isClockedIn
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-[#F0EEFF] text-[#635BFF] border border-purple-100'
              }`}
            >
              <Clock className={`w-6 h-6 ${isClockedIn ? 'animate-pulse' : ''}`} />
            </div>

            <div>
              <div className="flex items-center space-x-2.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-mono">
                  {formattedCurrentTime}
                </span>
                {isClockedIn && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>SESSION ACTIVE</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {formattedDate} • Work Window: 09:00 AM – 07:00 PM
              </p>
            </div>
          </div>

          {/* Primary Action Button (Clock In / Clock Out) */}
          <div className="w-full sm:w-auto">
            <button
              onClick={handleToggleClock}
              disabled={loading}
              className={`w-full sm:w-auto px-7 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all active:scale-95 min-h-[46px] disabled:opacity-50 border-t border-white/30 ${
                isClockedIn
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-[0_8px_20px_-2px_rgba(245,158,11,0.40)]'
                  : 'bg-[#0D9488] hover:bg-[#0f766e] text-white shadow-[0_8px_20px_-2px_rgba(13,148,136,0.40)]'
              }`}
            >
              {isClockedIn ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  <span>Clock Out</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Clock In</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-medium flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Live Status Pill Badges Row (Matching Image 4) */}
        {sessions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* First Check-In */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-50 border border-slate-200/80 text-slate-700 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>First Check-In: <strong className="font-mono font-bold text-slate-900">{evaluation.firstPunchInFormatted.toLowerCase()}</strong></span>
            </div>

            {/* Late Arrival Badge - Displays both hours and minutes */}
            {evaluation.isLate ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-rose-50/70 border border-rose-200 text-rose-700 shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Late Arrival ({formatLateArrival(evaluation.lateByMinutes)} after 9:15 AM)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50/70 border border-emerald-200 text-emerald-700 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>On Time Arrival (&le; 9:15 AM)</span>
              </div>
            )}

            {/* Half Day / Full Day / In Progress Badge */}
            {evaluation.status === 'full_day' || evaluation.effectiveWorkedMinutes >= 480 ? (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50/70 border border-emerald-200 text-emerald-700 shadow-2xs"
                title={evaluation.autoClockOutReason}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Full Day {evaluation.isAutoClockOut ? '(Auto 12:01 AM)' : '(8h+ Met)'}</span>
              </div>
            ) : isClockedIn ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-teal-50/70 border border-teal-200 text-teal-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span>In Progress ({evaluation.formattedWorked} / 8h)</span>
              </div>
            ) : (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50/70 border border-amber-200 text-amber-700 shadow-2xs"
                title={evaluation.autoClockOutReason}
              >
                <Info className="w-3.5 h-3.5 text-amber-600" />
                <span>Half Day {evaluation.isAutoClockOut ? '(Auto 12:01 AM)' : `(${evaluation.formattedWorked} / 8h Completed)`}</span>
              </div>
            )}
          </div>
        )}

        {/* 1. Shift Timeline Track (09:00 AM - 07:00 PM) - Starts filling from Employee Check-In Time */}
        <div className="space-y-2 pt-2 border-t border-slate-100/80">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-800">
                Shift Timeline (09:00 AM – 07:00 PM)
              </span>
              {shiftMetrics.hasCheckIn && (
                <span className="text-[11px] text-slate-500 font-medium">
                  • Starts at <strong className="text-slate-700 font-mono">{shiftMetrics.checkInFormatted}</strong>
                </span>
              )}
            </div>
            <div className="text-[11px] font-semibold text-slate-500">
              {shiftMetrics.hasCheckIn ? (
                <span>
                  Worked: <strong className="text-emerald-600 font-mono">{evaluation.formattedWorked}</strong>
                </span>
              ) : (
                <span className="text-slate-400">Not checked in yet</span>
              )}
            </div>
          </div>

          {/* Timeline Bar Track */}
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
            {/* Late Arrival Window before Check-In */}
            {shiftMetrics.hasCheckIn && shiftMetrics.isLate && shiftMetrics.checkInOffsetPercent > 0 && (
              <div
                className="absolute top-0 bottom-0 bg-rose-100/70 border-r border-rose-300 transition-all duration-300"
                style={{
                  left: 0,
                  width: `${shiftMetrics.checkInOffsetPercent}%`,
                }}
                title={`Late arrival period before check-in (${formatLateArrival(evaluation.lateByMinutes)})`}
              />
            )}

            {/* Active / Worked Segments starting from Check-In Time */}
            {shiftMetrics.hasCheckIn && (
              <div
                className={`absolute top-0 bottom-0 rounded-full transition-all duration-500 ${
                  evaluation.effectiveWorkedMinutes >= 480
                    ? 'bg-emerald-500'
                    : isClockedIn
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse'
                    : 'bg-[#635BFF]'
                }`}
                style={{
                  left: `${shiftMetrics.checkInOffsetPercent}%`,
                  width: `${Math.max(1.5, shiftMetrics.workedWidthPercent)}%`,
                }}
                title={`Active work segment starting from check-in at ${shiftMetrics.checkInFormatted}`}
              />
            )}

            {/* Check-In Pin Marker */}
            {shiftMetrics.hasCheckIn && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                style={{ left: `${shiftMetrics.checkInOffsetPercent}%` }}
                title={`Check-In: ${shiftMetrics.checkInFormatted}`}
              />
            )}
          </div>

          {/* Timeline Step Markers */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
            <span>09:00 AM (Start)</span>
            {shiftMetrics.hasCheckIn ? (
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 shadow-2xs">
                Check-In: {shiftMetrics.checkInFormatted}
              </span>
            ) : (
              <span>09:15 AM (Cutoff)</span>
            )}
            <span>07:00 PM (Shift End)</span>
          </div>
        </div>

        {/* 2. 8-Hour Target Progress Track (0h Start -> 4h Half Day -> 8h Full Day) */}
        <div className="space-y-2 pt-2 border-t border-slate-100/80">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800">
                Worked Today: {evaluation.formattedWorked}
              </span>
              <span className="text-slate-400 font-medium">/ 8h 00m</span>
            </div>

            <div className="font-bold text-xs text-[#635BFF]">
              {evaluation.effectiveWorkedMinutes >= 480 ? (
                <span className="text-emerald-600 flex items-center space-x-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>8h 00m target completed</span>
                </span>
              ) : (
                <span className="font-mono font-medium text-slate-500">
                  {formatMinutes(evaluation.remainingMinutes)} remaining to reach 8h
                </span>
              )}
            </div>
          </div>

          {/* Target Progress Bar Track */}
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                evaluation.effectiveWorkedMinutes >= 480
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-[#635BFF] to-[#7B73FF]'
              }`}
              style={{
                width: `${Math.max(sessions.length > 0 ? 2 : 0, Math.min(100, evaluation.progressPercent))}%`,
              }}
            />
          </div>

          {/* Step Markers (0h (Start) | 4h (Half Day) | 8h (Full Day Target)) */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
            <span>0h (Start)</span>
            <span>4h (Half Day)</span>
            <span>8h (Full Day Target)</span>
          </div>
        </div>

        {/* Today's Sessions Accordion (Matching Image 5) */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowSessionsDropdown(!showSessionsDropdown)}
            className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 transition-colors py-1 cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 text-[#635BFF]" />
              <span className="font-semibold text-slate-800">
                Today&apos;s Sessions ({sessions.length} Recorded)
              </span>
            </div>
            <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
              <span>View session breakdown</span>
              {showSessionsDropdown ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </div>
          </button>

          {showSessionsDropdown && (
            <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 animate-in fade-in">
              {sessions.length > 0 ? (
                sessions.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 px-3 bg-white rounded-xl border border-slate-100 shadow-2xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-4 h-4 rounded-full bg-[#F0EEFF] text-[#635BFF] flex items-center justify-center font-bold text-[9px]">
                        #{idx + 1}
                      </span>
                      <span className="font-mono font-medium text-slate-700">
                        {formatTimeAmPm(s.checkIn)} &rarr; {s.checkOut ? formatTimeAmPm(s.checkOut) : 'Active'}
                      </span>
                    </div>
                    {s.notes && (
                      <span className="text-[10px] text-slate-400 italic">{s.notes}</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-400 py-1 text-center">
                  No clock-in sessions recorded today yet. Click &ldquo;Clock In&rdquo; above to start your shift.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
