'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  CalendarCheck,
  Luggage,
  IndianRupee,
  CheckCircle2,
  Clock,
  ChevronRight,
  Plus,
  AlertCircle,
  Building2,
  Check,
  X,
  CreditCard,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatTimeAmPm } from '@/lib/attendanceEngine';

interface HRDashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenAddEmployee?: () => void;
}

export default function HRDashboardView({ onNavigate, onOpenAddEmployee }: HRDashboardViewProps) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHRData = async () => {
    try {
      setLoading(true);
      const [empRes, attRes, levRes, payRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/attendance'),
        fetch('/api/leaves'),
        fetch('/api/payroll'),
      ]);

      const [emps, atts, levs, pays] = await Promise.all([
        empRes.json(),
        attRes.json(),
        levRes.json(),
        payRes.json(),
      ]);

      if (Array.isArray(emps)) setEmployees(emps);
      if (Array.isArray(atts)) setAttendances(atts);
      if (Array.isArray(levs)) setLeaves(levs);
      if (Array.isArray(pays)) setPayrolls(pays);
    } catch (e) {
      console.error('HR Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  const handleApproveLeave = async (leaveId: string, status: 'approved' | 'rejected') => {
    try {
      await fetch(`/api/leaves`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leaveId, status }),
      });
      fetchHRData();
    } catch (e) {
      console.error('Error updating leave:', e);
    }
  };

  const presentCount = attendances.length;
  const attendanceRate =
    employees.length > 0
      ? Math.round((presentCount / employees.length) * 100)
      : 0;

  const pendingLeaves = leaves.filter((l) => l.status === 'pending');
  const totalPayrollCost = payrolls.reduce(
    (acc, curr) => acc + (curr.netSalary || curr.basicSalary || 0),
    0
  );

  // Group by department
  const deptCounts: Record<string, number> = {};
  employees.forEach((emp) => {
    const d = emp.department || 'General';
    deptCounts[d] = (deptCounts[d] || 0) + 1;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Quick HR Action Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900">
            HR &amp; Payroll Workspace
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Manage personnel, track daily timecards, and approve leave requests
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full">
          <button
            onClick={() => onOpenAddEmployee ? onOpenAddEmployee() : onNavigate('employees')}
            className="whitespace-nowrap shrink-0 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-semibold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm active:scale-95 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span>+ Add Employee</span>
          </button>
          <button
            onClick={() => onNavigate('attendance')}
            className="whitespace-nowrap shrink-0 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs active:scale-95 transition-all"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => onNavigate('payroll')}
            className="whitespace-nowrap shrink-0 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-95 transition-all"
          >
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span>Process Payroll</span>
          </button>
        </div>
      </div>

      {/* 2. 4 HR KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Present Today -> Redirects to Attendance */}
        <div
          onClick={() => onNavigate('attendance')}
          role="button"
          tabIndex={0}
          className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_25px_-4px_rgba(15,23,42,0.08)] hover:-translate-y-1 active:scale-[0.98] transition-all cursor-pointer select-none"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Present Today
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                {presentCount} / {employees.length}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                {attendanceRate}% attendance rate
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#E6F7F0] text-[#10B981] flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Pending Leaves -> Redirects to Leaves */}
        <div
          onClick={() => onNavigate('leave')}
          role="button"
          tabIndex={0}
          className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_25px_-4px_rgba(15,23,42,0.08)] hover:-translate-y-1 active:scale-[0.98] transition-all cursor-pointer select-none"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Pending Leaves
              </p>
              <h3 className="text-2xl font-extrabold text-amber-600 tracking-tight mt-1.5">
                {pendingLeaves.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Awaiting HR approval
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#FFF0ED] text-[#F97316] flex items-center justify-center flex-shrink-0">
              <Luggage className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Total Employees -> Redirects to Employees */}
        <div
          onClick={() => onNavigate('employees')}
          role="button"
          tabIndex={0}
          className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_25px_-4px_rgba(15,23,42,0.08)] hover:-translate-y-1 active:scale-[0.98] transition-all cursor-pointer select-none"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Total Headcount
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                {employees.length}
              </h3>
              <p className="text-[11px] text-indigo-600 font-semibold mt-1">
                Active organization staff
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#F0EEFF] text-[#635BFF] flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Monthly Payroll -> Redirects to Payroll */}
        <div
          onClick={() => onNavigate('payroll')}
          role="button"
          tabIndex={0}
          className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_25px_-4px_rgba(15,23,42,0.08)] hover:-translate-y-1 active:scale-[0.98] transition-all cursor-pointer select-none"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Est. Monthly Payroll
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                ₹{totalPayrollCost.toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Monthly disbursements
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#EEF2FF] text-[#3B82F6] flex items-center justify-center flex-shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Panels: Pending Leaves & Today's Attendance Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Approvals */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="text-base font-bold tracking-tight text-slate-900">
                Pending Leave Approvals
              </h4>
              <p className="text-xs text-slate-400">
                Requires HR Manager review &amp; signoff
              </p>
            </div>
            <button
              onClick={() => onNavigate('leave')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {pendingLeaves.length > 0 ? (
              pendingLeaves.map((l) => (
                <div
                  key={l._id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100/80 transition-colors"
                >
                  <div>
                    <h5 className="text-sm font-semibold text-slate-800">
                      {l.employee?.name || 'Staff Member'}
                    </h5>
                    <p className="text-xs text-slate-400">
                      {l.type} •{' '}
                      <span className="text-slate-600 font-medium">
                        {new Date(l.startDate).toLocaleDateString()} -{' '}
                        {new Date(l.endDate).toLocaleDateString()}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs truncate">
                      &quot;{l.reason}&quot;
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                    <button
                      onClick={() => handleApproveLeave(l._id, 'approved')}
                      className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      title="Approve Leave"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleApproveLeave(l._id, 'rejected')}
                      className="p-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                      title="Reject Leave"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No pending leave requests.
              </p>
            )}
          </div>
        </div>

        {/* Today's Attendance Log */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="text-base font-bold tracking-tight text-slate-900">
                Today&apos;s Attendance Check-Ins
              </h4>
              <p className="text-xs text-slate-400">
                Real-time punch records for {new Date().toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
            >
              <span>Manage Attendance</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {attendances.length > 0 ? (
              attendances.slice(0, 5).map((a) => {
                const isLate = a.isLate || a.evaluation?.isLate;
                const status = a.status || a.evaluation?.status || 'working';
                const effectiveMins = a.effectiveMinutes || a.evaluation?.effectiveWorkedMinutes || 0;
                const sessionsCount = a.sessions?.length || 1;

                return (
                  <div
                    key={a._id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100/80 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {(a.employee?.name || 'S').charAt(0)}
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-slate-800">
                          {a.employee?.name || 'Staff Member'}
                        </h5>
                        <p className="text-[11px] text-slate-400">
                          In: <span className="text-slate-600 font-medium">{formatTimeAmPm(a.checkIn)}</span>
                          <span className="mx-1.5">•</span>
                          <span className="font-mono text-slate-600">{sessionsCount} {sessionsCount === 1 ? 'session' : 'sessions'}</span>
                          {effectiveMins > 0 && <span className="ml-1 text-slate-500">({Math.floor(effectiveMins / 60)}h {effectiveMins % 60}m)</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {isLate ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Late
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          On Time
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                          status === 'full_day' || status === 'present'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : status === 'working'
                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}
                      >
                        {status === 'full_day' || status === 'present'
                          ? 'Present'
                          : status === 'half_day'
                          ? 'Half Day'
                          : status}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No attendance punches logged yet today.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Panel: Department Headcount Distribution */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)]">
        <h4 className="text-base font-bold tracking-tight text-slate-900 mb-4">
          Department Headcount Distribution
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Object.entries(deptCounts).map(([dept, count]) => (
            <div
              key={dept}
              className="p-4 rounded-xl bg-slate-50/60 border border-slate-100/80 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-700">{dept}</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{count} Staff</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-indigo-600">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
