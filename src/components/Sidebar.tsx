'use client';

import React from 'react';
import {
  Home,
  List,
  Target,
  Briefcase,
  HelpCircle,
  Calendar,
  IndianRupee,
  Luggage,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const { roleConfig, user } = useAuth();

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tasks', label: 'Task Management', icon: List },
    { id: 'leads', label: 'Lead Management', icon: Target },
    { id: 'projects', label: 'Project', icon: Briefcase },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'payroll', label: 'Payroll', icon: IndianRupee },
    { id: 'leave', label: 'Leave', icon: Luggage },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'employees', label: 'Employee Management', icon: Users },
    { id: 'management', label: 'Management', icon: Settings },
  ];

  // Dynamically filter menu items by role
  const menuItems = allMenuItems.filter((item) =>
    roleConfig.sidebarTabs.includes(item.id)
  );

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId === 'dashboard' ? 'overview' : tabId);
    if (onCloseMobile) onCloseMobile();
  };

  // Nav Items renderer reusable for desktop and drawer
  const renderNavList = (isDrawer = false) => {
    const isCompact = collapsed && !isDrawer;

    return (
      <nav className={`py-3 space-y-1.5 overflow-y-auto flex-1 no-scrollbar ${isCompact ? 'px-2' : 'px-3'}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id ||
            (item.id === 'dashboard' && activeTab === 'overview');

          if (isCompact) {
            return (
              <div key={item.id} className="relative group flex justify-center py-0.5">
                <button
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200 active:scale-95 relative ${
                    isActive
                      ? 'bg-gradient-to-tr from-[#635BFF] to-[#7B73FF] text-white shadow-md shadow-indigo-500/25 scale-105'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100/80 hover:scale-105'
                  }`}
                  aria-label={item.label}
                >
                  <Icon className="w-4 h-4 transition-transform duration-200" />
                </button>

                {/* Floating Tooltip */}
                <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900/90 backdrop-blur-xs text-white text-[11px] font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50 whitespace-nowrap">
                  {item.label}
                </div>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] transition-all duration-200 active:scale-[0.98] group text-left relative ${
                isActive
                  ? 'bg-[#F0EEFF] text-[#635BFF] font-bold shadow-[0_2px_12px_-2px_rgba(99,91,255,0.18)] border border-[#635BFF]/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 hover:translate-x-1 font-medium'
              }`}
            >
              {/* Icon Container with subtle animation */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-tr from-[#635BFF] to-[#7B73FF] text-white shadow-xs shadow-indigo-500/30 scale-105'
                    : 'bg-slate-100/80 text-slate-400 group-hover:bg-white group-hover:text-[#635BFF] group-hover:shadow-xs group-hover:scale-105'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <span className="truncate flex-1 tracking-tight">{item.label}</span>

              {/* Active right glow indicator */}
              {isActive ? (
                <span className="w-1.5 h-4 bg-[#635BFF] rounded-full shrink-0 shadow-xs shadow-indigo-500/40 animate-in fade-in zoom-in duration-200" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shrink-0" />
              )}
            </button>
          );
        })}
      </nav>
    );
  };

  return (
    <>
      {/* 1. Desktop Fixed / Collapsible Sidebar (Screens >= 1024px) */}
      <aside
        className={`hidden lg:flex sticky top-0 h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2.5rem)] lg:h-[calc(100vh-3.5rem)] self-start z-30 transition-all duration-300 flex-col justify-between flex-shrink-0 ${
          collapsed ? 'w-[76px]' : 'w-64'
        } bg-white/85 backdrop-blur-2xl border-r border-white/80 shadow-[8px_0_36px_-6px_rgba(15,23,42,0.12),2px_0_10px_-2px_rgba(15,23,42,0.06)] select-none`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/60 flex-shrink-0">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white font-black text-base shadow-md shadow-indigo-500/25 shrink-0 transition-transform duration-300 hover:scale-105">
                P
              </div>
              {!collapsed && (
                <div className="flex items-center truncate animate-in fade-in duration-200">
                  <span className="text-slate-900 font-extrabold text-base tracking-tight">
                    Prism<span className="text-[#635BFF]">CRM</span>
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-xl hover:bg-slate-100/80 text-slate-400 hover:text-slate-700 transition-all active:scale-95"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Desktop Nav Items */}
          {renderNavList(false)}
        </div>

        {/* Footer Role Badge & Expand Toggle */}
        <div className="p-3 border-t border-white/60 bg-gradient-to-b from-white/40 to-slate-50/80">
          {!collapsed ? (
            <div className="flex items-center space-x-2.5 p-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white/90 shadow-[0_4px_16px_-2px_rgba(15,23,42,0.12)] hover:shadow-[0_8px_24px_-4px_rgba(15,23,42,0.18)] transition-all duration-200">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#F0EEFF] text-[#635BFF] border border-[#635BFF]/20 flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || 'User'}
                </span>
                <span
                  className={`text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 border w-fit truncate ${roleConfig.badgeBg} ${roleConfig.badgeText} ${roleConfig.badgeBorder}`}
                >
                  {roleConfig.shortLabel || roleConfig.label}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center py-1">
              <button
                onClick={() => setCollapsed(false)}
                className="w-10 h-10 rounded-2xl bg-white/90 hover:bg-white text-slate-500 hover:text-slate-800 border border-white/80 shadow-[0_4px_14px_-2px_rgba(15,23,42,0.12)] hover:shadow-[0_6px_18px_-2px_rgba(15,23,42,0.18)] transition-all duration-200 flex items-center justify-center active:scale-95"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. Mobile & Tablet Slide-Over Drawer (< 1024px) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Slide-in Drawer Container */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-2xl shadow-[25px_0_60px_-10px_rgba(15,23,42,0.30)] flex flex-col justify-between h-full border-r border-white/80 animate-in slide-in-from-left duration-300 select-none">
            <div className="flex flex-col flex-1 min-h-0">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white font-black text-base shadow-md shadow-indigo-500/25">
                    P
                  </div>
                  <div>
                    <span className="text-slate-900 font-extrabold text-base tracking-tight">
                      Prism<span className="text-[#635BFF]">CRM</span>
                    </span>
                  </div>
                </div>

                {/* Close Button with generous touch area */}
                <button
                  onClick={onCloseMobile}
                  className="p-2 min-h-[44px] min-w-[44px] rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center"
                  title="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Nav List */}
              {renderNavList(true)}
            </div>

            {/* Drawer User Info Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-3 p-2 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-[#F0EEFF] text-[#635BFF] border border-[#635BFF]/20 flex items-center justify-center font-bold text-xs overflow-hidden shadow-xs">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                  <span
                    className={`text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 border ${roleConfig.badgeBg} ${roleConfig.badgeText} ${roleConfig.badgeBorder}`}
                  >
                    {roleConfig.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
