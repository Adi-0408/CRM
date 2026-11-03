'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Menu,
  Plus,
  Bell,
  Clock,
  LogOut,
  CalendarCheck,
  CreditCard,
  Luggage,
  FolderKanban,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NotificationDrawer from '@/components/notifications/NotificationDrawer';

interface HeaderProps {
  title: string;
  onOpenCreateTask: () => void;
  onOpenAddLead: () => void;
  onOpenCreateProject?: () => void;
  onOpenAddEmployee?: () => void;
  onNavigateTab?: (tab: string) => void;
  onToggleMobileMenu?: () => void;
}

export default function Header({
  title,
  onOpenCreateTask,
  onOpenAddLead,
  onOpenCreateProject,
  onOpenAddEmployee,
  onNavigateTab,
  onToggleMobileMenu,
}: HeaderProps) {
  const { user, role, roleConfig, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setNotifications(data);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const renderRoleActionButtons = () => {
    const primaryBtnClass =
      'whitespace-nowrap shrink-0 px-3.5 py-1.5 text-xs rounded-xl inline-flex items-center justify-center gap-1.5 font-semibold bg-[#635BFF] hover:bg-[#5249EC] text-white shadow-2xs transition-all duration-150 active:scale-95 cursor-pointer';
    const secondaryBtnClass =
      'whitespace-nowrap shrink-0 px-3.5 py-1.5 text-xs rounded-xl inline-flex items-center justify-center gap-1.5 font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs transition-all duration-150 active:scale-95 cursor-pointer';

    if (role === 'admin_manager') {
      return (
        <>
          <button onClick={onOpenCreateTask} className={secondaryBtnClass}>
            <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Create Task</span>
          </button>
          <button onClick={onOpenAddLead} className={primaryBtnClass}>
            <Plus className="w-3.5 h-3.5 text-white/90 shrink-0" />
            <span>Add Lead</span>
          </button>
          {onOpenCreateProject && (
            <button onClick={onOpenCreateProject} className={secondaryBtnClass}>
              <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>New Project</span>
            </button>
          )}
          {onOpenAddEmployee && (
            <button onClick={onOpenAddEmployee} className={secondaryBtnClass}>
              <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Add Member</span>
            </button>
          )}
        </>
      );
    }

    if (role === 'team_lead') {
      return (
        <>
          <button onClick={onOpenCreateTask} className={primaryBtnClass}>
            <Plus className="w-3.5 h-3.5 text-white/90 shrink-0" />
            <span>Create Task</span>
          </button>
          <button
            onClick={() => onNavigateTab && onNavigateTab('projects')}
            className={secondaryBtnClass}
          >
            <FolderKanban className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>My Projects</span>
          </button>
          <button
            onClick={() => onNavigateTab && onNavigateTab('attendance')}
            className={secondaryBtnClass}
          >
            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Clock In / Out</span>
          </button>
        </>
      );
    }

    if (role === 'hr') {
      return (
        <>
          {onOpenAddEmployee && (
            <button onClick={onOpenAddEmployee} className={primaryBtnClass}>
              <Plus className="w-3.5 h-3.5 text-white/90 shrink-0" />
              <span>Add Employee</span>
            </button>
          )}
          <button
            onClick={() => onNavigateTab && onNavigateTab('attendance')}
            className={secondaryBtnClass}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Staff Attendance</span>
          </button>
          <button
            onClick={() => onNavigateTab && onNavigateTab('leave')}
            className={secondaryBtnClass}
          >
            <Luggage className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Leave Requests</span>
          </button>
        </>
      );
    }

    if (role === 'accounts') {
      return (
        <>
          <button
            onClick={() => onNavigateTab && onNavigateTab('payroll')}
            className={primaryBtnClass}
          >
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span>Process Payroll</span>
          </button>
          <button
            onClick={() => onNavigateTab && onNavigateTab('attendance')}
            className={secondaryBtnClass}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Attendance Log</span>
          </button>
        </>
      );
    }

    if (role === 'sales') {
      return (
        <>
          <button onClick={onOpenAddLead} className={primaryBtnClass}>
            <Plus className="w-3.5 h-3.5 text-white/90 shrink-0" />
            <span>Add Lead</span>
          </button>
          <button
            onClick={() => onNavigateTab && onNavigateTab('quotations')}
            className={secondaryBtnClass}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Quotations</span>
          </button>
          <button
            onClick={() => onNavigateTab && onNavigateTab('attendance')}
            className={secondaryBtnClass}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Clock In / Out</span>
          </button>
        </>
      );
    }

    // Default staff roles
    return (
      <>
        <button
          onClick={() => onNavigateTab && onNavigateTab('attendance')}
          className={secondaryBtnClass}
        >
          <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>Clock In / Out</span>
        </button>
        <button
          onClick={() => onNavigateTab && onNavigateTab('leave')}
          className={primaryBtnClass}
        >
          <Luggage className="w-3.5 h-3.5 shrink-0" />
          <span>Request Leave</span>
        </button>
      </>
    );
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/70 backdrop-blur-2xl backdrop-saturate-150 border-b border-slate-200/50 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.03)] transition-all select-none">
      <div className="flex items-center justify-between w-full gap-3">
        {/* Left: Mobile Hamburger + Title + Active Role Context */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="p-2 rounded-xl border border-slate-200/80 bg-white/80 hover:bg-white backdrop-blur-xs shadow-2xs text-slate-700 hover:text-slate-900 transition-colors lg:hidden flex items-center justify-center shrink-0 active:scale-95"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>

          <div className="truncate">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 capitalize truncate">
              {title}
            </h1>
          </div>

          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border hidden sm:inline-flex items-center flex-shrink-0 ${roleConfig.badgeBg} ${roleConfig.badgeText} ${roleConfig.badgeBorder}`}
          >
            <span>{roleConfig.label}</span>
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 flex-shrink-0">
          {/* Header Role-Specific Action Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            {renderRoleActionButtons()}
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 rounded-xl bg-white/80 hover:bg-white backdrop-blur-xs text-slate-500 hover:text-slate-800 transition-colors relative border border-slate-200/80 shadow-2xs flex items-center justify-center cursor-pointer active:scale-95"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <NotificationDrawer
                notifications={notifications}
                onRefresh={fetchNotifications}
                onNavigateTab={onNavigateTab}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>

          {/* Direct Logout Button */}
          <button
            onClick={logout}
            className="w-9 h-9 rounded-xl bg-white/80 hover:bg-rose-50 backdrop-blur-xs text-slate-400 hover:text-rose-600 transition-colors border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
