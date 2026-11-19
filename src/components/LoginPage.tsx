'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface LoginPageProps {
  onSuccess?: () => void;
}

interface TenantInfo {
  companyName: string;
  slug: string;
  primaryColor?: string;
  logo?: string;
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tenant, setTenant] = useState<TenantInfo | null>(null);

  // Check if tenant context exists
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    if (slug) {
      fetch(`/api/tenant?slug=${slug}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.tenant) {
            setTenant(d.tenant);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both your email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await login(email.trim(), password.trim());
      if (res.success) {
        if (res.user?.email === 'admin@crm.com' || (res.user as any)?.platformRole === 'super_admin') {
          window.location.href = '/superadmin';
          return;
        }
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || 'Invalid credentials. Please verify your email & password.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-[#F4F3FA] via-[#FAF9FE] to-[#EFEBFD] flex items-center justify-center p-4 sm:p-6 select-none">
      {/* Decorative Floating Glass Background Orbs */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-72 h-40 bg-blue-100/40 rounded-full blur-2xl pointer-events-none -rotate-12" />

      {/* Main Centered Floating Card */}
      <div className="relative z-10 bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl text-white font-extrabold text-xl shadow-md mb-3.5"
            style={{ backgroundColor: tenant?.primaryColor || '#635BFF' }}
          >
            {tenant ? tenant.companyName.charAt(0) : 'P'}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {tenant ? (
              <span>{tenant.companyName}</span>
            ) : (
              <>
                Prism<span className="text-[#635BFF]">CRM</span>
              </>
            )}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {tenant ? `Sign in to ${tenant.companyName} Workspace` : 'Sign in to access your workspace'}
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-[#FFF0ED] border border-rose-100 flex items-start space-x-2.5 text-rose-600 text-xs font-medium animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email / Username Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/15 transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Primary Sign-In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-full bg-[#635BFF] hover:bg-[#5249E5] text-white text-xs font-semibold py-3 shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-50 min-h-[44px]"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Super Admin Quick Sign-In */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setEmail('admin@crm.com');
              setPassword('pass123');
              setError('');
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-700 text-xs font-semibold transition-all"
          >
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Super Admin (admin@crm.com)</span>
          </button>
        </div>

        {/* Register Company Link */}
        <div className="mt-4 text-center border-t border-slate-100 pt-3">
          <Link
            href="/register"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Create new company workspace →</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            Strict Role-Based Separation of Privileges • Multi-Tenant Enterprise Edition
          </p>
        </div>
      </div>
    </div>
  );
}
