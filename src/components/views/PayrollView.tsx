'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  IndianRupee,
  CheckCircle2,
  Clock,
  TrendingDown,
  Printer,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Edit2,
  Check,
  X,
  Sparkles,
  Building2,
  Calendar,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/apiClient';

interface PayrollRecord {
  _id?: string;
  employeeId: string;
  employee?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    avatar?: string;
    baseSalary?: number;
    salary?: number;
  };
  month: string;
  baseSalary: number;
  dailyRate: number;
  halfDayRate: number;
  approvedLeaves: number;
  unapprovedLeaves: number;
  halfDays: number;
  rawHalfDays?: number;
  rawUnapprovedLeaves?: number;
  unapprovedLeavesOverride?: number;
  halfDaysOverride?: number;
  unpaidLeaveDeduction: number;
  halfDayDeduction: number;
  totalDeductions: number;
  netSalary: number;
  status: 'Pending' | 'Paid';
  paidAt?: string | null;
}

interface PayrollViewProps {
  employees: any[];
  onRefresh?: () => void;
}

export default function PayrollView({ employees = [], onRefresh }: PayrollViewProps) {
  const { user: currentUser, role } = useAuth();
  const isAdminOrHR = role === 'admin_manager' || role === 'accounts';

  // Current month in YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [bulkPaying, setBulkPaying] = useState(false);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);

  // View toggle for Admin/HR to preview personal employee view
  const [viewMode, setViewMode] = useState<'admin' | 'employee'>(
    isAdminOrHR ? 'admin' : 'employee'
  );

  useEffect(() => {
    if (!isAdminOrHR) {
      setViewMode('employee');
    }
  }, [isAdminOrHR]);

  // Inline salary editing state
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editSalaryVal, setEditSalaryVal] = useState<number>(45000);

  // Payslip modal state
  const [payslipRecord, setPayslipRecord] = useState<PayrollRecord | null>(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);

  // Format month for display (e.g., "October 2026")
  const formattedMonth = useMemo(() => {
    const [year, m] = selectedMonth.split('-');
    const date = new Date(parseInt(year, 10), parseInt(m, 10) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    const [year, m] = selectedMonth.split('-');
    const prev = new Date(parseInt(year, 10), parseInt(m, 10) - 2, 1);
    setSelectedMonth(
      `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const handleNextMonth = () => {
    const [year, m] = selectedMonth.split('-');
    const next = new Date(parseInt(year, 10), parseInt(m, 10), 1);
    setSelectedMonth(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
    );
  };

  // 1. Fetch Payrolls from MongoDB (with graceful localStorage fallback)
  const fetchPayrolls = async (month: string) => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/payroll?month=${month}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setPayrolls(data);
        setIsOfflineFallback(false);
        // Cache to localStorage
        try {
          localStorage.setItem(`prismcrm_payroll_${month}`, JSON.stringify(data));
        } catch (_) {}
      }
    } catch (err) {
      console.warn('MongoDB payroll fetch failed, checking local cache:', err);
      setIsOfflineFallback(true);
      try {
        const cached = localStorage.getItem(`prismcrm_payroll_${month}`);
        if (cached) {
          setPayrolls(JSON.parse(cached));
        } else if (employees.length > 0) {
          // Generate fallback calculated rows from employees array
          const generated: PayrollRecord[] = employees.map((emp) => {
            const baseSalary = emp.baseSalary || emp.salary || 45000;
            const dailyRate = Math.round(baseSalary / 30);
            const halfDayRate = Math.round(dailyRate * 0.5);
            return {
              employeeId: emp._id,
              employee: emp,
              month,
              baseSalary,
              dailyRate,
              halfDayRate,
              approvedLeaves: 0,
              unapprovedLeaves: 0,
              halfDays: 0,
              unpaidLeaveDeduction: 0,
              halfDayDeduction: 0,
              totalDeductions: 0,
              netSalary: baseSalary,
              status: 'Pending',
              paidAt: null,
            };
          });
          setPayrolls(generated);
        }
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls(selectedMonth);
  }, [selectedMonth]);

  // Recalculate helper for local optimistic updates
  const computeRecalculation = (
    baseSalary: number,
    unapprovedLeaves: number,
    halfDays: number
  ) => {
    const dailyRate = baseSalary / 30;
    const halfDayRate = dailyRate * 0.5;
    const unpaidLeaveDeduction = Math.round(unapprovedLeaves * dailyRate);
    const halfDayDeduction = Math.round(halfDays * halfDayRate);
    const totalDeductions = unpaidLeaveDeduction + halfDayDeduction;
    const netSalary = Math.max(0, baseSalary - totalDeductions);

    return {
      dailyRate: Math.round(dailyRate),
      halfDayRate: Math.round(halfDayRate),
      unpaidLeaveDeduction,
      halfDayDeduction,
      totalDeductions,
      netSalary,
    };
  };

  // 2. Silent MongoDB Sync helper
  const syncToMongoDB = async (payload: {
    employeeId: string;
    month: string;
    baseSalary?: number;
    unapprovedLeavesOverride?: number;
    halfDaysOverride?: number;
    status?: string;
  }) => {
    try {
      setSyncingId(payload.employeeId);
      const res = await authFetch('/api/payroll/QuickUpdate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update payroll on server');
      const data = await res.json();
      if (data.data) {
        // Sync confirmed from MongoDB
        setPayrolls((prev) =>
          prev.map((p) =>
            (p.employeeId || p.employee?._id) === payload.employeeId
              ? { ...p, ...data.data }
              : p
          )
        );
      }
    } catch (err) {
      console.warn('Network sync error, persisting locally:', err);
    } finally {
      setSyncingId(null);
    }
  };

  // 3. Inline Base Salary Edit (Optimistic UI)
  const handleStartSalaryEdit = (p: PayrollRecord) => {
    if (!isAdminOrHR) return;
    const empId = p.employeeId || p.employee?._id || null;
    setEditingEmpId(empId);
    setEditSalaryVal(p.baseSalary || 45000);
  };

  const handleSaveSalary = async (empId: string, customVal?: number) => {
    const finalSalary = Math.max(0, customVal !== undefined ? customVal : editSalaryVal);
    setEditingEmpId(null);

    // Optimistic local state update
    setPayrolls((prev) =>
      prev.map((item) => {
        const id = item.employeeId || item.employee?._id;
        if (id === empId) {
          const recalcs = computeRecalculation(
            finalSalary,
            item.unapprovedLeaves,
            item.halfDays
          );
          return {
            ...item,
            baseSalary: finalSalary,
            ...recalcs,
          };
        }
        return item;
      })
    );

    // Background sync to MongoDB
    await syncToMongoDB({
      employeeId: empId,
      month: selectedMonth,
      baseSalary: finalSalary,
    });
  };

  // 4. Quick adjustment micro-buttons for Half Days and Unapproved Leaves
  const handleAdjustDeduction = async (
    empId: string,
    field: 'halfDays' | 'unapprovedLeaves',
    delta: number
  ) => {
    if (!isAdminOrHR) return;

    let updatedVal = 0;
    setPayrolls((prev) =>
      prev.map((item) => {
        const id = item.employeeId || item.employee?._id;
        if (id === empId) {
          const curVal = item[field] || 0;
          updatedVal = Math.max(0, curVal + delta);
          const newHalfDays = field === 'halfDays' ? updatedVal : item.halfDays;
          const newUnapproved =
            field === 'unapprovedLeaves' ? updatedVal : item.unapprovedLeaves;

          const recalcs = computeRecalculation(
            item.baseSalary,
            newUnapproved,
            newHalfDays
          );

          return {
            ...item,
            [field]: updatedVal,
            ...recalcs,
          };
        }
        return item;
      })
    );

    // Sync to MongoDB
    await syncToMongoDB({
      employeeId: empId,
      month: selectedMonth,
      ...(field === 'halfDays'
        ? { halfDaysOverride: updatedVal }
        : { unapprovedLeavesOverride: updatedVal }),
    });
  };

  // 5. 1-Click Pay Now for single employee
  const handlePayNow = async (empId: string) => {
    if (!isAdminOrHR) return;
    const nowIso = new Date().toISOString();

    // Optimistic UI update
    setPayrolls((prev) =>
      prev.map((p) => {
        const id = p.employeeId || p.employee?._id;
        if (id === empId) {
          return { ...p, status: 'Paid', paidAt: nowIso };
        }
        return p;
      })
    );

    await syncToMongoDB({
      employeeId: empId,
      month: selectedMonth,
      status: 'Paid',
    });
  };

  // 6. Complete All Payroll (1-Click Bulk Disbursal)
  const handlePayAll = async () => {
    if (!isAdminOrHR || bulkPaying) return;
    setBulkPaying(true);
    const nowIso = new Date().toISOString();

    // Optimistically mark all as Paid
    setPayrolls((prev) =>
      prev.map((p) => ({ ...p, status: 'Paid', paidAt: p.paidAt || nowIso }))
    );

    try {
      const res = await authFetch('/api/payroll/pay-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth }),
      });
      const data = await res.json();
      if (data.payrolls && Array.isArray(data.payrolls)) {
        setPayrolls(data.payrolls);
      }
    } catch (err) {
      console.error('Error during bulk disbursal:', err);
    } finally {
      setBulkPaying(false);
      if (onRefresh) onRefresh();
    }
  };

  // Top KPI Metrics calculated dynamically
  const kpiStats = useMemo(() => {
    const totalBase = payrolls.reduce((sum, p) => sum + (p.baseSalary || 0), 0);
    const totalDeductions = payrolls.reduce(
      (sum, p) => sum + (p.totalDeductions || 0),
      0
    );
    const totalNet = payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const paidCount = payrolls.filter((p) => p.status === 'Paid').length;
    const pendingCount = payrolls.length - paidCount;
    const progressPct =
      payrolls.length > 0 ? Math.round((paidCount / payrolls.length) * 100) : 0;

    return {
      totalBase,
      totalDeductions,
      totalNet,
      paidCount,
      pendingCount,
      progressPct,
      totalCount: payrolls.length,
    };
  }, [payrolls]);

  // Logged-in employee's specific record
  const currentEmployeeRecord = useMemo(() => {
    if (!currentUser) return null;
    const currentUserId = currentUser.id || (currentUser as any)._id;
    const found = payrolls.find((p) => {
      const emp = p.employee;
      return (
        (emp?.email && currentUser.email && emp.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (emp?.name && currentUser.name && emp.name.toLowerCase() === currentUser.name.toLowerCase()) ||
        (p.employeeId && currentUserId && String(p.employeeId) === String(currentUserId)) ||
        (emp?._id && currentUserId && String(emp._id) === String(currentUserId))
      );
    });
    if (found) return found;
    return isAdminOrHR ? payrolls[0] || null : null;
  }, [payrolls, currentUser, isAdminOrHR]);

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar with Month Selector, Role Switcher, and 1-Click Pay All */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#F0EEFF] text-[#635BFF] flex items-center justify-center font-bold text-lg shadow-xs flex-shrink-0">
            ₹
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Automated Payroll Engine
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                MongoDB Synced
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              1-Click dynamic calculation, leave deductions & instant disbursal
            </p>
          </div>
        </div>

        {/* Month Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Switcher Pill */}
          <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-xl p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-1.5 px-3">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800 select-none min-w-[110px] text-center">
                {formattedMonth}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Admin vs Employee Preview Toggle (Only for Admin/HR) */}
          {isAdminOrHR && (
            <div className="flex items-center bg-slate-100/80 rounded-xl p-1 border border-slate-200/60">
              <button
                onClick={() => setViewMode('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'admin'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Admin Table
              </button>
              <button
                onClick={() => setViewMode('employee')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'employee'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Payslip Preview
              </button>
            </div>
          )}

          {/* 1-Click Complete All Payroll Header Button */}
          {isAdminOrHR && viewMode === 'admin' && (
            <button
              onClick={handlePayAll}
              disabled={bulkPaying || kpiStats.pendingCount === 0}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm ${
                kpiStats.pendingCount === 0
                  ? 'bg-emerald-600/60 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-500/20'
              }`}
            >
              {bulkPaying ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>
                {kpiStats.pendingCount === 0
                  ? 'All Disbursed ✓'
                  : `Complete All Payroll (1-Click)`}
              </span>
            </button>
          )}

          {/* Refresh button */}
          <button
            onClick={() => fetchPayrolls(selectedMonth)}
            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
            title="Refresh Payroll"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Top KPI Metric Cards (Visible to Admin & HR in Admin Table view) */}
      {isAdminOrHR && viewMode === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Net Disbursable Salary */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Net Payroll
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                ₹
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
              ₹{kpiStats.totalNet.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
              <span>Base: ₹{kpiStats.totalBase.toLocaleString()}</span>
            </p>
          </div>

          {/* KPI 2: Total Base Salary */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Gross Base Salary
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                Base
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
              ₹{kpiStats.totalBase.toLocaleString()}
            </h3>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1">
              Standard 30-Day Pay Cycle
            </p>
          </div>

          {/* KPI 3: Deductions */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Deductions
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-rose-500 tracking-tight mt-2">
              -₹{kpiStats.totalDeductions.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Half-day + Unapproved leaves
            </p>
          </div>

          {/* KPI 4: Disbursal Progress */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Disbursal Progress
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                {kpiStats.progressPct}%
              </span>
            </div>
            <h3 className="text-2xl font-black text-emerald-600 tracking-tight mt-2">
              {kpiStats.paidCount} / {kpiStats.totalCount} Paid
            </h3>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${kpiStats.progressPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Views: Admin Management Table vs Employee Payslip View */}
      {viewMode === 'admin' ? (
        /* ADMIN & HR VIEW */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/40">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Staff Payroll Roster • {formattedMonth}
              </h3>
              <p className="text-xs text-slate-400">
                Click any Base Salary to edit inline • Click + / - to adjust deductions
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Approved Leaves = ₹0 Deducted
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Half Day = 50% Daily Rate
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">
                    Base Salary <span className="text-[10px] font-normal text-indigo-500">(1-Click Edit)</span>
                  </th>
                  <th className="py-3.5 px-4">Attendance & Leave Status</th>
                  <th className="py-3.5 px-4">Deductions</th>
                  <th className="py-3.5 px-4">Net Salary</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {payrolls.length > 0 ? (
                  payrolls.map((p) => {
                    const empId = p.employeeId || p.employee?._id || '';
                    const isEditingSalary = editingEmpId === empId;
                    const isRowSyncing = syncingId === empId;
                    const isPaid = p.status === 'Paid';

                    return (
                      <tr
                        key={empId || p._id}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        {/* 1. Employee Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-50 text-[#635BFF] flex items-center justify-center font-bold text-xs ring-1 ring-slate-100 flex-shrink-0">
                              {p.employee?.avatar ? (
                                <img
                                  src={p.employee.avatar}
                                  alt={p.employee.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (p.employee?.name || 'E').charAt(0)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">
                                {p.employee?.name || 'Staff Member'}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {p.employee?.role || 'Staff'} • {p.employee?.department || 'IT'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Editable Base Salary with 1-Click Pills */}
                        <td className="py-3 px-4">
                          {isEditingSalary ? (
                            <div className="flex flex-col space-y-1.5 animate-in fade-in duration-150">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-bold text-slate-400">₹</span>
                                <input
                                  type="number"
                                  autoFocus
                                  value={editSalaryVal}
                                  onChange={(e) =>
                                    setEditSalaryVal(Number(e.target.value))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveSalary(empId);
                                    if (e.key === 'Escape') setEditingEmpId(null);
                                  }}
                                  className="w-28 px-2 py-1 text-xs font-bold font-mono border border-indigo-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                                />
                                <button
                                  onClick={() => handleSaveSalary(empId)}
                                  className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition"
                                  title="Save Base Salary"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingEmpId(null)}
                                  className="p-1 rounded-md bg-slate-200 text-slate-600 hover:bg-slate-300 transition"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Quick increment preset pills */}
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() =>
                                    handleSaveSalary(empId, editSalaryVal + 5000)
                                  }
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                                >
                                  +₹5k
                                </button>
                                <button
                                  onClick={() =>
                                    handleSaveSalary(empId, editSalaryVal + 10000)
                                  }
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                                >
                                  +₹10k
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartSalaryEdit(p)}
                              className="group/sal flex items-center space-x-1.5 py-1 px-2 -ml-2 rounded-lg hover:bg-indigo-50/70 transition text-left"
                              title="Click to edit Base Salary"
                            >
                              <span className="font-mono font-bold text-slate-900 text-xs">
                                ₹{(p.baseSalary || 45000).toLocaleString()}
                              </span>
                              <Edit2 className="w-3 h-3 text-slate-300 group-hover/sal:text-indigo-600 transition" />
                            </button>
                          )}
                          <p className="text-[10px] text-slate-400 font-mono">
                            ₹{p.dailyRate}/day
                          </p>
                        </td>

                        {/* 3. Attendance & Leave Pills with Micro-adjusters (- / +) */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Approved Paid Leaves Pill */}
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                              title="Paid Leave: ₹0 deduction"
                            >
                              Approved: {p.approvedLeaves} (Paid)
                            </span>

                            {/* Half Days Pill with - / + micro-buttons */}
                            <div
                              className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                              title="Half Days: 50% daily deduction"
                            >
                              <span>Half Days: {p.halfDays}</span>
                              <button
                                onClick={() =>
                                  handleAdjustDeduction(empId, 'halfDays', -1)
                                }
                                disabled={p.halfDays <= 0}
                                className="w-3.5 h-3.5 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-900 flex items-center justify-center font-bold text-[9px] disabled:opacity-30 disabled:pointer-events-none transition"
                              >
                                -
                              </button>
                              <button
                                onClick={() =>
                                  handleAdjustDeduction(empId, 'halfDays', 1)
                                }
                                className="w-3.5 h-3.5 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-900 flex items-center justify-center font-bold text-[9px] transition"
                              >
                                +
                              </button>
                            </div>

                            {/* Unapproved Leaves Pill with - / + micro-buttons */}
                            <div
                              className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200"
                              title="Unapproved Leaves: 100% daily deduction"
                            >
                              <span>Unapproved: {p.unapprovedLeaves}</span>
                              <button
                                onClick={() =>
                                  handleAdjustDeduction(
                                    empId,
                                    'unapprovedLeaves',
                                    -1
                                  )
                                }
                                disabled={p.unapprovedLeaves <= 0}
                                className="w-3.5 h-3.5 rounded bg-rose-200/80 hover:bg-rose-300 text-rose-900 flex items-center justify-center font-bold text-[9px] disabled:opacity-30 disabled:pointer-events-none transition"
                              >
                                -
                              </button>
                              <button
                                onClick={() =>
                                  handleAdjustDeduction(
                                    empId,
                                    'unapprovedLeaves',
                                    1
                                  )
                                }
                                className="w-3.5 h-3.5 rounded bg-rose-200/80 hover:bg-rose-300 text-rose-900 flex items-center justify-center font-bold text-[9px] transition"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* 4. Deduction Breakdown */}
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs">
                            <span
                              className={`font-bold ${
                                p.totalDeductions > 0
                                  ? 'text-rose-500'
                                  : 'text-slate-400'
                              }`}
                            >
                              -₹{(p.totalDeductions || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {p.halfDayDeduction > 0 && `HD: -₹${p.halfDayDeduction}`}
                            {p.halfDayDeduction > 0 && p.unpaidLeaveDeduction > 0 && ' • '}
                            {p.unpaidLeaveDeduction > 0 &&
                              `Unpaid: -₹${p.unpaidLeaveDeduction}`}
                            {p.totalDeductions === 0 && '0 deductions'}
                          </div>
                        </td>

                        {/* 5. Net Salary */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-black text-slate-900 text-sm">
                            ₹{(p.netSalary || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* 6. Status Badge */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {isPaid ? 'Paid ✓' : 'Pending'}
                          </span>
                        </td>

                        {/* 7. Action: 1-Click Pay Now + Printable Payslip */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {!isPaid ? (
                              <button
                                onClick={() => handlePayNow(empId)}
                                disabled={isRowSyncing}
                                className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg shadow-xs transition"
                              >
                                {isRowSyncing ? 'Saving...' : 'Pay Now'}
                              </button>
                            ) : (
                              <span className="text-xs font-semibold text-emerald-600 inline-flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Paid</span>
                              </span>
                            )}

                            {/* Payslip Modal trigger */}
                            <button
                              onClick={() => {
                                setPayslipRecord(p);
                                setShowPayslipModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                              title="View & Print Payslip"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      {loading
                        ? 'Calculating and syncing payroll from MongoDB...'
                        : 'No employees found for this month.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* EMPLOYEE PERSONAL PAYSLIP VIEW */
        <div className="space-y-6">
          {currentEmployeeRecord ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)]">
              {/* Employee Top Profile & Disbursal Status */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 font-extrabold text-xl flex items-center justify-center overflow-hidden ring-2 ring-indigo-100">
                    {currentEmployeeRecord.employee?.avatar ? (
                      <img
                        src={currentEmployeeRecord.employee.avatar}
                        alt={currentEmployeeRecord.employee.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (currentEmployeeRecord.employee?.name || 'U').charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        {currentEmployeeRecord.employee?.name || 'Staff Employee'}
                      </h3>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                          currentEmployeeRecord.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {currentEmployeeRecord.status === 'Paid'
                          ? 'Salary Disbursed ✓'
                          : 'Payment Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {currentEmployeeRecord.employee?.role} •{' '}
                      {currentEmployeeRecord.employee?.department} • Pay Period:{' '}
                      <span className="font-bold text-slate-700">{formattedMonth}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setPayslipRecord(currentEmployeeRecord);
                    setShowPayslipModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm active:scale-95 self-start md:self-auto"
                >
                  <Printer className="w-4 h-4" />
                  <span>Download / Print Payslip</span>
                </button>
              </div>

              {/* Itemized Calculation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-6">
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Base Gross Salary
                  </p>
                  <h4 className="text-2xl font-black text-slate-900 mt-1 font-mono">
                    ₹{(currentEmployeeRecord.baseSalary || 45000).toLocaleString()}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Daily Rate: ₹{currentEmployeeRecord.dailyRate}/day
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
                  <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                    Total Deductions
                  </p>
                  <h4 className="text-2xl font-black text-rose-600 mt-1 font-mono">
                    -₹{(currentEmployeeRecord.totalDeductions || 0).toLocaleString()}
                  </h4>
                  <p className="text-[11px] text-rose-400 mt-1">
                    {currentEmployeeRecord.halfDays} half days +{' '}
                    {currentEmployeeRecord.unapprovedLeaves} unpaid days
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                    Net Take-Home Salary
                  </p>
                  <h4 className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                    ₹{(currentEmployeeRecord.netSalary || 0).toLocaleString()}
                  </h4>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    Direct Bank Transfer / UPI
                  </p>
                </div>
              </div>

              {/* Itemized Breakdown Table */}
              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-3.5 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-700">
                  Itemized Salary & Attendance Statement
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between p-3.5 hover:bg-slate-50/50">
                    <span className="text-slate-600 font-medium">
                      Basic Salary (30 Working Days Basis)
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{(currentEmployeeRecord.baseSalary || 45000).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between p-3.5 bg-emerald-50/30">
                    <div className="flex items-center space-x-2">
                      <span className="text-emerald-800 font-medium">
                        Approved Paid Leaves ({currentEmployeeRecord.approvedLeaves} Days)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                        Paid Leave
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700">₹0 Deducted</span>
                  </div>

                  <div className="flex justify-between p-3.5 hover:bg-slate-50/50">
                    <span className="text-slate-600">
                      Half-Day Deductions ({currentEmployeeRecord.halfDays} Half Days × ₹
                      {currentEmployeeRecord.halfDayRate})
                    </span>
                    <span className="font-mono font-semibold text-rose-500">
                      -₹{(currentEmployeeRecord.halfDayDeduction || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between p-3.5 hover:bg-slate-50/50">
                    <span className="text-slate-600">
                      Unapproved Leaves / LOP ({currentEmployeeRecord.unapprovedLeaves} Days × ₹
                      {currentEmployeeRecord.dailyRate})
                    </span>
                    <span className="font-mono font-semibold text-rose-500">
                      -₹{(currentEmployeeRecord.unpaidLeaveDeduction || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between p-4 bg-slate-50 font-bold text-sm">
                    <span className="text-slate-900">Net Disbursable Salary</span>
                    <span className="font-mono text-emerald-700 font-black text-base">
                      ₹{(currentEmployeeRecord.netSalary || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
              No personal payroll record found for {formattedMonth}.
            </div>
          )}
        </div>
      )}

      {/* 4. Printable Payslip Modal */}
      {showPayslipModal && payslipRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                  P
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Prism<span className="text-violet-600">CRM</span> • Official Payslip
                  </h3>
                  <p className="text-xs text-slate-400">
                    Unique Digital Services • Central HQ Sangli
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPayslipModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Payslip Body */}
            <div id="printable-payslip" className="py-6 space-y-6">
              {/* Pay Period & Status Bar */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Statement For
                  </span>
                  <p className="text-base font-extrabold text-slate-900">{formattedMonth}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Disbursal Status
                  </span>
                  <p
                    className={`text-sm font-black ${
                      payslipRecord.status === 'Paid'
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {payslipRecord.status === 'Paid' ? 'Paid ✓' : 'Pending Disbursal'}
                  </p>
                </div>
              </div>

              {/* Employee Summary Details */}
              <div className="grid grid-cols-2 gap-4 text-xs border border-slate-100 p-4 rounded-2xl">
                <div>
                  <span className="text-slate-400">Employee Name:</span>
                  <p className="font-bold text-slate-800 text-sm">
                    {payslipRecord.employee?.name || 'Staff Member'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Email Address:</span>
                  <p className="font-bold text-slate-800">
                    {payslipRecord.employee?.email || 'employee@uniquedigital.com'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Designation / Role:</span>
                  <p className="font-bold text-slate-800">
                    {payslipRecord.employee?.role || 'Developer'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Department / Office:</span>
                  <p className="font-bold text-slate-800">
                    {payslipRecord.employee?.department || 'Engineering'} • Sangli HQ
                  </p>
                </div>
              </div>

              {/* Earnings & Deductions Breakdown */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4 text-center">Days / Rate</th>
                      <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    <tr>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        Gross Base Salary
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-400">
                        30-Day Rate
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{(payslipRecord.baseSalary || 45000).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/40 text-emerald-800">
                      <td className="py-2.5 px-4">
                        Approved Paid Leaves (Paid in Full)
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {payslipRecord.approvedLeaves} Days
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                        ₹0
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-rose-600">
                        Half-Day Deductions (&lt; 8 Hours)
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-400">
                        {payslipRecord.halfDays} Days × ₹{payslipRecord.halfDayRate}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-rose-500">
                        -₹{(payslipRecord.halfDayDeduction || 0).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-rose-600">
                        Unapproved / Absent Leave Deductions
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-400">
                        {payslipRecord.unapprovedLeaves} Days × ₹
                        {payslipRecord.dailyRate}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-rose-500">
                        -₹{(payslipRecord.unpaidLeaveDeduction || 0).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold text-slate-900">
                      <td className="py-3 px-4 text-sm" colSpan={2}>
                        Total Net Payable Salary
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 text-base">
                        ₹{(payslipRecord.netSalary || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer Note */}
              <p className="text-[11px] text-slate-400 text-center">
                This is a computer-generated payslip generated automatically by PrismCRM for{' '}
                {payslipRecord.employee?.name || 'Employee'}.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowPayslipModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition shadow-sm active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Payslip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
