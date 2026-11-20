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
  Clock,
  ArrowUp,
  Building2,
  Users,
  CheckCircle2,
  Shield,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { ILandingContent, DEFAULT_LANDING_CONTENT } from '@/models/LandingContent';
import { useAuth } from '@/context/AuthContext';

interface LandingFooterProps {
  contact?: ILandingContent['contact'];
}

export default function LandingFooter({ contact = DEFAULT_LANDING_CONTENT.contact }: LandingFooterProps) {
  const currentYear = new Date().getFullYear();
  const { user, isAuthenticated } = useAuth();

  const scrollToSection = (id: string) => {
    if (id === 'top' || id === 'home') {
      const container = document.getElementById('landing-scroll-container');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const email = contact?.email || DEFAULT_LANDING_CONTENT.contact.email;
  const phone = contact?.phone || DEFAULT_LANDING_CONTENT.contact.phone;
  const address = contact?.address || DEFAULT_LANDING_CONTENT.contact.address;

  return (
    <footer className="border-t border-slate-200/80 bg-gradient-to-b from-white via-slate-50/80 to-slate-100/90 backdrop-blur-xl pt-16 sm:pt-20 pb-12 relative overflow-hidden text-slate-800">
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#635BFF]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00D4B2]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
        {/* =======================================================================
            1. PRE-FOOTER CONVERSION BANNER ("Transform Your Operations")
            ======================================================================= */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0B0F19] text-white p-8 sm:p-12 lg:p-14 border border-slate-800/80 shadow-2xl">
          {/* Ambient Lighting Blobs */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#635BFF]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#00D4B2]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-[#00D4B2]" />
                <span>Enterprise Multi-Tenant Infrastructure</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Ready to unify your sales, attendance, billing, and team operations?
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                Experience high-performance company workspace management with strict data isolation, smart geofencing, and automated GST billing.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>99.99% Uptime Guarantee</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Isolated Company Database</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Free Onboarding Support</span>
                </span>
              </div>
            </div>

            {/* Action Hub */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={() => scrollToSection('contact')}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#635BFF] via-[#5249EC] to-[#4338CA] hover:from-[#5249EC] hover:to-[#3730A3] text-white font-bold text-sm shadow-xl shadow-[#635BFF]/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0F172A] focus:ring-[#635BFF]"
              >
                <span>Request a Custom Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('member-portal')}
                className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-indigo-300" />
                <span>Go to Workspace Login</span>
              </button>
            </div>
          </div>
        </div>

        {/* =======================================================================
            2. DEDICATED WORKSPACE & MEMBER LOGIN PORTAL SECTION
               (Prominently placed in the footer per user request)
            ======================================================================= */}
        <section
          id="member-portal"
          aria-labelledby="member-portal-heading"
          className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-md shadow-slate-200/50 space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#635BFF] uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-[#635BFF]" />
                <span>Member Portal &amp; Workspace Access</span>
              </div>
              <h3 id="member-portal-heading" className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Log In to Your Company CRM Workspace
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Authorized access for company administrators, managers, accountants, and team employees.
              </p>
            </div>

            {/* Direct Login CTA */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  href="/"
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-500/25 flex items-center gap-2 active:scale-95 transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Open Active Dashboard ({user?.role || 'Member'})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-lg shadow-slate-900/20 flex items-center gap-2 active:scale-95 transition-all"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Quick Access Tiles for Different Roles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <Link
              href="/login"
              className="p-4 rounded-2xl border border-slate-200/80 hover:border-[#635BFF]/50 bg-slate-50/60 hover:bg-white hover:shadow-md transition-all group block"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-[#635BFF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#635BFF] transition-colors flex items-center gap-1">
                    <span>Company Admin Login</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Manage leads, branches, GST billing, and payroll
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/login"
              className="p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-500/50 bg-slate-50/60 hover:bg-white hover:shadow-md transition-all group block"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
                    <span>Employee Attendance Clock</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Geofenced office punch &amp; facial selfie verification
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/superadmin"
              className="p-4 rounded-2xl border border-slate-200/80 hover:border-purple-500/50 bg-slate-50/60 hover:bg-white hover:shadow-md transition-all group block"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors flex items-center gap-1">
                    <span>Super Admin Console</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Global tenant provisioning &amp; platform settings
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* =======================================================================
            3. 5-COLUMN ENTERPRISE NAVIGATION MATRIX
            ======================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 pt-4">
          {/* Column 1: Brand & Tagline (spans 2 cols on mobile) */}
          <div className="col-span-2 space-y-4">
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('top');
              }}
              className="flex items-center gap-3 group"
              aria-label="PrismCRM Home"
            >
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
              The unified multi-tenant enterprise operating system. Manage sales pipelines, GST billing, project task sprints, live geofenced attendance, and automated payroll in one company workspace.
            </p>

            <div className="pt-2 flex flex-col gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                All Cloud Services Operational
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Multi-Tenant Isolation • AES-256 Cloud Encryption
              </span>
            </div>
          </div>

          {/* Column 2: Platform Modules */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Platform Modules</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button type="button" onClick={() => scrollToSection('features')} className="hover:text-[#635BFF] transition-colors cursor-pointer text-left">
                  Lead &amp; Sales Pipeline
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('features')} className="hover:text-[#635BFF] transition-colors cursor-pointer text-left">
                  GST Invoicing &amp; Quotations
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('features')} className="hover:text-[#635BFF] transition-colors cursor-pointer text-left">
                  Geofence Attendance &amp; AI Selfie
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('features')} className="hover:text-[#635BFF] transition-colors cursor-pointer text-left">
                  Kanban Task Management
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('features')} className="hover:text-[#635BFF] transition-colors cursor-pointer text-left">
                  Automated Payroll Engine
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('features')} className="hover:text-[#635BFF] transition-colors cursor-pointer text-left">
                  Tech Support Helpdesk
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Solutions & Architecture */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Solutions &amp; Trust</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button type="button" onClick={() => scrollToSection('solutions')} className="hover:text-[#635BFF] transition-colors cursor-pointer text-left">
                  Interactive Showcase
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('architecture')} className="hover:text-[#635BFF] transition-colors cursor-pointer text-left">
                  Multi-Tenant Architecture
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('how-it-works')} className="hover:text-[#635BFF] transition-colors cursor-pointer text-left">
                  3-Step Onboarding
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('roles')} className="hover:text-[#635BFF] transition-colors cursor-pointer text-left">
                  Granular RBAC (8 Roles)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('security')} className="hover:text-[#635BFF] transition-colors cursor-pointer text-left">
                  Security &amp; Data Isolation
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('pricing')} className="hover:text-[#635BFF] transition-colors cursor-pointer text-left">
                  Deployment Options
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Enterprise Contact</h4>
            <div className="space-y-2.5 text-xs text-slate-600">
              {email && (
                <div>
                  <a href={`mailto:${email}`} className="hover:text-[#635BFF] transition-colors flex items-center gap-1.5 group">
                    <Mail className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#635BFF]" />
                    <span className="truncate">{email}</span>
                  </a>
                </div>
              )}
              {phone && (
                <div>
                  <a href={`tel:${phone}`} className="hover:text-[#635BFF] transition-colors flex items-center gap-1.5 group">
                    <Phone className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#635BFF]" />
                    <span>{phone}</span>
                  </a>
                </div>
              )}
              {address && (
                <div className="flex items-start gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{address}</span>
                </div>
              )}

              <div className="pt-2 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-600">Operating Hours:</span>
                <br />
                Mon &ndash; Sat: 9:00 AM &ndash; 7:00 PM IST
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================================
            4. BOTTOM BAR: COPYRIGHT, COMPLIANCE & BACK TO TOP
            ======================================================================= */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {currentYear} PrismCRM Enterprise Inc. All rights reserved. Strict Multi-Tenant Separation.
          </p>

          <div className="flex items-center gap-4 sm:gap-6 font-medium">
            <button
              type="button"
              onClick={() => scrollToSection('security')}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              Privacy &amp; Security
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('faq')}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              FAQ
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="hover:text-[#635BFF] font-semibold transition-colors cursor-pointer"
            >
              Request Workspace
            </button>

            {/* Back to top smooth button */}
            <button
              type="button"
              onClick={() => scrollToSection('top')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-[11px] font-semibold cursor-pointer"
              title="Back to top of page"
            >
              <ArrowUp className="w-3 h-3" />
              <span>Top</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
