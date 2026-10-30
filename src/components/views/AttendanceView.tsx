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
  Info,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/apiClient';
import LiveClockCard from '@/components/attendance/LiveClockCard';
import RegularizeAttendanceModal from '@/components/modals/RegularizeAttendanceModal';
import AttendanceAnalyticsChart from '@/components/attendance/AttendanceAnalyticsChart';
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

  const [selectedDate, setSelectedDate] = useState<string>(getLocalTodayStr());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedSessionEmpId, setExpandedSessionEmpId] = useState<string | null>(null);

  // Modal State for Admin/HR Regularize
  const [selectedEmpForOverride, setSelectedEmpForOverride] = useState<any>(null);
  const [selectedRecordForOverride, setSelectedRecordForOverride] = useState<any>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const url = `/api/attendance?date=${selectedDate}`;
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setRecords(data);
        }
      }
    } catch (err) {
      console.error('Error fetching attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedDate]);

  // Extract unique departments for the dropdown
  const departmentsList = useMemo(() => {
    const deps = new Set<string>();
    for (const e of employees) {
      if (e.department) deps.add(e.department);
    }
    return Array.from(deps);
  }, [employees]);

  // Combine full employee roster with attendance records for the selected date
  const displayRows = useMemo(() => {
    const recordsMap = new Map<string, any>();
    for (const r of records) {
      const empId =
        r.employee?._id ||
        r.employee?.id ||
        (typeof r.employee === 'string' ? r.employee : null);
      if (empId) {
        recordsMap.set(String(empId), r);
      }
    }

    let emps = isAdminOrHr ? employees : employees.filter((e) => e._id === user?.id || e.id === user?.id || e.email?.toLowerCase() === user?.email?.toLowerCase());

    if (emps.length === 0 && user) {
      emps = [user as any];
    }

    // Filter by department
    if (departmentFilter !== 'all') {
      emps = emps.filter((e) => e.department === departmentFilter);
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

    // Map each employee to their daily evaluation
    const rows = emps.map((emp) => {
      const existingRecord = recordsMap.get(String(emp._id || emp.id));
      const sessions: AttendanceSession[] = existingRecord?.sessions || [];
      const evaluation = evaluateDailyAttendance(sessions, selectedDate, new Date());

      // Determine day status code
      let dayStatusCode = evaluation.status;
      if (existingRecord?.status) {
        dayStatusCode = existingRecord.status;
      }

      return {
        employee: emp,
        record: existingRecord || {
          employee: emp,
          date: selectedDate,
          sessions: [],
          status: 'absent',
        },
        sessions,
        evaluation,
        dayStatusCode,
        date: selectedDate,
      };
    });

    // Filter by status dropdown
    if (statusFilter !== 'all') {
      return rows.filter((r) => {
        const isAuto = Boolean(r.record?.isAutoClockOut || r.evaluation?.isAutoClockOut);
        if (statusFilter === 'full_day') return r.dayStatusCode === 'full_day' || (!isAuto && r.evaluation.totalWorkedMinutes >= 480);
        if (statusFilter === 'half_day') return r.dayStatusCode === 'half_day' || (!isAuto && r.evaluation.totalWorkedMinutes < 480 && r.sessions.length > 0 && !r.evaluation.isCurrentlyWorking);
        if (statusFilter === 'working') return !isAuto && r.evaluation.isCurrentlyWorking;
        if (statusFilter === 'absent') return r.sessions.length === 0 || r.dayStatusCode === 'absent';
        return true;
      });
    }

    return rows;
  }, [employees, records, selectedDate, departmentFilter, statusFilter, searchQuery, isAdminOrHr, user]);

  const handleOpenOverride = (emp: any, rec: any) => {
    if (!isAdminOrHr) return;
    setSelectedEmpForOverride(emp);
    setSelectedRecordForOverride(rec);
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
          selectedDate={selectedDate}
          onDateChange={(d) => setSelectedDate(d)}
          title="Department & Employee Attendance Analysis"
          subtitle="Interactive telemetry charts: department distribution, individual employee shift compliance & hours logged"
        />
      )}

      {/* 3. Scalable Attendance Table matching Image 2 */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.12),0_6px_16px_-3px_rgba(15,23,42,0.06)] overflow-hidden">
        {/* Top Search & Filter Bar (Matching Image 2) */}
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

          {/* Department & Status Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* All Departments Dropdown */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#635BFF] shadow-2xs cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departmentsList.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>

            {/* All Statuses Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#635BFF] shadow-2xs cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="full_day">Full Day</option>
              <option value="half_day">Half Day</option>
              <option value="working">Working</option>
              <option value="absent">Absent</option>
            </select>

            {/* Date Picker */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-1 shadow-2xs">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
              {selectedDate !== getLocalTodayStr() && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(getLocalTodayStr())}
                  className="px-2 py-0.5 text-[11px] font-bold text-[#635BFF] hover:bg-[#F0EEFF] rounded-lg transition-colors"
                >
                  Today
                </button>
              )}
            </div>

            <button
              onClick={fetchRecords}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-colors shadow-2xs"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Clean History Table (EMPLOYEE | FIRST IN / LAST OUT | SESSIONS | TOTAL WORKED | PUNCTUALITY | DAY STATUS | ACTIONS) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5">EMPLOYEE</th>
                <th className="py-3.5 px-4">FIRST IN / LAST OUT</th>
                <th className="py-3.5 px-4">SESSIONS</th>
                <th className="py-3.5 px-4">TOTAL WORKED</th>
                <th className="py-3.5 px-4">PUNCTUALITY</th>
                <th className="py-3.5 px-4">DAY STATUS</th>
                {isAdminOrHr && <th className="py-3.5 px-5 text-right">ACTIONS</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs bg-white">
              {displayRows.length > 0 ? (
                displayRows.map(({ employee, record, evaluation, sessions, dayStatusCode }) => {
                  const empId = String(employee?._id || employee?.id || employee?.email);
                  const displayRole = getRoleDisplay(employee?.role, employee?.department);

                  // 1. First In / Last Out format: e.g. "09:10 am -> 06:00 pm"
                  const hasSessions = sessions.length > 0;
                  const isAutoClockOut = Boolean(record?.isAutoClockOut || evaluation?.isAutoClockOut);
                  const firstTime = hasSessions ? formatTimeAmPm(sessions[0].checkIn).toLowerCase() : '--';
                  const lastSessionObj = hasSessions ? sessions[sessions.length - 1] : null;
                  const lastTime = hasSessions
                    ? lastSessionObj?.checkOut
                      ? `${formatTimeAmPm(lastSessionObj.checkOut).toLowerCase()}${isAutoClockOut || lastSessionObj.isAutoClockOut ? ' (auto)' : ''}`
                      : 'active'
                    : '--';
                  const firstInLastOut = hasSessions ? `${firstTime} -> ${lastTime}` : '--';

                  // 2. Total Worked Duration & Percentage
                  const totalMins = evaluation.totalWorkedMinutes;
                  const workedFormatted = formatMinutes(totalMins);
                  const percent = Math.min(100, Math.round((totalMins / 480) * 100));

                  // 3. Punctuality status
                  const isLate = evaluation.isLate;
                  const lateMinutes = evaluation.lateByMinutes;

                  // 4. Day Status
                  const isFullDay = dayStatusCode === 'full_day' || (!isAutoClockOut && totalMins >= 480);
                  const isHalfDay = dayStatusCode === 'half_day' || (!isFullDay && hasSessions && !evaluation.isCurrentlyWorking);
                  const isWorking = !isAutoClockOut && (evaluation.isCurrentlyWorking || dayStatusCode === 'working');
                  const isAbsent = (!hasSessions && !isFullDay && !isHalfDay) || dayStatusCode === 'absent';

                  const isExpanded = expandedSessionEmpId === empId;

                  return (
                    <React.Fragment key={empId}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        {/* 1. EMPLOYEE */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#F0EEFF] text-[#635BFF] border border-[#635BFF]/20 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
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

                        {/* 2. FIRST IN / LAST OUT */}
                        <td className="py-4 px-4 font-mono font-bold text-slate-800 whitespace-nowrap text-xs">
                          {firstInLastOut}
                        </td>

                        {/* 3. SESSIONS */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {hasSessions ? (
                            <button
                              type="button"
                              onClick={() => setExpandedSessionEmpId(isExpanded ? null : empId)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0EEFF] text-[#635BFF] hover:bg-[#E5E0FD] transition-all cursor-pointer shadow-2xs"
                            >
                              <span>
                                {sessions.length} Session{sessions.length > 1 ? 's' : ''}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium">0 Sessions</span>
                          )}
                        </td>

                        {/* 4. TOTAL WORKED */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-3 text-xs">
                              <span className="font-bold text-emerald-700 font-mono">
                                {workedFormatted}
                              </span>
                              {hasSessions && (
                                <span className="text-[10px] text-slate-400 font-semibold font-mono">
                                  {percent}%
                                </span>
                              )}
                            </div>
                            {hasSessions && (
                              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    percent >= 100
                                      ? 'bg-emerald-500'
                                      : percent > 0
                                      ? 'bg-amber-500'
                                      : 'bg-transparent'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 5. PUNCTUALITY */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {!hasSessions ? (
                            <span className="text-slate-400 text-xs">--</span>
                          ) : isLate ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Late ({formatLateArrival(lateMinutes)})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>On Time</span>
                            </span>
                          )}
                        </td>

                        {/* 6. DAY STATUS */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isFullDay ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs"
                              title={record?.autoClockOutReason || evaluation?.autoClockOutReason}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Full Day {isAutoClockOut ? '(Auto 12:01 AM)' : '(8h+)'}</span>
                            </span>
                          ) : isHalfDay ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs"
                              title={record?.autoClockOutReason || evaluation?.autoClockOutReason}
                            >
                              <Info className="w-3.5 h-3.5 text-amber-600" />
                              <span>Half Day {isAutoClockOut ? '(Auto 12:01 AM)' : ''}</span>
                            </span>
                          ) : isWorking ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                              <span>Working</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <span>Absent</span>
                            </span>
                          )}
                        </td>

                        {/* 7. ACTIONS (Admin/HR Only) */}
                        {isAdminOrHr && (
                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenOverride(employee, record)}
                              className="px-3 py-1.5 rounded-full border border-slate-200 hover:border-[#635BFF] text-slate-700 hover:text-[#635BFF] hover:bg-[#F0EEFF]/50 text-xs font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Regularize</span>
                            </button>
                          </td>
                        )}
                      </tr>

                      {/* Dropdown Expanded Sessions Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={isAdminOrHr ? 7 : 6} className="px-5 py-3 border-y border-slate-100">
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                              <span className="font-bold text-slate-600 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-[#635BFF]" />
                                Recorded Sessions for {employee.name}:
                              </span>
                              {sessions.map((s, idx) => (
                                <div
                                  key={idx}
                                  className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 shadow-2xs"
                                >
                                  <span className="font-bold text-[10px] text-[#635BFF]">#{idx + 1}</span>
                                  <span className="font-mono">{formatTimeAmPm(s.checkIn)}</span>
                                  <span className="text-slate-400">&rarr;</span>
                                  <span className="font-mono">
                                    {s.checkOut
                                      ? `${formatTimeAmPm(s.checkOut)}${s.isAutoClockOut ? ' (Auto 12:01 AM)' : ''}`
                                      : 'Active'}
                                  </span>
                                  {s.notes && (
                                    <span className="text-[10px] text-slate-400 italic">({s.notes})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={isAdminOrHr ? 7 : 6}
                    className="py-12 text-center text-slate-400 text-xs font-medium"
                  >
                    No attendance records found matching the active filter.
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
          date={selectedDate}
          initialRecord={selectedRecordForOverride}
        />
      )}
    </div>
  );
}
