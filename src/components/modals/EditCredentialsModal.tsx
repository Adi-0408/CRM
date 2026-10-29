'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface EditCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
  onUpdated: () => void;
}

export default function EditCredentialsModal({
  isOpen,
  onClose,
  employee,
  onUpdated,
}: EditCredentialsModalProps) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin_manager';

  const [password, setPassword] = useState('');
  const [role, setRole] = useState('web_developer');
  const [department, setDepartment] = useState('Engineering');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (employee) {
      setPassword(employee.password || 'Emp#2026');
      setRole(employee.role || 'employee');
      setDepartment(employee.department || 'Engineering');
      setStatus(employee.status === 'suspended' ? 'suspended' : 'active');
      setMsg('');
      setError('');
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handleGeneratePassword = () => {
    const specials = ['#', '$', '@', '!'];
    const prefix = role === 'manager' ? 'Mgr' : role === 'hr_manager' ? 'HR' : 'Emp';
    const special = specials[Math.floor(Math.random() * specials.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newPass = `${prefix}${special}${randomNum}`;
    setPassword(newPass);
    setShowPassword(true);
  };

  const handleCopyCredentials = () => {
    const snippet = `CRM Login Details — Email: ${employee.email} | Password: ${password} | Role: ${role}`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setMsg('');

      const res = await fetch('/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: employee.name,
          email: employee.email,
          password: password.trim(),
          role,
          department,
          status,
          salary: employee.salary,
          phone: employee.phone,
          avatar: employee.avatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update credentials');
      }

      setMsg('Credentials and status updated successfully!');
      setTimeout(() => {
        onUpdated();
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err.message || 'Error updating credentials');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-[95vw] max-w-md p-5 sm:p-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F0EEFF] text-[#635BFF] flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Reset Password &amp; Manage Access
              </h3>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-[220px]">
                {employee.name} • {employee.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {msg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Employee Email (Read-Only) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Login Email
            </label>
            <input
              type="text"
              disabled
              value={employee.email}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono cursor-not-allowed"
            />
          </div>

          {/* Reset Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                New Password
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#635BFF] hover:text-[#5249EC] bg-[#F0EEFF] px-2 py-0.5 rounded-full"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generate</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/15 focus:border-[#635BFF] text-base sm:text-xs text-slate-900 bg-white font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              System Access Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/15 focus:border-[#635BFF] text-base sm:text-xs text-slate-800 bg-white"
            >
              {isAdmin && (
                <option value="admin_manager">Admin (Manager)</option>
              )}
              {isAdmin && (
                <option value="hr">HR</option>
              )}
              <option value="accounts">Accounts</option>
              <option value="sales">Sales</option>
              <option value="web_developer">Web Developer</option>
              <option value="android_developer">Android Developer</option>
              <option value="tech_support">Tech Support</option>
              <option value="intern">Intern (Training)</option>
            </select>
          </div>

          {/* Account Status Toggle: Active vs Suspended */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Account Status (Access Control)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all min-h-[44px] sm:min-h-0 ${
                  status === 'active'
                    ? 'bg-[#E6F7F0] border-emerald-300 text-emerald-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatus('suspended')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all min-h-[44px] sm:min-h-0 ${
                  status === 'suspended'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Suspended
              </button>
            </div>
            {status === 'suspended' && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                ⚠️ When suspended, this user will be blocked from logging into the CRM.
              </p>
            )}
          </div>

          {/* Quick Copy Snippet Button */}
          <button
            type="button"
            onClick={handleCopyCredentials}
            className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-700 flex items-center justify-center space-x-1.5 transition-colors min-h-[44px]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#635BFF]" />
                <span>Copy Current Login Details</span>
              </>
            )}
          </button>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[44px] rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 min-h-[44px] rounded-full text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm disabled:opacity-50 transition-all"
            >
              {saving ? 'Updating...' : 'Save Credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
