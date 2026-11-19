'use client';

import { useState, useEffect } from 'react';
import { Building2, Users, CreditCard, TrendingUp, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface DashboardStats {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  trialCompanies: number;
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    activeCompanies: 0,
    suspendedCompanies: 0,
    trialCompanies: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/companies', {
        headers: {
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.companies || [];
        setCompanies(list);
        setStats({
          totalCompanies: list.length,
          activeCompanies: list.filter((c: any) => c.status === 'active').length,
          suspendedCompanies: list.filter((c: any) => c.status === 'suspended').length,
          trialCompanies: list.filter((c: any) => c.subscriptionStatus === 'trial').length,
        });
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const statCards = [
    { label: 'Total Companies', value: stats.totalCompanies, icon: Building2, color: 'indigo', bg: 'bg-indigo-50', iconColor: 'text-indigo-600', border: 'border-indigo-100' },
    { label: 'Active', value: stats.activeCompanies, icon: CheckCircle, color: 'emerald', bg: 'bg-emerald-50', iconColor: 'text-emerald-600', border: 'border-emerald-100' },
    { label: 'On Trial', value: stats.trialCompanies, icon: Clock, color: 'amber', bg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-100' },
    { label: 'Suspended', value: stats.suspendedCompanies, icon: AlertTriangle, color: 'red', bg: 'bg-red-50', iconColor: 'text-red-500', border: 'border-red-100' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Monitor all tenants and platform health.</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`bg-white rounded-xl border ${card.border} p-5 shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500 font-medium">{card.label}</p>
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {loading ? '—' : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Companies Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">All Companies</h2>
          <a
            href="/superadmin/companies"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Manage →
          </a>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
            Loading companies...
          </div>
        ) : companies.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No companies yet</p>
            <p className="text-sm mt-1">Run data migration or create a new company.</p>
            <a
              href="/superadmin/companies"
              className="inline-block mt-3 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + New Company
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Company</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Slug</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Subscription</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((company) => (
                  <tr key={company.id || company._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ backgroundColor: company.primaryColor || '#4F46E5' }}
                        >
                          {company.companyName?.charAt(0) || 'C'}
                        </div>
                        <span className="font-medium text-slate-900 text-sm">{company.companyName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{company.slug}</code>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge value={company.status} type="status" />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge value={company.subscriptionStatus} type="subscription" />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {company.createdAt ? new Date(company.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <a
                        href={`/superadmin/companies/${company.id || company._id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        View →
                      </a>
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

function StatusBadge({ value, type }: { value?: string; type: 'status' | 'subscription' }) {
  const statusStyles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    suspended: 'bg-red-50 text-red-600 border-red-200',
    pending: 'bg-slate-100 text-slate-600 border-slate-200',
    trial: 'bg-amber-50 text-amber-700 border-amber-200',
    expired: 'bg-orange-50 text-orange-600 border-orange-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
    grace_period: 'bg-orange-50 text-orange-600 border-orange-200',
  };
  const cls = statusStyles[value || ''] || 'bg-slate-100 text-slate-500 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${cls}`}>
      {value?.replace(/_/g, ' ') || 'unknown'}
    </span>
  );
}
