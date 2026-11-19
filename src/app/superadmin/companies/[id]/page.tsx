'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Building2, Users, Shield, ArrowLeft, RefreshCw, CheckCircle,
  AlertTriangle, Ban, Calendar, Globe, Mail, Save, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function CompanyDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: '',
    status: 'active',
    subscriptionStatus: 'active',
    primaryColor: '#4F46E5',
    industry: '',
  });

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/companies/${params.id}`, {
        headers: {
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCompany(data.company);
        setMembers(data.members || []);
        if (data.company) {
          setForm({
            companyName: data.company.companyName || '',
            status: data.company.status || 'active',
            subscriptionStatus: data.company.subscriptionStatus || 'trial',
            primaryColor: data.company.primaryColor || '#4F46E5',
            industry: data.company.industry || '',
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchCompanyData();
  }, [user, params.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/companies/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setCompany(data.company);
        setMessage('Company settings updated successfully.');
      } else {
        alert(data.error || 'Failed to update company');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-600" />
        <p className="font-medium text-sm">Loading company profile...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-slate-500">
        <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <h2 className="text-lg font-bold text-slate-900">Company Not Found</h2>
        <p className="text-sm mt-1">This company profile does not exist or has been removed.</p>
        <Link
          href="/superadmin/companies"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Companies
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/superadmin/companies"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{company.companyName}</h1>
              <code className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {company.slug}
              </code>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Tenant ID: {company.id || company._id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/login?slug=${company.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all shadow-xs"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Open Company Workspace</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5 text-indigo-500" />
          </a>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Main Grid: Settings & Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Edit Settings */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Company Configuration
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subscription Lifecycle</label>
                <select
                  value={form.subscriptionStatus}
                  onChange={(e) => setForm({ ...form, subscriptionStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="trial">Trial (30 days)</option>
                  <option value="active">Active (Paid)</option>
                  <option value="grace_period">Grace Period</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
                <input
                  type="text"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. Technology"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                    className="h-9 w-12 rounded border border-slate-200 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-500">{form.primaryColor}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving Changes...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Tenant Info Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Tenant Details</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Subdomain</span>
                <span className="font-semibold text-slate-700">{company.slug}.yourcrm.com</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Created On</span>
                <span className="text-slate-700">
                  {company.createdAt ? new Date(company.createdAt).toLocaleDateString('en-IN') : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Total Members</span>
                <span className="font-semibold text-indigo-600">{members.length} Users</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Company Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h2 className="font-semibold text-slate-900 text-sm">Company Members ({members.length})</h2>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No specific members assigned yet. Run migration or add employees through the workspace.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Member ID</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id || m._id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono text-slate-600">
                      {m.employeeId || m.uid || m.id}
                    </td>
                    <td className="px-6 py-3 capitalize font-medium text-slate-800">
                      {m.role?.replace(/_/g, ' ') || 'member'}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        m.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {m.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-400">
                      {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
