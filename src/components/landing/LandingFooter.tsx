'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, Mail, Phone, LayoutDashboard, Lock } from 'lucide-react';
import { ILandingContent, DEFAULT_LANDING_CONTENT } from '@/models/LandingContent';
import { useAuth } from '@/context/AuthContext';

interface LandingFooterProps {
  contact?: ILandingContent['contact'];
}

export default function LandingFooter({ contact = DEFAULT_LANDING_CONTENT.contact }: LandingFooterProps) {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated } = useAuth();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const email = contact?.email || DEFAULT_LANDING_CONTENT.contact.email;
  const phone = contact?.phone || DEFAULT_LANDING_CONTENT.contact.phone;

  return (
    <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-12 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
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

          {/* Contact Details */}
          {(email || phone) && (
            <div className="flex items-center gap-5 text-xs text-slate-500 font-medium">
              {email && (
                <a href={`mailto:${email}`} className="hover:text-[#635BFF] transition-colors flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{email}</span>
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="hover:text-[#635BFF] transition-colors flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{phone}</span>
                </a>
              )}
            </div>
          )}

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
          </div>

          {/* Login & Dashboard Access Section in Footer */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <Link
                href="/"
                className="px-4 py-2.5 rounded-xl border border-purple-200 hover:border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#635BFF] active:scale-95"
              >
                <LayoutDashboard className="w-4 h-4 text-purple-600" />
                <span>Open Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2.5 rounded-xl border border-slate-200/90 hover:border-slate-300 text-slate-700 hover:text-slate-900 font-semibold text-xs sm:text-sm bg-white hover:bg-slate-50 transition-all shadow-xs flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#635BFF] active:scale-95"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Log in</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
