'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';

interface DailyStandupsDigestViewProps {
  onOpenStandupModal?: () => void;
}

export default function DailyStandupsDigestView({
  onOpenStandupModal,
}: DailyStandupsDigestViewProps) {
  const [standups, setStandups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  );
  const [search, setSearch] = useState('');
  const [filterBlocker, setFilterBlocker] = useState<'all' | 'blockers_only'>('all');

  const fetchStandups = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/standups?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setStandups(data);
      }
    } catch (err) {
      console.error('Error fetching standups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandups();
  }, [selectedDate]);

  const blockerCount = standups.filter((s) => s.hasBlockers).length;
  const cleanCount = standups.length - blockerCount;

  const filteredStandups = standups.filter((s) => {
    const matchesBlocker = filterBlocker === 'all' || (filterBlocker === 'blockers_only' && s.hasBlockers);
    const matchesSearch =
      s.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      s.completedToday?.toLowerCase().includes(search.toLowerCase()) ||
      s.plannedTomorrow?.toLowerCase().includes(search.toLowerCase()) ||
      s.blockers?.toLowerCase().includes(search.toLowerCase());

    return matchesBlocker && matchesSearch;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Header Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-5 shadow-[0_10px_28px_-4px_rgba(15,23,42,0.06)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Submitted Digests
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              {standups.length}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Staff standup logs for {selectedDate}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#635BFF] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-5 shadow-[0_10px_28px_-4px_rgba(15,23,42,0.06)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              All Clear (No Blockers)
            </p>
            <h3 className="text-2xl font-extrabold text-emerald-600 tracking-tight mt-1">
              {cleanCount}
            </h3>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              Progress on track
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-5 shadow-[0_10px_28px_-4px_rgba(15,23,42,0.06)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Blockers Flagged
            </p>
            <h3 className={`text-2xl font-extrabold tracking-tight mt-1 ${blockerCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {blockerCount}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {blockerCount > 0 ? 'Requires Team Lead attention' : 'Zero blockers reported'}
            </p>
          </div>
          <div
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
              blockerCount > 0
                ? 'bg-rose-50 border-rose-100 text-rose-600'
                : 'bg-slate-50 border-slate-100 text-slate-400'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Filter & Date Controls */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-2xl border border-white/80 p-4 shadow-[0_10px_28px_-4px_rgba(15,23,42,0.06)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Date Picker */}
          <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none pr-2 py-0.5"
            />
          </div>

          {/* Quick Filter: All vs Blockers */}
          <div className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={() => setFilterBlocker('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterBlocker === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({standups.length})
            </button>
            <button
              onClick={() => setFilterBlocker('blockers_only')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterBlocker === 'blockers_only'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              Blockers ({blockerCount})
            </button>
          </div>

          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member, tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-center">
          <button
            onClick={fetchStandups}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Refresh standups"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {onOpenStandupModal && (
            <button
              onClick={onOpenStandupModal}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-xs transition flex items-center space-x-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log My Standup</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Standups Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400">
            Loading Daily Standups digest...
          </div>
        ) : filteredStandups.length > 0 ? (
          filteredStandups.map((s, idx) => (
            <div
              key={s._id || s.id || idx}
              className={`rounded-2xl p-5 border transition-all ${
                s.hasBlockers
                  ? 'bg-rose-50/20 border-rose-200/80 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.06)]'
                  : 'bg-white border-slate-100 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_25px_-4px_rgba(15,23,42,0.06)]'
              }`}
            >
              {/* Member Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 shadow-xs">
                    {s.employeeAvatar ? (
                      <img src={s.employeeAvatar} alt={s.employeeName} className="w-full h-full object-cover" />
                    ) : (
                      s.employeeName
                        ?.split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{s.employeeName}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {s.employeeRole || 'Developer'} • {s.employeeEmail}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border shrink-0 ${
                    s.hasBlockers
                      ? 'bg-rose-100 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {s.hasBlockers ? '⚠️ Blocker Reported' : '✅ All Clear'}
                </span>
              </div>

              {/* Completed Today */}
              <div className="mt-4 pt-3 border-t border-slate-100/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  1. Completed Today:
                </span>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-mono bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                  {s.completedToday || 'No specific deliverables noted.'}
                </p>
              </div>

              {/* Planned Tomorrow */}
              <div className="mt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  2. Planned for Tomorrow:
                </span>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-mono bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                  {s.plannedTomorrow || 'Continuing sprint tasks.'}
                </p>
              </div>

              {/* Blockers */}
              {s.hasBlockers && s.blockers && s.blockers !== 'None' && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <div className="flex items-center space-x-1.5 font-bold mb-0.5 text-rose-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Active Blocker / Dependency:</span>
                  </div>
                  <p className="leading-relaxed font-mono">{s.blockers}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full glass-card p-12 text-center border-slate-100">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No Standups Submitted for {selectedDate}</h4>
            <p className="text-xs text-slate-400 mt-1">
              Employees are automatically prompted to log their daily digest upon clocking out.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
