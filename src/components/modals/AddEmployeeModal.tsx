'use client';

import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Upload,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmployeeAdded: () => void;
}

export default function AddEmployeeModal({
  isOpen,
  onClose,
  onEmployeeAdded,
}: AddEmployeeModalProps) {
  const { user: currentUser } = useAuth();
  const isAdminManager = currentUser?.role === 'admin_manager';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [role, setRole] = useState<string>('web_developer');
  const [department, setDepartment] = useState('Engineering');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [salary, setSalary] = useState('60000');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Post-Creation state
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
    status: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Auto-generate strong password like Emp#8492
  const handleGeneratePassword = () => {
    const specials = ['#', '$', '@', '!'];
    const prefix = role === 'manager' ? 'Mgr' : role === 'hr_manager' ? 'HR' : 'Emp';
    const special = specials[Math.floor(Math.random() * specials.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newPass = `${prefix}${special}${randomNum}`;
    setPassword(newPass);
    setShowPassword(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError('');
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64, folder: 'avatars' }),
        });
        const data = await res.json();
        if (data.secureUrl) {
          setAvatarUrl(data.secureUrl);
        } else {
          setError(data.error || 'Failed to upload image');
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('Error uploading photo');
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }

    const finalPassword = password.trim() || 'Emp#2026';

    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: finalPassword,
          role,
          department,
          status,
          salary: Number(salary) || 45000,
          baseSalary: Number(salary) || 45000,
          avatar: avatarUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add employee');
      }

      onEmployeeAdded();

      // Show the post-creation confirmation & copy card
      setCreatedCredentials({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: finalPassword,
        role,
        status,
      });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDetails = () => {
    if (!createdCredentials) return;
    const snippet = `CRM Login Details — Email: ${createdCredentials.email} | Password: ${createdCredentials.password} | Role: ${createdCredentials.role}`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetForNext = () => {
    setCreatedCredentials(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('employee');
    setStatus('active');
    setAvatarUrl('');
    setError('');
  };

  const handleCloseAll = () => {
    handleResetForNext();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-[95vw] max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-8 overflow-hidden relative max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F0EEFF] text-[#635BFF] flex items-center justify-center flex-shrink-0 shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Add Employee &amp; Issue Credentials
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Provision employee account and generate system login credentials
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseAll}
            className="p-1.5 min-h-[44px] min-w-[44px] rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post-Creation "Copy Credentials" Card */}
        {createdCredentials ? (
          <div className="mt-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="p-4 rounded-2xl bg-[#E6F7F0] border border-emerald-100 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900">
                  Account Created &amp; Credentials Issued!
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  The employee record is saved. You can now copy and send their login credentials.
                </p>
              </div>
            </div>

            {/* Issued Credentials Snippet Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Issued Login Credentials
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full capitalize">
                  {createdCredentials.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-800 font-mono bg-white p-3 rounded-xl border border-slate-200/60">
                <p>
                  <span className="text-slate-400 font-sans">Full Name:</span>{' '}
                  <span className="font-bold">{createdCredentials.name}</span>
                </p>
                <p>
                  <span className="text-slate-400 font-sans">Login Email:</span>{' '}
                  <span className="font-bold text-[#635BFF]">{createdCredentials.email}</span>
                </p>
                <p>
                  <span className="text-slate-400 font-sans">Password:</span>{' '}
                  <span className="font-bold text-slate-900">{createdCredentials.password}</span>
                </p>
                <p>
                  <span className="text-slate-400 font-sans">System Role:</span>{' '}
                  <span className="font-bold capitalize">{createdCredentials.role}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyDetails}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 active:scale-98"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#635BFF]" />
                    <span>Copy Login Details for Employee</span>
                  </>
                )}
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetForNext}
                className="px-4 py-2.5 min-h-[44px] rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                + Add Another Employee
              </button>
              <button
                type="button"
                onClick={handleCloseAll}
                className="px-6 py-2.5 min-h-[44px] rounded-full text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Main Creation Form */
          <>
            {error && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Profile Photo Uploader */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Profile Photo (Optional)
                </label>
                <div className="flex items-center space-x-3.5 p-3 rounded-2xl bg-slate-50/70 border border-slate-200/60">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs relative">
                    {uploading ? (
                      <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                    ) : avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 min-h-[36px] rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-semibold shadow-xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      JPG, PNG, or WebP format
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Name & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/15 focus:border-[#635BFF] text-base sm:text-xs text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Department &amp; Designation
                  </label>
                  <input
                    type="text"
                    value={department}
                    placeholder="e.g. Engineering, Sales, HR"
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/15 focus:border-[#635BFF] text-base sm:text-xs text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* System Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Assign System Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/15 focus:border-[#635BFF] text-base sm:text-xs text-slate-800 bg-white"
                  >
                    {isAdminManager && (
                      <option value="admin_manager">Admin (Manager)</option>
                    )}
                    <option value="hr">HR</option>
                    <option value="accounts">Accounts</option>
                    <option value="sales">Sales</option>
                    <option value="web_developer">Web Developer</option>
                    <option value="android_developer">Android Developer</option>
                    <option value="tech_support">Tech Support</option>
                    <option value="intern">Intern (Training)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Account Status Toggle *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus('active')}
                      className={`min-h-[44px] sm:min-h-0 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
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
                      className={`min-h-[44px] sm:min-h-0 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        status === 'suspended'
                          ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Suspended
                    </button>
                  </div>
                </div>
              </div>

              {/* Login Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Login Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/15 focus:border-[#635BFF] text-base sm:text-xs text-slate-900 bg-white"
                />
              </div>

              {/* Login Password with "Generate Strong Password" Pill */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Login Password *
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#635BFF] hover:text-[#5249EC] bg-[#F0EEFF] hover:bg-[#E6E2FF] px-2.5 py-1 rounded-full transition-colors active:scale-95"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Strong Password</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="e.g. Emp#8492"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/15 focus:border-[#635BFF] text-base sm:text-xs text-slate-900 bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  The employee will use this password to sign into their portal.
                </p>
              </div>

              {/* Salary field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Monthly Salary (₹)
                </label>
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/15 focus:border-[#635BFF] text-base sm:text-xs text-slate-900 bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseAll}
                  className="px-4 py-2.5 min-h-[44px] rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="px-6 py-2.5 min-h-[44px] rounded-full text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm hover:shadow-md hover:shadow-indigo-500/15 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 active:scale-98"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{loading ? 'Creating...' : 'Issue Credentials & Save'}</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
