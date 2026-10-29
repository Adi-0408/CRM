'use client';

import React from 'react';
import {
  Rocket,
  Zap,
  Activity,
  CheckSquare,
  Users2,
  FolderKanban,
  CalendarCheck,
  Building2,
  HelpCircle,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface BINavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  syncing?: boolean;
}

export default function BusinessIntelligenceNav({
  activeTab,
  setActiveTab,
  syncing = false,
}: BINavProps) {
  const { roleConfig } = useAuth();

  const allTabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'leads', label: 'Leads', icon: Users2 },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'branches', label: 'Branches', icon: Building2 },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'payroll', label: 'Payroll', icon: CreditCard },
    { id: 'employees', label: 'Employees', icon: UserCheck },
  ];

  // Dynamically filter tabs by role
  const tabs = allTabs.filter((tab) =>
    roleConfig.biNavTabs.includes(tab.id)
  );

  return (
    <div className="mb-6">
      {/* Title & Live Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-3.5 mb-4 sm:mb-5">
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0 transition-transform duration-300 hover:scale-105">
            <Rocket className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              Business Intelligence
            </h2>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium mt-0.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span className="truncate">Real-time organizational analytics</span>
            </div>
          </div>
        </div>

        {/* Live data sync indicator */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 bg-emerald-50/90 border border-emerald-200/60 shadow-2xs px-3.5 py-1.5 rounded-full self-start sm:self-auto shrink-0 transition-all hover:shadow-xs">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                syncing ? 'bg-amber-400' : 'bg-emerald-400'
              } opacity-75`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                syncing ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </span>
          <span>{syncing ? 'Syncing...' : 'Live data sync'}</span>
        </div>
      </div>

      {/* Touch-Friendly Horizontal Scroll Pill-Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full p-1.5 bg-slate-100/80 rounded-full border border-slate-200/60 shadow-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id || (tab.id === 'overview' && activeTab === 'dashboard');

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap shrink-0 px-4 py-1.5 text-xs rounded-full inline-flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.1)] text-slate-900 font-bold border border-slate-200/80 scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/70 hover:shadow-2xs font-semibold'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isActive ? 'text-[#635BFF] scale-110' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
