'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  Users,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Filter,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Layers,
  Award,
  CalendarDays,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import CustomSelect from '@/components/common/CustomSelect';
import {
  evaluateDailyAttendance,
  getLocalTodayStr,
  AttendanceSession,
} from '@/lib/attendanceEngine';

interface AttendanceAnalyticsChartProps {
  employees: any[];
  records?: any[];
  selectedMonth?: string;
  selectedDate?: string;
  onMonthChange?: (month: string) => void;
  onDateChange?: (date: string) => void;
  onNavigate?: (tab: string) => void;
  title?: string;
  subtitle?: string;
  defaultMode?: 'combined' | 'department' | 'individual' | 'distribution' | 'timeline';
  defaultPeriod?: 'month' | 'day';
}

// Get current month string: 'YYYY-MM' (e.g., '2026-10')
function getLocalCurrentMonthStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Format month display (e.g. "2026-10" -> "October 2026")
function formatMonthDisplay(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-').map(Number);
  if (!year || !month) return monthStr;
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Format department display name (e.g., "sales" -> "Sales")
function formatDeptName(dept?: string): string {
  if (!dept || dept.trim() === '') return 'General';
  return dept
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Calculate adjacent month string by delta (e.g. +1 or -1)
function getAdjacentMonth(monthStr: string, delta: number): string {
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  const nextYear = d.getFullYear();
  const nextMonth = String(d.getMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}`;
}

export default function AttendanceAnalyticsChart({
  employees = [],
  records: propRecords,
  selectedMonth: initialSelectedMonth,
  selectedDate: initialSelectedDate,
  onMonthChange,
  onDateChange,
  onNavigate,
  title = 'Department & Employee Attendance Analysis',
  subtitle,
  defaultMode = 'combined',
  defaultPeriod = 'month', // Defaults to Month as requested
}: AttendanceAnalyticsChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [period, setPeriod] = useState<'month' | 'day'>(defaultPeriod);
  const [internalMonth, setInternalMonth] = useState<string>(
    initialSelectedMonth || getLocalCurrentMonthStr()
  );
  const [internalDate, setInternalDate] = useState<string>(
    initialSelectedDate || getLocalTodayStr()
  );
  const [records, setRecords] = useState<any[]>(propRecords || []);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'combined' | 'department' | 'individual' | 'distribution' | 'timeline'
  >(defaultMode);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  // Track client mounting for Recharts hydration safety
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync internal month when prop updates
  useEffect(() => {
    if (initialSelectedMonth && initialSelectedMonth !== internalMonth) {
      setInternalMonth(initialSelectedMonth);
    }
  }, [initialSelectedMonth]);

  // Sync internal date when prop updates
  useEffect(() => {
    if (initialSelectedDate && initialSelectedDate !== internalDate) {
      setInternalDate(initialSelectedDate);
    }
  }, [initialSelectedDate]);

  // Fetch records whenever period, month, or date changes
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        const queryUrl =
          period === 'month'
            ? `/api/attendance?month=${internalMonth}`
            : `/api/attendance?date=${internalDate}`;

        const res = await authFetch(queryUrl);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setRecords(data);
          }
        }
      } catch (err) {
        console.error('Error fetching attendance data for analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [period, internalMonth, internalDate]);

  const handleMonthSelect = (newMonth: string) => {
    setInternalMonth(newMonth);
    if (onMonthChange) {
      onMonthChange(newMonth);
    }
  };

  const handleDateSelect = (newDate: string) => {
    setInternalDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  // Unique departments list
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      set.add(formatDeptName(e.department));
    });
    return Array.from(set).sort();
  }, [employees]);

  // 1. Process Monthly / Daily Attendance Dataset for All Employees
  const employeeData = useMemo(() => {
    const now = new Date();

    // Group records by employeeId
    const recordsByEmpId = new Map<string, any[]>();
    records.forEach((r) => {
      const empId =
        r.employee?._id ||
        r.employee?.id ||
        (typeof r.employee === 'string' ? r.employee : null);
      if (empId) {
        const idStr = String(empId);
        if (!recordsByEmpId.has(idStr)) {
          recordsByEmpId.set(idStr, []);
        }
        recordsByEmpId.get(idStr)!.push(r);
      }
    });

    // Distinct dates recorded in the selected period
    const distinctDates = Array.from(new Set(records.map((r) => r.date))).sort();
    const activeWorkDays = Math.max(1, distinctDates.length);
    const monthlyBenchmarkHours = activeWorkDays * 8; // 8h per working day

    return employees.map((emp) => {
      const empId = String(emp._id || emp.id || '');
      const empRecords = recordsByEmpId.get(empId) || [];

      if (period === 'month') {
        // --- MONTHLY AGGREGATION ---
        let totalWorkedMinutes = 0;
        let fullDaysCount = 0;
        let halfDaysCount = 0;
        let workingShiftsCount = 0;
        let lateShiftsCount = 0;
        let firstCheckInTimes: string[] = [];

        empRecords.forEach((rec) => {
          const sessions: AttendanceSession[] = rec.sessions || [];
          const evaluation = evaluateDailyAttendance(sessions, rec.date, now);

          const isAuto = Boolean(rec.isAutoClockOut || evaluation.isAutoClockOut);
          const effectiveMinutes = isAuto
            ? rec.effectiveMinutes || evaluation.effectiveWorkedMinutes
            : evaluation.effectiveWorkedMinutes;

          totalWorkedMinutes += effectiveMinutes;

          if (rec.status === 'full_day' || evaluation.status === 'full_day' || effectiveMinutes >= 480) {
            fullDaysCount += 1;
          } else if (
            rec.status === 'half_day' ||
            evaluation.status === 'half_day' ||
            (effectiveMinutes < 480 && sessions.length > 0 && !evaluation.isCurrentlyWorking)
          ) {
            halfDaysCount += 1;
          } else if (evaluation.isCurrentlyWorking || rec.status === 'working') {
            workingShiftsCount += 1;
          }

          if (rec.isLate || evaluation.isLate) {
            lateShiftsCount += 1;
          }

          if (evaluation.firstPunchInFormatted) {
            firstCheckInTimes.push(evaluation.firstPunchInFormatted);
          }
        });

        const totalWorkedHours = Math.round((totalWorkedMinutes / 60) * 10) / 10;
        const totalActiveDays = fullDaysCount + halfDaysCount + workingShiftsCount;
        const avgDailyHours = totalActiveDays > 0 ? Math.round((totalWorkedHours / totalActiveDays) * 10) / 10 : 0;

        // Monthly attendance rate: weighted (full day = 1, half day = 0.5) against active work days
        const attendanceRate = Math.min(
          100,
          Math.round(((fullDaysCount + halfDaysCount * 0.5 + workingShiftsCount * 0.8) / activeWorkDays) * 100)
        );

        const onTimeRate =
          totalActiveDays > 0
            ? Math.round(((totalActiveDays - lateShiftsCount) / totalActiveDays) * 100)
            : 100;

        return {
          id: empId,
          name: emp.name || 'Unknown',
          email: emp.email || '',
          department: formatDeptName(emp.department),
          role: emp.role || 'employee',
          avatar: emp.avatar,
          totalWorkedHours,
          totalWorkedMinutes,
          benchmarkHours: monthlyBenchmarkHours,
          fullDaysCount,
          halfDaysCount,
          workingShiftsCount,
          totalActiveDays,
          lateShiftsCount,
          attendanceRate,
          onTimeRate,
          avgDailyHours,
          isLate: lateShiftsCount > 0,
          statusDisplay:
            totalActiveDays > 0
              ? `${totalActiveDays} Days Active (${fullDaysCount} Full)`
              : '0 Days Logged',
          punctualityText:
            lateShiftsCount > 0 ? `${lateShiftsCount} Late Shifts` : `${totalActiveDays} On Time`,
          firstPunchIn: firstCheckInTimes[0] || '--',
        };
      } else {
        // --- DAILY AGGREGATION ---
        const rec = empRecords.find((r) => r.date === internalDate);
        const sessions: AttendanceSession[] = rec?.sessions || [];
        const evaluation = evaluateDailyAttendance(sessions, internalDate, now);

        const isAuto = Boolean(rec?.isAutoClockOut || evaluation.isAutoClockOut);
        const effectiveMinutes = isAuto
          ? rec?.effectiveMinutes || evaluation.effectiveWorkedMinutes
          : evaluation.effectiveWorkedMinutes;

        const totalWorkedHours = Math.round((effectiveMinutes / 60) * 10) / 10;
        const completionRate = Math.min(100, Math.round((effectiveMinutes / 480) * 100));

        let statusDisplay = 'Absent';
        let statusCode = 'absent';
        if (rec?.status === 'full_day' || evaluation.status === 'full_day' || effectiveMinutes >= 480) {
          statusDisplay = 'Full Day';
          statusCode = 'full_day';
        } else if (
          rec?.status === 'half_day' ||
          evaluation.status === 'half_day' ||
          (effectiveMinutes < 480 && sessions.length > 0 && !evaluation.isCurrentlyWorking)
        ) {
          statusDisplay = 'Half Day';
          statusCode = 'half_day';
        } else if (evaluation.isCurrentlyWorking) {
          statusDisplay = 'Working';
          statusCode = 'working';
        }

        const isLate = Boolean(rec?.isLate ?? evaluation.isLate);
        const lateBy = rec?.lateByMinutes ?? evaluation.lateByMinutes;
        const punctualityText = isLate
          ? `Late (+${lateBy}m)`
          : sessions.length > 0
          ? 'On Time'
          : 'Not Checked In';

        return {
          id: empId,
          name: emp.name || 'Unknown',
          email: emp.email || '',
          department: formatDeptName(emp.department),
          role: emp.role || 'employee',
          avatar: emp.avatar,
          totalWorkedHours,
          totalWorkedMinutes: effectiveMinutes,
          benchmarkHours: 8,
          fullDaysCount: statusCode === 'full_day' ? 1 : 0,
          halfDaysCount: statusCode === 'half_day' ? 1 : 0,
          workingShiftsCount: statusCode === 'working' ? 1 : 0,
          totalActiveDays: sessions.length > 0 ? 1 : 0,
          lateShiftsCount: isLate ? 1 : 0,
          attendanceRate: completionRate,
          onTimeRate: isLate ? 0 : 100,
          avgDailyHours: totalWorkedHours,
          isLate,
          statusDisplay,
          punctualityText,
          firstPunchIn: evaluation.firstPunchInFormatted || '--',
        };
      }
    });
  }, [employees, records, period, internalMonth, internalDate]);

  // Filtered employees if department filter is active
  const filteredEmployees = useMemo(() => {
    if (selectedDeptFilter === 'all') return employeeData;
    return employeeData.filter(
      (e) => e.department.toLowerCase() === selectedDeptFilter.toLowerCase()
    );
  }, [employeeData, selectedDeptFilter]);

  // 2. Process Department Level Aggregations
  const departmentData = useMemo(() => {
    const distinctDates = Array.from(new Set(records.map((r) => r.date))).sort();
    const activeWorkDays = Math.max(1, distinctDates.length);

    const deptMap = new Map<
      string,
      {
        department: string;
        totalStaff: number;
        fullDayShifts: number;
        halfDayShifts: number;
        workingShifts: number;
        lateShifts: number;
        totalHours: number;
        attendanceRate: number;
        avgDailyHours: number;
      }
    >();

    // Initialize all departments
    departmentsList.forEach((dept) => {
      deptMap.set(dept, {
        department: dept,
        totalStaff: 0,
        fullDayShifts: 0,
        halfDayShifts: 0,
        workingShifts: 0,
        lateShifts: 0,
        totalHours: 0,
        attendanceRate: 0,
        avgDailyHours: 0,
      });
    });

    // Populate data from employees
    employeeData.forEach((emp) => {
      const dept = emp.department;
      if (!deptMap.has(dept)) {
        deptMap.set(dept, {
          department: dept,
          totalStaff: 0,
          fullDayShifts: 0,
          halfDayShifts: 0,
          workingShifts: 0,
          lateShifts: 0,
          totalHours: 0,
          attendanceRate: 0,
          avgDailyHours: 0,
        });
      }

      const item = deptMap.get(dept)!;
      item.totalStaff += 1;
      item.totalHours += emp.totalWorkedHours;
      item.fullDayShifts += emp.fullDaysCount;
      item.halfDayShifts += emp.halfDaysCount;
      item.workingShifts += emp.workingShiftsCount;
      item.lateShifts += emp.lateShiftsCount;
    });

    // Calculate rates
    return Array.from(deptMap.values()).map((d) => {
      const targetShifts = d.totalStaff * activeWorkDays;
      const rate =
        targetShifts > 0
          ? Math.min(
              100,
              Math.round(((d.fullDayShifts + d.halfDayShifts * 0.5 + d.workingShifts * 0.8) / targetShifts) * 100)
            )
          : 0;

      const totalActive = d.fullDayShifts + d.halfDayShifts + d.workingShifts;
      const avgDailyHours = totalActive > 0 ? Math.round((d.totalHours / totalActive) * 10) / 10 : 0;

      return {
        ...d,
        totalHours: Math.round(d.totalHours * 10) / 10,
        attendanceRate: rate,
        avgDailyHours,
      };
    });
  }, [departmentsList, employeeData, records]);

  // 3. Organization-Wide KPI Summary Stats
  const orgKpiStats = useMemo(() => {
    const totalStaff = employeeData.length;
    const distinctDates = Array.from(new Set(records.map((r) => r.date))).sort();
    const activeWorkDays = Math.max(1, distinctDates.length);

    let totalFullDay = 0;
    let totalHalfDay = 0;
    let totalWorking = 0;
    let totalLate = 0;
    let totalHoursLogged = 0;

    employeeData.forEach((e) => {
      totalFullDay += e.fullDaysCount;
      totalHalfDay += e.halfDaysCount;
      totalWorking += e.workingShiftsCount;
      totalLate += e.lateShiftsCount;
      totalHoursLogged += e.totalWorkedHours;
    });

    const totalExpectedShifts = totalStaff * activeWorkDays;
    const attendanceRate =
      totalExpectedShifts > 0
        ? Math.min(
            100,
            Math.round(
              ((totalFullDay + totalHalfDay * 0.5 + totalWorking * 0.8) / totalExpectedShifts) * 100
            )
          )
        : 0;

    const totalActiveShifts = totalFullDay + totalHalfDay + totalWorking;
    const onTimeRate =
      totalActiveShifts > 0
        ? Math.round(((totalActiveShifts - totalLate) / totalActiveShifts) * 100)
        : 100;

    const avgHoursPerEmployee =
      totalStaff > 0 ? Math.round((totalHoursLogged / totalStaff) * 10) / 10 : 0;

    return {
      totalStaff,
      activeWorkDays,
      totalFullDay,
      totalHalfDay,
      totalWorking,
      totalLate,
      totalActiveShifts,
      totalHoursLogged: Math.round(totalHoursLogged * 10) / 10,
      avgHoursPerEmployee,
      attendanceRate,
      onTimeRate,
    };
  }, [employeeData, records]);

  // 4. Day-by-Day Attendance Timeline in the Selected Month
  const monthlyTimelineData = useMemo(() => {
    if (period !== 'month') return [];

    const dateMap = new Map<
      string,
      {
        date: string;
        displayDate: string;
        fullDay: number;
        halfDay: number;
        working: number;
        totalHours: number;
      }
    >();

    records.forEach((r) => {
      if (!r.date || !r.date.startsWith(internalMonth)) return;
      const d = r.date;
      if (!dateMap.has(d)) {
        const parts = d.split('-');
        const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
        dateMap.set(d, {
          date: d,
          displayDate,
          fullDay: 0,
          halfDay: 0,
          working: 0,
          totalHours: 0,
        });
      }

      const item = dateMap.get(d)!;
      if (r.status === 'full_day' || (r.effectiveMinutes || 0) >= 480) {
        item.fullDay += 1;
      } else if (r.status === 'half_day' || ((r.effectiveMinutes || 0) < 480 && (r.sessions?.length || 0) > 0)) {
        item.halfDay += 1;
      } else if (r.status === 'working') {
        item.working += 1;
      }

      item.totalHours += Math.round(((r.effectiveMinutes || 0) / 60) * 10) / 10;
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [records, period, internalMonth]);

  // 5. Shift Distribution Pie Data
  const statusPieData = useMemo(() => {
    return [
      { name: 'Full Day Shifts', value: orgKpiStats.totalFullDay, color: '#10B981' },
      { name: 'Active Working', value: orgKpiStats.totalWorking, color: '#0D9488' },
      { name: 'Half Day Shifts', value: orgKpiStats.totalHalfDay, color: '#F59E0B' },
      { name: 'Late Shifts', value: orgKpiStats.totalLate, color: '#EF4444' },
    ].filter((item) => item.value > 0);
  }, [orgKpiStats]);

  // Color code helper for individual employee bars
  const getEmployeeBarColor = (entry: any) => {
    if (entry.totalWorkedHours >= (entry.benchmarkHours || 8)) return '#10B981'; // Green (Benchmark met)
    if (entry.totalWorkedHours >= (entry.benchmarkHours || 8) * 0.5) return '#635BFF'; // Indigo
    if (entry.totalWorkedHours > 0) return '#F59E0B'; // Amber
    return '#E2E8F0'; // Slate
  };

  // Custom Tooltip for Department Chart
  const CustomDeptTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs space-y-1.5 min-w-[210px]">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <span className="font-bold text-sm text-slate-100">{label}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
              {data.attendanceRate}% Rate
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <div>
              <span className="text-slate-400">Total Staff:</span>{' '}
              <strong className="text-white">{data.totalStaff}</strong>
            </div>
            <div>
              <span className="text-emerald-400">Full Days:</span>{' '}
              <strong className="text-white">{data.fullDayShifts}</strong>
            </div>
            <div>
              <span className="text-amber-400">Half Days:</span>{' '}
              <strong className="text-white">{data.halfDayShifts}</strong>
            </div>
            <div>
              <span className="text-rose-400">Late Shifts:</span>{' '}
              <strong className="text-white">{data.lateShifts}</strong>
            </div>
          </div>
          <div className="border-t border-slate-700/80 pt-1 text-[10px] text-slate-300 flex justify-between">
            <span>Total Logged: <strong>{data.totalHours}h</strong></span>
            <span>Avg: <strong>{data.avgDailyHours}h/day</strong></span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Individual Employee Chart
  const CustomEmployeeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs space-y-1.5 min-w-[230px]">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <div>
              <h5 className="font-bold text-sm text-slate-100">{data.name}</h5>
              <p className="text-[10px] text-slate-400">
                {data.department} • {data.role}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              {data.attendanceRate}% Rate
            </span>
          </div>

          <div className="space-y-1 pt-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Hours Logged:</span>
              <strong className="text-emerald-400 font-mono text-xs">
                {data.totalWorkedHours}h {period === 'month' ? `(${data.benchmarkHours}h Target)` : '/ 8.0h'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Full Day Shifts:</span>
              <strong className="text-slate-200">{data.fullDaysCount} days</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Half Day Shifts:</span>
              <strong className="text-slate-200">{data.halfDaysCount} days</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Punctuality:</span>
              <span
                className={`font-semibold ${
                  data.lateShiftsCount > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {data.punctualityText}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/80 p-5 sm:p-6 lg:p-7 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.12),0_6px_16px_-3px_rgba(15,23,42,0.06)] space-y-6 transition-all duration-300">
      {/* 1. Header with Controls & View Mode Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#635BFF] via-[#7067FF] to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                {title}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {subtitle ||
                  (period === 'month'
                    ? `Monthly attendance analytics, days worked & hours logged for ${formatMonthDisplay(internalMonth)}`
                    : `Daily attendance telemetry for ${internalDate}`)}
              </p>
            </div>
          </div>
        </div>

        {/* Filters & View Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Toggle (Monthly vs Daily) */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 shadow-inner">
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                period === 'month'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
            <button
              onClick={() => setPeriod('day')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                period === 'day'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Day</span>
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 shadow-inner">
            <button
              onClick={() => setActiveTab('combined')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'combined'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Combined
            </button>
            <button
              onClick={() => setActiveTab('department')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'department'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Dept
            </button>
            <button
              onClick={() => setActiveTab('individual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'individual'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Individual
            </button>
            {period === 'month' ? (
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Timeline
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('distribution')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'distribution'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Status
              </button>
            )}
          </div>

          {/* Department Filter Dropdown */}
          <CustomSelect
            value={selectedDeptFilter}
            onChange={setSelectedDeptFilter}
            size="sm"
            options={[
              { value: 'all', label: `All Departments (${departmentsList.length})` },
              ...departmentsList.map((dept) => ({
                value: dept.toLowerCase(),
                label: dept,
              })),
            ]}
          />

          {/* Timeframe Picker: Month Selector OR Day Picker */}
          {period === 'month' ? (
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200/80 rounded-2xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => handleMonthSelect(getAdjacentMonth(internalMonth, -1))}
                className="p-1 hover:bg-slate-200/70 text-slate-600 rounded-lg transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center space-x-1.5 px-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                <input
                  type="month"
                  value={internalMonth}
                  onChange={(e) => handleMonthSelect(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => handleMonthSelect(getAdjacentMonth(internalMonth, 1))}
                className="p-1 hover:bg-slate-200/70 text-slate-600 rounded-lg transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {internalMonth !== getLocalCurrentMonthStr() && (
                <button
                  type="button"
                  onClick={() => handleMonthSelect(getLocalCurrentMonthStr())}
                  className="px-2 py-0.5 text-[10px] font-black text-[#635BFF] hover:bg-[#F0EEFF] rounded-md transition-colors"
                >
                  This Month
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl px-2.5 py-1 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={internalDate}
                onChange={(e) => handleDateSelect(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
              {internalDate !== getLocalTodayStr() && (
                <button
                  type="button"
                  onClick={() => handleDateSelect(getLocalTodayStr())}
                  className="px-1.5 py-0.5 text-[10px] font-black text-[#635BFF] hover:bg-[#F0EEFF] rounded-md transition-colors"
                >
                  Today
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Top Executive Telemetry Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Attendance Rate */}
        <div
          onClick={() => onNavigate?.('attendance')}
          className={`bg-slate-50/70 rounded-2xl p-3 border border-slate-100 flex flex-col justify-between shadow-2xs hover:bg-white hover:shadow-xs transition-all ${
            onNavigate ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]' : ''
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {period === 'month' ? 'Monthly Attendance' : 'Attendance Rate'}
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {orgKpiStats.attendanceRate}%
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              {period === 'month' ? formatMonthDisplay(internalMonth).split(' ')[0] : 'Live'}
            </span>
          </div>
        </div>

        {/* Total Staff */}
        <div
          onClick={() => onNavigate?.('employees')}
          className={`bg-slate-50/70 rounded-2xl p-3 border border-slate-100 flex flex-col justify-between shadow-2xs hover:bg-white hover:shadow-xs transition-all ${
            onNavigate ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]' : ''
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Headcount
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {orgKpiStats.totalStaff}
            </span>
            <span className="text-[10px] font-medium text-slate-500">
              {departmentsList.length} Depts
            </span>
          </div>
        </div>

        {/* Full Days Completed */}
        <div
          onClick={() => onNavigate?.('attendance')}
          className={`bg-slate-50/70 rounded-2xl p-3 border border-slate-100 flex flex-col justify-between shadow-2xs hover:bg-white hover:shadow-xs transition-all ${
            onNavigate ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]' : ''
          }`}
        >
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Full Days Logged</span>
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-emerald-600">
              {orgKpiStats.totalFullDay}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              {period === 'month' ? `${orgKpiStats.activeWorkDays} days tracked` : 'Today'}
            </span>
          </div>
        </div>

        {/* Half Days Logged */}
        <div
          onClick={() => onNavigate?.('attendance')}
          className={`bg-slate-50/70 rounded-2xl p-3 border border-slate-100 flex flex-col justify-between shadow-2xs hover:bg-white hover:shadow-xs transition-all ${
            onNavigate ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]' : ''
          }`}
        >
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Half Days</span>
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-amber-600">
              {orgKpiStats.totalHalfDay}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              {orgKpiStats.totalWorking} active
            </span>
          </div>
        </div>

        {/* Total Hours Worked */}
        <div
          onClick={() => onNavigate?.('attendance')}
          className={`bg-slate-50/70 rounded-2xl p-3 border border-slate-100 flex flex-col justify-between shadow-2xs hover:bg-white hover:shadow-xs transition-all ${
            onNavigate ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]' : ''
          }`}
        >
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center space-x-1">
            <Clock className="w-3 h-3 text-indigo-500" />
            <span>Total Hours Logged</span>
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-indigo-600">
              {orgKpiStats.totalHoursLogged}h
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              ~{orgKpiStats.avgHoursPerEmployee}h / staff
            </span>
          </div>
        </div>

        {/* Monthly Punctuality */}
        <div
          onClick={() => onNavigate?.('attendance')}
          className={`bg-slate-50/70 rounded-2xl p-3 border border-slate-100 flex flex-col justify-between shadow-2xs hover:bg-white hover:shadow-xs transition-all ${
            onNavigate ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]' : ''
          }`}
        >
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Punctuality</span>
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {orgKpiStats.onTimeRate}%
            </span>
            <span
              className={`text-[10px] font-bold ${
                orgKpiStats.totalLate > 0 ? 'text-rose-500' : 'text-emerald-500'
              }`}
            >
              {orgKpiStats.totalLate > 0 ? `${orgKpiStats.totalLate} Late` : 'On Time'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Dynamic Visual Charts Section */}
      {!isMounted || loading ? (
        <div className="h-72 w-full flex flex-col items-center justify-center space-y-3 bg-slate-50/50 rounded-2xl animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-400">
            Analyzing {period === 'month' ? formatMonthDisplay(internalMonth) : internalDate} attendance telemetry...
          </p>
        </div>
      ) : (
        <>
          {/* VIEW MODE 1: COMBINED (Dept Stacked Bar Chart + Individual Employees Side-by-Side) */}
          {activeTab === 'combined' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Department Distribution Chart */}
              <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                      <Building2 className="w-4 h-4 text-[#635BFF]" />
                      <span>Department Monthly Shift Breakdown</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Full Days, Half Days &amp; Late shifts for {formatMonthDisplay(internalMonth)}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
                    All Departments
                  </span>
                </div>

                <div className="h-64 w-full">
                  {departmentData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={departmentData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                          dataKey="department"
                          tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                          interval={0}
                        />
                        <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} />
                        <Tooltip content={<CustomDeptTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                          formatter={(value) => (
                            <span className="text-slate-700 font-semibold">{value}</span>
                          )}
                        />
                        <Bar
                          dataKey="fullDayShifts"
                          name="Full Day Shifts"
                          stackId="a"
                          fill="#10B981"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="halfDayShifts"
                          name="Half Day Shifts"
                          stackId="a"
                          fill="#F59E0B"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="lateShifts"
                          name="Late Shifts"
                          stackId="a"
                          fill="#EF4444"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No department data available.
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Individual Employee Worked Hours Chart */}
              <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>Employee Monthly Hours Logged</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Cumulative hours worked in {formatMonthDisplay(internalMonth)}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    {filteredEmployees.length} Employees
                  </span>
                </div>

                <div className="h-64 w-full">
                  {filteredEmployees.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredEmployees}
                        margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                          interval={0}
                        />
                        <YAxis
                          tick={{ fill: '#94A3B8', fontSize: 11 }}
                          unit="h"
                        />
                        <Tooltip content={<CustomEmployeeTooltip />} />
                        {period === 'month' && filteredEmployees[0]?.benchmarkHours && (
                          <ReferenceLine
                            y={filteredEmployees[0].benchmarkHours}
                            stroke="#10B981"
                            strokeDasharray="3 3"
                            strokeWidth={2}
                            label={{
                              value: `${filteredEmployees[0].benchmarkHours}h Target`,
                              fill: '#059669',
                              fontSize: 10,
                              position: 'right',
                              fontWeight: 700,
                            }}
                          />
                        )}
                        <Bar dataKey="totalWorkedHours" name="Total Hours" radius={[6, 6, 0, 0]}>
                          {filteredEmployees.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getEmployeeBarColor(entry)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No employee records found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: ALL DEPARTMENTS DEEP DIVE */}
          {activeTab === 'department' && (
            <div className="space-y-6">
              {/* Large Department Comparative Bar Chart */}
              <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-[#635BFF]" />
                      <span>Monthly Department Attendance Rate (%)</span>
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      Attendance fulfillment percentage by department for {formatMonthDisplay(internalMonth)}
                    </p>
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={departmentData}
                      margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="department"
                        tick={{ fill: '#334155', fontSize: 12, fontWeight: 700 }}
                      />
                      <YAxis
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                        unit="%"
                        domain={[0, 100]}
                      />
                      <Tooltip content={<CustomDeptTooltip />} />
                      <Legend
                        wrapperStyle={{ paddingTop: '10px' }}
                        formatter={(val) => (
                          <span className="text-xs font-bold text-slate-700">{val}</span>
                        )}
                      />
                      <Bar
                        dataKey="attendanceRate"
                        name="Attendance Rate (%)"
                        fill="#635BFF"
                        radius={[8, 8, 0, 0]}
                      >
                        {departmentData.map((d, idx) => (
                          <Cell
                            key={`dept-cell-${idx}`}
                            fill={
                              d.attendanceRate >= 80
                                ? '#10B981'
                                : d.attendanceRate >= 50
                                ? '#635BFF'
                                : '#F59E0B'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department Comparative Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {departmentData.map((d) => (
                  <div
                    key={d.department}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_8px_20px_-3px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_28px_-3px_rgba(99,91,255,0.14)] hover:-translate-y-0.5 transition-all duration-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#635BFF] flex items-center justify-center font-bold text-xs">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-slate-900">{d.department}</h5>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {d.totalStaff} staff member{d.totalStaff !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-black ${
                          d.attendanceRate >= 80
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : d.attendanceRate >= 50
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {d.attendanceRate}% Rate
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            d.attendanceRate >= 80
                              ? 'bg-emerald-500'
                              : d.attendanceRate >= 50
                              ? 'bg-[#635BFF]'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${d.attendanceRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Breakdown Badges */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
                      <div className="bg-emerald-50/80 rounded-xl p-1.5 border border-emerald-100">
                        <span className="text-[10px] text-emerald-700 font-semibold block">Full</span>
                        <strong className="text-xs text-emerald-900 font-black">{d.fullDayShifts}</strong>
                      </div>
                      <div className="bg-amber-50/80 rounded-xl p-1.5 border border-amber-100">
                        <span className="text-[10px] text-amber-700 font-semibold block">Half</span>
                        <strong className="text-xs text-amber-900 font-black">{d.halfDayShifts}</strong>
                      </div>
                      <div className="bg-indigo-50/80 rounded-xl p-1.5 border border-indigo-100">
                        <span className="text-[10px] text-indigo-700 font-semibold block">Hours</span>
                        <strong className="text-xs text-indigo-900 font-black">{d.totalHours}h</strong>
                      </div>
                      <div className="bg-rose-50/80 rounded-xl p-1.5 border border-rose-100">
                        <span className="text-[10px] text-rose-700 font-semibold block">Late</span>
                        <strong className="text-xs text-rose-900 font-black">{d.lateShifts}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW MODE 3: INDIVIDUAL EMPLOYEES COMPREHENSIVE */}
          {activeTab === 'individual' && (
            <div className="space-y-6">
              {/* Full Width Individual Employee Worked Hours Chart */}
              <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <span>
                        {period === 'month'
                          ? `Individual Employee Monthly Hours (${formatMonthDisplay(internalMonth)})`
                          : `Individual Employee Hours (${internalDate})`}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      Cumulative hours worked vs expected benchmark across the month
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 text-xs font-semibold">
                    <span className="flex items-center space-x-1 text-emerald-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Benchmark Met</span>
                    </span>
                    <span className="flex items-center space-x-1 text-indigo-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#635BFF]" />
                      <span>In Progress</span>
                    </span>
                    <span className="flex items-center space-x-1 text-amber-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>Under Benchmark</span>
                    </span>
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredEmployees}
                      margin={{ top: 20, right: 30, left: -10, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#1E293B', fontSize: 12, fontWeight: 700 }}
                      />
                      <YAxis
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                        unit="h"
                      />
                      <Tooltip content={<CustomEmployeeTooltip />} />
                      {period === 'month' && filteredEmployees[0]?.benchmarkHours && (
                        <ReferenceLine
                          y={filteredEmployees[0].benchmarkHours}
                          stroke="#10B981"
                          strokeDasharray="4 4"
                          strokeWidth={2}
                          label={{
                            value: `${filteredEmployees[0].benchmarkHours}h Full Benchmark`,
                            fill: '#059669',
                            fontSize: 11,
                            position: 'top',
                            fontWeight: 700,
                          }}
                        />
                      )}
                      <Bar dataKey="totalWorkedHours" name="Hours Worked" radius={[8, 8, 0, 0]}>
                        {filteredEmployees.map((entry, index) => (
                          <Cell key={`ind-cell-${index}`} fill={getEmployeeBarColor(entry)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Individual Employee Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_8px_20px_-3px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_28px_-3px_rgba(99,91,255,0.14)] hover:-translate-y-0.5 transition-all duration-200 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {emp.avatar ? (
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="w-10 h-10 rounded-2xl object-cover border border-slate-200/80 shadow-2xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#635BFF] flex items-center justify-center font-bold text-sm">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h5 className="text-sm font-bold text-slate-900">{emp.name}</h5>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {emp.department} • {emp.role}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          emp.attendanceRate >= 80
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : emp.attendanceRate >= 50
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {emp.attendanceRate}% Rate
                      </span>
                    </div>

                    {/* Hours Progress Bar against Month Target */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500">Monthly Hours:</span>
                        <span className="font-mono text-slate-900 font-bold">
                          {emp.totalWorkedHours}h / {emp.benchmarkHours}h Target
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            emp.totalWorkedHours >= emp.benchmarkHours
                              ? 'bg-emerald-500'
                              : emp.totalWorkedHours >= emp.benchmarkHours * 0.5
                              ? 'bg-[#635BFF]'
                              : 'bg-amber-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (emp.totalWorkedHours / Math.max(1, emp.benchmarkHours)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Breakdown of Days in Month */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1 text-center text-[10px]">
                      <div className="bg-emerald-50/80 rounded-xl p-1.5 border border-emerald-100">
                        <span className="text-emerald-700 font-semibold block">Full Days</span>
                        <strong className="text-xs text-emerald-900 font-black">{emp.fullDaysCount}</strong>
                      </div>
                      <div className="bg-amber-50/80 rounded-xl p-1.5 border border-amber-100">
                        <span className="text-amber-700 font-semibold block">Half Days</span>
                        <strong className="text-xs text-amber-900 font-black">{emp.halfDaysCount}</strong>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-1.5 border border-slate-200/70">
                        <span className="text-slate-600 font-semibold block">Avg Hours</span>
                        <strong className="text-xs text-slate-800 font-black">{emp.avgDailyHours}h/d</strong>
                      </div>
                    </div>

                    {/* Punctuality Footnote */}
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-100">
                      <div>
                        Shifts: <strong className="text-slate-700 font-mono">{emp.totalActiveDays} days</strong>
                      </div>
                      <span
                        className={`font-semibold ${
                          emp.lateShiftsCount > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {emp.punctualityText}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW MODE 4: MONTHLY DAILY TREND TIMELINE */}
          {activeTab === 'timeline' && period === 'month' && (
            <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100 space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <span>Day-by-Day Attendance Timeline in {formatMonthDisplay(internalMonth)}</span>
                </h4>
                <p className="text-xs text-slate-400 font-medium">
                  Daily shifts and total team hours logged across the month
                </p>
              </div>

              <div className="h-80 w-full">
                {monthlyTimelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={monthlyTimelineData}
                      margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
                    >
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#635BFF" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#635BFF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                      />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} unit="h" />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900/95 text-white p-3 rounded-xl text-xs space-y-1 shadow-xl border border-slate-700">
                                <div className="font-bold border-b border-slate-700 pb-1">
                                  Date: {d.date}
                                </div>
                                <div className="text-indigo-300">
                                  Total Hours: <strong>{d.totalHours}h</strong>
                                </div>
                                <div className="text-emerald-300">
                                  Full Days: <strong>{d.fullDay}</strong>
                                </div>
                                <div className="text-amber-300">
                                  Half Days: <strong>{d.halfDay}</strong>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }} />
                      <Area
                        type="monotone"
                        dataKey="totalHours"
                        name="Team Hours Logged"
                        stroke="#635BFF"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorHours)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No timeline records available for this month.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW MODE 5: STATUS DISTRIBUTION */}
          {activeTab === 'distribution' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Donut Chart */}
              <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <PieChartIcon className="w-4 h-4 text-[#635BFF]" />
                    <span>Company-Wide Shift Distribution</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Proportion of Full Day, Half Day, Active, and Late shifts in {formatMonthDisplay(internalMonth)}
                  </p>
                </div>

                <div className="h-64 w-full flex items-center justify-center">
                  {statusPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {statusPieData.map((entry, index) => (
                            <Cell key={`pie-cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                          formatter={(val) => (
                            <span className="text-slate-700 font-semibold">{val}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs text-slate-400">No shift data to plot.</div>
                  )}
                </div>
              </div>

              {/* Department Ranking by Attendance Rate */}
              <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Department Monthly Ranking</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Leaderboard by attendance fulfillment in {formatMonthDisplay(internalMonth)}
                  </p>
                </div>

                <div className="space-y-3 my-auto py-2">
                  {departmentData
                    .slice()
                    .sort((a, b) => b.attendanceRate - a.attendanceRate)
                    .map((d, idx) => (
                      <div
                        key={d.department}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-2xs"
                      >
                        <div className="flex items-center space-x-3">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-800'
                                : idx === 1
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <div>
                            <h5 className="text-xs font-bold text-slate-900">{d.department}</h5>
                            <span className="text-[10px] text-slate-400">
                              {d.totalStaff} staff • {d.fullDayShifts} full days
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900 font-mono">
                            {d.attendanceRate}%
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {d.totalHours}h total
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
