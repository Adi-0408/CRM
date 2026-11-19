'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, CreditCard, FileText, Settings,
  Users, LogOut, Shield, ChevronRight, Bell, Menu, X, RefreshCw
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/superadmin/companies', label: 'Companies', icon: Building2 },
  { href: '/superadmin/plans', label: 'Plans', icon: CreditCard },
  { href: '/superadmin/audit-logs', label: 'Audit Logs', icon: FileText },
];

const SUPER_ADMIN_EMAILS = [
  (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'admin@crm.com').toLowerCase(),
  'admin@gmail.com',
];

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSuperAdmin = Boolean(
    user && (
      SUPER_ADMIN_EMAILS.includes(user.email?.toLowerCase()) ||
      (user as any)?.platformRole === 'super_admin'
    )
  );

  useEffect(() => {
    // Crucial: Wait for initial session restore before deciding to redirect!
    if (loading) return;

    if (!user) {
      router.replace('/login');
    } else if (!isSuperAdmin) {
      router.replace('/');
    }
  }, [loading, user, isSuperAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 text-indigo-400 animate-spin" />
          <p className="text-sm font-medium text-slate-300">Loading Super Admin Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-indigo-400" />
          <p className="text-lg font-semibold">Access Restricted</p>
          <p className="text-slate-400 text-sm mt-1">Super Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">PrismCRM</p>
              <p className="text-xs text-slate-400">Super Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <button
                key={item.href}
                onClick={() => { router.push(item.href); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* User info & logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
              {user.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 lg:px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-semibold text-indigo-700">Super Admin Mode</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
