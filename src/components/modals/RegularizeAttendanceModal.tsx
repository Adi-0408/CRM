'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  Plus,
  Trash2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/apiClient';
import {
  AttendanceSession,
  formatMinutes,
  formatTimeAmPm,
  formatLateArrival,
  evaluateDailyAttendance,
} from '@/lib/attendanceEngine';

interface RegularizeAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: any;
  date: string; // YYYY-MM-DD
  initialRecord?: any;
}

// Helper to extract HH:mm from Date or string
function extractHHmm(dateInput?: string | Date | null, fallback = '09:00'): string {
  if (!dateInput) return fallback;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return fallback;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Convert YYYY-MM-DD and HH:mm to ISO string
function timeToIsoString(dateStr: string, timeStr: string, fallbackH = 9, fallbackM = 0): string {
  if (!timeStr) return '';
  const [inH, inM] = timeStr.split(':').map(Number);
  const h = isNaN(inH) ? fallbackH : inH;
  const m = isNaN(inM) ? fallbackM : inM;

  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3) {
    const d = new Date(parts[0], parts[1] - 1, parts[2], h, m, 0, 0);
    return d.toISOString();
  }
  const d = new Date(dateStr);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

type TargetStatus = 'full_day' | 'half_day' | 'working' | 'absent';

export default function RegularizeAttendanceModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
  date,
  initialRecord,
}: RegularizeAttendanceModalProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<
    Array<{ checkIn: string; checkOut: string; notes?: string }>
  >([]);
  const [targetStatus, setTargetStatus] = useState<TargetStatus>('full_day');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (initialRecord && Array.isArray(initialRecord.sessions) && initialRecord.sessions.length > 0) {
      setSessions(
        initialRecord.sessions.map((s: AttendanceSession) => ({
          checkIn: extractHHmm(s.checkIn, '09:00'),
          checkOut: s.checkOut ? extractHHmm(s.checkOut, '18:00') : '',
          notes: s.notes || '',
        }))
      );
      setOverrideReason(initialRecord.overrideReason || 'Regularized attendance record by Admin/HR');
      if (initialRecord.status === 'half_day') setTargetStatus('half_day');
      else if (initialRecord.status === 'working') setTargetStatus('working');
      else if (initialRecord.status === 'absent') setTargetStatus('absent');
      else setTargetStatus('full_day');
    } else {
      // Default standard full day
      setSessions([
        {
          checkIn: '09:00',
          checkOut: '17:30',
          notes: 'Standard full workday',
        },
      ]);
      setTargetStatus('full_day');
      setOverrideReason('Regularized standard shift by HR/Admin');
    }
    setError('');
    setSuccessMsg('');
  }, [initialRecord, isOpen]);

  // Handle clicking Target Day Status preset pills (matching Image 3)
  const handleSelectTargetStatus = (status: TargetStatus) => {
    setTargetStatus(status);
    if (status === 'full_day') {
      setSessions([
        {
          checkIn: '09:00',
          checkOut: '17:30',
          notes: 'Full Day shift (8h 30m completed)',
        },
      ]);
      setOverrideReason('Approved full day regularized attendance');
    } else if (status === 'half_day') {
      setSessions([
        {
          checkIn: '09:30',
          checkOut: '14:00',
          notes: 'Half Day shift (< 8h completed)',
        },
      ]);
      setOverrideReason('Approved half-day shift (under 8 hours)');
    } else if (status === 'working') {
      setSessions([
        {
          checkIn: '09:00',
          checkOut: '',
          notes: 'Currently working active shift',
        },
      ]);
      setOverrideReason('Active shift currently in progress');
    } else if (status === 'absent') {
      setSessions([]);
      setOverrideReason('Marked absent for the day');
    }
  };

  // Live client-side preview of what the sessions calculate to
  const calculatedPreview = useMemo(() => {
    const mockSessions: AttendanceSession[] = sessions
      .filter((s) => s.checkIn)
      .map((s) => ({
        checkIn: timeToIsoString(date, s.checkIn, 9, 0),
        checkOut: s.checkOut ? timeToIsoString(date, s.checkOut, 18, 0) : null,
        notes: s.notes || '',
      }));

    return evaluateDailyAttendance(mockSessions, date, new Date());
  }, [sessions, date]);

  if (!isOpen || !employee) return null;

  const handleAddSession = () => {
    const lastSession = sessions[sessions.length - 1];
    let nextCheckIn = '14:00';
    let nextCheckOut = '18:00';

    if (lastSession?.checkOut) {
      const [h] = lastSession.checkOut.split(':').map(Number);
      const nextH = Math.min(23, (h || 13) + 1);
      nextCheckIn = `${String(nextH).padStart(2, '0')}:00`;
      nextCheckOut = `${String(Math.min(23, nextH + 4)).padStart(2, '0')}:00`;
    }

    setSessions([
      ...sessions,
      {
        checkIn: nextCheckIn,
        checkOut: nextCheckOut,
        notes: '',
      },
    ]);
  };

  const handleRemoveSession = (index: number) => {
    setSessions(sessions.filter((_, i) => i !== index));
  };

  const handleSessionChange = (index: number, field: string, value: string) => {
    const updated = [...sessions];
    updated[index] = { ...updated[index], [field]: value };
    setSessions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      setError('Please provide a brief justification / reason for this attendance record.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');

      const payloadSessions = sessions
        .filter((s) => s.checkIn)
        .map((s) => ({
          checkIn: timeToIsoString(date, s.checkIn, 9, 0),
          checkOut: s.checkOut ? timeToIsoString(date, s.checkOut, 18, 0) : null,
          notes: s.notes || '',
        }));

      // Map targetStatus to exact status code
      let finalStatus: string = calculatedPreview.status;
      if (targetStatus === 'absent' || payloadSessions.length === 0) {
        finalStatus = 'absent';
      } else if (targetStatus === 'half_day') {
        finalStatus = 'half_day';
      } else if (targetStatus === 'working') {
        finalStatus = 'working';
      } else if (targetStatus === 'full_day') {
        finalStatus = 'full_day';
      }

      const res = await authFetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employee._id || employee.id,
          action: 'regularize',
          date,
          sessions: payloadSessions,
          status: finalStatus,
          overrideReason: overrideReason.trim(),
          overriddenById: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to regularize attendance');
      }

      setSuccessMsg('Attendance timesheet regularized and saved successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving attendance override');
    } finally {
      setLoading(false);
    }
  };

  const formattedTargetDate = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_25px_70px_-10px_rgba(15,23,42,0.25),0_10px_24px_-4px_rgba(15,23,42,0.10)] w-[95vw] max-w-lg p-5 sm:p-7 relative overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Decorative Floating Pill Gradient Accents */}
        <div className="absolute top-0 right-0 w-60 h-32 bg-purple-100/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-32 bg-emerald-100/30 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-[#F0EEFF] text-[#635BFF] border border-purple-100/80 flex items-center justify-center flex-shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Regularize Attendance
              </h3>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-xs font-semibold text-slate-800">
                  {employee.name}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.2 rounded-full font-medium">
                  {employee.department || 'General'}
                </span>
                <span className="text-[11px] text-slate-400">• {formattedTargetDate}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-h-[40px] min-w-[40px] rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors flex items-center justify-center"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TARGET DAY STATUS (Matching Image 3) */}
        <div className="mb-5">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            TARGET DAY STATUS
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Full Day */}
            <button
              type="button"
              onClick={() => handleSelectTargetStatus('full_day')}
              className={`p-2.5 rounded-2xl text-center border transition-all active:scale-95 ${
                targetStatus === 'full_day'
                  ? 'border-[#635BFF] bg-[#F0EEFF] text-[#635BFF] ring-2 ring-[#635BFF]/20 shadow-xs'
                  : 'border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-xs font-bold leading-tight">Full Day</div>
              <div className={`text-[10px] mt-0.5 font-medium ${targetStatus === 'full_day' ? 'text-[#635BFF]/80' : 'text-slate-400'}`}>
                8h+ met
              </div>
            </button>

            {/* 2. Half Day */}
            <button
              type="button"
              onClick={() => handleSelectTargetStatus('half_day')}
              className={`p-2.5 rounded-2xl text-center border transition-all active:scale-95 ${
                targetStatus === 'half_day'
                  ? 'border-amber-300 bg-amber-50/70 text-amber-800 ring-2 ring-amber-400/20 shadow-xs'
                  : 'border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-xs font-bold leading-tight">Half Day</div>
              <div className={`text-[10px] mt-0.5 font-medium ${targetStatus === 'half_day' ? 'text-amber-700/80' : 'text-slate-400'}`}>
                &lt; 8h
              </div>
            </button>

            {/* 3. Working */}
            <button
              type="button"
              onClick={() => handleSelectTargetStatus('working')}
              className={`p-2.5 rounded-2xl text-center border transition-all active:scale-95 ${
                targetStatus === 'working'
                  ? 'border-indigo-300 bg-indigo-50/70 text-indigo-700 ring-2 ring-indigo-400/20 shadow-xs'
                  : 'border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-xs font-bold leading-tight">Working</div>
              <div className={`text-[10px] mt-0.5 font-medium ${targetStatus === 'working' ? 'text-indigo-600/80' : 'text-slate-400'}`}>
                Active session
              </div>
            </button>

            {/* 4. Absent */}
            <button
              type="button"
              onClick={() => handleSelectTargetStatus('absent')}
              className={`p-2.5 rounded-2xl text-center border transition-all active:scale-95 ${
                targetStatus === 'absent'
                  ? 'border-slate-400 bg-slate-100 text-slate-800 ring-2 ring-slate-300 shadow-xs'
                  : 'border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-xs font-bold leading-tight">Absent</div>
              <div className={`text-[10px] mt-0.5 font-medium ${targetStatus === 'absent' ? 'text-slate-600' : 'text-slate-400'}`}>
                0 hours
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sessions Manager */}
          {targetStatus !== 'absent' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#635BFF]" />
                  <span>Daily Punches &amp; Sessions</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddSession}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold text-[#635BFF] bg-[#F0EEFF] hover:bg-[#E5E0FD] transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Session</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-48 overflow-y-auto no-scrollbar pr-0.5">
                {sessions.map((s, index) => {
                  let sessionMins = 0;
                  if (s.checkIn && s.checkOut) {
                    const [inH, inM] = s.checkIn.split(':').map(Number);
                    const [outH, outM] = s.checkOut.split(':').map(Number);
                    sessionMins = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));
                  }

                  return (
                    <div
                      key={index}
                      className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2 transition-all hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            Session {index + 1}
                          </span>
                          {sessionMins > 0 && (
                            <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                              {formatMinutes(sessionMins)}
                            </span>
                          )}
                        </div>

                        {sessions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSession(index)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Clock In
                          </label>
                          <input
                            type="time"
                            required
                            value={s.checkIn}
                            onChange={(e) =>
                              handleSessionChange(index, 'checkIn', e.target.value)
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-mono font-bold focus:outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/15 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Clock Out
                          </label>
                          <input
                            type="time"
                            value={s.checkOut}
                            onChange={(e) =>
                              handleSessionChange(index, 'checkOut', e.target.value)
                            }
                            placeholder="Active session if blank"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-mono font-bold focus:outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/15 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={s.notes || ''}
                          onChange={(e) =>
                            handleSessionChange(index, 'notes', e.target.value)
                          }
                          placeholder="Session notes (e.g. Regular shift, client meeting)"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#635BFF]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Status Pill Badges Row (Matching Image 4) */}
          <div className="flex flex-wrap items-center gap-2 py-1">
            {/* First Check-In */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>First Check-In: <strong className="font-mono text-slate-900">{calculatedPreview.firstPunchInFormatted}</strong></span>
            </div>

            {/* Punctuality Badge */}
            {calculatedPreview.isLate ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50/70 border border-rose-200 text-rose-700">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Late Arrival ({formatLateArrival(calculatedPreview.lateByMinutes)} after 9:15 AM)</span>
              </div>
            ) : calculatedPreview.firstCheckIn ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50/70 border border-emerald-200 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>On Time (&le; 9:15 AM)</span>
              </div>
            ) : null}

            {/* Day Status Badge */}
            {calculatedPreview.totalWorkedMinutes >= 480 ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50/70 border border-emerald-200 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Full Day (8h+ Met)</span>
              </div>
            ) : calculatedPreview.firstCheckIn ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50/70 border border-amber-200 text-amber-700">
                <Info className="w-3.5 h-3.5 text-amber-600" />
                <span>Half Day (&lt; 8h Completed)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-600">
                <span>Absent (0h Completed)</span>
              </div>
            )}
          </div>

          {/* Audit Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Audit Reason / Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Biometric punch error, employee forgot to clock out at 6:00 PM, approved by HR..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/15 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm active:scale-95 transition-all flex items-center space-x-1.5 disabled:opacity-50 min-h-[42px]"
            >
              <span>{loading ? 'Saving Changes...' : 'Save & Regularize'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
