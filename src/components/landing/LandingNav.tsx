'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layers, Menu, X, ArrowRight, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-xs transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-[#635BFF] rounded-xl p-1"
          aria-label="PrismCRM Home"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#635BFF] to-[#00D4B2] flex items-center justify-center text-white shadow-md shadow-[#635BFF]/20 group-hover:scale-105 transition-transform duration-200">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-lg text-slate-900 flex items-center gap-1.5">
              PrismCRM
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
                Enterprise
              </span>
            </span>
          </div>
        </Link>

        {/* Desktop Anchor Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600" aria-label="Main Navigation">
          <button
            type="button"
            onClick={() => scrollToSection('features')}
            className="hover:text-[#635BFF] transition-colors py-2 focus:outline-none focus:ring-2 focus:ring-[#635BFF] rounded-lg px-2"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-[#635BFF] transition-colors py-2 focus:outline-none focus:ring-2 focus:ring-[#635BFF] rounded-lg px-2"
          >
            How it works
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('contact')}
            className="hover:text-[#635BFF] transition-colors py-2 focus:outline-none focus:ring-2 focus:ring-[#635BFF] rounded-lg px-2"
          >
            Contact
          </button>
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl border border-purple-200 hover:border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 font-semibold text-xs sm:text-sm transition-all shadow-xs min-h-[44px] flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            >
              <LayoutDashboard className="w-4 h-4 text-purple-600" />
              <span>Open Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2.5 rounded-xl border border-slate-200/80 hover:border-slate-300 text-slate-700 hover:text-slate-900 font-semibold text-xs sm:text-sm bg-white hover:bg-slate-50 transition-all shadow-xs min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            >
              Log in
            </Link>
          )}
          <button
            type="button"
            onClick={() => scrollToSection('contact')}
            className="px-5 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5249EC] text-white font-semibold text-xs sm:text-sm shadow-md shadow-[#635BFF]/25 hover:shadow-lg hover:shadow-[#635BFF]/35 active:scale-95 transition-all min-h-[44px] flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635BFF]"
          >
            <span>Send an inquiry</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated ? (
            <Link
              href="/"
              className="px-3 py-2 rounded-xl border border-purple-200 text-purple-700 font-semibold text-xs bg-purple-50 min-h-[44px] flex items-center"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs bg-white min-h-[44px] flex items-center"
            >
              Log in
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 shadow-lg">
          <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700" aria-label="Mobile Navigation">
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              How it works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Contact
            </button>
          </nav>
          <div className="pt-2 border-t border-slate-150">
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="w-full py-3 rounded-xl bg-[#635BFF] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#635BFF]/20"
            >
              <span>Send an inquiry</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
