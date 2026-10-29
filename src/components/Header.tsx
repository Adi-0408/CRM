'use client';

import React, { useState } from 'react';
import {
  Menu,
  Plus,
  Bell,
  AlertCircle,
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

  const renderRoleActionButtons = (isMobile = false) => {
    const btnBaseClass =
      'whitespace-nowrap shrink-0 px-4 py-2 text-xs rounded-full inline-flex items-center justify-center gap-1.5 font-bold active:scale-95 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 glossy-btn';

    if (role === 'admin_manager') {
      return (
        <>
          <button
            onClick={onOpenCreateTask}
            className={`${btnBaseClass} text-slate-700 bg-white/90 hover:bg-white border border-slate-200/90 hover:border-slate-300 shadow-[0_4px_14px_-2px_rgba(15,23,42,0.12)] hover:shadow-[0_8px_20px_-3px_rgba(15,23,42,0.18)]`}
          >
            <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Create Task</span>
          </button>
          <button
            onClick={onOpenAddLead}
            className={`${btnBaseClass} text-white bg-gradient-to-r from-[#635BFF] via-[#7067FF] to-[#7B73FF] hover:brightness-105 shadow-[0_6px_20px_-2px_rgba(99,91,255,0.40)] hover:shadow-[0_10px_25px_-2px_rgba(99,91,255,0.50)] border-t border-white/30`}
          >
            <Plus className="w-3.5 h-3.5 text-white/90 shrink-0" />
            <span>Add Leads</span>
          </button>
          {onOpenCreateProject && (
            <button
              onClick={onOpenCreateProject}
              className={`${btnBaseClass} text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:brightness-105 shadow-[0_6px_20px_-2px_rgba(37,99,235,0.40)] hover:shadow-[0_10px_25px_-2px_rgba(37,99,235,0.50)] border-t border-white/30`}
            >
              <Plus className="w-3.5 h-3.5 text-white/90 shrink-0" />
              <span>New Project</span>
            </button>
          )}
          {onOpenAddEmployee && (
            <button
              onClick={onOpenAddEmployee}
              className={`${btnBaseClass} text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-105 shadow-[0_6px_20px_-2px_rgba(16,185,129,0.40)] hover:shadow-[0_10px_25px_-2px_rgba(16,185,129,0.50)] border-t border-white/30`}
            >
              <Plus className="w-3.5 h-3.5 text-white/90 shrink-0" />
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
            <button
              onClick={onOpenAddEmployee}
              className={`${btnBaseClass} text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm`}
            >
              <Plus className="w-3.5 h-3.5 text-white/90 shrink-0" />
              <span>+ Add Employee</span>
            </button>
          )}
          <button
            onClick={() => onNavigateTab && onNavigateTab('attendance')}
            className={`${btnBaseClass} text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs`}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Staff Attendance</span>
          </button>
          <button
            onClick={() => onNavigateTab && onNavigateTab('leave')}
            className={`${btnBaseClass} text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm`}
          >
            <Luggage className="w-3.5 h-3.5 shrink-0" />
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
            className={`${btnBaseClass} text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm`}
          >
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span>Process Payroll</span>
          </button>
          <button
            onClick={() => onNavigateTab && onNavigateTab('attendance')}
            className={`${btnBaseClass} text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs`}
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
          <button
            onClick={onOpenAddLead}
            className={`${btnBaseClass} text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm`}
          >
            <Plus className="w-3.5 h-3.5 text-white/90 shrink-0" />
            <span>+ Add Lead</span>
          </button>
          <button
            onClick={() => onNavigateTab && onNavigateTab('attendance')}
            className={`${btnBaseClass} text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Clock In / Out</span>
          </button>
        </>
      );
    }

    // Default self-service roles: web_developer, android_developer, tech_support, intern
    return (
      <>
        <button
          onClick={() => onNavigateTab && onNavigateTab('attendance')}
          className={`${btnBaseClass} text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs`}
        >
          <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>Clock In / Out</span>
        </button>
        <button
          onClick={() => onNavigateTab && onNavigateTab('leave')}
          className={`${btnBaseClass} text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm`}
        >
          <Luggage className="w-3.5 h-3.5 shrink-0" />
          <span>Request Leave</span>
        </button>
      </>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-white/70 shadow-[0_8px_30px_-4px_rgba(15,23,42,0.10),0_2px_8px_-1px_rgba(15,23,42,0.05)] px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Hamburger + Title + Active Role Context */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="p-2 rounded-xl border border-slate-200 bg-white shadow-xs text-slate-700 hover:text-slate-900 transition-colors lg:hidden flex items-center justify-center shrink-0 active:scale-95"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>

          <div className="truncate">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 capitalize truncate">
              {title}
            </h1>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border hidden sm:inline-flex items-center space-x-1 flex-shrink-0 ${roleConfig.badgeBg} ${roleConfig.badgeText} ${roleConfig.badgeBorder}`}
          >
            <span>{roleConfig.label}</span>
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 flex-shrink-0">
          {/* Header Role-Specific Action Buttons (hidden on small mobile screens, visible from sm: up) */}
          <div className="hidden sm:flex items-center gap-2">
            {renderRoleActionButtons(false)}
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 min-h-[44px] min-w-[44px] rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors relative border border-slate-100 flex items-center justify-center"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#635BFF] rounded-full ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
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

          {/* Active User Badge (Static, no unauthorized role switcher) */}
          <div className="flex items-center space-x-2 p-1.5 sm:px-3 min-h-[44px] rounded-full border border-slate-200/70 bg-white shadow-xs select-none">
            {/* User Avatar */}
            <div className="w-7 h-7 rounded-full overflow-hidden bg-[#F0EEFF] text-[#635BFF] flex items-center justify-center font-bold text-xs flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{(user?.name || 'U').charAt(0)}</span>
              )}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]">
                {user?.name || 'User'}
              </p>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 border ${roleConfig.badgeBg} ${roleConfig.badgeText} ${roleConfig.badgeBorder}`}
              >
                {roleConfig.label}
              </span>
            </div>
          </div>

          {/* Direct Logout Button */}
          <button
            onClick={logout}
            className="p-2 min-h-[44px] min-w-[44px] rounded-full bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors border border-slate-100 flex items-center justify-center"
            title="Log Out to Login Page"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
