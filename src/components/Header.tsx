'use client';

import React, { useState } from 'react';
import {
  Menu,
  Plus,
  Bell,
  Clock,
  LogOut,
  CalendarCheck,
  CreditCard,
  Luggage,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
  const [notifications] = useState<any[]>([]);

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
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 flex items-center justify-between transition-all select-none">
      <div className="flex items-center justify-between w-full gap-3">
        {/* Left: Mobile Hamburger + Title + Active Role Context */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="p-2 rounded-xl border border-slate-200 bg-white shadow-2xs text-slate-700 hover:text-slate-900 transition-colors lg:hidden flex items-center justify-center shrink-0 active:scale-95"
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
              className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors relative border border-slate-200/80 shadow-2xs flex items-center justify-center"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#635BFF] rounded-full ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-semibold text-xs text-slate-800">Notifications</span>
                  {notifications.length > 0 && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                      {notifications.length} unread
                    </span>
                  )}
                </div>
                <div className="divide-y divide-slate-50 mt-2 max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div key={n.id} className="py-2.5 flex items-start space-x-3">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{n.desc}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      No new notifications
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Direct Logout Button */}
          <button
            onClick={logout}
            className="w-9 h-9 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
