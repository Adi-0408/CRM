'use client';

import React, { useState, useMemo } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  Percent,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SalesTargetsTabProps {
  leads: any[];
  employees?: any[];
  projects?: any[];
  onRefreshParent?: () => void;
}

export default function SalesTargetsTab({
  leads = [],
  employees = [],
  projects = [],
  onRefreshParent,
}: SalesTargetsTabProps) {
  const { user, role } = useAuth();
  const [commissionRate, setCommissionRate] = useState<number>(5); // default 5%
  const [search, setSearch] = useState('');
  const [targetOverrides, setTargetOverrides] = useState<Record<string, number>>({});
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [tempTarget, setTempTarget] = useState<string>('');

  // Extract all unique sales representatives (from employees with sales role or assignedTo in leads)
  const salesReps = useMemo(() => {
    const repMap = new Map<string, { id: string; name: string; email: string; avatar?: string; role?: string }>();

    // 1. From employees list
    employees.forEach((emp) => {
      const empRole = (emp.role || '').toLowerCase();
      const empDept = (emp.department || '').toLowerCase();
      if (empRole === 'sales' || empDept.includes('sales') || empRole.includes('sales')) {
        const id = String(emp._id || emp.id);
        repMap.set(id, {
          id,
          name: emp.name,
          email: emp.email,
          avatar: emp.avatar,
          role: emp.role || 'Sales Specialist',
        });
      }
    });

    // 2. From assigned leads
    leads.forEach((l) => {
      if (l.assignedTo) {
        const id = typeof l.assignedTo === 'object' ? String(l.assignedTo._id || l.assignedTo.id) : String(l.assignedTo);
        const name = typeof l.assignedTo === 'object' ? l.assignedTo.name : 'Sales Executive';
        const email = typeof l.assignedTo === 'object' ? l.assignedTo.email : '';
        const avatar = typeof l.assignedTo === 'object' ? l.assignedTo.avatar : undefined;
        if (!repMap.has(id)) {
          repMap.set(id, {
            id,
            name,
            email,
            avatar,
            role: 'Sales Representative',
          });
        }
      }
    });

    // If still empty (demo fallback), ensure current user or demo sales rep appears
    if (repMap.size === 0 && user) {
      repMap.set(String(user.id || 'current_sales'), {
        id: String(user.id || 'current_sales'),
        name: user.name || 'Sales Representative',
        email: user.email || 'sales@company.com',
        avatar: (user as any)?.avatar,
        role: 'Sales Executive',
      });
    }

    return Array.from(repMap.values());
  }, [employees, leads, user]);

  // Aggregate metrics per representative
  const repMetrics = useMemo(() => {
    return salesReps.map((rep) => {
      const repId = String(rep.id);
      const repEmail = rep.email?.toLowerCase();

      // Find all leads assigned to this rep
      const assignedLeads = leads.filter((l) => {
        if (!l.assignedTo) return false;
        const leadAssigneeId = typeof l.assignedTo === 'object'
          ? String(l.assignedTo._id || l.assignedTo.id)
          : String(l.assignedTo);
        const leadAssigneeEmail = typeof l.assignedTo === 'object' ? l.assignedTo.email?.toLowerCase() : null;

        return (
          leadAssigneeId === repId ||
          (repEmail && leadAssigneeEmail && leadAssigneeEmail === repEmail)
        );
      });

      const wonLeads = assignedLeads.filter((l) => l.status === 'won');
      const wonRevenue = wonLeads.reduce((acc, curr) => acc + (curr.value || 0), 0);
      const pipelineLeads = assignedLeads.filter((l) => l.status !== 'won' && l.status !== 'lost');
      const pipelineValue = pipelineLeads.reduce((acc, curr) => acc + (curr.value || 0), 0);

      // Default target is ₹10,00,000 unless overridden
      const monthlyTarget = targetOverrides[repId] || 1000000;
      const attainment = monthlyTarget > 0 ? Math.round((wonRevenue / monthlyTarget) * 100) : 0;
      const commissionEarned = Math.round((wonRevenue * commissionRate) / 100);

      return {
        ...rep,
        monthlyTarget,
        wonLeads,
        wonRevenue,
        pipelineLeads,
        pipelineValue,
        attainment,
        commissionEarned,
      };
    });
  }, [salesReps, leads, targetOverrides, commissionRate]);

  // Overall Organization Sales Target Totals
  const totalTarget = repMetrics.reduce((acc, curr) => acc + curr.monthlyTarget, 0);
  const totalWonRevenue = repMetrics.reduce((acc, curr) => acc + curr.wonRevenue, 0);
  const totalCommissionPool = repMetrics.reduce((acc, curr) => acc + curr.commissionEarned, 0);
  const totalWonDealsCount = repMetrics.reduce((acc, curr) => acc + curr.wonLeads.length, 0);
  const overallAttainment = totalTarget > 0 ? Math.round((totalWonRevenue / totalTarget) * 100) : 0;

  // Filtered reps by search
  const filteredReps = repMetrics.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.wonLeads.some((wl) => wl.company?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSaveTarget = (repId: string) => {
    const val = parseInt(tempTarget, 10);
    if (!isNaN(val) && val > 0) {
      setTargetOverrides((prev) => ({ ...prev, [repId]: val }));
    }
    setEditingTargetId(null);
    setTempTarget('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Target */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-5 shadow-[0_10px_28px_-4px_rgba(15,23,42,0.08)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Monthly Sales Quota
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              ₹{totalTarget.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Across {salesReps.length} sales representative{salesReps.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#635BFF] flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Won Closed Revenue */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-5 shadow-[0_10px_28px_-4px_rgba(15,23,42,0.08)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Achieved Won Revenue
            </p>
            <h3 className="text-2xl font-extrabold text-emerald-600 tracking-tight mt-1">
              ₹{totalWonRevenue.toLocaleString()}
            </h3>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              {totalWonDealsCount} deal{totalWonDealsCount === 1 ? '' : 's'} successfully closed
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Quota Attainment */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-5 shadow-[0_10px_28px_-4px_rgba(15,23,42,0.08)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quota Attainment
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              {overallAttainment}%
            </h3>
            <div className="w-28 h-2 rounded-full bg-slate-100 overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallAttainment >= 100
                    ? 'bg-emerald-500'
                    : overallAttainment >= 70
                    ? 'bg-indigo-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(overallAttainment, 100)}%` }}
              />
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        {/* Commission Pool */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-5 shadow-[0_10px_28px_-4px_rgba(15,23,42,0.08)] flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Commission Earned
              </p>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 rounded">
                {commissionRate}%
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-purple-700 tracking-tight mt-1">
              ₹{totalCommissionPool.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Payable upon settlement</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Control Bar (Commission Rate Tier & Search) */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-2xl border border-white/80 p-4 shadow-[0_10px_28px_-4px_rgba(15,23,42,0.06)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sales rep, won company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Commission Tier Selector */}
          <div className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
            <span className="text-[11px] font-bold text-slate-500 px-2 hidden sm:inline-block">
              Commission:
            </span>
            {[3, 5, 8, 10].map((rate) => (
              <button
                key={rate}
                onClick={() => setCommissionRate(rate)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  commissionRate === rate
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {rate}%
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium self-end sm:self-center">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Closed/Won deals automatically credit to the lead's owner</span>
        </div>
      </div>

      {/* 3. Sales Representative Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredReps.length > 0 ? (
          filteredReps.map((rep) => {
            const isCurrentUser = user && (String(user.id || (user as any)._id) === rep.id || user.email === rep.email);

            return (
              <div
                key={rep.id}
                className={`rounded-2xl p-5 border transition-all ${
                  isCurrentUser
                    ? 'bg-gradient-to-b from-indigo-50/40 via-white to-white border-indigo-200/80 shadow-[0_12px_32px_-4px_rgba(99,91,255,0.12)]'
                    : 'bg-white border-slate-100 shadow-[0_6px_24px_-4px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_30px_-4px_rgba(15,23,42,0.08)]'
                }`}
              >
                {/* Header: Representative Info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#635BFF] to-indigo-400 text-white font-extrabold flex items-center justify-center text-sm shadow-sm overflow-hidden shrink-0">
                      {rep.avatar ? (
                        <img src={rep.avatar} alt={rep.name} className="w-full h-full object-cover" />
                      ) : (
                        rep.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-900">{rep.name}</h4>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 border border-indigo-200 px-2 py-0.2 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{rep.email}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      rep.attainment >= 100
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : rep.attainment >= 70
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {rep.attainment}% Quota
                  </span>
                </div>

                {/* Target vs Achieved Progress Bar */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-500 font-medium">Achieved:</span>
                      <strong className="text-slate-900 font-bold">
                        ₹{rep.wonRevenue.toLocaleString()}
                      </strong>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400">Target:</span>
                      {editingTargetId === rep.id ? (
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            autoFocus
                            value={tempTarget}
                            onChange={(e) => setTempTarget(e.target.value)}
                            className="w-24 px-1.5 py-0.5 text-xs border border-indigo-400 rounded focus:outline-none"
                            placeholder="₹ Target"
                          />
                          <button
                            onClick={() => handleSaveTarget(rep.id)}
                            className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingTargetId(rep.id);
                            setTempTarget(String(rep.monthlyTarget));
                          }}
                          className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                          title="Click to adjust monthly quota"
                        >
                          ₹{rep.monthlyTarget.toLocaleString()} ✏️
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        rep.attainment >= 100
                          ? 'bg-emerald-500'
                          : rep.attainment >= 70
                          ? 'bg-indigo-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(rep.attainment, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Deals Won
                    </span>
                    <strong className="text-sm font-extrabold text-emerald-600">
                      {rep.wonLeads.length}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Commission
                    </span>
                    <strong className="text-sm font-extrabold text-purple-700">
                      ₹{rep.commissionEarned.toLocaleString()}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Pipeline
                    </span>
                    <strong className="text-sm font-extrabold text-slate-700">
                      ₹{rep.pipelineValue.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Credited Won Deals List */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Credited Closed Deals ({rep.wonLeads.length})
                  </span>

                  {rep.wonLeads.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {rep.wonLeads.map((deal: any, dIdx: number) => (
                        <div
                          key={deal._id || dIdx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50/60 hover:bg-slate-50 border border-slate-100 text-xs transition-colors"
                        >
                          <div className="flex items-center space-x-2 truncate mr-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-slate-800 truncate">
                              {deal.company || deal.name}
                            </span>
                            {deal.projectId && (
                              <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded shrink-0">
                                In Project
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-emerald-600 shrink-0">
                            ₹{(deal.value || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-2">
                      No closed deals credited yet this cycle.
                    </p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full glass-card p-12 text-center border-slate-100">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No Sales Data Found</h4>
            <p className="text-xs text-slate-400 mt-1">
              Add leads or assign sales representatives to track commission and quotas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
