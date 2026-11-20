'use client';

import React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-12 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#635BFF] to-[#00D4B2] flex items-center justify-center text-white shadow-xs">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold tracking-tight text-slate-900 text-sm">
            PrismCRM
          </span>
          <span className="text-xs text-slate-400">
            &copy; {currentYear} All rights reserved.
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => scrollToSection('features')}
            className="hover:text-[#635BFF] transition-colors py-1"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-[#635BFF] transition-colors py-1"
          >
            How it works
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('contact')}
            className="hover:text-[#635BFF] transition-colors py-1"
          >
            Contact
          </button>
          <Link
            href="/login"
            className="hover:text-[#635BFF] transition-colors py-1"
          >
            Sign In
          </Link>
        </div>
      </div>
    </footer>
  );
}
