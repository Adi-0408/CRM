'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/apiClient';
import { Building2, Plus, Search, RefreshCw, ExternalLink, AlertTriangle, CheckCircle, Clock, Ban, ChevronDown } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [runningMigration, setRunningMigration] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string[] | null>(null);

  const [form, setForm] = useState({
    companyName: '', slug: '', adminEmail: '', adminName: '',
    primaryColor: '#4F46E5', industry: '',
  });

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/admin/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchCompanies(); }, [user]);

  const filtered = companies.filter(c =>
    c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    c.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.slug || !form.adminEmail) return;
    setCreating(true);
    try {
      const res = await authFetch('/api/admin/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreate(false);
        setForm({ companyName: '', slug: '', adminEmail: '', adminName: '', primaryColor: '#4F46E5', industry: '' });
        await fetchCompanies();
      } else {
        alert(data.error || 'Failed to create company');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSuspend = async (id: string, name: string) => {
    if (!confirm(`Suspend "${name}"? Their employees will lose access.`)) return;
    await authFetch(`/api/admin/companies/${id}`, {
      method: 'DELETE',
    });
    await fetchCompanies();
  };

  const handleReactivate = async (id: string) => {
    await authFetch(`/api/admin/companies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active', subscriptionStatus: 'trial' }),
    });
    await fetchCompanies();
  };

  const handleMigrate = async () => {
    if (!confirm('Run data migration? This assigns existing employees to the default ITPL company.')) return;
    setRunningMigration(true);
    setMigrationResult(null);
    try {
      const res = await authFetch('/api/admin/migrate', {
        method: 'POST',
      });
      const data = await res.json();
      setMigrationResult(data.results || [data.error || 'Unknown error']);
      await fetchCompanies();
    } catch (err: any) {
      setMigrationResult([`Error: ${err.message}`]);
    } finally {
      setRunningMigration(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
          <p className="text-slate-500 text-sm">Manage all tenant companies on the platform.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleMigrate}
            disabled={runningMigration}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${runningMigration ? 'animate-spin' : ''}`} />
            Run Migration
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Company
          </button>
        </div>
      </div>

      {/* Migration results */}
      {migrationResult && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="font-semibold text-slate-900 mb-2">Migration Results:</p>
          <ul className="space-y-1">
            {migrationResult.map((r, i) => (
              <li key={i} className="text-sm text-slate-600 font-mono">{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search companies..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white"
        />
      </div>

      {/* Companies table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No companies found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Company', 'Slug', 'Status', 'Subscription', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((company) => {
                  const id = company.id || company._id;
                  const isSuspended = company.status === 'suspended';
                  return (
                    <tr key={id} className={`hover:bg-slate-50 transition-colors ${isSuspended ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                            style={{ backgroundColor: company.primaryColor || '#4F46E5' }}
                          >
                            {company.companyName?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <Link
                              href={`/superadmin/companies/${id}`}
                              className="font-semibold text-slate-900 text-sm hover:text-indigo-600 transition-colors"
                            >
                              {company.companyName}
                            </Link>
                            {company.industry && <p className="text-xs text-slate-400">{company.industry}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{company.slug}</code>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
                          company.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          company.status === 'suspended' ? 'bg-red-50 text-red-600 border-red-200' :
                          'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            company.status === 'active' ? 'bg-emerald-500' :
                            company.status === 'suspended' ? 'bg-red-500' : 'bg-slate-400'
                          }`} />
                          {company.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
                          company.subscriptionStatus === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          company.subscriptionStatus === 'trial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          company.subscriptionStatus === 'expired' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                          'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {(company.subscriptionStatus || 'unknown').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {company.createdAt ? new Date(company.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <Link
                            href={`/superadmin/companies/${id}`}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Manage
                          </Link>
                          <a
                            href={`/login?slug=${company.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Open company workspace login"
                          >
                            <span>Workspace</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                          {isSuspended ? (
                            <button
                              onClick={() => handleReactivate(id)}
                              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Reactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspend(id, company.companyName)}
                              className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                            >
                              <Ban className="w-3.5 h-3.5" /> Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Company Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Create New Company</h2>
              <p className="text-sm text-slate-500 mt-0.5">A 30-day trial subscription will be automatically created.</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company Name *</label>
                  <input
                    required value={form.companyName}
                    onChange={e => {
                      const name = e.target.value;
                      const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                      setForm(f => ({ ...f, companyName: name, slug: autoSlug }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="Acme Technologies"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company Code * (Identifier)</label>
                  <input
                    required value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="acme"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Industry</label>
                  <input
                    value={form.industry}
                    onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="Technology"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Admin Email *</label>
                  <input
                    required type="email" value={form.adminEmail}
                    onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="admin@acme.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Admin Name</label>
                  <input
                    value={form.adminName}
                    onChange={e => setForm(f => ({ ...f, adminName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="John Doe"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Brand Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color" value={form.primaryColor}
                      onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                      className="h-9 w-16 rounded border border-slate-200 cursor-pointer"
                    />
                    <span className="text-sm text-slate-500 font-mono">{form.primaryColor}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {creating ? 'Creating...' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
