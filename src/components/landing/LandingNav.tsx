'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layers, Menu, X, ArrowRight, Sparkles } from 'lucide-react';

interface NavItem {
  label: string;
  targetId: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', targetId: 'home' },
  { label: 'Features', targetId: 'features' },
  { label: 'Solutions', targetId: 'solutions' },
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
      setIsScrolled(scrollY > 20);
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
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)]'
          : 'bg-white/40 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('home');
          }}
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#635BFF] rounded-2xl p-1"
          aria-label="PrismCRM Enterprise Home"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#635BFF] via-[#5249EC] to-[#00D4B2] p-[1.5px] shadow-md shadow-[#635BFF]/25 group-hover:shadow-lg group-hover:shadow-[#635BFF]/35 group-hover:scale-105 transition-all duration-300">
            <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-white transition-transform group-hover:rotate-12 duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-xl text-slate-900 group-hover:text-[#635BFF] transition-colors">
                Prism<span className="text-[#635BFF]">CRM</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 text-[#635BFF] border border-[#D8D4FF]">
                <Sparkles className="w-2.5 h-2.5 text-[#00D4B2]" />
                SaaS
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium tracking-tight -mt-0.5">
              Unified Operating System
            </span>
          </div>
        </Link>

        {/* Center Desktop Navigation */}
        <nav
          className="hidden lg:flex items-center gap-1 px-4 py-1.5 rounded-full bg-slate-100/70 border border-slate-200/60 backdrop-blur-md"
          aria-label="Primary Navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeItem === item.targetId;
            return (
              <button
                key={item.targetId}
                type="button"
                onClick={() => scrollToSection(item.targetId)}
                className={`relative px-4 py-2 text-xs font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#635BFF] ${
                  isActive
                    ? 'text-[#635BFF] font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <span>{item.label}</span>
                {/* Animated active/hover underline indicator */}
                {isActive && (
                  <span className="absolute bottom-1 left-3 right-3 h-[2px] bg-gradient-to-r from-[#635BFF] to-[#00D4B2] rounded-full animate-pulse-subtle" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-[#635BFF] hover:bg-slate-100/80 transition-all focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
          >
            Sign In
          </Link>
          <button
            type="button"
            onClick={() => scrollToSection('contact')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#635BFF] to-[#5249EC] hover:from-[#5249EC] hover:to-[#4338ca] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#635BFF]/30 hover:shadow-lg hover:shadow-[#635BFF]/40 active:scale-95 transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635BFF]"
          >
            <span>Request a Demo</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => scrollToSection('contact')}
            className="px-3 py-2 rounded-xl bg-[#635BFF] text-white font-bold text-xs shadow-sm flex items-center gap-1 sm:hidden"
          >
            <span>Demo</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-slate-800" /> : <Menu className="w-6 h-6 text-slate-800" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown with smooth entrance */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200/80 bg-white/95 backdrop-blur-2xl px-5 py-6 shadow-2xl space-y-4 animate-in slide-in-from-top-3 duration-200">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.targetId}
                type="button"
                onClick={() => scrollToSection(item.targetId)}
                className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:text-[#635BFF] hover:bg-[#F0EEFF]/50 rounded-xl transition-colors flex items-center justify-between"
              >
                <span>{item.label}</span>
                <span className="text-xs text-slate-400">→</span>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-xl border border-slate-200 text-center font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors block"
            >
              Sign In to Workspace
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="w-full py-3 rounded-xl bg-[#635BFF] hover:bg-[#5249EC] text-white font-bold text-sm shadow-md shadow-[#635BFF]/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Request a Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
