'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  Lock,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface NavItem {
  label: string;
  targetId: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', targetId: 'home' },
  { label: 'Features', targetId: 'features' },
  { label: 'Solutions', targetId: 'solutions' },
  { label: 'Architecture', targetId: 'architecture' },
  { label: 'How It Works', targetId: 'how-it-works' },
  { label: 'Security', targetId: 'security' },
  { label: 'FAQ', targetId: 'faq' },
];

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeItem, setActiveItem] = useState('home');

  useEffect(() => {
    const container = document.getElementById('landing-scroll-container') || window;
    const handleScroll = () => {
      const scrollY = container instanceof Window ? window.scrollY : (container as HTMLElement).scrollTop;
      setIsScrolled(scrollY > 25);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (targetId: string) => {
    setMobileMenuOpen(false);
    setActiveItem(targetId);

    if (targetId === 'home') {
      const container = document.getElementById('landing-scroll-container');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full px-3 sm:px-6 lg:px-8 py-3 transition-all duration-300 pointer-events-none">
      <div
        className={`max-w-7xl mx-auto rounded-2xl sm:rounded-full transition-all duration-300 pointer-events-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between ${
          isScrolled
            ? 'bg-white/85 backdrop-blur-2xl border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.08)]'
            : 'bg-white/60 backdrop-blur-xl border border-slate-200/50 shadow-sm'
        }`}
      >
        {/* Brand Logo & Name */}
        <Link
          href="/"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('home');
          }}
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#635BFF] rounded-full p-1"
          aria-label="PrismCRM Enterprise Home"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#635BFF] via-[#5249EC] to-[#00D4B2] p-[1.5px] shadow-md shadow-[#635BFF]/20 group-hover:shadow-lg group-hover:shadow-[#635BFF]/35 group-hover:scale-105 transition-all duration-300">
            <div className="w-full h-full bg-[#0F172A] rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white transition-transform group-hover:rotate-12 duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-lg sm:text-xl text-slate-900 group-hover:text-[#635BFF] transition-colors">
                Prism<span className="text-[#635BFF]">CRM</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 text-[#635BFF] border border-[#D8D4FF]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Enterprise
              </span>
            </div>
            <span className="hidden md:inline-block text-[10px] text-slate-500 font-medium tracking-tight -mt-0.5">
              Unified Operating System
            </span>
          </div>
        </Link>

        {/* Center Desktop Navigation Pill Bar */}
        <nav
          className="hidden lg:flex items-center gap-0.5 px-3 py-1 rounded-full bg-slate-100/70 border border-slate-200/60 shadow-inner backdrop-blur-md"
          aria-label="Primary Navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeItem === item.targetId;
            return (
              <button
                key={item.targetId}
                type="button"
                onClick={() => scrollToSection(item.targetId)}
                className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#635BFF] ${
                  isActive
                    ? 'text-[#635BFF] font-bold bg-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right CTA Actions (Login moved to footer; primary focus on Demo & Portal scroll) */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Subtle Portal Link that scrolls to the new dedicated footer login portal */}
          <button
            type="button"
            onClick={() => scrollToSection('member-portal')}
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#635BFF] hover:bg-slate-100/80 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            title="Member login portal is located in the footer"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#635BFF]" />
            <span>Portal Login ↓</span>
          </button>

          {/* Primary CTA Button */}
          <button
            type="button"
            onClick={() => scrollToSection('contact')}
            className="px-4.5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#635BFF] via-[#5249EC] to-[#4338CA] hover:from-[#5249EC] hover:to-[#3730A3] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#635BFF]/25 hover:shadow-lg hover:shadow-[#635BFF]/35 active:scale-95 transition-all flex items-center gap-2 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635BFF]"
          >
            <span>Request a Demo</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Mobile Hamburger & Quick Demo Button */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => scrollToSection('contact')}
            className="px-3 py-1.5 rounded-full bg-[#635BFF] text-white font-bold text-xs shadow-sm flex items-center gap-1 sm:hidden"
          >
            <span>Demo</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 min-h-[40px] min-w-[40px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5 text-slate-800" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown with clean glassmorphic styling */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 max-w-7xl mx-auto rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-2xl p-5 shadow-2xl space-y-4 pointer-events-auto animate-in slide-in-from-top-3 duration-200">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.targetId}
                type="button"
                onClick={() => scrollToSection(item.targetId)}
                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-[#635BFF] hover:bg-[#F0EEFF]/60 rounded-xl transition-colors flex items-center justify-between"
              >
                <span>{item.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200/80 space-y-2">
            <button
              type="button"
              onClick={() => scrollToSection('member-portal')}
              className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Workspace Portal Login (in Footer)</span>
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="w-full py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5249EC] text-white font-bold text-xs shadow-md shadow-[#635BFF]/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00D4B2]" />
              <span>Request an Enterprise Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
