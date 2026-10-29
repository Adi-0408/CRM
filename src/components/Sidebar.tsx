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
      <nav className={`p-3 space-y-1 overflow-y-auto flex-1 no-scrollbar ${isCompact ? 'px-2' : 'px-3'}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id ||
            (item.id === 'dashboard' && activeTab === 'overview');

          if (isCompact) {
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-150 active:scale-95 group relative ${
                  isActive
                    ? 'bg-[#F0EEFF] text-[#635BFF] border border-[#635BFF]/30 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
                title={item.label}
              >
                <Icon
                  className={`w-4 h-4 transition-transform duration-150 group-hover:scale-110 ${
                    isActive ? 'text-[#635BFF]' : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute right-1 top-1 w-2 h-2 rounded-full bg-[#635BFF] ring-2 ring-white" />
                )}
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 active:scale-[0.99] group text-left ${
                isActive
                  ? 'bg-[#F0EEFF] text-[#635BFF] font-bold border border-[#635BFF]/25 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/90 font-medium'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 ${
                  isActive
                    ? 'bg-[#635BFF] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200/70 group-hover:text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              <span className="truncate flex-1">{item.label}</span>

              {isActive && (
                <span className="w-1.5 h-3.5 bg-[#635BFF] rounded-full shrink-0" />
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
          collapsed ? 'w-20' : 'w-64'
        } bg-white/90 backdrop-blur-md border-r border-slate-200/70 shadow-[2px_0_16px_-4px_rgba(15,23,42,0.02)] select-none`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#635BFF] via-[#7B73FF] to-[#8C84FF] flex items-center justify-center text-white font-extrabold text-base shadow-sm shadow-[#635BFF]/25 flex-shrink-0">
                P
              </div>
              {!collapsed && (
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-slate-900 font-extrabold text-base tracking-tight">
                    Prism<span className="text-[#635BFF]">CRM</span>
                  </span>
                  <span className="bg-[#F0EEFF] text-[#635BFF] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#635BFF]/20 shrink-0">
                    Enterprise
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Desktop Nav Items */}
          {renderNavList(false)}
        </div>

        {/* Footer Role Badge & Collapse Button */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
          {!collapsed ? (
            <>
              <div className="flex items-center space-x-2.5 overflow-hidden flex-1 min-w-0 pr-1">
                <div className="w-8 h-8 rounded-full bg-[#F0EEFF] text-[#635BFF] border border-[#635BFF]/20 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex flex-col overflow-hidden min-w-0">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {user?.name || 'User'}
                  </span>
                  <span
                    className={`text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 border w-fit truncate ${roleConfig.badgeBg} ${roleConfig.badgeText} ${roleConfig.badgeBorder}`}
                  >
                    {roleConfig.shortLabel || roleConfig.label}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <button
                onClick={() => setCollapsed(false)}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
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
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col justify-between h-full border-r border-slate-100 animate-in slide-in-from-left duration-300 select-none">
            <div className="flex flex-col flex-1 min-h-0">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#635BFF] via-[#7B73FF] to-[#8C84FF] flex items-center justify-center text-white font-extrabold text-base shadow-sm shadow-[#635BFF]/25">
                    P
                  </div>
                  <div>
                    <span className="text-slate-900 font-extrabold text-base tracking-tight">
                      Prism<span className="text-[#635BFF]">CRM</span>
                    </span>
                    <span className="ml-2 bg-[#F0EEFF] text-[#635BFF] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#635BFF]/20">
                      Enterprise
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
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-[#F0EEFF] text-[#635BFF] border border-[#635BFF]/20 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                  )}
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
