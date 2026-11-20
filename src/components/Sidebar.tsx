'use client';

import React from 'react';
import Link from 'next/link';
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
  Shield,
  Building2,
  Inbox,
  Globe,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  unreadInquiriesCount?: number;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  mobileOpen = false,
  onCloseMobile,
  unreadInquiriesCount = 0,
}: SidebarProps) {
  const { roleConfig, user } = useAuth();
  const { branding } = useTenant();

  const superAdminMenuItems = [
    { id: 'organizations', label: 'Organizations & Tenants', icon: Building2 },
    { id: 'inquiries', label: 'Inquiries', icon: Inbox, badge: unreadInquiriesCount },
    { id: 'landing_cms', label: 'Landing Page CMS', icon: Globe },
  ];

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tasks', label: 'Task Management', icon: List },
    { id: 'leads', label: 'Lead Management', icon: Target },
    { id: 'projects', label: 'Project', icon: Briefcase },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'payroll', label: 'Payroll', icon: IndianRupee },
    { id: 'leave', label: 'Leave', icon: Luggage },
    { id: 'support', label: 'Tech Support', icon: HelpCircle },
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
        {user?.role === 'platform_super_admin' ? (
          <div className="space-y-1">
            {!isCompact && (
              <div className="px-3 pt-1 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Platform Console
                </span>
              </div>
            )}
            {superAdminMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === 'organizations' && activeTab === 'super_admin');
              const badgeCount = item.badge || 0;

              if (isCompact) {
                return (
                  <div key={item.id} className="relative group flex justify-center py-0.5">
                    <button
                      type="button"
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-95 relative ${
                        isActive
                          ? 'bg-purple-600 text-white font-bold shadow-xs'
                          : 'text-slate-500 hover:text-purple-700 hover:bg-purple-50'
                      }`}
                      aria-label={item.label}
                    >
                      <Icon className="w-4 h-4" />
                      {badgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white">
                          {badgeCount > 9 ? '9+' : badgeCount}
                        </span>
                      )}
                    </button>
                    {/* Tooltip */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900/90 backdrop-blur-xs text-white text-[11px] font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50 whitespace-nowrap flex items-center gap-1.5">
                      <span>{item.label}</span>
                      {badgeCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                          {badgeCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 active:scale-[0.99] group text-left ${
                    isActive
                      ? 'bg-purple-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-purple-50/70 font-medium'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-purple-600'
                    }`}
                  />
                  <span className="truncate flex-1 tracking-tight">{item.label}</span>
                  {badgeCount > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-2xs ${
                        isActive
                          ? 'bg-white text-purple-700'
                          : 'bg-purple-600 text-white'
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          menuItems.map((item) => {
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
                      ? 'font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: 'var(--color-primary-light, #F0EEFF)',
                          color: branding.primary_color || 'var(--color-primary, #635BFF)',
                        }
                      : undefined
                  }
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
                  ? 'font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 font-medium'
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: 'var(--color-primary-light, #F0EEFF)',
                      color: branding.primary_color || 'var(--color-primary, #635BFF)',
                    }
                  : undefined
              }
            >
              <Icon
                className="w-4 h-4 shrink-0 transition-colors"
                style={isActive ? { color: branding.primary_color || 'var(--color-primary, #635BFF)' } : undefined}
              />
              <span className="truncate flex-1 tracking-tight">{item.label}</span>
            </button>
          );
        })
        )}
      </nav>
    );
  };

  return (
    <>
      {/* 1. Desktop Fixed / Collapsible Sidebar (Screens >= 1024px) */}
      <aside
        className={`hidden lg:flex h-full self-stretch z-30 transition-all duration-200 flex-col justify-between flex-shrink-0 ${
          collapsed ? 'w-[72px]' : 'w-60'
        } bg-white/65 backdrop-blur-2xl backdrop-saturate-150 border-r border-slate-200/50 shadow-[4px_0_24px_-4px_rgba(15,23,42,0.03)] select-none`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header - Height 16 (64px) matching Navbar height */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/50 bg-white/40 backdrop-blur-md flex-shrink-0">
            {user?.role === 'platform_super_admin' ? (
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                {!collapsed && (
                  <div className="flex flex-col truncate animate-in fade-in duration-150">
                    <span className="text-slate-900 font-extrabold text-base tracking-tight truncate leading-tight">
                      Prism Platform
                    </span>
                    <span className="text-[10px] font-semibold text-purple-600 tracking-tight">
                      Super Admin Hub
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-xs shrink-0 overflow-hidden"
                  style={{ backgroundColor: branding.primary_color || '#635BFF' }}
                >
                  {branding.logo_url ? (
                    <img src={branding.logo_url} alt={branding.brand_name} className="w-full h-full object-cover" />
                  ) : (
                    (branding.brand_name || 'C').charAt(0).toUpperCase()
                  )}
                </div>
                {!collapsed && (
                  <div className="flex items-center truncate animate-in fade-in duration-150">
                    <span className="text-slate-900 font-extrabold text-base tracking-tight truncate">
                      {branding.brand_name || 'Enterprise CRM'}
                    </span>
                  </div>
                )}
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-lg hover:bg-slate-100/80 text-slate-400 hover:text-slate-600 transition-colors active:scale-95"
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
        <div className="p-3 border-t border-slate-200/50 bg-white/40 backdrop-blur-md flex-shrink-0">
          {!collapsed ? (
            <div className="flex items-center space-x-2.5 p-2 rounded-xl hover:bg-white/70 transition-colors">
              <div className="relative shrink-0">
                <div
                  className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-primary-light, #F0EEFF)',
                    color: branding.primary_color || 'var(--color-primary, #635BFF)',
                    borderColor: 'var(--color-primary-border, rgba(99,91,255,0.15))',
                  }}
                >
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
                className="w-9 h-9 rounded-xl hover:bg-white/80 text-slate-400 hover:text-slate-700 border border-slate-200/80 transition-colors flex items-center justify-center active:scale-95"
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
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Slide-in Drawer Container */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white/85 backdrop-blur-2xl backdrop-saturate-150 shadow-2xl flex flex-col justify-between h-full border-r border-slate-200/60 animate-in slide-in-from-left duration-200 select-none">
            <div className="flex flex-col flex-1 min-h-0">
              {/* Drawer Top Header */}
              <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200/50 bg-white/50 backdrop-blur-md">
                {user?.role === 'platform_super_admin' ? (
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-slate-900 font-extrabold text-base tracking-tight truncate leading-tight">
                        Prism Platform
                      </span>
                      <span className="text-[10px] font-semibold text-purple-600 tracking-tight">
                        Super Admin Hub
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-xs shrink-0 overflow-hidden"
                      style={{ backgroundColor: branding.primary_color || '#635BFF' }}
                    >
                      {branding.logo_url ? (
                        <img src={branding.logo_url} alt={branding.brand_name} className="w-full h-full object-cover" />
                      ) : (
                        (branding.brand_name || 'C').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-slate-900 font-extrabold text-base tracking-tight truncate block">
                        {branding.brand_name || 'Enterprise CRM'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={onCloseMobile}
                  className="p-2 rounded-xl hover:bg-slate-100/80 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
                  title="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Nav List */}
              {renderNavList(true)}
            </div>

            {/* Drawer User Info Footer */}
            <div className="p-3 border-t border-slate-200/50 bg-white/50 backdrop-blur-md">
              <div className="flex items-center space-x-2.5 p-2 rounded-xl hover:bg-white/70 transition-colors">
                <div className="relative shrink-0">
                  <div
                  className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-primary-light, #F0EEFF)',
                    color: branding.primary_color || 'var(--color-primary, #635BFF)',
                    borderColor: 'var(--color-primary-border, rgba(99,91,255,0.15))',
                  }}
                >
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
