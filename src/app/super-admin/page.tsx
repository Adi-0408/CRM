'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  Users,
  CheckCircle2,
  Ban,
  Search,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  MoreVertical,
  KeyRound,
  Trash2,
  Edit,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  ChevronRight,
  LogOut,
  SlidersHorizontal,
  Layers,
  MapPin,
  Phone,
} from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';

interface CompanyItem {
  id: string;
  _id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended';
  brand_name: string;
  currency_code: string;
  currency_symbol: string;
  timezone: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  userCount?: number;
  branchCount?: number;
  admin?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    must_change_password?: boolean;
  } | null;
}

interface StatsSummary {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  totalPlatformUsers: number;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();

  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [stats, setStats] = useState<StatsSummary>({
    totalCompanies: 0,
    activeCompanies: 0,
    suspendedCompanies: 0,
    totalPlatformUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<'form' | 'credentials'>('form');
  const [provisionedData, setProvisionedData] = useState<any>(null);
  const [showPass, setShowPass] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    slug: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    phone: '',
    address: '',
    currency_code: 'INR',
    currency_symbol: '₹',
    timezone: 'Asia/Kolkata',
  });
  const [autoGenPassword, setAutoGenPassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Password Reset Modal
  const [resetModalData, setResetModalData] = useState<{
    company: CompanyItem;
    newPassword?: string;
    adminEmail?: string;
    adminName?: string;
  } | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Edit Modal
  const [editCompany, setEditCompany] = useState<CompanyItem | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<CompanyItem | null>(null);
  const [deleteConfirmationSlug, setDeleteConfirmationSlug] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Actions Dropdown Menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const isSuperAdmin = user?.role === 'platform_super_admin';

  const fetchCompanies = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/super-admin/companies', {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || '',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!isSuperAdmin) {
        // Redirect non-superadmin to normal CRM workspace
        router.push('/dashboard');
      } else {
        fetchCompanies();
      }
    }
  }, [isAuthenticated, authLoading, isSuperAdmin]);

  // Auto-slug generator when company name changes
  const handleNameChange = (val: string) => {
    const slugified = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/^-+|-+$/g, '');
    setForm((prev) => ({
      ...prev,
      name: val,
      slug: slugified,
    }));
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim() || !form.adminEmail.trim()) {
      setFormError('Company Name and Admin Email are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/super-admin/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Failed to provision company.');
        return;
      }

      setProvisionedData(data);
      setCreateStep('credentials');
      fetchCompanies();
    } catch (err: any) {
      setFormError(err.message || 'Network error during provisioning.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (comp: CompanyItem) => {
    const compDisplayName = comp.name || comp.brand_name || (comp as any).companyName || comp.slug || 'this company';
    const nextStatus = comp.status === 'active' ? 'suspended' : 'active';
    const confirmMsg =
      nextStatus === 'suspended'
        ? `Are you sure you want to SUSPEND '${compDisplayName}'? All users in this company will be blocked from logging in.`
        : `Reactivate '${compDisplayName}'? Users will immediately regain access.`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/super-admin/companies/${comp.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === comp.id ? { ...c, status: nextStatus } : c))
        );
        fetchCompanies();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleResetPassword = async (comp: CompanyItem) => {
    try {
      setResettingPassword(true);
      const res = await fetch(`/api/super-admin/companies/${comp.id}/reset-admin-password`, {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || '',
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || '',
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResetModalData({
          company: comp,
          newPassword: data.newPassword,
          adminEmail: data.adminEmail,
          adminName: data.adminName,
        });
      } else {
        alert(data.error || 'Failed to reset admin password');
      }
    } catch (err: any) {
      alert(err.message || 'Error resetting password');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!deleteTarget) return;
    if (deleteConfirmationSlug.trim().toLowerCase() !== deleteTarget.slug.toLowerCase()) {
      alert(`Slug mismatch. Please type '${deleteTarget.slug}' exactly to confirm.`);
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(`/api/super-admin/companies/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || '',
        },
      });

      if (res.ok) {
        setDeleteTarget(null);
        setDeleteConfirmationSlug('');
        fetchCompanies();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete company');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting company');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompany) return;

    try {
      setSavingEdit(true);
      const res = await fetch(`/api/super-admin/companies/${editCompany.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        setEditCompany(null);
        fetchCompanies();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update company');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating company');
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.admin?.email?.toLowerCase().includes(q) ||
        c.admin?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (authLoading || (loading && !refreshing && companies.length === 0)) {
    return <LoadingScreen message="Loading Multi-Tenant Control Console..." />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-800 antialiased flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#635BFF] to-[#8C85FF] text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-500/20">
            P
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-base tracking-tight">PrismCRM</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 uppercase tracking-wider">
                Platform Super Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Multi-Tenant Management Console</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <span>Switch to CRM App</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <div className="h-6 w-[1px] bg-slate-200 hidden sm:block" />

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-xs font-bold text-purple-800">
              SA
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">Super Admin</div>
              <div className="text-[10px] text-slate-400 leading-tight">superadmin@crm.com</div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        {/* Hero Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Company Tenant Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Provision new client organizations, manage administrative credentials, and govern multi-tenant status.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={fetchCompanies}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-xs disabled:opacity-50"
              title="Refresh Tenants"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#635BFF]' : ''}`} />
            </button>

            <button
              onClick={() => {
                setForm({
                  name: '',
                  slug: '',
                  adminName: '',
                  adminEmail: '',
                  adminPassword: '',
                  phone: '',
                  address: '',
                  currency_code: 'INR',
                  currency_symbol: '₹',
                  timezone: 'Asia/Kolkata',
                });
                setCreateStep('form');
                setShowCreateModal(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5249E5] text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Company & Admin</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Companies
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {stats.totalCompanies}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-[#635BFF] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Active Organizations
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                {stats.activeCompanies}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Suspended Tenants
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
                {stats.suspendedCompanies}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <Ban className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Platform Users
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {stats.totalPlatformUsers}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company name, slug, or admin email..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/15 transition-all"
            />
          </div>

          <div className="flex items-center space-x-1.5 self-start sm:self-center overflow-x-auto">
            {(['all', 'active', 'suspended'] as const).map((st) => {
              const isSelected = statusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {st} {st === 'all' ? `(${companies.length})` : st === 'active' ? `(${stats.activeCompanies})` : `(${stats.suspendedCompanies})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Companies Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Company & Slug</th>
                  <th className="px-5 py-3.5">Company Admin</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Scale</th>
                  <th className="px-5 py-3.5">Currency / Timezone</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                      <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600 text-sm">No Companies Found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {search ? 'Try clearing your search query' : 'Click "Create Company & Admin" to provision your first tenant'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((comp) => {
                    const isActive = comp.status === 'active';
                    return (
                      <tr key={comp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-100 to-indigo-50 border border-slate-200 flex items-center justify-center font-bold text-indigo-700 text-sm">
                              {(comp.name || comp.brand_name || (comp as any).companyName || comp.slug || 'CO').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm leading-tight flex items-center space-x-1.5">
                                <span>{comp.name || comp.brand_name || (comp as any).companyName || 'Unnamed Company'}</span>
                                {comp.id === 'company_unique_digital' && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-[#635BFF] border border-indigo-100">
                                    DEFAULT TENANT
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                slug: <span className="text-slate-600 font-semibold">{comp.slug}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {comp.admin ? (
                            <div>
                              <div className="font-semibold text-slate-800">{comp.admin.name}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{comp.admin.email}</div>
                              {comp.admin.must_change_password && (
                                <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  Temp Password Active
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No admin assigned</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleToggleStatus(comp)}
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                            title="Click to toggle status"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="capitalize">{comp.status}</span>
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center space-x-3 text-slate-600">
                            <span title="Employees in company">
                              <span className="font-bold text-slate-900">{comp.userCount ?? 0}</span> staff
                            </span>
                            <span className="text-slate-300">•</span>
                            <span title="Branch offices">
                              <span className="font-bold text-slate-900">{comp.branchCount ?? 0}</span> branch
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-slate-700 font-semibold">
                            {comp.currency_code} ({comp.currency_symbol})
                          </div>
                          <div className="text-[11px] text-slate-400">{comp.timezone}</div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleResetPassword(comp)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-colors flex items-center space-x-1 shadow-xs"
                              title="Reset Company Admin Temporary Password"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="hidden sm:inline">Reset Pass</span>
                            </button>

                            <button
                              onClick={() => {
                                setEditCompany(comp);
                                setEditForm({
                                  name: comp.name || comp.brand_name || (comp as any).companyName || '',
                                  brand_name: comp.brand_name || comp.name || (comp as any).companyName || '',
                                  phone: comp.phone || '',
                                  address: comp.address || '',
                                  currency_code: comp.currency_code,
                                  currency_symbol: comp.currency_symbol,
                                  timezone: comp.timezone,
                                });
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                              title="Edit Details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {comp.id !== 'company_unique_digital' && (
                              <button
                                onClick={() => {
                                  setDeleteTarget(comp);
                                  setDeleteConfirmationSlug('');
                                }}
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                                title="Delete Tenant Organization"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL 1: Create Company & Admin */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-lg w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
            {createStep === 'form' ? (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-[#635BFF] mb-3">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Provision Company & Admin</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Creates an isolated tenant organization, central branch, and initial Company Admin account.
                  </p>
                </div>

                {formError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-xs text-rose-600 font-medium">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  {/* Company Name & Slug */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Acme Technologies"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#635BFF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Tenant Slug (Unique) *</label>
                      <input
                        type="text"
                        required
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        placeholder="acme-technologies"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#635BFF]"
                      />
                    </div>
                  </div>

                  {/* Admin Details */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Company Admin Credentials
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Full Name</label>
                        <input
                          type="text"
                          value={form.adminName}
                          onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                          placeholder="e.g. John Doe"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#635BFF]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email *</label>
                        <input
                          type="email"
                          required
                          value={form.adminEmail}
                          onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                          placeholder="admin@acme.com"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#635BFF]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">Temporary Password</label>
                      <button
                        type="button"
                        onClick={() => setAutoGenPassword(!autoGenPassword)}
                        className="text-[11px] font-semibold text-[#635BFF] hover:underline"
                      >
                        {autoGenPassword ? 'Custom Password' : 'Auto-Generate Password'}
                      </button>
                    </div>

                    {autoGenPassword ? (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-mono flex items-center justify-between">
                        <span>A secure temporary password will be generated automatically.</span>
                        <Sparkles className="w-4 h-4 text-[#635BFF]" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={form.adminPassword}
                        onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                        placeholder="Enter custom temporary password"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#635BFF]"
                      />
                    )}
                  </div>

                  {/* Localization & Contact */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Code</label>
                      <input
                        type="text"
                        value={form.currency_code}
                        onChange={(e) => setForm({ ...form, currency_code: e.target.value.toUpperCase() })}
                        placeholder="INR"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#635BFF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Timezone</label>
                      <input
                        type="text"
                        value={form.timezone}
                        onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                        placeholder="Asia/Kolkata"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#635BFF]"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5249E5] text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50"
                    >
                      {submitting ? 'Provisioning...' : 'Provision Company'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Step 2: One-Click Copy Credentials Card */
              <div className="space-y-5">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-2.5">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Company Provisioned!</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Share these initial login credentials with the company administrator.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-400 font-sans text-xs">Organization:</span>
                    <span className="font-bold text-slate-800">{provisionedData?.company?.name}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-400 font-sans text-xs">Login URL:</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-indigo-600">
                        {typeof window !== 'undefined' ? `${window.location.origin}/login/${provisionedData?.company?.slug || ''}` : `/login/${provisionedData?.company?.slug || ''}`}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `${window.location.origin}/login/${provisionedData?.company?.slug || ''}`,
                            'login_url'
                          )
                        }
                        className="p-1 text-slate-400 hover:text-indigo-600"
                      >
                        {copiedKey === 'login_url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-400 font-sans text-xs">Admin Email:</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-800">{provisionedData?.admin?.email}</span>
                      <button
                        onClick={() => copyToClipboard(provisionedData?.admin?.email, 'admin_email')}
                        className="p-1 text-slate-400 hover:text-indigo-600"
                      >
                        {copiedKey === 'admin_email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans text-xs">Temporary Password:</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {showPass ? provisionedData?.admin?.password : '••••••••••••'}
                      </span>
                      <button
                        onClick={() => setShowPass(!showPass)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(provisionedData?.admin?.password, 'admin_pass')}
                        className="p-1 text-slate-400 hover:text-indigo-600"
                      >
                        {copiedKey === 'admin_pass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => {
                      const loginUrl = `${window.location.origin}/login/${provisionedData?.company?.slug || ''}`;
                      const summary = `Workspace Login Credentials\nCompany: ${provisionedData?.company?.name}\nBranded Login URL: ${loginUrl}\nEmail: ${provisionedData?.admin?.email}\nTemporary Password: ${provisionedData?.admin?.password}\n\nNote: You will be prompted to set a new password on your first login.`;
                      copyToClipboard(summary, 'all_summary');
                    }}
                    className="w-full py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-[#635BFF] text-xs font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    {copiedKey === 'all_summary' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey === 'all_summary' ? 'Copied Full Summary!' : 'Copy Full Summary to Clipboard'}</span>
                  </button>

                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Reset Admin Password Result */}
      {resetModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mb-2.5">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Password Reset Generated</h2>
              <p className="text-xs text-slate-500 mt-1">
                A new temporary password has been set for {resetModalData.adminName || 'Company Admin'}.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-400 font-sans text-xs">Admin Email:</span>
                <span className="font-bold text-slate-800">{resetModalData.adminEmail}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans text-xs">New Temporary Password:</span>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 text-sm">
                    {resetModalData.newPassword}
                  </span>
                  <button
                    onClick={() => copyToClipboard(resetModalData.newPassword || '', 'reset_pass')}
                    className="p-1.5 text-slate-400 hover:text-indigo-600"
                  >
                    {copiedKey === 'reset_pass' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setResetModalData(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Company Metadata */}
      {editCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Edit Company Details</h2>
            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={editForm.brand_name}
                  onChange={(e) => setEditForm({ ...editForm, brand_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Code</label>
                  <input
                    type="text"
                    value={editForm.currency_code}
                    onChange={(e) => setEditForm({ ...editForm, currency_code: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={editForm.currency_symbol}
                    onChange={(e) => setEditForm({ ...editForm, currency_symbol: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">HQ Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setEditCompany(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5249E5] text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Company Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900">Delete Tenant Organization</h2>
              <p className="text-xs text-slate-500 mt-1">
                This action is <span className="font-bold text-rose-600">irreversible</span>. It will permanently remove <b>{deleteTarget.name}</b> and all associated users, tasks, attendance, payroll, and project records.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
              Please type <span className="font-mono font-bold text-rose-600 select-all">{deleteTarget.slug}</span> below to confirm:
            </div>

            <input
              type="text"
              value={deleteConfirmationSlug}
              onChange={(e) => setDeleteConfirmationSlug(e.target.value)}
              placeholder={deleteTarget.slug}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-rose-500"
            />

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting || deleteConfirmationSlug.trim().toLowerCase() !== deleteTarget.slug.toLowerCase()}
                onClick={handleDeleteCompany}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
