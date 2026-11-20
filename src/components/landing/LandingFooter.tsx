'use client';

import React from 'react';
import Link from 'next/link';
import {
  Layers,
  Mail,
  Phone,
  LayoutDashboard,
  ShieldCheck,
  MapPin,
  Sparkles,
  ArrowRight,
  Lock,
} from 'lucide-react';
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
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const email = contact?.email || DEFAULT_LANDING_CONTENT.contact.email;
  const phone = contact?.phone || DEFAULT_LANDING_CONTENT.contact.phone;
  const address = contact?.address || DEFAULT_LANDING_CONTENT.contact.address;

  return (
    <footer className="border-t border-slate-200/80 bg-white/90 backdrop-blur-xl pt-16 pb-12 mt-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* 5-Column Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Column 1: Brand & Tagline (spans 2 cols on mobile) */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group" aria-label="PrismCRM Home">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#635BFF] via-[#5249EC] to-[#00D4B2] p-[1.5px] shadow-sm">
                <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="font-extrabold tracking-tight text-xl text-slate-900">
                Prism<span className="text-[#635BFF]">CRM</span>
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm font-normal">
              The unified multi-tenant enterprise operating system. Manage sales pipelines, GST invoices, project tasks, smart geofenced attendance, and payroll in one company workspace.
            </p>

            <div className="pt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Operational
              </span>
            </div>
          </div>

          {/* Column 2: Platform Modules */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button type="button" onClick={() => scrollToSection('features')} className="hover:text-[#635BFF] transition-colors">
                  Sales & Quotations
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('features')} className="hover:text-[#635BFF] transition-colors">
                  GST Invoicing
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('features')} className="hover:text-[#635BFF] transition-colors">
                  Smart Geofence Attendance
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('features')} className="hover:text-[#635BFF] transition-colors">
                  Kanban Task Management
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('features')} className="hover:text-[#635BFF] transition-colors">
                  Automated Payroll
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Solutions & Architecture */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Solutions</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button type="button" onClick={() => scrollToSection('solutions')} className="hover:text-[#635BFF] transition-colors">
                  Interactive Showcase
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('architecture')} className="hover:text-[#635BFF] transition-colors">
                  Multi-Tenant Architecture
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('how-it-works')} className="hover:text-[#635BFF] transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('roles')} className="hover:text-[#635BFF] transition-colors">
                  Role-Based Access
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('security')} className="hover:text-[#635BFF] transition-colors">
                  Security & Isolation
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Enterprise Contact</h4>
            <div className="space-y-2 text-xs text-slate-600">
              {email && (
                <div>
                  <a href={`mailto:${email}`} className="hover:text-[#635BFF] transition-colors flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{email}</span>
                  </a>
                </div>
              )}
              {phone && (
                <div>
                  <a href={`tel:${phone}`} className="hover:text-[#635BFF] transition-colors flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{phone}</span>
                  </a>
                </div>
              )}
              {address && (
                <div className="flex items-start gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{address}</span>
                </div>
              )}

              <div className="pt-3">
                {isAuthenticated ? (
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 font-bold hover:bg-purple-100 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Open Dashboard</span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In to Workspace</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Privacy */}
        <div className="pt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {currentYear} PrismCRM. All rights reserved. Strict Multi-Tenant Separation.
          </p>
          <div className="flex items-center gap-6 font-medium">
            <button type="button" onClick={() => scrollToSection('security')} className="hover:text-slate-800 transition-colors">
              Data Privacy & Isolation
            </button>
            <button type="button" onClick={() => scrollToSection('faq')} className="hover:text-slate-800 transition-colors">
              FAQ
            </button>
            <button type="button" onClick={() => scrollToSection('contact')} className="hover:text-[#635BFF] font-semibold transition-colors">
              Request Workspace
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
