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
      <nav className={`py-3 space-y-1 overflow-y-auto flex-1 no-scrollbar ${isCompact ? 'px-2' : 'px-3'}`}>
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
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-95 relative ${
                    isActive
                      ? 'bg-[#F0EEFF] text-[#635BFF] font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  aria-label={item.label}
                >
                  <Icon className="w-4 h-4" />
                </button>

                {/* Floating Tooltip */}
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900/90 backdrop-blur-xs text-white text-[11px] font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50 whitespace-nowrap">
                  {item.label}
                </div>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 active:scale-[0.99] group text-left ${
                isActive
                  ? 'bg-[#F0EEFF] text-[#635BFF] font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 font-medium'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? 'text-[#635BFF]'
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span className="truncate flex-1 tracking-tight">{item.label}</span>
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
        className={`hidden lg:flex sticky top-0 h-full self-stretch z-30 transition-all duration-200 flex-col justify-between flex-shrink-0 ${
          collapsed ? 'w-[72px]' : 'w-60'
        } bg-white border-r border-slate-100 select-none`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header - Height 16 (64px) matching Navbar height */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-[#635BFF] flex items-center justify-center text-white font-extrabold text-sm shadow-xs shrink-0">
                P
              </div>
              {!collapsed && (
                <div className="flex items-center truncate animate-in fade-in duration-150">
                  <span className="text-slate-900 font-extrabold text-base tracking-tight">
                    Prism<span className="text-[#635BFF]">CRM</span>
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors active:scale-95"
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
        <div className="p-3 border-t border-slate-100 bg-white flex-shrink-0">
          {!collapsed ? (
            <div className="flex items-center space-x-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#F0EEFF] text-[#635BFF] border border-[#635BFF]/15 flex items-center justify-center font-bold text-xs overflow-hidden">
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
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white rounded-full" />
              </div>
              <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {user?.name || 'User'}
                </span>
                <span
                  className={`text-[9px] font-medium px-1.5 py-0.2 rounded-full inline-block mt-0.5 border w-fit truncate ${roleConfig.badgeBg} ${roleConfig.badgeText} ${roleConfig.badgeBorder}`}
                >
                  {roleConfig.shortLabel || roleConfig.label}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center py-1">
              <button
                onClick={() => setCollapsed(false)}
                className="w-9 h-9 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-700 border border-slate-200/80 transition-colors flex items-center justify-center active:scale-95"
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
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Slide-in Drawer Container */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col justify-between h-full border-r border-slate-100 animate-in slide-in-from-left duration-200 select-none">
            <div className="flex flex-col flex-1 min-h-0">
              {/* Drawer Top Header */}
              <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#635BFF] flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
                    P
                  </div>
                  <div>
                    <span className="text-slate-900 font-extrabold text-base tracking-tight">
                      Prism<span className="text-[#635BFF]">CRM</span>
                    </span>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={onCloseMobile}
                  className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
                  title="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Nav List */}
              {renderNavList(true)}
            </div>

            {/* Drawer User Info Footer */}
            <div className="p-3 border-t border-slate-100 bg-white">
              <div className="flex items-center space-x-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-[#F0EEFF] text-[#635BFF] border border-[#635BFF]/15 flex items-center justify-center font-bold text-xs overflow-hidden">
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
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white rounded-full" />
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
                  <span
                    className={`text-[9px] font-medium px-1.5 py-0.2 rounded-full inline-block mt-0.5 border ${roleConfig.badgeBg} ${roleConfig.badgeText} ${roleConfig.badgeBorder}`}
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
