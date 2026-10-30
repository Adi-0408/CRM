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
  Sparkles,
  Layers,
  Award,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import {
  evaluateDailyAttendance,
  getLocalTodayStr,
  AttendanceSession,
} from '@/lib/attendanceEngine';

interface AttendanceAnalyticsChartProps {
  employees: any[];
  records?: any[];
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  title?: string;
  subtitle?: string;
  defaultMode?: 'combined' | 'department' | 'individual' | 'distribution';
}

// Format department display name (e.g., "sales" -> "Sales")
function formatDeptName(dept?: string): string {
  if (!dept || dept.trim() === '') return 'General';
  return dept
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function AttendanceAnalyticsChart({
  employees = [],
  records: initialRecords,
  selectedDate: initialSelectedDate,
  onDateChange,
  title = 'Attendance Telemetry & Data Analysis',
  subtitle = 'Cross-departmental attendance distribution and individual employee performance metrics',
  defaultMode = 'combined',
}: AttendanceAnalyticsChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [internalDate, setInternalDate] = useState<string>(
    initialSelectedDate || getLocalTodayStr()
  );
  const [records, setRecords] = useState<any[]>(initialRecords || []);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'combined' | 'department' | 'individual' | 'distribution'
  >(defaultMode);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  // Track client mounting for Recharts hydration safety
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync internal date when prop updates
  useEffect(() => {
    if (initialSelectedDate && initialSelectedDate !== internalDate) {
      setInternalDate(initialSelectedDate);
    }
  }, [initialSelectedDate]);

  // Sync records if passed as prop
  useEffect(() => {
    if (initialRecords) {
      setRecords(initialRecords);
    }
  }, [initialRecords]);

  // Fetch records if not provided or when date changes
  useEffect(() => {
    if (!initialRecords) {
      const fetchDateRecords = async () => {
        try {
          setLoading(true);
          const res = await authFetch(`/api/attendance?date=${internalDate}`);
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
      fetchDateRecords();
    }
  }, [internalDate, initialRecords]);

  const handleDateSelect = (newDate: string) => {
    setInternalDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  // 1. Process Individual Employees Dataset
  const employeeData = useMemo(() => {
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

    const now = new Date();

    return employees.map((emp) => {
      const empId = String(emp._id || emp.id || '');
      const rec = recordsMap.get(empId);
      const sessions: AttendanceSession[] = rec?.sessions || [];
      const evaluation = evaluateDailyAttendance(sessions, internalDate, now);

      const isAuto = Boolean(rec?.isAutoClockOut || evaluation.isAutoClockOut);
      const effectiveMinutes = isAuto
        ? rec?.effectiveMinutes || evaluation.effectiveWorkedMinutes
        : evaluation.effectiveWorkedMinutes;

      const workedHours = Math.round((effectiveMinutes / 60) * 10) / 10;
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
        rawDept: emp.department || 'general',
        role: emp.role || 'employee',
        avatar: emp.avatar,
        workedHours,
        workedMinutes: effectiveMinutes,
        completionRate,
        statusCode,
        statusDisplay,
        isLate,
        lateByMinutes: lateBy,
        punctualityText,
        firstPunchIn: evaluation.firstPunchInFormatted || '--',
        lastPunchOut: evaluation.lastPunchOutFormatted || '--',
        sessionsCount: sessions.length,
      };
    });
  }, [employees, records, internalDate]);

  // Unique departments list
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      set.add(formatDeptName(e.department));
    });
    return Array.from(set).sort();
  }, [employees]);

  // Filtered employees if department filter is active
  const filteredEmployees = useMemo(() => {
    if (selectedDeptFilter === 'all') return employeeData;
    return employeeData.filter(
      (e) => e.department.toLowerCase() === selectedDeptFilter.toLowerCase()
    );
  }, [employeeData, selectedDeptFilter]);

  // 2. Process Department Level Aggregations
  const departmentData = useMemo(() => {
    const deptMap = new Map<
      string,
      {
        department: string;
        totalStaff: number;
        fullDay: number;
        halfDay: number;
        working: number;
        absent: number;
        late: number;
        totalHours: number;
        attendanceRate: number;
      }
    >();

    // Initialize all existing departments
    departmentsList.forEach((dept) => {
      deptMap.set(dept, {
        department: dept,
        totalStaff: 0,
        fullDay: 0,
        halfDay: 0,
        working: 0,
        absent: 0,
        late: 0,
        totalHours: 0,
        attendanceRate: 0,
      });
    });

    // Populate counts from employees
    employeeData.forEach((emp) => {
      const dept = emp.department;
      if (!deptMap.has(dept)) {
        deptMap.set(dept, {
          department: dept,
          totalStaff: 0,
          fullDay: 0,
          halfDay: 0,
          working: 0,
          absent: 0,
          late: 0,
          totalHours: 0,
          attendanceRate: 0,
        });
      }

      const item = deptMap.get(dept)!;
      item.totalStaff += 1;
      item.totalHours += emp.workedHours;

      if (emp.statusCode === 'full_day') item.fullDay += 1;
      else if (emp.statusCode === 'half_day') item.halfDay += 1;
      else if (emp.statusCode === 'working') item.working += 1;
      else item.absent += 1;

      if (emp.isLate) item.late += 1;
    });

    // Compute attendance percentage
    return Array.from(deptMap.values()).map((d) => {
      const presentWeight = d.fullDay + d.working + d.halfDay * 0.5;
      const rate = d.totalStaff > 0 ? Math.round((presentWeight / d.totalStaff) * 100) : 0;
      const avgHours = d.totalStaff > 0 ? Math.round((d.totalHours / d.totalStaff) * 10) / 10 : 0;
      return {
        ...d,
        attendanceRate: rate,
        avgHours,
      };
    });
  }, [departmentsList, employeeData]);

  // 3. Organization-Wide KPI Stats
  const orgKpiStats = useMemo(() => {
    const totalStaff = employeeData.length;
    let fullDay = 0;
    let halfDay = 0;
    let working = 0;
    let absent = 0;
    let late = 0;
    let totalWorkedMinutes = 0;

    employeeData.forEach((e) => {
      if (e.statusCode === 'full_day') fullDay += 1;
      else if (e.statusCode === 'half_day') halfDay += 1;
      else if (e.statusCode === 'working') working += 1;
      else absent += 1;

      if (e.isLate) late += 1;
      totalWorkedMinutes += e.workedMinutes;
    });

    const activePresent = fullDay + working + halfDay;
    const attendanceRate =
      totalStaff > 0
        ? Math.round(((fullDay + working + halfDay * 0.5) / totalStaff) * 100)
        : 0;

    const onTimeRate =
      activePresent > 0
        ? Math.round(((activePresent - late) / activePresent) * 100)
        : 100;

    const avgHours =
      totalStaff > 0
        ? Math.round((totalWorkedMinutes / 60 / totalStaff) * 10) / 10
        : 0;

    return {
      totalStaff,
      fullDay,
      halfDay,
      working,
      absent,
      late,
      activePresent,
      attendanceRate,
      onTimeRate,
      avgHours,
    };
  }, [employeeData]);

  // 4. Status Distribution Pie Dataset
  const statusPieData = useMemo(() => {
    return [
      { name: 'Full Day (8h+)', value: orgKpiStats.fullDay, color: '#10B981' },
      { name: 'Active Working', value: orgKpiStats.working, color: '#0D9488' },
      { name: 'Half Day (<8h)', value: orgKpiStats.halfDay, color: '#F59E0B' },
      { name: 'Absent', value: orgKpiStats.absent, color: '#CBD5E1' },
    ].filter((item) => item.value > 0);
  }, [orgKpiStats]);

  // Color code helper for individual employee bars
  const getEmployeeBarColor = (entry: any) => {
    if (entry.statusCode === 'full_day') return '#10B981'; // Green
    if (entry.statusCode === 'working') return '#0D9488'; // Teal
    if (entry.statusCode === 'half_day') return '#F59E0B'; // Amber
    return '#E2E8F0'; // Absent gray
  };

  // Custom Tooltip for Department Chart
  const CustomDeptTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs space-y-1.5 min-w-[200px]">
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
              <span className="text-emerald-400">Full Day:</span>{' '}
              <strong className="text-white">{data.fullDay}</strong>
            </div>
            <div>
              <span className="text-amber-400">Half Day:</span>{' '}
              <strong className="text-white">{data.halfDay}</strong>
            </div>
            <div>
              <span className="text-teal-400">Working:</span>{' '}
              <strong className="text-white">{data.working}</strong>
            </div>
            <div>
              <span className="text-rose-400">Absent:</span>{' '}
              <strong className="text-white">{data.absent}</strong>
            </div>
            <div>
              <span className="text-red-400">Late Arrivals:</span>{' '}
              <strong className="text-white">{data.late}</strong>
            </div>
          </div>
          <div className="border-t border-slate-700/80 pt-1 text-[10px] text-slate-400">
            Average logged:{' '}
            <strong className="text-slate-200">{data.avgHours}h / person</strong>
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
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs space-y-1.5 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <div>
              <h5 className="font-bold text-sm text-slate-100">{data.name}</h5>
              <p className="text-[10px] text-slate-400">
                {data.department} • {data.role}
              </p>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                data.statusCode === 'full_day'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : data.statusCode === 'half_day'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  : data.statusCode === 'working'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
              }`}
            >
              {data.statusDisplay}
            </span>
          </div>

          <div className="space-y-1 pt-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Hours Worked:</span>
              <strong className="text-emerald-400 font-mono">
                {data.workedHours}h / 8.0h
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Shift Target:</span>
              <strong className="text-slate-200">{data.completionRate}% Met</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Punctuality:</span>
              <span
                className={`font-semibold ${
                  data.isLate ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {data.punctualityText}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">First Check-In:</span>
              <strong className="text-slate-200 font-mono">
                {data.firstPunchIn}
              </strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/80 p-5 sm:p-6 lg:p-7 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.12),0_6px_16px_-3px_rgba(15,23,42,0.06)] space-y-6 transition-all duration-300">
      {/* 1. Header with Controls & View Mode Pills */}
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
              <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Filters & View Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
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
          </div>

          {/* Department Filter Dropdown */}
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#635BFF] shadow-2xs cursor-pointer"
          >
            <option value="all">All Departments ({departmentsList.length})</option>
            {departmentsList.map((dept) => (
              <option key={dept} value={dept.toLowerCase()}>
                {dept}
              </option>
            ))}
          </select>

          {/* Date Picker */}
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
        </div>
      </div>

      {/* 2. Top Executive Telemetry Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Attendance Rate */}
        <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100 flex flex-col justify-between shadow-2xs hover:bg-white hover:shadow-xs transition-all">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Attendance Rate
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {orgKpiStats.attendanceRate}%
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              Live
            </span>
          </div>
        </div>

        {/* Total Staff */}
        <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100 flex flex-col justify-between shadow-2xs hover:bg-white hover:shadow-xs transition-all">
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

        {/* Full Day Completed */}
        <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100 flex flex-col justify-between shadow-2xs hover:bg-white hover:shadow-xs transition-all">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Full Day (8h+)</span>
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-emerald-600">
              {orgKpiStats.fullDay}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              {orgKpiStats.totalStaff > 0
                ? Math.round((orgKpiStats.fullDay / orgKpiStats.totalStaff) * 100)
                : 0}
              %
            </span>
          </div>
        </div>

        {/* Half Day */}
        <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100 flex flex-col justify-between shadow-2xs hover:bg-white hover:shadow-xs transition-all">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Half Day (&lt;8h)</span>
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-amber-600">
              {orgKpiStats.halfDay}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              {orgKpiStats.working} active
            </span>
          </div>
        </div>

        {/* Absent */}
        <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100 flex flex-col justify-between shadow-2xs hover:bg-white hover:shadow-xs transition-all">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Absent</span>
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-rose-500">
              {orgKpiStats.absent}
            </span>
            <span className="text-[10px] font-medium text-slate-400">0 logs</span>
          </div>
        </div>

        {/* On-Time Punctuality */}
        <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100 flex flex-col justify-between shadow-2xs hover:bg-white hover:shadow-xs transition-all">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center space-x-1">
            <Clock className="w-3 h-3 text-indigo-500" />
            <span>Punctuality</span>
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-indigo-600">
              {orgKpiStats.onTimeRate}%
            </span>
            <span
              className={`text-[10px] font-bold ${
                orgKpiStats.late > 0 ? 'text-rose-500' : 'text-emerald-500'
              }`}
            >
              {orgKpiStats.late > 0 ? `${orgKpiStats.late} Late` : 'On Time'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Dynamic Visual Charts Section */}
      {!isMounted || loading ? (
        <div className="h-72 w-full flex flex-col items-center justify-center space-y-3 bg-slate-50/50 rounded-2xl animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-400">
            Analyzing attendance telemetry data...
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
                      <span>Department Attendance Breakdown</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Attendance status distribution across all company departments
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
                          dataKey="fullDay"
                          name="Full Day (8h+)"
                          stackId="a"
                          fill="#10B981"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="working"
                          name="Working"
                          stackId="a"
                          fill="#0D9488"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="halfDay"
                          name="Half Day (<8h)"
                          stackId="a"
                          fill="#F59E0B"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="absent"
                          name="Absent"
                          stackId="a"
                          fill="#E2E8F0"
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
                      <span>Individual Employee Hours</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Worked hours vs 8-hour daily target per employee
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
                          domain={[0, 10]}
                          unit="h"
                        />
                        <Tooltip content={<CustomEmployeeTooltip />} />
                        <ReferenceLine
                          y={8}
                          stroke="#10B981"
                          strokeDasharray="3 3"
                          strokeWidth={2}
                          label={{
                            value: '8h Target',
                            fill: '#059669',
                            fontSize: 10,
                            position: 'right',
                            fontWeight: 700,
                          }}
                        />
                        <ReferenceLine
                          y={4}
                          stroke="#F59E0B"
                          strokeDasharray="3 3"
                          label={{
                            value: '4h Half Day',
                            fill: '#D97706',
                            fontSize: 9,
                            position: 'right',
                          }}
                        />
                        <Bar dataKey="workedHours" name="Worked Hours" radius={[6, 6, 0, 0]}>
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
                      <span>Cross-Department Attendance Rate &amp; Headcount Analysis</span>
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      Attendance rate percentage and distribution by organizational department
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
                        <strong className="text-xs text-emerald-900 font-black">{d.fullDay}</strong>
                      </div>
                      <div className="bg-teal-50/80 rounded-xl p-1.5 border border-teal-100">
                        <span className="text-[10px] text-teal-700 font-semibold block">Active</span>
                        <strong className="text-xs text-teal-900 font-black">{d.working}</strong>
                      </div>
                      <div className="bg-amber-50/80 rounded-xl p-1.5 border border-amber-100">
                        <span className="text-[10px] text-amber-700 font-semibold block">Half</span>
                        <strong className="text-xs text-amber-900 font-black">{d.halfDay}</strong>
                      </div>
                      <div className="bg-rose-50/80 rounded-xl p-1.5 border border-rose-100">
                        <span className="text-[10px] text-rose-700 font-semibold block">Absent</span>
                        <strong className="text-xs text-rose-900 font-black">{d.absent}</strong>
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
                      <span>Individual Employee Attendance &amp; Shift Compliance</span>
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      Exact hours logged today by every employee with 8-hour Full Day benchmark
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 text-xs font-semibold">
                    <span className="flex items-center space-x-1 text-emerald-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Full Day (≥8h)</span>
                    </span>
                    <span className="flex items-center space-x-1 text-amber-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>Half Day (&lt;8h)</span>
                    </span>
                    <span className="flex items-center space-x-1 text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <span>Absent</span>
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
                        domain={[0, 10]}
                      />
                      <Tooltip content={<CustomEmployeeTooltip />} />
                      <ReferenceLine
                        y={8}
                        stroke="#10B981"
                        strokeDasharray="4 4"
                        strokeWidth={2}
                        label={{
                          value: '8h Full Day Benchmark',
                          fill: '#059669',
                          fontSize: 11,
                          position: 'top',
                          fontWeight: 700,
                        }}
                      />
                      <ReferenceLine
                        y={4}
                        stroke="#F59E0B"
                        strokeDasharray="4 4"
                        label={{
                          value: '4h Half Day Cutoff',
                          fill: '#D97706',
                          fontSize: 10,
                          position: 'top',
                        }}
                      />
                      <Bar dataKey="workedHours" name="Worked Hours" radius={[8, 8, 0, 0]}>
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
                          emp.statusCode === 'full_day'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : emp.statusCode === 'half_day'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : emp.statusCode === 'working'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {emp.statusDisplay}
                      </span>
                    </div>

                    {/* Hours Progress Bar against 8h */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500">Worked Today:</span>
                        <span className="font-mono text-slate-900 font-bold">
                          {emp.workedHours}h / 8.0h ({emp.completionRate}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            emp.workedHours >= 8
                              ? 'bg-emerald-500'
                              : emp.workedHours >= 4
                              ? 'bg-amber-500'
                              : emp.workedHours > 0
                              ? 'bg-teal-500'
                              : 'bg-slate-200'
                          }`}
                          style={{ width: `${Math.min(100, (emp.workedHours / 8) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Timeline & Punctuality Footnote */}
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-100">
                      <div>
                        Punch: <strong className="text-slate-700 font-mono">{emp.firstPunchIn}</strong>
                      </div>
                      <span
                        className={`font-semibold ${
                          emp.isLate ? 'text-rose-600' : 'text-emerald-600'
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

          {/* VIEW MODE 4: OVERALL STATUS DISTRIBUTION */}
          {activeTab === 'distribution' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Donut Chart */}
              <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <PieChartIcon className="w-4 h-4 text-[#635BFF]" />
                    <span>Company-Wide Attendance Proportions</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Proportion of Full Day, Half Day, Active, and Absent staff
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
                    <div className="text-xs text-slate-400">No attendance data to plot.</div>
                  )}
                </div>
              </div>

              {/* Department Ranking by Attendance Rate */}
              <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Department Attendance Ranking</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Leaderboard by daily attendance fulfillment
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
                              {d.fullDay + d.working} active of {d.totalStaff} staff
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900 font-mono">
                            {d.attendanceRate}%
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {d.avgHours}h avg
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
