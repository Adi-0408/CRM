'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Edit3,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/apiClient';
import LiveClockCard from '@/components/attendance/LiveClockCard';
import RegularizeAttendanceModal from '@/components/modals/RegularizeAttendanceModal';
import AttendanceAnalyticsChart from '@/components/attendance/AttendanceAnalyticsChart';
import CustomSelect from '@/components/common/CustomSelect';
import {
  evaluateDailyAttendance,
  getLocalTodayStr,
  formatMinutes,
  formatTimeAmPm,
  formatLateArrival,
  AttendanceSession,
} from '@/lib/attendanceEngine';

interface AttendanceViewProps {
  employees: any[];
  onRefresh: () => void;
}

// Map role to display subtitle (e.g. "admin", "hr_manager", "manager", "employee")
function getRoleDisplay(roleStr?: string, department?: string): string {
  if (!roleStr) return 'employee';
  const r = roleStr.toLowerCase();
  if (r === 'admin_manager' || r === 'admin') return 'admin';
  if (r === 'hr' || r === 'hr_manager') return 'hr_manager';
  if (r === 'sales' || r === 'manager') return 'manager';
  return 'employee';
}

function getCurrentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getAdjacentMonth(monthStr: string, delta: number): string {
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  const nextYear = d.getFullYear();
  const nextMonth = String(d.getMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}`;
}

function formatMonthDisplay(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getElapsedWorkingDaysInMonth(monthStr: string): number {
  const now = new Date();
  const [year, month] = monthStr.split('-').map(Number);
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const maxDay = isCurrentMonth ? now.getDate() : new Date(year, month, 0).getDate();

  let workingDays = 0;
  for (let day = 1; day <= maxDay; day++) {
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }
  return Math.max(1, workingDays);
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AttendanceView({
  employees = [],
  onRefresh,
}: AttendanceViewProps) {
  const { user, role } = useAuth();
  const userRoleStr = (role as string) || '';
  const isAdminOrHr =
    userRoleStr === 'admin_manager' ||
    userRoleStr === 'admin' ||
    userRoleStr === 'hr' ||
    userRoleStr === 'hr_manager';

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);

  // Modal State for Admin/HR Regularize
  const [selectedEmpForOverride, setSelectedEmpForOverride] = useState<any>(null);
  const [selectedDateForOverride, setSelectedDateForOverride] = useState<string>(getLocalTodayStr());
  const [selectedRecordForOverride, setSelectedRecordForOverride] = useState<any>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const url = `/api/attendance?month=${selectedMonth}`;
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setRecords(data);
        }
      }
    } catch (err) {
      console.error('Error fetching attendance records for month:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedMonth]);

  const todayStr = getLocalTodayStr();
  const workingDaysInMonth = useMemo(() => getElapsedWorkingDaysInMonth(selectedMonth), [selectedMonth]);

  // Aggregate monthly attendance metrics per employee
  const displayRows = useMemo(() => {
    let emps = isAdminOrHr
      ? employees
      : employees.filter(
          (e) =>
            e._id === user?.id ||
            e.id === user?.id ||
            e.email?.toLowerCase() === user?.email?.toLowerCase()
        );

    if (emps.length === 0 && user) {
      emps = [user as any];
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      emps = emps.filter(
        (e) =>
          e.name?.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q) ||
          e.role?.toLowerCase().includes(q) ||
          e.department?.toLowerCase().includes(q)
      );
    }

    const rows = emps.map((emp) => {
      const empId = String(emp._id || emp.id || emp.email);

      // All records for this employee in the selected month
      const empRecords = records
        .filter((r) => {
          const rEmpId =
            r.employee?._id ||
            r.employee?.id ||
            (typeof r.employee === 'string' ? r.employee : null);
          return String(rEmpId) === String(emp._id || emp.id);
        })
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      // Process each daily log
      let fullDaysCount = 0;
      let halfDaysCount = 0;
      let totalWorkedMinutes = 0;
      let onTimeDaysCount = 0;
      let lateDaysCount = 0;
      let isWorkingToday = false;
      let latestDayRecord: any = null;

      const dailyLogs = empRecords.map((r) => {
        const sessions: AttendanceSession[] = r.sessions || [];
        const evaluation = evaluateDailyAttendance(sessions, r.date, new Date());
        const isAuto = Boolean(r.isAutoClockOut || evaluation.isAutoClockOut);

        let dayStatusCode = evaluation.status;
        if (r.status) {
          dayStatusCode = r.status;
        }

        const isFullDay =
          dayStatusCode === 'full_day' ||
          (!isAuto && evaluation.totalWorkedMinutes >= 480);
        const isHalfDay =
          dayStatusCode === 'half_day' ||
          (!isFullDay && sessions.length > 0 && !evaluation.isCurrentlyWorking);

        if (isFullDay) fullDaysCount++;
        else if (isHalfDay) halfDaysCount++;

        totalWorkedMinutes += evaluation.totalWorkedMinutes || 0;

        if (sessions.length > 0) {
          if (evaluation.isLate) {
            lateDaysCount++;
          } else {
            onTimeDaysCount++;
          }
        }

        if (r.date === todayStr && evaluation.isCurrentlyWorking) {
          isWorkingToday = true;
        }

        if (!latestDayRecord) {
          latestDayRecord = {
            record: r,
            evaluation,
            sessions,
            dayStatusCode,
          };
        }

        return {
          date: r.date,
          record: r,
          sessions,
          evaluation,
          dayStatusCode,
          isFullDay,
          isHalfDay,
          isAutoClockOut: isAuto,
        };
      });

      const presentDays = fullDaysCount + halfDaysCount;
      const targetHours = workingDaysInMonth * 8;
      const targetMinutes = targetHours * 60;
      const attendanceRate = Math.min(
        100,
        Math.round((presentDays / workingDaysInMonth) * 100)
      );
      const workPercent = Math.min(
        100,
        Math.round((totalWorkedMinutes / (targetMinutes || 1)) * 100)
      );

      const totalPunctualityDays = onTimeDaysCount + lateDaysCount;
      const punctualityRate =
        totalPunctualityDays > 0
          ? Math.round((onTimeDaysCount / totalPunctualityDays) * 100)
          : 100;

      return {
        employee: emp,
        empId,
        presentDays,
        fullDaysCount,
        halfDaysCount,
        workingDaysInMonth,
        attendanceRate,
        totalWorkedMinutes,
        workPercent,
        onTimeDaysCount,
        lateDaysCount,
        punctualityRate,
        isWorkingToday,
        dailyLogs,
        latestDayRecord,
      };
    });

    // Filter by status dropdown
    if (statusFilter !== 'all') {
      return rows.filter((r) => {
        if (statusFilter === 'active_today') return r.isWorkingToday;
        if (statusFilter === 'high_attendance') return r.attendanceRate >= 90;
        if (statusFilter === 'average_attendance')
          return r.attendanceRate >= 60 && r.attendanceRate < 90;
        if (statusFilter === 'low_attendance') return r.attendanceRate < 60;
        return true;
      });
    }

    return rows;
  }, [
    employees,
    records,
    selectedMonth,
    statusFilter,
    searchQuery,
    isAdminOrHr,
    user,
    workingDaysInMonth,
    todayStr,
  ]);

  const handleOpenOverride = (emp: any, dateStr: string, rec?: any) => {
    if (!isAdminOrHr) return;
    setSelectedEmpForOverride(emp);
    setSelectedDateForOverride(dateStr || todayStr);
    setSelectedRecordForOverride(rec || null);
    setIsOverrideModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Punch-In / Punch-Out Action Card */}
      <LiveClockCard
        onPunchSuccess={() => {
          fetchRecords();
          onRefresh();
        }}
      />

      {/* 2. Admin / HR Executive Attendance & Department Analytics Chart */}
      {isAdminOrHr && (
        <AttendanceAnalyticsChart
          employees={employees}
          records={records}
          selectedMonth={selectedMonth}
          onMonthChange={(m) => setSelectedMonth(m)}
          title="Department & Employee Attendance Analysis"
          subtitle="Interactive telemetry charts: department distribution, individual employee shift compliance & hours logged"
        />
      )}

      {/* 3. Scalable Monthly Employee Attendance Table */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.12),0_6px_16px_-3px_rgba(15,23,42,0.06)] overflow-hidden">
        {/* Top Search & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white/70 backdrop-blur-md">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by employee name, role or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#635BFF] transition-all shadow-2xs"
            />
          </div>

          {/* Controls: Status Filter, Month Selector & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              size="sm"
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active_today', label: 'Working Today' },
                { value: 'high_attendance', label: 'High Attendance (≥90%)' },
                { value: 'average_attendance', label: 'Average (60–89%)' },
                { value: 'low_attendance', label: 'Low (<60%)' },
              ]}
            />

            {/* Month Picker with Next / Prev */}
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200/80 rounded-2xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setSelectedMonth(getAdjacentMonth(selectedMonth, -1))}
                className="p-1 hover:bg-slate-200/70 text-slate-600 rounded-lg transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center space-x-1.5 px-2">
                <CalendarDays className="w-3.5 h-3.5 text-[#635BFF]" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => setSelectedMonth(getAdjacentMonth(selectedMonth, 1))}
                className="p-1 hover:bg-slate-200/70 text-slate-600 rounded-lg transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {selectedMonth !== getCurrentMonthStr() && (
                <button
                  type="button"
                  onClick={() => setSelectedMonth(getCurrentMonthStr())}
                  className="px-2 py-0.5 text-[11px] font-bold text-[#635BFF] hover:bg-[#F0EEFF] rounded-lg transition-colors cursor-pointer ml-1"
                >
                  This Month
                </button>
              )}
            </div>

            <button
              onClick={fetchRecords}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-colors shadow-2xs cursor-pointer"
              title="Refresh monthly logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Monthly Attendance Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5">EMPLOYEE</th>
                <th className="py-3.5 px-4">DAYS ATTENDED</th>
                <th className="py-3.5 px-4">TOTAL WORKED ({formatMonthDisplay(selectedMonth)})</th>
                <th className="py-3.5 px-4">PUNCTUALITY</th>
                <th className="py-3.5 px-4">MONTH STATUS</th>
                <th className="py-3.5 px-4 text-center">DAILY SESSIONS</th>
                {isAdminOrHr && <th className="py-3.5 px-5 text-right">ACTIONS</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs bg-white">
              {displayRows.length > 0 ? (
                displayRows.map(
                  ({
                    employee,
                    empId,
                    presentDays,
                    fullDaysCount,
                    halfDaysCount,
                    workingDaysInMonth,
                    attendanceRate,
                    totalWorkedMinutes,
                    workPercent,
                    onTimeDaysCount,
                    lateDaysCount,
                    punctualityRate,
                    isWorkingToday,
                    dailyLogs,
                    latestDayRecord,
                  }) => {
                    const displayRole = getRoleDisplay(
                      employee?.role,
                      employee?.department
                    );
                    const isExpanded = expandedEmpId === empId;
                    const workedFormatted = formatMinutes(totalWorkedMinutes);

                    return (
                      <React.Fragment key={empId}>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          {/* 1. EMPLOYEE */}
                          <td className="py-4 px-5 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-[#F0EEFF] text-[#635BFF] border border-[#635BFF]/20 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                {employee?.avatar ? (
                                  <img
                                    src={employee.avatar}
                                    alt={employee.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>
                                    {(employee?.name || 'U')
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                )}
                                {isWorkingToday && (
                                  <span
                                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/50 animate-pulse"
                                    title="Active Shift Today"
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-800 text-sm truncate">
                                  {employee?.name}
                                </div>
                                <div className="text-[11px] text-slate-400 font-medium truncate">
                                  {employee?.department || 'Staff'} • {displayRole}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. DAYS ATTENDED */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-800 text-xs">
                                {presentDays} / {workingDaysInMonth} Days
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                <span className="text-emerald-600 font-bold">
                                  {fullDaysCount} Full
                                </span>
                                {' • '}
                                <span className="text-amber-600 font-bold">
                                  {halfDaysCount} Half
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 3. TOTAL WORKED */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-3 text-xs">
                                <span className="font-bold text-emerald-700 font-mono">
                                  {workedFormatted}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold font-mono">
                                  {workPercent}%
                                </span>
                              </div>
                              <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    workPercent >= 100
                                      ? 'bg-emerald-500'
                                      : workPercent >= 70
                                      ? 'bg-indigo-500'
                                      : workPercent > 0
                                      ? 'bg-amber-500'
                                      : 'bg-transparent'
                                  }`}
                                  style={{ width: `${workPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* 4. PUNCTUALITY */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            {dailyLogs.length === 0 ? (
                              <span className="text-slate-400 text-xs">--</span>
                            ) : lateDaysCount === 0 ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>On Time (100%)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>
                                  {lateDaysCount} Late ({punctualityRate}% On Time)
                                </span>
                              </span>
                            )}
                          </td>

                          {/* 5. MONTH STATUS */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            {isWorkingToday ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-[#635BFF] border border-[#635BFF]/30 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-[#635BFF] animate-pulse" />
                                <span>Working Today</span>
                              </span>
                            ) : attendanceRate >= 90 ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Compliant ({attendanceRate}%)</span>
                              </span>
                            ) : attendanceRate >= 60 ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                                <Info className="w-3.5 h-3.5 text-amber-600" />
                                <span>Average ({attendanceRate}%)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Low ({attendanceRate}%)</span>
                              </span>
                            )}
                          </td>

                          {/* 6. DAILY SESSIONS DROPDOWN ACCORDION BUTTON */}
                          <td className="py-4 px-4 whitespace-nowrap text-center">
                            {dailyLogs.length > 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedEmpId(isExpanded ? null : empId)
                                }
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                  isExpanded
                                    ? 'bg-[#635BFF] text-white shadow-xs'
                                    : 'bg-[#F0EEFF] text-[#635BFF] hover:bg-[#E5E0FD]'
                                }`}
                              >
                                <span>
                                  {dailyLogs.length} Day{dailyLogs.length > 1 ? 's' : ''} Logs
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs font-medium">
                                0 Days Recorded
                              </span>
                            )}
                          </td>

                          {/* 7. ACTIONS (Admin/HR Only) */}
                          {isAdminOrHr && (
                            <td className="py-4 px-5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenOverride(
                                    employee,
                                    latestDayRecord?.record?.date || todayStr,
                                    latestDayRecord?.record
                                  )
                                }
                                className="px-3 py-1.5 rounded-full border border-slate-200 hover:border-[#635BFF] text-slate-700 hover:text-[#635BFF] hover:bg-[#F0EEFF]/50 text-xs font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Regularize</span>
                              </button>
                            </td>
                          )}
                        </tr>

                        {/* Expandable Day-by-Day Monthly Log Breakdown */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70">
                            <td
                              colSpan={isAdminOrHr ? 7 : 6}
                              className="px-5 py-4 border-y border-slate-100"
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-[#635BFF]" />
                                    Daily Breakdown for {employee.name} (
                                    {formatMonthDisplay(selectedMonth)})
                                  </span>
                                  <span className="text-[11px] font-semibold text-slate-400">
                                    {dailyLogs.length} days recorded
                                  </span>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase text-slate-400">
                                        <th className="py-2.5 px-4">Date</th>
                                        <th className="py-2.5 px-4">Punch In &rarr; Out</th>
                                        <th className="py-2.5 px-4">Sessions</th>
                                        <th className="py-2.5 px-4">Worked</th>
                                        <th className="py-2.5 px-4">Punctuality</th>
                                        <th className="py-2.5 px-4">Status</th>
                                        {isAdminOrHr && (
                                          <th className="py-2.5 px-4 text-right">Action</th>
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {dailyLogs.map((dayLog) => {
                                        const {
                                          date,
                                          sessions,
                                          evaluation,
                                          dayStatusCode,
                                          isFullDay,
                                          isHalfDay,
                                          isAutoClockOut,
                                          record,
                                        } = dayLog;

                                        const hasSessions = sessions.length > 0;
                                        const firstTime = hasSessions
                                          ? formatTimeAmPm(sessions[0].checkIn).toLowerCase()
                                          : '--';
                                        const lastSessionObj = hasSessions
                                          ? sessions[sessions.length - 1]
                                          : null;
                                        const lastTime = hasSessions
                                          ? lastSessionObj?.checkOut
                                            ? `${formatTimeAmPm(
                                                lastSessionObj.checkOut
                                              ).toLowerCase()}${
                                                isAutoClockOut ||
                                                lastSessionObj.isAutoClockOut
                                                  ? ' (auto)'
                                                  : ''
                                              }`
                                            : 'active'
                                          : '--';
                                        const punchTimeline = hasSessions
                                          ? `${firstTime} -> ${lastTime}`
                                          : '--';

                                        return (
                                          <tr
                                            key={date}
                                            className="hover:bg-slate-50/60 transition-colors"
                                          >
                                            <td className="py-2.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                                              {formatDateDisplay(date)}
                                            </td>
                                            <td className="py-2.5 px-4 font-mono text-slate-700 whitespace-nowrap text-[11px]">
                                              {punchTimeline}
                                            </td>
                                            <td className="py-2.5 px-4 whitespace-nowrap">
                                              <div className="flex flex-wrap items-center gap-1.5">
                                                {sessions.map((s, sIdx) => (
                                                  <span
                                                    key={sIdx}
                                                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono border border-slate-200"
                                                  >
                                                    {formatTimeAmPm(s.checkIn)} -{' '}
                                                    {s.checkOut
                                                      ? formatTimeAmPm(s.checkOut)
                                                      : 'Active'}
                                                  </span>
                                                ))}
                                              </div>
                                            </td>
                                            <td className="py-2.5 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                                              {formatMinutes(evaluation.totalWorkedMinutes)}
                                            </td>
                                            <td className="py-2.5 px-4 whitespace-nowrap">
                                              {evaluation.isLate ? (
                                                <span className="text-[11px] font-semibold text-rose-600">
                                                  Late ({formatLateArrival(evaluation.lateByMinutes)})
                                                </span>
                                              ) : (
                                                <span className="text-[11px] font-semibold text-emerald-600">
                                                  On Time
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-2.5 px-4 whitespace-nowrap">
                                              {isFullDay ? (
                                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                  Full Day
                                                </span>
                                              ) : isHalfDay ? (
                                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                  Half Day
                                                </span>
                                              ) : evaluation.isCurrentlyWorking ? (
                                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                  Working
                                                </span>
                                              ) : (
                                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                                  Absent
                                                </span>
                                              )}
                                            </td>
                                            {isAdminOrHr && (
                                              <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleOpenOverride(
                                                      employee,
                                                      date,
                                                      record
                                                    )
                                                  }
                                                  className="text-[11px] font-bold text-[#635BFF] hover:underline cursor-pointer"
                                                >
                                                  Edit Day
                                                </button>
                                              </td>
                                            )}
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  }
                )
              ) : (
                <tr>
                  <td
                    colSpan={isAdminOrHr ? 7 : 6}
                    className="py-12 text-center text-slate-400 text-xs font-medium"
                  >
                    No attendance records found for {formatMonthDisplay(selectedMonth)}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin / HR Regularize Modal */}
      {isOverrideModalOpen && selectedEmpForOverride && (
        <RegularizeAttendanceModal
          isOpen={isOverrideModalOpen}
          onClose={() => setIsOverrideModalOpen(false)}
          onSuccess={() => {
            fetchRecords();
            onRefresh();
          }}
          employee={selectedEmpForOverride}
          date={selectedDateForOverride}
          initialRecord={selectedRecordForOverride}
        />
      )}
    </div>
  );
}
