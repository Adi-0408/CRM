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
      className={`bg-white rounded-3xl border border-slate-100 p-5 sm:p-7 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] relative overflow-hidden transition-all ${className}`}
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
              className={`w-full sm:w-auto px-7 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-sm min-h-[46px] disabled:opacity-50 ${
                isClockedIn
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                  : 'bg-[#0D9488] hover:bg-[#0f766e] text-white shadow-emerald-600/20'
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

            {/* Late Arrival Badge */}
            {evaluation.isLate ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-rose-50/70 border border-rose-200 text-rose-700 shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Late Arrival ({evaluation.lateByMinutes}m after 9:15 AM)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50/70 border border-emerald-200 text-emerald-700 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>On Time Arrival (&le; 9:15 AM)</span>
              </div>
            )}

            {/* Half Day / Full Day Badge */}
            {evaluation.effectiveWorkedMinutes >= 480 ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50/70 border border-emerald-200 text-emerald-700 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Full Day (8h+ Met)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50/70 border border-amber-200 text-amber-700 shadow-2xs">
                <Info className="w-3.5 h-3.5 text-amber-600" />
                <span>Half Day (&lt; 8h Completed)</span>
              </div>
            )}
          </div>
        )}

        {/* Total Hours Worked Today with Progress Track & Markers (Matching Image 5) */}
        <div className="space-y-2 pt-1">
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
                <span className="font-mono font-medium">
                  {formatMinutes(evaluation.remainingMinutes)} remaining
                </span>
              )}
            </div>
          </div>

          {/* Minimalist Progress Track */}
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                evaluation.effectiveWorkedMinutes >= 480
                  ? 'bg-emerald-500'
                  : 'bg-[#635BFF]'
              }`}
              style={{ width: `${Math.max(2, Math.min(100, evaluation.progressPercent))}%` }}
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
