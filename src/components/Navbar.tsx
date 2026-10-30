'use client';

import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Search,
  ChevronDown,
  Building2,
  UserCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { canManageTasks, canManageLeads } from '@/lib/permissions';

interface NavbarProps {
  onOpenCreateTask?: () => void;
  onOpenAddLead?: () => void;
  onSeedData?: () => void;
  seeding?: boolean;
}

export default function Navbar({
  onOpenCreateTask,
  onOpenAddLead,
  onSeedData,
  seeding,
}: NavbarProps) {
  const { user } = useAuth();
  const canCreateTask = canManageTasks(user);
  const canAddLead = canManageLeads(user);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between shadow-xs">
      {/* Title & Search */}
      <div className="flex items-center space-x-6">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard</h1>

        <div className="relative hidden md:block w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads, projects, tasks..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Action Buttons & Profile */}
      <div className="flex items-center space-x-3">
        {/* Quick Demo Data Seeder */}
        {onSeedData && (
          <button
            onClick={onSeedData}
            disabled={seeding}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition disabled:opacity-50"
            title="Populate or Reset Demo Data into MongoDB"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{seeding ? 'Syncing...' : 'Sync Demo Data'}</span>
          </button>
        )}

        {/* Create Task Button */}
        {canCreateTask && onOpenCreateTask && (
          <button
            onClick={onOpenCreateTask}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        )}

        {/* Add Leads Button */}
        {canAddLead && onOpenAddLead && (
          <button
            onClick={onOpenAddLead}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Leads</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-3 space-y-2 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-xs text-slate-900">Notifications</span>
                <span className="text-[10px] text-indigo-600 font-medium">Mark all read</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-800">Task Completed</p>
                    <p className="text-slate-500 text-[11px]">Rehan completed "Kanban pipeline UI"</p>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-start space-x-2">
                  <UserCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-800">New Qualified Lead</p>
                    <p className="text-slate-500 text-[11px]">Sneha Roy (₹3.8L deal) qualified</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-indigo-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
            UD
          </div>
          <div className="hidden lg:block text-left leading-tight">
            <div className="text-xs font-bold text-slate-900 flex items-center space-x-1">
              <span>Unique Digital Services</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
            <span className="text-[10px] text-slate-500">company</span>
          </div>
        </div>
      </div>
    </header>
  );
}
