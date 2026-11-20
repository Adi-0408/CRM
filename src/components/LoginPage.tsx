'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DEMO_CREDENTIALS } from '@/types/auth';

interface LoginPageProps {
  onSuccess?: () => void;
  companySlug?: string;
  initialBranding?: {
    brand_name?: string;
    logo_url?: string;
    primary_color?: string;
    currency_symbol?: string;
  };
}

export default function LoginPage({
  onSuccess,
  companySlug,
  initialBranding,
}: LoginPageProps) {
  const router = useRouter();
  const routeParams = useParams();
  const { login } = useAuth();

  const effectiveSlug =
    companySlug ||
    (typeof routeParams?.companySlug === 'string'
      ? routeParams.companySlug
      : Array.isArray(routeParams?.companySlug)
        ? routeParams.companySlug[0]
        : undefined);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dynamic Company Branding State
  const [tenantBrand, setTenantBrand] = useState<{
    brand_name: string;
    logo_url: string;
    primary_color: string;
    status?: string;
  }>({
    brand_name: initialBranding?.brand_name || 'PrismCRM',
    logo_url: initialBranding?.logo_url || '',
    primary_color: initialBranding?.primary_color || '#635BFF',
    status: 'active',
  });

  useEffect(() => {
    if (effectiveSlug) {
      const fetchPublicBranding = async () => {
        try {
          const res = await fetch(`/api/companies/public/${effectiveSlug}`);
          if (res.ok) {
            const data = await res.json();
            if (data.brand_name) {
              setTenantBrand({
                brand_name: data.brand_name,
                logo_url: data.logo_url || '',
                primary_color: data.primary_color || '#635BFF',
                status: data.status || 'active',
              });
              if (typeof document !== 'undefined') {
                document.title = `${data.brand_name} - Login`;
              }
            }
          }
        } catch (err) {
          console.error('Error fetching public branding:', err);
        }
      };
      fetchPublicBranding();
    }
  }, [effectiveSlug]);

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
      if (res.success && res.user) {
        router.push('/');
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

  // Show demo credentials for fast testing and working structure
  const showDemoGrid = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== 'false';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-[#F4F3FA] via-[#FAF9FE] to-[#EFEBFD] flex items-center justify-center p-4 sm:p-6 select-none">
      {/* Decorative Floating Glass Background Orbs */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-72 h-40 bg-blue-100/40 rounded-full blur-2xl pointer-events-none -rotate-12" />

      {/* Main Centered Floating Card */}
      <div className="relative z-10 bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
        {/* Back to Landing Page Link */}
        <div className="mb-4">
          <Link
            href="/landing"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#635BFF] transition-colors group p-1 -ml-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Website</span>
          </Link>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl text-white font-extrabold text-xl shadow-md mb-3.5 overflow-hidden"
            style={{ backgroundColor: tenantBrand.primary_color }}
          >
            {tenantBrand.logo_url ? (
              <img src={tenantBrand.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              tenantBrand.brand_name.charAt(0).toUpperCase()
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {tenantBrand.brand_name}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Sign in to access your organization workspace
          </p>
        </div>

        {/* Suspended Tenant Warning */}
        {tenantBrand.status === 'suspended' && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-2.5 text-amber-800 text-xs font-medium animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
            <div className="leading-relaxed">
              <span className="font-bold">Organization Suspended:</span> This company workspace has been paused by the platform administrator. Access is temporarily unavailable.
            </div>
          </div>
        )}

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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition-all"
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
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition-all"
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
            style={{ backgroundColor: tenantBrand.primary_color }}
            className="w-full mt-2 rounded-full text-white text-xs font-semibold py-3 shadow-sm hover:opacity-90 transition-all active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-50 min-h-[44px]"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* 1-Click Platform Access (Only Platform Super Admin) */}
        {showDemoGrid && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#635BFF]" />
                Platform Access (1-Click Fill)
              </span>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Super Admin
              </span>
            </div>
            <div>
              {DEMO_CREDENTIALS.map((cred) => {
                const isSelected = email.toLowerCase() === cred.email.toLowerCase();
                return (
                  <button
                    key={cred.role}
                    type="button"
                    onClick={() => {
                      setEmail(cred.email);
                      setPassword(cred.password);
                      setError('');
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-800'
                    }`}
                    title={`${cred.name} (${cred.email})`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        SA
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-slate-900 leading-tight">{cred.roleTitle}</div>
                        <div className="text-[10.5px] font-mono text-slate-400">{cred.email}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-purple-600 bg-purple-100/70 px-2.5 py-1 rounded-lg border border-purple-200/60">
                      1-Click Fill
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 text-center space-y-2">
          <p className="text-[11px] text-slate-400 font-medium">
            Strict Role-Based Multi-Tenant Separation • {tenantBrand.brand_name}
          </p>
          <div>
            <Link
              href="/landing"
              className="text-[11px] font-semibold text-slate-500 hover:text-[#635BFF] transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Return to Public Landing Page</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
