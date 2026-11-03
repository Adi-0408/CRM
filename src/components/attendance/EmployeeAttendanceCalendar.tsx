'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  CalendarDays,
  User,
  Search,
  Sparkles,
  ArrowLeft,
  Edit3,
  Coffee,
  Check,
  ChevronDown,
  Camera,
  MapPin,
  ExternalLink,
  X,
  ShieldCheck,
} from 'lucide-react';
import {
  evaluateDailyAttendance,
  getLocalTodayStr,
  formatMinutes,
  formatTimeAmPm,
  formatLateArrival,
  AttendanceSession,
} from '@/lib/attendanceEngine';

export interface EmployeeAttendanceCalendarProps {
  employee: any;
  employees?: any[];
  records: any[];
  leaves?: any[];
  selectedMonth: string; // 'YYYY-MM'
  onMonthChange: (month: string) => void;
  onEmployeeChange?: (emp: any) => void;
  onRegularize?: (emp: any, date: string, record: any) => void;
  isAdminOrHr?: boolean;
  onBack?: () => void;
}

export type DayAttendanceStatus =
  | 'present'
  | 'half_day'
  | 'absent'
  | 'paid_leave'
  | 'unpaid_leave'
  | 'weekend'
  | 'today_pending'
  | 'future';

export interface DayData {
  dayNum: number;
  dateStr: string;
  dayOfWeek: number; // 0 = Sun, 6 = Sat
  status: DayAttendanceStatus;
  isLate: boolean;
  lateByMinutes: number;
  totalWorkedMinutes: number;
  isAutoClockOut: boolean;
  isCurrentlyWorking: boolean;
  record: any | null;
  sessions: AttendanceSession[];
  leaveInfo?: any | null;
  statusLabel: string;
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function EmployeeAttendanceCalendar({
  employee,
  employees = [],
  records = [],
  leaves = [],
  selectedMonth,
  onMonthChange,
  onEmployeeChange,
  onRegularize,
  isAdminOrHr = false,
  onBack,
}: EmployeeAttendanceCalendarProps) {
  const [empSearch, setEmpSearch] = useState('');
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const [calendarPreviewPhoto, setCalendarPreviewPhoto] = useState<{
    url: string;
    title: string;
    subtitle?: string;
    time?: string;
    type: 'Clock In' | 'Clock Out';
    location?: any;
  } | null>(null);

  // Prevent background scrolling while preview photo lightbox is active
  useEffect(() => {
    if (calendarPreviewPhoto) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [calendarPreviewPhoto]);

  const todayStr = useMemo(() => getLocalTodayStr(), []);

  // Parse Year & Month
  const { year, month, totalDaysInMonth, startingDayOfWeek, monthName } = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const firstDate = new Date(y, m - 1, 1);
    const lastDate = new Date(y, m, 0);
    const mName = firstDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return {
      year: y,
      month: m,
      totalDaysInMonth: lastDate.getDate(),
      startingDayOfWeek: firstDate.getDay(), // 0 = Sun
      monthName: mName,
    };
  }, [selectedMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    const d = new Date(year, month - 2, 1);
    const newMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(newMonthStr);
  };

  const handleNextMonth = () => {
    const d = new Date(year, month, 1);
    const newMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(newMonthStr);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    const currMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(currMonthStr);
  };

  // Filter records for this employee
  const empRecordsMap = useMemo(() => {
    const map = new Map<string, any>();
    const targetEmpId = String(employee?._id || employee?.id || employee?.email || '');

    records.forEach((r) => {
      const rEmpId = String(
        r.employee?._id ||
          r.employee?.id ||
          (typeof r.employee === 'string' ? r.employee : '')
      );
      if (rEmpId === targetEmpId && r.date) {
        map.set(r.date, r);
      }
    });

    return map;
  }, [records, employee]);

  // Map of approved leaves for this employee
  const empLeavesList = useMemo(() => {
    const targetEmpId = String(employee?._id || employee?.id || '');
    return leaves.filter((l) => {
      const lEmpId = String(
        l.employee?._id || l.employee?.id || (typeof l.employee === 'string' ? l.employee : '')
      );
      const isStatusApproved = String(l.status || '').toLowerCase() === 'approved';
      return lEmpId === targetEmpId && isStatusApproved;
    });
  }, [leaves, employee]);

  // Build the complete days array for the month
  const { days, metrics } = useMemo(() => {
    const daysArr: DayData[] = [];
    const now = new Date();

    let presentCount = 0;
    let absentCount = 0;
    let halfDaysCount = 0;
    let paidLeaveCount = 0;
    let unpaidLeaveCount = 0;

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(year, month - 1, d);
      const dayOfWeek = dayDate.getDay();
      const isSunday = dayOfWeek === 0;
      const isPastOrToday = dateStr <= todayStr;
      const isToday = dateStr === todayStr;

      const record = empRecordsMap.get(dateStr) || null;

      // Check if day falls within an approved leave
      const matchingLeave = empLeavesList.find((l) => {
        const start = String(l.startDate || '').slice(0, 10);
        const end = String(l.endDate || '').slice(0, 10);
        return dateStr >= start && dateStr <= end;
      });

      let status: DayAttendanceStatus = 'future';
      let isLate = false;
      let lateByMinutes = 0;
      let totalWorkedMinutes = 0;
      let isAutoClockOut = false;
      let isCurrentlyWorking = false;
      let sessions: AttendanceSession[] = [];
      let statusLabel = 'Upcoming';

      if (record) {
        sessions = record.sessions || [];
        const evaluation = evaluateDailyAttendance(sessions, dateStr, now);

        totalWorkedMinutes = evaluation.totalWorkedMinutes || 0;
        isLate = Boolean(record.isLate || evaluation.isLate);
        lateByMinutes = evaluation.lateByMinutes || 0;
        isAutoClockOut = Boolean(record.isAutoClockOut || evaluation.isAutoClockOut);
        isCurrentlyWorking = Boolean(evaluation.isCurrentlyWorking);

        let statusCode = record.status || evaluation.status;
        const isFullDay =
          statusCode === 'full_day' || (!isAutoClockOut && totalWorkedMinutes >= 480);
        const isHalf =
          statusCode === 'half_day' ||
          (!isFullDay && sessions.length > 0 && !isCurrentlyWorking && totalWorkedMinutes > 0);

        if (isFullDay) {
          status = 'present';
          statusLabel = isLate ? 'Present (Late)' : 'Present';
          presentCount++;
        } else if (isHalf) {
          status = 'half_day';
          statusLabel = 'Half Day';
          halfDaysCount++;
        } else if (isCurrentlyWorking) {
          status = 'present';
          statusLabel = 'Working Active';
          presentCount++;
        } else if (statusCode === 'absent') {
          status = 'absent';
          statusLabel = 'Absent';
          absentCount++;
        } else {
          status = 'present';
          statusLabel = 'Present';
          presentCount++;
        }
      } else if (matchingLeave) {
        if (matchingLeave.type === 'unpaid') {
          status = 'unpaid_leave';
          statusLabel = 'Unpaid Leave';
          unpaidLeaveCount++;
        } else {
          status = 'paid_leave';
          statusLabel = 'Paid Leave';
          paidLeaveCount++;
        }
      } else if (isSunday) {
        status = 'weekend';
        statusLabel = 'Sunday (Off)';
      } else if (isToday) {
        status = 'today_pending';
        statusLabel = 'Clock In Pending';
      } else if (isPastOrToday) {
        status = 'absent';
        statusLabel = 'Absent';
        absentCount++;
      } else {
        status = 'future';
        statusLabel = 'Scheduled';
      }

      daysArr.push({
        dayNum: d,
        dateStr,
        dayOfWeek,
        status,
        isLate,
        lateByMinutes,
        totalWorkedMinutes,
        isAutoClockOut,
        isCurrentlyWorking,
        record,
        sessions,
        leaveInfo: matchingLeave || null,
        statusLabel,
      });
    }

    return {
      days: daysArr,
      metrics: {
        present: presentCount,
        absent: absentCount,
        halfDays: halfDaysCount,
        paid: paidLeaveCount,
        unpaid: unpaidLeaveCount,
      },
    };
  }, [
    year,
    month,
    totalDaysInMonth,
    empRecordsMap,
    empLeavesList,
    todayStr,
  ]);

  // Currently selected day in calendar to inspect
  const [selectedDay, setSelectedDay] = useState<DayData | null>(() => {
    // Default to today if in current month, or the 1st of the month
    const todayDay = days.find((d) => d.dateStr === todayStr);
    return todayDay || days[0] || null;
  });

  // Keep selectedDay synced when month changes
  useMemo(() => {
    const match = days.find((d) => d.dateStr === selectedDay?.dateStr);
    if (match) setSelectedDay(match);
    else setSelectedDay(days.find((d) => d.dateStr === todayStr) || days[0] || null);
  }, [days, todayStr]);

  // Filtered employees for selector
  const filteredEmployees = useMemo(() => {
    if (!empSearch.trim()) return employees;
    const q = empSearch.toLowerCase();
    return employees.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q)
    );
  }, [employees, empSearch]);

  const weekDayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper for styling day tiles according to the reference image
  const getDayTileStyles = (day: DayData) => {
    const isSelected = selectedDay?.dateStr === day.dateStr;
    const base =
      'relative flex flex-col items-center justify-center rounded-2xl p-1 sm:p-2 font-bold transition-all duration-150 select-none cursor-pointer focus:outline-none';

    let colorBg = '';
    let textColor = 'text-white';
    let subBadge = null;

    switch (day.status) {
      case 'present':
        // Teal/Green like reference
        colorBg = 'bg-[#10b981] hover:bg-[#059669] shadow-xs';
        if (day.isLate) {
          subBadge = (
            <span className="text-[9px] font-extrabold px-1 rounded-sm bg-teal-800/80 text-amber-200 mt-0.5 leading-tight tracking-tight">
              Late
            </span>
          );
        }
        break;

      case 'half_day':
        // Vibrant Orange/Amber like reference
        colorBg = 'bg-[#f59e0b] hover:bg-[#d97706] shadow-xs';
        subBadge = (
          <span className="text-[9px] font-extrabold px-1 rounded-sm bg-amber-800/60 text-amber-100 mt-0.5 leading-tight tracking-tight">
            Half
          </span>
        );
        break;

      case 'absent':
        // Vibrant Red like reference
        colorBg = 'bg-[#ef4444] hover:bg-[#dc2626] shadow-xs';
        break;

      case 'weekend':
        // Sunday is highlighted red in reference image!
        colorBg = 'bg-[#f87171] hover:bg-[#ef4444] shadow-xs';
        break;

      case 'paid_leave':
        // Sky Blue
        colorBg = 'bg-[#0ea5e9] hover:bg-[#0284c7] shadow-xs';
        subBadge = (
          <span className="text-[9px] font-extrabold px-1 rounded-sm bg-sky-800/70 text-sky-100 mt-0.5 leading-tight tracking-tight">
            Paid
          </span>
        );
        break;

      case 'unpaid_leave':
        // Purple/Fuchsia
        colorBg = 'bg-[#d946ef] hover:bg-[#c026d3] shadow-xs';
        subBadge = (
          <span className="text-[9px] font-extrabold px-1 rounded-sm bg-purple-900/60 text-pink-100 mt-0.5 leading-tight tracking-tight">
            Unpaid
          </span>
        );
        break;

      case 'today_pending':
        colorBg = 'bg-amber-100 border-2 border-dashed border-amber-400 text-amber-800';
        textColor = 'text-amber-900';
        subBadge = (
          <span className="text-[9px] font-bold text-amber-700 mt-0.5">Today</span>
        );
        break;

      case 'future':
      default:
        colorBg = 'bg-slate-100/70 border border-slate-200/80 text-slate-400 hover:bg-slate-100';
        textColor = 'text-slate-400';
        break;
    }

    const ring = isSelected
      ? 'ring-4 ring-indigo-500/80 ring-offset-2 scale-105 z-10 shadow-md'
      : 'hover:scale-[1.03]';

    return {
      className: `${base} ${colorBg} ${textColor} ${ring} h-14 sm:h-16 w-full`,
      subBadge,
    };
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar (Employee Title, Switcher & Month Navigator) */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.3)] border border-slate-800">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Left: Employee Profile & Back Button */}
          <div className="flex items-center space-x-3.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Back to table view"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="relative">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-bold text-base shrink-0 shadow-inner">
                {employee?.avatar ? (
                  <img
                    src={employee.avatar}
                    alt={employee.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(employee?.name || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black tracking-tight text-white truncate">
                  {employee?.name || 'Employee Attendance'}
                </h3>

                {/* Switcher Pill for Admin/HR */}
                {isAdminOrHr && employees.length > 1 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmpDropdown(!showEmpDropdown)}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-slate-300 flex items-center space-x-1 transition cursor-pointer"
                    >
                      <span>Switch Employee</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {showEmpDropdown && (
                      <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                        <div className="p-2 border-b border-slate-800">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={empSearch}
                              onChange={(e) => setEmpSearch(e.target.value)}
                              placeholder="Search employee..."
                              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                              autoFocus
                            />
                          </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/50 mt-1">
                          {filteredEmployees.map((emp) => {
                            const isCurrent =
                              String(emp._id || emp.id) ===
                              String(employee?._id || employee?.id);
                            return (
                              <button
                                key={emp._id || emp.id}
                                type="button"
                                onClick={() => {
                                  if (onEmployeeChange) onEmployeeChange(emp);
                                  setShowEmpDropdown(false);
                                  setEmpSearch('');
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                                  isCurrent
                                    ? 'bg-indigo-600/30 text-indigo-300 font-bold'
                                    : 'text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                <div className="truncate">
                                  <div className="font-semibold text-white truncate">
                                    {emp.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {emp.department || 'Staff'} • {emp.role || 'Member'}
                                  </div>
                                </div>
                                {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                {employee?.department || 'Department'} • {employee?.role || 'Team Member'} • {employee?.email}
              </p>
            </div>
          </div>

          {/* Right: Modern Month Picker Pill */}
          <div className="flex items-center space-x-1.5 bg-slate-800/90 border border-slate-700/80 rounded-2xl p-1.5 shadow-inner self-start sm:self-auto">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 px-3">
              <CalendarDays className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs sm:text-sm font-extrabold tracking-wide text-white whitespace-nowrap">
                {monthName}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleCurrentMonth}
              className="ml-1 px-2.5 py-1 text-[11px] font-bold text-indigo-300 hover:text-white bg-indigo-600/30 hover:bg-indigo-600/50 rounded-xl transition cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>

        {/* 2. Reference-Style Summary Metric Banner */}
        <div className="mt-6 bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-inner">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-800/60">
            {/* Present */}
            <div className="p-2 sm:p-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#10b981]">
                Present
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#10b981] mt-1 font-mono">
                {metrics.present}
              </div>
            </div>

            {/* Absent */}
            <div className="p-2 sm:p-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#ef4444]">
                Absent
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#ef4444] mt-1 font-mono">
                {metrics.absent}
              </div>
            </div>

            {/* Half Days */}
            <div className="p-2 sm:p-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#f59e0b]">
                Half Days
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#f59e0b] mt-1 font-mono">
                {metrics.halfDays}
              </div>
            </div>

            {/* Paid */}
            <div className="p-2 sm:p-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#38bdf8]">
                Paid
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#38bdf8] mt-1 font-mono">
                {metrics.paid}
              </div>
            </div>

            {/* Unpaid */}
            <div className="p-2 sm:p-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#e879f9]">
                Unpaid
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#e879f9] mt-1 font-mono">
                {metrics.unpaid}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Calendar Container & Day Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: The 7-Day Monthly Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06)]">
          
          {/* Days-of-the-Week Header */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3.5 mb-3 text-center text-xs font-black">
            {weekDayHeaders.map((dayName, idx) => (
              <div
                key={dayName}
                className={`py-2 select-none uppercase tracking-wider ${
                  idx === 0 ? 'text-[#ef4444]' : 'text-slate-600'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* 7-Column Day Matrix */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3.5">
            {/* Blank offset tiles for month start */}
            {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="h-14 sm:h-16 rounded-2xl bg-transparent"
              />
            ))}

            {/* Day tiles */}
            {days.map((day) => {
              const { className, subBadge } = getDayTileStyles(day);
              const isToday = day.dateStr === todayStr;

              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={className}
                  title={`${day.dateStr}: ${day.statusLabel}`}
                >
                  <span className="text-sm sm:text-base font-extrabold leading-none">
                    {day.dayNum}
                  </span>
                  {subBadge}

                  {isToday && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Color Legend Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-500">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-[#10b981]" />
                <span>Present</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-[#f59e0b]" />
                <span>Half Day</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-[#ef4444]" />
                <span>Absent</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-[#f87171]" />
                <span>Sunday (Off)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-[#0ea5e9]" />
                <span>Paid Leave</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-[#d946ef]" />
                <span>Unpaid Leave</span>
              </span>
            </div>

            <div className="text-[11px] text-slate-400">
              Click any tile to inspect daily punch sessions
            </div>
          </div>
        </div>

        {/* Right 1 Col: Selected Day Detail Inspector */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06)] flex flex-col justify-between space-y-6">
          {selectedDay ? (
            <div className="space-y-5">
              {/* Day Header */}
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Day Inspector
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    {new Date(selectedDay.dateStr).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h4>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      selectedDay.status === 'present'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : selectedDay.status === 'half_day'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : selectedDay.status === 'absent'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : selectedDay.status === 'weekend'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : selectedDay.status === 'paid_leave'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : selectedDay.status === 'unpaid_leave'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {selectedDay.statusLabel}
                  </span>
                </div>
              </div>

              {/* Working Telemetry */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Logged Work Duration:</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">
                    {formatMinutes(selectedDay.totalWorkedMinutes)}
                  </span>
                </div>

                {/* Progress bar towards 8h */}
                <div className="space-y-1">
                  <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        selectedDay.totalWorkedMinutes >= 480
                          ? 'bg-emerald-500'
                          : selectedDay.totalWorkedMinutes >= 240
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((selectedDay.totalWorkedMinutes / 480) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>Target: 8h 00m</span>
                    <span>
                      {Math.min(
                        100,
                        Math.round((selectedDay.totalWorkedMinutes / 480) * 100)
                      )}
                      % Achieved
                    </span>
                  </div>
                </div>

                {/* Punctuality Indicator */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Punctuality:</span>
                  {selectedDay.sessions.length > 0 ? (
                    selectedDay.isLate ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        <span>Late ({formatLateArrival(selectedDay.lateByMinutes)})</span>
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>On Time (≤ 9:15 AM)</span>
                      </span>
                    )
                  ) : (
                    <span className="text-slate-400">No Check-in</span>
                  )}
                </div>
              </div>

              {/* Sessions breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Daily Punch Sessions ({selectedDay.sessions.length})</span>
                </span>

                {selectedDay.sessions.length > 0 ? (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
                    {selectedDay.sessions.map((s, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-3 shadow-2xs space-y-2 transition-all text-xs"
                      >
                        {/* Top Row: Session Index, Time Range, and Duration */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[9px]">
                              #{idx + 1}
                            </span>
                            <span className="font-mono font-bold text-slate-800 text-[11px]">
                              {formatTimeAmPm(s.checkIn)} &rarr;{' '}
                              {s.checkOut ? formatTimeAmPm(s.checkOut) : 'Active Session'}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 text-[10px]">
                            {formatMinutes(s.durationMinutes || 0)}
                          </span>
                        </div>

                        {/* Bottom Row: Verification Selfies & Badges with Clean Alignment */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-50">
                          {/* 1. Clock-In Selfie (Shown for each recorded check-in) */}
                          {s.checkInPhoto ? (
                            <button
                              type="button"
                              onClick={() =>
                                setCalendarPreviewPhoto({
                                  url: s.checkInPhoto!,
                                  title: `${employee?.name || 'Employee'} • Clock-In Selfie`,
                                  subtitle: `Session #${idx + 1} • ${formatDateDisplay(selectedDay.dateStr)}`,
                                  time: formatTimeAmPm(s.checkIn),
                                  type: 'Clock In',
                                  location: s.checkInLocation,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 transition-all cursor-pointer shadow-2xs hover:shadow active:scale-95"
                              title="Click to view full-size Clock-In Selfie"
                            >
                              <div className="w-5 h-5 rounded-md overflow-hidden bg-slate-900 border border-emerald-300 shrink-0">
                                <img
                                  src={s.checkInPhoto}
                                  alt="In Selfie"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-[10px] font-bold">In Selfie</span>
                            </button>
                          ) : s.isPhotoExpired ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-xl border border-slate-200"
                              title="Selfie auto-deleted after 30-day retention"
                            >
                              <Camera className="w-3 h-3 text-slate-400" />
                              <span>Expired</span>
                            </span>
                          ) : null}

                          {/* 2. Clock-Out Selfie:
                              RULE: DO NOT show if employee forgot to punch out (s.isAutoClockOut is true)!
                              Only show if employee actually punched out with a selfie */}
                          {!s.isAutoClockOut && s.checkOutPhoto ? (
                            <button
                              type="button"
                              onClick={() =>
                                setCalendarPreviewPhoto({
                                  url: s.checkOutPhoto!,
                                  title: `${employee?.name || 'Employee'} • Clock-Out Selfie`,
                                  subtitle: `Session #${idx + 1} • ${formatDateDisplay(selectedDay.dateStr)}`,
                                  time: formatTimeAmPm(s.checkOut!),
                                  type: 'Clock Out',
                                  location: s.checkOutLocation,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-amber-50/80 hover:bg-amber-100 border border-amber-200 text-amber-800 transition-all cursor-pointer shadow-2xs hover:shadow active:scale-95"
                              title="Click to view full-size Clock-Out Selfie"
                            >
                              <div className="w-5 h-5 rounded-md overflow-hidden bg-slate-900 border border-amber-300 shrink-0">
                                <img
                                  src={s.checkOutPhoto}
                                  alt="Out Selfie"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-[10px] font-bold">Out Selfie</span>
                            </button>
                          ) : s.isAutoClockOut ? (
                            // When employee forgot to punch out: NO image is shown; show auto badge
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold"
                              title="Employee forgot to punch out on this day. Auto clock-out applied at 12:01 AM without checkout photo."
                            >
                              <AlertCircle className="w-3 h-3 text-amber-500" />
                              <span>Forgot Punch Out (Auto)</span>
                            </span>
                          ) : !s.checkOut ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-slate-100 text-slate-500 text-[10px] font-medium border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Active Session</span>
                            </span>
                          ) : null}

                          {/* Geofence verification tag */}
                          {s.checkInLocation && (
                            <span
                              className="inline-flex items-center gap-1 text-[9px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 ml-auto"
                              title={`Verified within ${s.checkInLocation.distanceMeters || 0}m of office`}
                            >
                              <MapPin className="w-2.5 h-2.5 text-teal-600" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center text-xs text-slate-400">
                    {selectedDay.leaveInfo
                      ? `Approved Leave: ${selectedDay.leaveInfo.type?.toUpperCase()} (${selectedDay.leaveInfo.reason || 'No remarks'})`
                      : selectedDay.status === 'weekend'
                      ? 'Weekly off (Sunday)'
                      : selectedDay.dateStr > todayStr
                      ? 'Upcoming workday'
                      : 'No punch sessions logged for this day.'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Select any date on the calendar to view session details
            </div>
          )}

          {/* Action: Regularize / Edit Day for Admin/HR */}
          {isAdminOrHr && selectedDay && onRegularize && (
            <button
              type="button"
              onClick={() =>
                onRegularize(
                  employee,
                  selectedDay.dateStr,
                  selectedDay.record
                )
              }
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Regularize Day Attendance</span>
            </button>
          )}
        </div>
      </div>

      {/* Full-Size Verified Selfie Lightbox Modal */}
      {calendarPreviewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200"
          onClick={() => setCalendarPreviewPhoto(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm sm:max-w-md max-h-[92vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-xs ${
                    calendarPreviewPhoto.type === 'Clock In' ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {calendarPreviewPhoto.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                    {calendarPreviewPhoto.subtitle || calendarPreviewPhoto.type} • {calendarPreviewPhoto.time || 'Logged'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCalendarPreviewPhoto(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo Body */}
            <div className="p-4 flex flex-col items-center bg-slate-950/5">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 shadow-md border-2 border-slate-200 flex items-center justify-center">
                <img
                  src={calendarPreviewPhoto.url}
                  alt={calendarPreviewPhoto.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Footer with verification metadata & Cloudinary button */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-teal-700 font-medium text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Pearl Enclave (Verified)</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={calendarPreviewPhoto.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs hover:shadow"
                >
                  <span>Open Original</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
                <button
                  type="button"
                  onClick={() => setCalendarPreviewPhoto(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
