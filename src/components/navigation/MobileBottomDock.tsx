'use client';

import React from 'react';
import {
  Activity,
  CheckSquare,
  Clock,
  FolderKanban,
  HelpCircle,
  Menu,
  Users2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface MobileBottomDockProps {
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  onToggleMobileMenu: () => void;
}

export default function MobileBottomDock({
  activeTab,
  onNavigateTab,
  onToggleMobileMenu,
}: MobileBottomDockProps) {
  const { role } = useAuth();

  // Role-appropriate 4th item
  const fourthItem =
    role === 'sales'
      ? { id: 'leads', label: 'Leads', icon: Users2 }
      : role === 'tech_support'
      ? { id: 'support', label: 'Support', icon: HelpCircle }
      : { id: 'projects', label: 'Projects', icon: FolderKanban };

  const navItems = [
    { id: 'overview', label: 'Home', icon: Activity },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'attendance', label: 'Clock', icon: Clock },
    fourthItem,
  ];

  return (
    <nav
      aria-label="Mobile Navigation Dock"
      className="lg:hidden fixed bottom-3 inset-x-3 max-w-sm sm:max-w-md mx-auto z-40 bg-white/92 backdrop-blur-2xl border border-slate-200/80 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.20),0_4px_16px_-2px_rgba(15,23,42,0.08)] rounded-full p-1.5 flex items-center justify-between select-none"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigateTab(item.id)}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-all duration-200 cursor-pointer active:scale-95 ${
              isActive
                ? 'bg-[#635BFF] text-white shadow-xs font-bold scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold leading-none">
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Menu / More button */}
      <button
        type="button"
        onClick={onToggleMobileMenu}
        className="flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full text-slate-500 hover:text-slate-800 transition-all duration-200 cursor-pointer active:scale-95"
        title="Open full navigation drawer"
      >
        <Menu className="w-4 h-4 text-slate-500" />
        <span className="text-[10px] mt-0.5 tracking-tight font-semibold leading-none">
          More
        </span>
      </button>
    </nav>
  );
}
