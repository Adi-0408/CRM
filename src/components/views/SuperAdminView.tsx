'use client';

import React, { useState, useEffect } from 'react';
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
  SlidersHorizontal,
  Layers,
  MapPin,
  Phone,
  ArrowUpRight,
} from 'lucide-react';

export interface CompanyItem {
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

interface SuperAdminViewProps {
  onEnterWorkspace?: (company: CompanyItem) => void;
}

export default function SuperAdminView({ onEnterWorkspace }: SuperAdminViewProps) {
  const { user } = useAuth();

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
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Password Reset Modal
  const [resetTarget, setResetTarget] = useState<CompanyItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);

  // Edit Company Modal
  const [editTarget, setEditTarget] = useState<CompanyItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    brand_name: '',
    status: 'active' as 'active' | 'suspended',
    currency_code: 'INR',
    currency_symbol: '₹',
    timezone: 'Asia/Kolkata',
    phone: '',
    address: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<CompanyItem | null>(null);
  const [deleteConfirmationSlug, setDeleteConfirmationSlug] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Wipe All Data Modal
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [wipeConfirmation, setWipeConfirmation] = useState('');
  const [wipingData, setWipingData] = useState(false);

  // Actions Dropdown Menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

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
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleNameChange = (val: string) => {
    setForm((prev) => {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      return { ...prev, name: val, slug: autoSlug };
    });
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);

    try {
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
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create company');
      }

      setProvisionedData(data);
      setCreateStep('credentials');
      fetchCompanies();
    } catch (err: any) {
      setCreateError(err.message || 'Error provisioning company');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggleStatus = async (comp: CompanyItem) => {
    const nextStatus = comp.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/super-admin/companies/${comp.id || comp._id}`, {
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
          prev.map((c) => ((c.id || c._id) === (comp.id || comp._id) ? { ...c, status: nextStatus } : c))
        );
      }
    } catch (err) {
      console.error('Error toggling company status:', err);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    try {
      setResetting(true);
      const res = await fetch(
        `/api/super-admin/companies/${resetTarget.id || resetTarget._id}/reset-admin-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || '',
            'x-user-email': user?.email || '',
            'x-user-role': user?.role || '',
          },
          body: JSON.stringify({ newPassword: newPassword || undefined }),
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        setResetResult(data);
      } else {
        alert(data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      alert(err.message || 'Error resetting password');
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!deleteTarget) return;
    if (deleteConfirmationSlug.trim().toLowerCase() !== deleteTarget.slug.toLowerCase()) {
      alert('Slug does not match. Please verify slug before deleting.');
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(`/api/super-admin/companies/${deleteTarget.id || deleteTarget._id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || '',
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDeleteTarget(null);
        setDeleteConfirmationSlug('');
        fetchCompanies();
      } else {
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
    if (!editTarget) return;
    try {
      setSavingEdit(true);
      const res = await fetch(`/api/super-admin/companies/${editTarget.id || editTarget._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (res.ok) {
        setEditTarget(null);
        fetchCompanies();
      } else {
        alert(data.error || 'Failed to update company');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating company');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleWipeAllData = async () => {
    if (wipeConfirmation.trim().toUpperCase() !== 'RESET') {
      alert('Please type RESET to confirm data wipe.');
      return;
    }
    try {
      setWipingData(true);
      const res = await fetch('/api/super-admin/wipe-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || '',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowWipeModal(false);
        setWipeConfirmation('');
        alert('All platform test data successfully wiped. System reset to baseline.');
        fetchCompanies();
      } else {
        alert(data.error || 'Failed to wipe platform data.');
      }
    } catch (err: any) {
      alert(err.message || 'Error executing platform data wipe.');
    } finally {
      setWipingData(false);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const compName = (c.name || c.brand_name || '').toLowerCase();
      const compSlug = (c.slug || '').toLowerCase();
      const adminEmail = (c.admin?.email || '').toLowerCase();
      return compName.includes(q) || compSlug.includes(q) || adminEmail.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-slate-150 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100/80 border border-purple-200 text-purple-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Platform Organizations & Tenants
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage all companies, provision new workspaces, and oversee platform tenants.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Platform Data Reset Danger Button */}
          <button
            type="button"
            onClick={() => {
              setWipeConfirmation('');
              setShowWipeModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
            title="Wipe test data and reset to baseline"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Reset Platform Data</span>
          </button>

          <button
            type="button"
            onClick={fetchCompanies}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all active:scale-95 shadow-2xs"
            title="Refresh tenants"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
          </button>

          <button
            type="button"
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
              setCreateError('');
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5249EC] text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Company & Admin</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-150 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Companies</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {stats.totalCompanies}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">All registered tenants</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-150 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Workspaces</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {stats.activeCompanies}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">Full operational status</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-150 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Suspended</span>
            <Ban className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {stats.suspendedCompanies}
          </div>
          <div className="text-[11px] text-amber-600 mt-1 font-medium">Temporarily paused</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-150 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Platform Users</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {stats.totalPlatformUsers}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Across all organizations</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-150 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company name, slug, or admin email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['all', 'active', 'suspended'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === filter
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-3xl border border-slate-150 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Company / Slug</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Admin Account</th>
                <th className="py-3.5 px-4 text-center">Staff / Branches</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                    <p className="font-medium">No company organizations found.</p>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((comp) => {
                  const compId = comp.id || comp._id;
                  const isActive = comp.status === 'active';
                  const isMenuOpen = activeMenuId === compId;

                  return (
                    <tr
                      key={compId}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Name / Slug */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {(comp.name || comp.brand_name || comp.slug || 'CO').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">
                              {comp.name || comp.brand_name}
                            </div>
                            <div className="text-[11px] font-mono text-purple-600 truncate">
                              /{comp.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(comp)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                          title="Click to toggle status"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="capitalize">{comp.status}</span>
                        </button>
                      </td>

                      {/* Admin Account */}
                      <td className="py-3.5 px-4">
                        {comp.admin ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-800">{comp.admin.name}</div>
                            <div className="text-[11px] text-slate-500">{comp.admin.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No admin assigned</span>
                        )}
                      </td>

                      {/* Staff & Branches */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center space-x-2 text-[11px] text-slate-600 bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-lg">
                          <span className="font-semibold text-slate-800">{comp.userCount || 0}</span> staff
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-slate-800">{comp.branchCount || 1}</span> branch
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {comp.createdAt
                          ? new Date(comp.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Enter Workspace Button */}
                          {onEnterWorkspace && (
                            <button
                              type="button"
                              onClick={() => onEnterWorkspace(comp)}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] inline-flex items-center gap-1 border border-purple-200 transition-colors shadow-2xs"
                              title="Enter and manage this company workspace"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>Enter Workspace</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setResetTarget(comp);
                              setNewPassword('');
                              setResetResult(null);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                            title="Reset Admin Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditTarget(comp);
                              setEditForm({
                                name: comp.name || '',
                                brand_name: comp.brand_name || comp.name || '',
                                status: comp.status || 'active',
                                currency_code: comp.currency_code || 'INR',
                                currency_symbol: comp.currency_symbol || '₹',
                                timezone: comp.timezone || 'Asia/Kolkata',
                                phone: comp.phone || '',
                                address: comp.address || '',
                              });
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                            title="Edit Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget(comp);
                              setDeleteConfirmationSlug('');
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Company"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* MODAL 1: Create Company & Admin */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            {createStep === 'form' ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Provision New Organization</h2>
                    <p className="text-xs text-slate-500">Atomic tenant + Company Admin creation</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-semibold p-1"
                  >
                    ✕
                  </button>
                </div>

                {createError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {createError}
                  </div>
                )}

                <form onSubmit={handleCreateCompany} className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Company Information</h3>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Acme Innovations"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Company Slug *</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">/</span>
                        <input
                          type="text"
                          required
                          value={form.slug}
                          onChange={(e) => setForm({ ...form, slug: e.target.value })}
                          placeholder="acme-innovations"
                          className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Code</label>
                        <input
                          type="text"
                          value={form.currency_code}
                          onChange={(e) => setForm({ ...form, currency_code: e.target.value.toUpperCase() })}
                          placeholder="INR, USD, EUR"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Symbol</label>
                        <input
                          type="text"
                          value={form.currency_symbol}
                          onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })}
                          placeholder="₹, $, €"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Initial Company Admin</h3>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Full Name *</label>
                      <input
                        type="text"
                        required
                        value={form.adminName}
                        onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                        placeholder="John Doe"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Temporary Password <span className="text-slate-400 font-normal">(Leave blank to auto-generate)</span>
                      </label>
                      <input
                        type="text"
                        value={form.adminPassword}
                        onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                        placeholder="Auto-generated secure password if blank"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 disabled:opacity-50"
                    >
                      {creating ? 'Provisioning...' : 'Provision Company'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Step 2: Provisioned Credentials */
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div className="text-center">
                  <h2 className="text-xl font-bold text-slate-900">Organization Provisioned!</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Company <b>{provisionedData?.company?.name}</b> is ready. Share these login credentials with the Company Admin.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Company Slug:</span>
                    <div className="font-mono font-bold text-purple-700 mt-0.5">/{provisionedData?.company?.slug}</div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium">Admin Email:</span>
                    <div className="font-semibold text-slate-800 mt-0.5">{provisionedData?.admin?.email}</div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium">Temporary Password:</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                        {provisionedData?.admin?.temporaryPassword}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(provisionedData?.admin?.temporaryPassword, 'pass')}
                        className="text-xs text-purple-600 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        {copiedKey === 'pass' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'pass' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20"
                  >
                    Done & Return
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Reset Admin Password */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4">
            <div className="text-center">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Reset Company Admin Password</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate a new temporary password for <b>{resetTarget.admin?.name || resetTarget.name}</b>.
              </p>
            </div>

            {resetResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-800 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Password successfully reset!</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 font-medium">New Password: </span>
                    <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 text-slate-900">
                      {resetResult.temporaryPassword}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custom New Password (or leave blank to auto-generate)
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Auto-generate secure password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetTarget(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={resetting}
                    onClick={handleResetPassword}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 disabled:opacity-50"
                  >
                    {resetting ? 'Resetting...' : 'Confirm Reset'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Company Details */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Edit Company Details</h2>
              <p className="text-xs text-slate-500">Update organization settings & localized defaults</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={editForm.brand_name}
                  onChange={(e) => setEditForm({ ...editForm, brand_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Code</label>
                  <input
                    type="text"
                    value={editForm.currency_code}
                    onChange={(e) => setEditForm({ ...editForm, currency_code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={editForm.currency_symbol}
                    onChange={(e) => setEditForm({ ...editForm, currency_symbol: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e: any) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 disabled:opacity-50"
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
                This action is <span className="font-bold text-rose-600">irreversible</span>. It will permanently remove <b>{deleteTarget.name}</b> and all associated records.
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

      {/* MODAL 5: Wipe All Platform Data Confirmation */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900">Reset & Wipe Platform Data</h2>
              <p className="text-xs text-slate-500 mt-1">
                This will delete all test companies, users, tasks, projects, leads, attendance, payroll, and tickets.
                Only the <span className="font-semibold text-slate-700">Platform Super Admin</span> and the <span className="font-semibold text-slate-700">Default Company Tenant</span> will remain.
              </p>
            </div>

            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-900">
              Please type <span className="font-mono font-bold text-amber-700 select-all">RESET</span> below to confirm:
            </div>

            <input
              type="text"
              value={wipeConfirmation}
              onChange={(e) => setWipeConfirmation(e.target.value)}
              placeholder="RESET"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500"
            />

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowWipeModal(false);
                  setWipeConfirmation('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={wipingData || wipeConfirmation.trim().toUpperCase() !== 'RESET'}
                onClick={handleWipeAllData}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20 disabled:opacity-40"
              >
                {wipingData ? 'Resetting...' : 'Confirm Wipe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
