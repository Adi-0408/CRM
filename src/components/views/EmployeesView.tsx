'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Mail,
  Camera,
  Trash2,
  Loader2,
  KeyRound,
  LayoutGrid,
  List,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import EditCredentialsModal from '@/components/modals/EditCredentialsModal';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/apiClient';

interface EmployeesViewProps {
  employees: any[];
  onOpenAddEmployee: () => void;
  onRefresh: () => void;
}

export default function EmployeesView({
  employees,
  onOpenAddEmployee,
  onRefresh,
}: EmployeesViewProps) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin_manager';
  const isAdminOrHR = isAdmin || currentUser?.role === 'hr';

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedEmpForCredentials, setSelectedEmpForCredentials] = useState<any | null>(null);
  const [editingSalaryEmpId, setEditingSalaryEmpId] = useState<string | null>(null);
  const [editSalaryValue, setEditSalaryValue] = useState<number>(45000);

  const handleUpdateSalary = async (empId: string, newSalary: number) => {
    if (!isAdminOrHR) return;
    setEditingSalaryEmpId(null);
    try {
      await authFetch(`/api/employees/${empId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salary: newSalary, baseSalary: newSalary }),
      });
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await authFetch('/api/payroll/QuickUpdate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empId,
          month: currentMonth,
          baseSalary: newSalary,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error('Error updating employee salary:', err);
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!isAdmin) {
      alert('Only Super Admin can remove employee accounts.');
      return;
    }
    if (!confirm('Are you sure you want to remove this employee account?')) return;
    try {
      const res = await authFetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete employee');
        return;
      }
      onRefresh();
    } catch (err) {
      console.error('Error deleting employee:', err);
    }
  };

  const handleAvatarChange = async (
    employeeId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUpdatingId(employeeId);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const uploadRes = await authFetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64, folder: 'avatars' }),
        });
        const uploadData = await uploadRes.json();

        if (uploadData.secureUrl) {
          await authFetch(`/api/employees/${employeeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar: uploadData.secureUrl }),
          });
          onRefresh();
        }
        setUpdatingId(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error updating avatar:', err);
      setUpdatingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const r = (role || 'employee').toLowerCase();
    if (r.includes('admin')) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0EEFF] text-[#635BFF] border border-purple-200">
          Super Admin
        </span>
      );
    }
    if (r.includes('hr')) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          HR Manager
        </span>
      );
    }
    if (r.includes('manager')) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
          Project Manager
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        Staff Employee
      </span>
    );
  };

  const getStatusBadge = (status?: string) => {
    const isSuspended = String(status || 'active').toLowerCase() === 'suspended';
    if (isSuspended) {
      return (
        <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>Suspended</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Active</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Title, View Switcher & Add Button */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/80 p-4 sm:p-5 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.12),0_6px_16px_-3px_rgba(15,23,42,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold tracking-tight text-slate-900">
            Employee Credential &amp; Team Management ({employees.length})
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            {isAdminOrHR
              ? 'Issue login credentials, assign system roles, and manage access status'
              : 'Team directory and organizational contact information'}
          </p>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-between sm:justify-end">
          {/* Table / Card view toggle */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Add Employee button: strictly visible to Admin & HR */}
          {isAdminOrHR && (
            <button
              onClick={onOpenAddEmployee}
              className="whitespace-nowrap shrink-0 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-semibold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm hover:shadow-md hover:shadow-indigo-500/15 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>+ Add Employee &amp; Issue Credentials</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View: Credential Management Table (Table Mode) */}
      {viewMode === 'table' ? (
        <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.12),0_6px_16px_-3px_rgba(15,23,42,0.06)] overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Employee</th>
                  <th className="py-3.5 px-4">Login Email</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Base Salary</th>
                  <th className="py-3.5 px-4">Access Status</th>
                  {isAdminOrHR && (
                    <th className="py-3.5 px-5 text-right">Credential Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {employees.length > 0 ? (
                  employees.map((emp) => {
                    const isUpdating = updatingId === emp._id;
                    const canEditAvatar =
                      isAdminOrHR ||
                      emp._id === currentUser?.id ||
                      emp.email === currentUser?.email;

                    return (
                      <tr key={emp._id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Name & Avatar */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/80 overflow-hidden flex items-center justify-center flex-shrink-0">
                                {isUpdating ? (
                                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                                ) : (
                                  <img
                                    src={
                                      emp.avatar ||
                                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`
                                    }
                                    alt={emp.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              {canEditAvatar && (
                                <>
                                  <label
                                    htmlFor={`tbl-avatar-${emp._id}`}
                                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center cursor-pointer border border-white hover:bg-indigo-700 transition-transform active:scale-90"
                                    title="Change photo"
                                  >
                                    <Camera className="w-2.5 h-2.5" />
                                  </label>
                                  <input
                                    id={`tbl-avatar-${emp._id}`}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleAvatarChange(emp._id, e)}
                                    className="hidden"
                                  />
                                </>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-snug">{emp.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                ID: {String(emp._id).slice(-6)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Login Email */}
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {emp.email}
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {emp.department || 'General'}
                        </td>

                        {/* Assigned Role Badge */}
                        <td className="py-3.5 px-4">
                          {getRoleBadge(emp.role)}
                        </td>

                        {/* Base Salary (Editable only for Admin/HR) */}
                        <td className="py-3.5 px-4">
                          {isAdminOrHR ? (
                            editingSalaryEmpId === emp._id ? (
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-bold text-slate-400">₹</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  autoFocus
                                  value={editSalaryValue || ''}
                                  onChange={(e) => setEditSalaryValue(Number(e.target.value.replace(/\D/g, '')))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateSalary(emp._id, editSalaryValue);
                                    if (e.key === 'Escape') setEditingSalaryEmpId(null);
                                  }}
                                  className="w-24 px-2 py-1 text-xs font-bold font-mono border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <button
                                  onClick={() => handleUpdateSalary(emp._id, editSalaryValue)}
                                  className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                                  title="Save"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingSalaryEmpId(emp._id);
                                  setEditSalaryValue(emp.baseSalary || emp.salary || 45000);
                                }}
                                className="group/esal flex items-center space-x-1.5 py-1 px-2 -ml-2 rounded-lg hover:bg-indigo-50/70 transition text-left"
                                title="Click to edit Base Salary"
                              >
                                <span className="font-mono font-bold text-slate-900">
                                  ₹{(emp.baseSalary || emp.salary || 45000).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">/mo</span>
                              </button>
                            )
                          ) : (
                            <span className="font-mono font-bold text-slate-700">
                              ₹{(emp.baseSalary || emp.salary || 45000).toLocaleString()}
                              <span className="text-[10px] text-slate-400 font-mono">/mo</span>
                            </span>
                          )}
                        </td>

                        {/* Access Status */}
                        <td className="py-3.5 px-4">
                          {getStatusBadge(emp.status)}
                        </td>

                        {/* Actions: only rendered for Admin and HR */}
                        {isAdminOrHR && (
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => setSelectedEmpForCredentials(emp)}
                                className="px-3 py-1.5 min-h-[36px] rounded-full text-xs font-bold text-[#635BFF] bg-[#F0EEFF] hover:bg-[#E6E2FF] border border-indigo-100 shadow-xs transition-colors flex items-center space-x-1.5 active:scale-95"
                                title="Reset password or toggle active/suspended status"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                <span>Reset Password / View Credentials</span>
                              </button>

                              {isAdmin && (
                                <button
                                  onClick={() => deleteEmployee(emp._id)}
                                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Remove employee account"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isAdminOrHR ? 7 : 6} className="text-center py-12 text-slate-400">
                      No employees registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Alternative Card Grid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {employees.length > 0 ? (
            employees.map((emp) => {
              const isUpdating = updatingId === emp._id;
              const canEditAvatar =
                isAdminOrHR ||
                emp._id === currentUser?.id ||
                emp.email === currentUser?.email;

              return (
                <div
                  key={emp._id}
                  className="h-full bg-white/85 backdrop-blur-xl rounded-3xl border border-white/80 p-5 sm:p-6 shadow-[0_10px_28px_-4px_rgba(15,23,42,0.08)] hover:shadow-[0_20px_42px_-6px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between relative group"
                >
                  {/* Top Bar: Status Badge on Left, Delete Action on Right */}
                  <div className="flex items-center justify-between w-full h-7 mb-3">
                    <div>{getStatusBadge(emp.status)}</div>
                    {isAdmin && emp._id !== currentUser?.id && (
                      <button
                        onClick={() => deleteEmployee(emp._id)}
                        className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors opacity-70 group-hover:opacity-100"
                        title="Remove Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Avatar Container: Uniform Square Frame with Aspect-Square & Object-Cover */}
                  <div className="relative w-full aspect-square max-w-[220px] mx-auto rounded-2xl border-2 border-indigo-100/80 bg-slate-100 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                    {isUpdating ? (
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    ) : (
                      <img
                        src={
                          emp.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`
                        }
                        alt={emp.name}
                        className="w-full h-full object-cover object-center bg-white"
                      />
                    )}
                    {canEditAvatar && (
                      <>
                        <label
                          htmlFor={`crd-avatar-${emp._id}`}
                          className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-[#635BFF] text-white flex items-center justify-center shadow-md hover:bg-[#5249EC] cursor-pointer border-2 border-white transition-transform active:scale-90 z-10"
                          title="Upload photo"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </label>
                        <input
                          id={`crd-avatar-${emp._id}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAvatarChange(emp._id, e)}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>

                  {/* Member Name, Role Badge, Department */}
                  <div className="w-full text-center mt-4 space-y-1.5 flex-1 flex flex-col items-center justify-center">
                    <h4 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                      {emp.name}
                    </h4>
                    <div>{getRoleBadge(emp.role)}</div>
                    <p className="text-xs text-slate-400 font-medium">
                      {emp.department || 'General'}
                    </p>
                  </div>

                  {/* Bottom Actions & Details */}
                  <div className="w-full mt-4 pt-3.5 border-t border-slate-100/90 space-y-2.5 text-xs text-slate-600">
                    <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-500 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate font-mono font-medium">{emp.email}</span>
                    </div>

                    {/* Reset Password / View Credentials Button: visible only for Admin and HR */}
                    {isAdminOrHR && (
                      <button
                        onClick={() => setSelectedEmpForCredentials(emp)}
                        className="w-full py-2.5 min-h-[42px] px-3 rounded-xl text-xs font-bold text-[#635BFF] bg-[#F0EEFF] hover:bg-[#E6E2FF] border border-indigo-100 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center space-x-2 active:scale-98"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Reset Password / View Credentials</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700">No employees registered</h4>
              <p className="text-xs text-slate-400 mt-1">
                {isAdminOrHR
                  ? 'Click "+ Add Employee & Issue Credentials" above to create employee records.'
                  : 'No employees found in the directory.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit / Reset Credentials Modal */}
      {isAdminOrHR && (
        <EditCredentialsModal
          isOpen={!!selectedEmpForCredentials}
          onClose={() => setSelectedEmpForCredentials(null)}
          employee={selectedEmpForCredentials}
          onUpdated={onRefresh}
        />
      )}
    </div>
  );
}
