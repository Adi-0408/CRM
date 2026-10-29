'use client';

import React, { useState } from 'react';
import {
  Shield,
  Users,
  CreditCard,
  Target,
  Code2,
  Smartphone,
  Headphones,
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DEMO_CREDENTIALS, UserRole } from '@/types/auth';

interface LoginPageProps {
  onSuccess?: () => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<string>('admin@gmail.com');

  const handleFillDemo = (item: (typeof DEMO_CREDENTIALS)[0]) => {
    setEmail(item.email);
    setPassword(item.password);
    setSelectedEmail(item.email);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await login(email, password);
      if (res.success) {
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

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin_manager':
        return Shield;
      case 'hr':
        return Users;
      case 'accounts':
        return CreditCard;
      case 'sales':
        return Target;
      case 'web_developer':
        return Code2;
      case 'android_developer':
        return Smartphone;
      case 'tech_support':
        return Headphones;
      case 'intern':
        return GraduationCap;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F3FA] via-[#FAF9FE] to-[#EFEBFD] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Decorative Floating Glass Background Orbs */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-72 h-40 bg-blue-100/40 rounded-full blur-2xl pointer-events-none -rotate-12" />

      {/* Main Centered Floating Card */}
      <div className="relative z-10 bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8 max-w-xl w-full animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#635BFF] text-white font-extrabold text-xl shadow-md shadow-indigo-500/20 mb-3.5">
            P
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Prism<span className="text-[#635BFF]">CRM</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Sign in to access your role-isolated workspace
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
              Email / Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@crm.com"
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
              <span className="text-[10px] text-slate-400 font-medium">
                Default: pass123
              </span>
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

        {/* 8 Dedicated Roles & Quick Demo Login */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-[#635BFF]" />
              <span>Quick Demo Roles (Click to Auto-Fill &amp; Test)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">8 Strict Roles</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DEMO_CREDENTIALS.map((item) => {
              const IconComponent = getRoleIcon(item.role);
              const isSelected = selectedEmail === item.email || email === item.email;

              return (
                <div
                  key={item.role}
                  onClick={() => handleFillDemo(item)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer text-left relative group ${
                    isSelected
                      ? 'bg-purple-50/80 border-[#635BFF] ring-2 ring-[#635BFF]/30 shadow-xs'
                      : 'bg-slate-50/60 border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                  title={`Click to fill ${item.roleTitle} credentials`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div
                      className={`w-6 h-6 rounded-lg ${item.badgeBg} ${item.badgeText} flex items-center justify-center flex-shrink-0`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#635BFF]" />
                    )}
                  </div>

                  <p className="text-[11px] font-bold text-slate-900 leading-tight truncate">
                    {item.roleTitle}
                  </p>
                  <p className="text-[9px] text-slate-500 truncate mt-0.5 font-mono">
                    {item.email}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            Strict Role-Based Separation of Privileges • PrismCRM v2.0
          </p>
        </div>
      </div>
    </div>
  );
}
