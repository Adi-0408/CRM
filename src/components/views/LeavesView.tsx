'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarOff,
  Plus,
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Ban,
  User,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { canApproveLeave, canCancelLeave, isRecordOwner, isUserAdminOrHR } from '@/lib/permissions';
import { authFetch } from '@/lib/apiClient';

interface LeavesViewProps {
  employees: any[];
  onRefresh: () => void;
}

export default function LeavesView({ employees, onRefresh }: LeavesViewProps) {
  const { user, role } = useAuth();
  const isAdminOrHR = isUserAdminOrHR(user);
  const isStaff = role !== 'admin_manager' && role !== 'hr';

  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [employee, setEmployee] = useState('');
  const [type, setType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Reject remarks modal state
  const [rejectModalLeaveId, setRejectModalLeaveId] = useState<string | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/leaves');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeaves(data);
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
    if (user?.id) {
      setEmployee(user.id);
    } else if (employees.length > 0 && !employee) {
      setEmployee(employees[0]._id);
    }
  }, [user, employees]);

  const updateLeaveStatus = async (
    id: string,
    status: 'approved' | 'rejected' | 'cancelled',
    remarks?: string
  ) => {
    try {
      setActionError(null);
      const res = await authFetch('/api/leaves', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, remarks }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update leave request');
      }

      setRejectModalLeaveId(null);
      setRejectRemarks('');
      fetchLeaves();
      onRefresh();
    } catch (err: any) {
      console.error('Error updating leave status:', err);
      setActionError(err.message || 'Operation failed');
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) return;

    // If role is staff, force own id
    const targetEmpId = isStaff ? user?.id : employee || user?.id;

    try {
      setSubmitting(true);
      setActionError(null);
      const res = await authFetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee: targetEmpId,
          type,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit leave request');
      }

      setShowModal(false);
      setReason('');
      setStartDate('');
      setEndDate('');
      fetchLeaves();
      onRefresh();
    } catch (err: any) {
      console.error('Error requesting leave:', err);
      setActionError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter leaves for display:
  // If user is staff, display ONLY their own records
  const displayedLeaves = useMemo(() => {
    if (isStaff) {
      return leaves.filter((l) => isRecordOwner(user, l));
    }
    return leaves;
  }, [leaves, isStaff, user]);

  return (
    <div className="space-y-6">
      {/* Action Error Banner */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-500 hover:text-rose-800 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold tracking-tight text-slate-900">
            {isStaff ? 'My Leave Requests & History' : 'Leave Management & Approvals'}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {isStaff
              ? 'Apply for leave, check real-time approval status, or cancel pending requests'
              : 'Review staff time-off requests, authorize paid leaves, or reject with feedback'}
          </p>
        </div>

        <button
          onClick={() => {
            setActionError(null);
            setShowModal(true);
          }}
          className="whitespace-nowrap shrink-0 px-4 py-2.5 text-xs sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-semibold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm hover:shadow-md hover:shadow-indigo-500/15 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>Apply Leave</span>
        </button>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {displayedLeaves.length > 0 ? (
                displayedLeaves.map((l) => {
                  const isSelf = isRecordOwner(user, l);
                  const canApprove = canApproveLeave(user, l);
                  const canCancel = canCancelLeave(user, l);
                  const isPending = l.status?.toLowerCase() === 'pending';
                  const isApproved = l.status?.toLowerCase() === 'approved';
                  const isRejected = l.status?.toLowerCase() === 'rejected';
                  const isCancelled = l.status?.toLowerCase() === 'cancelled';

                  return (
                    <tr key={l._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* 1. Employee Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0 ring-1 ring-slate-100">
                            {l.employee?.avatar ? (
                              <img
                                src={l.employee.avatar}
                                alt={l.employee.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (l.employee?.name || 'E').charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {l.employee?.name || 'Staff Member'}
                              {isSelf && (
                                <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {l.employee?.department || 'General'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Leave Type */}
                      <td className="py-3 px-4">
                        <span className="capitalize font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full text-[10px]">
                          {l.type} Leave
                        </span>
                      </td>

                      {/* 3. Duration */}
                      <td className="py-3 px-4 text-slate-600">
                        <div>
                          <span className="font-semibold text-slate-800">
                            {new Date(l.startDate).toLocaleDateString()}
                          </span>
                          <span className="text-slate-400 mx-1">→</span>
                          <span className="font-semibold text-slate-800">
                            {new Date(l.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {l.days || 1} {l.days === 1 ? 'day' : 'days'}
                        </span>
                      </td>

                      {/* 4. Reason */}
                      <td className="py-3 px-4 text-slate-700 max-w-xs">
                        <p className="truncate" title={l.reason}>
                          {l.reason}
                        </p>
                        {l.remarks && (
                          <p className="text-[10px] text-amber-600 italic mt-0.5 truncate" title={l.remarks}>
                            Remarks: {l.remarks}
                          </p>
                        )}
                      </td>

                      {/* 5. Status Badge */}
                      <td className="py-3 px-4">
                        {isPending && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                            <span>
                              {isStaff || isSelf
                                ? 'Waiting for HR Approval'
                                : 'Pending'}
                            </span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Approved by HR</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Rejected</span>
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            <Ban className="w-3 h-3 text-slate-400" />
                            <span>Cancelled</span>
                          </span>
                        )}
                      </td>

                      {/* 6. STRICT ACTION COLUMN ENFORCEMENT */}
                      <td className="py-3 px-4 text-right">
                        {/* CASE A: Authorized Admin/HR reviewing an employee's pending leave */}
                        {canApprove && isPending && (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => updateLeaveStatus(l._id, 'approved')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs flex items-center space-x-1 shadow-2xs transition active:scale-95"
                              title="Approve Leave"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectModalLeaveId(l._id);
                                setRejectRemarks('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs flex items-center space-x-1 shadow-2xs transition active:scale-95"
                              title="Reject Leave"
                            >
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}

                        {/* CASE B: Self leave by HR (Self-approval locked) */}
                        {role === 'hr' && isSelf && isPending && (
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                              Admin Approval Required
                            </span>
                            {canCancel && (
                              <button
                                onClick={() => updateLeaveStatus(l._id, 'cancelled')}
                                className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Cancel my request"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        )}

                        {/* CASE C: Staff's own pending request (Cancel button only) */}
                        {isStaff && isPending && canCancel && (
                          <button
                            onClick={() => updateLeaveStatus(l._id, 'cancelled')}
                            className="px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition active:scale-95"
                            title="Cancel this leave request"
                          >
                            Cancel Request
                          </button>
                        )}

                        {/* CASE D: Already processed leave */}
                        {!isPending && (
                          <span className="text-[11px] font-medium text-slate-400 capitalize">
                            {isApproved
                              ? 'Processed ✓'
                              : isRejected
                              ? 'Declined'
                              : 'Closed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    {loading
                      ? 'Loading leave records...'
                      : isStaff
                      ? 'You have not submitted any leave requests yet.'
                      : 'No leave requests on file.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {isStaff ? 'Apply for Personal Leave' : 'Submit Leave Request'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequest} className="space-y-4 mt-4">
              {/* Employee Selection: Hidden or locked for employees */}
              {isAdminOrHR ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employee
                  </label>
                  <select
                    value={employee}
                    onChange={(e) => setEmployee(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {employees.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.name} ({e.role})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center space-x-2.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  <div className="text-xs">
                    <span className="text-slate-400">Applicant: </span>
                    <span className="font-bold text-slate-800">{user?.name}</span>
                    <span className="text-slate-400 ml-1">({user?.email})</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Leave Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="casual">Casual Leave (Paid if approved)</option>
                  <option value="sick">Sick Leave (Paid if approved)</option>
                  <option value="annual">Annual Vacation (Paid if approved)</option>
                  <option value="unpaid">Unpaid Leave / LOP</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Time-off *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Medical reason, family event, personal emergency, etc."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs transition"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject with Remarks Modal */}
      {rejectModalLeaveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              Reject Leave Request
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Optional feedback or reason for rejecting this leave request:
            </p>
            <textarea
              rows={3}
              placeholder="e.g., Critical release deadline that week, kindly reschedule."
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="button"
                onClick={() => setRejectModalLeaveId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() =>
                  updateLeaveStatus(rejectModalLeaveId, 'rejected', rejectRemarks)
                }
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
