'use client';

import React from 'react';
import {
  Settings,
  Bell,
  Plus,
  Sparkles,
  Search,
} from 'lucide-react';

interface PrismNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateTask?: () => void;
  onOpenAddClient?: () => void;
}

export default function PrismNavbar({
  activeTab,
  setActiveTab,
  onOpenCreateTask,
  onOpenAddClient,
}: PrismNavbarProps) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'clients', label: 'Clients' },
    { id: 'projects', label: 'Projects' },
    { id: 'inbox', label: 'Inbox', badge: '2' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'headoffice', label: 'Head Office' },
  ];

  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
      {/* Brand & Connected Platforms */}
      <div className="flex items-center space-x-4">
        {/* Logo */}
        <div
          onClick={() => setActiveTab('overview')}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            {/* Infinity / Prism Symbol */}
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 12c-2-2.5-4-4-6.5-4A4.5 4.5 0 1 0 10 14.5L12 12m0 0c2 2.5 4 4 6.5 4a4.5 4.5 0 1 0-4.5-6.5L12 12" />
            </svg>
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">
            Prism<span className="text-violet-600 font-extrabold">CRM</span>
          </span>
        </div>

        {/* Connected Integration Badges (Upwork, Fiverr, Web) */}
        <div className="hidden sm:flex items-center space-x-2 pl-3 border-l border-slate-200">
          <div
            className="w-8 h-8 rounded-full bg-[#14a800] text-white flex items-center justify-center text-[11px] font-black shadow-xs cursor-pointer hover:opacity-90"
            title="Upwork Connected"
          >
            Up
          </div>
          <div
            className="w-8 h-8 rounded-full bg-[#1dbf73] text-white flex items-center justify-center text-[11px] font-black shadow-xs cursor-pointer hover:opacity-90"
            title="Fiverr Connected"
          >
            fi
          </div>
          <button
            onClick={onOpenAddClient}
            className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-400 flex items-center justify-center transition"
            title="Connect New Integration"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Pill Navigation Bar */}
      <nav className="flex items-center bg-slate-50/80 p-1.5 rounded-full border border-slate-200/80 shadow-xs self-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 sm:px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-violet-600 text-white'
                      : 'bg-violet-100 text-violet-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Controls & Profile */}
      <div className="flex items-center space-x-3 self-end lg:self-center">
        <button
          onClick={() => setActiveTab('headoffice')}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
          title="Settings & Head Office"
        >
          <Settings className="w-5 h-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setActiveTab('inbox')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 relative transition"
            title="Notifications & Messages"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
        </div>

        {/* Profile Avatar with Online Status */}
        <div
          onClick={() => setActiveTab('headoffice')}
          className="flex items-center space-x-2 pl-2 border-l border-slate-200 cursor-pointer group"
        >
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
              alt="Aditya Patil"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-violet-400 transition"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div className="hidden xl:block text-left text-xs leading-tight">
            <p className="font-bold text-slate-900">Aditya Patil</p>
            <p className="text-[10px] text-slate-400">Sangli HQ</p>
          </div>
        </div>
      </div>
    </header>
  );
}
