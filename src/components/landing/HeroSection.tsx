'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  FolderKanban,
  Receipt,
  Headphones,
  Users,
  Camera,
  MapPin,
  Sparkles,
  BarChart3,
  Clock,
  Briefcase,
  Layers,
} from 'lucide-react';
import { ILandingContent, DEFAULT_LANDING_CONTENT } from '@/models/LandingContent';

interface HeroSectionProps {
  hero?: ILandingContent['hero'];
}

export default function HeroSection({ hero = DEFAULT_LANDING_CONTENT.hero }: HeroSectionProps) {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const badgeText = hero?.badgeText || DEFAULT_LANDING_CONTENT.hero.badgeText;
  const headline = hero?.headline || DEFAULT_LANDING_CONTENT.hero.headline;
  const subheadline = hero?.subheadline || DEFAULT_LANDING_CONTENT.hero.subheadline;
  const primaryCta = hero?.primaryCtaText || DEFAULT_LANDING_CONTENT.hero.primaryCtaText;
  const secondaryCta = hero?.secondaryCtaText || DEFAULT_LANDING_CONTENT.hero.secondaryCtaText;

  return (
    <section id="home" className="relative pt-8 pb-16 sm:pt-14 sm:pb-24 overflow-hidden">
      {/* Background Subtle Ambient Glow Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-tr from-[#635BFF]/10 via-[#00D4B2]/10 to-indigo-500/10 blur-3xl pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-[#635BFF]/8 blur-2xl pointer-events-none -z-10 rounded-full animate-float-slow" />
      <div className="absolute top-60 left-10 w-80 h-80 bg-[#00D4B2]/8 blur-2xl pointer-events-none -z-10 rounded-full animate-float-reverse" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Hero Header Copy */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#D8D4FF] text-[#635BFF] text-xs font-bold shadow-sm backdrop-blur-md hover:scale-105 transition-transform duration-200">
            <span className="w-2 h-2 rounded-full bg-[#00D4B2] animate-ping" />
            <ShieldCheck className="w-4 h-4 text-[#635BFF]" />
            <span>{badgeText}</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] text-balance">
            One Platform. Every Team.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#635BFF] via-[#5249EC] to-[#00D4B2]">
              Complete Business Control.
            </span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            {subheadline}
          </p>

          {/* Three CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#635BFF] hover:bg-[#5249EC] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#635BFF]/30 hover:shadow-xl hover:shadow-[#635BFF]/40 active:scale-95 transition-all flex items-center justify-center gap-2.5 min-h-[50px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635BFF]"
            >
              <span>{primaryCta}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm sm:text-base shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[50px] focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            >
              <Sparkles className="w-4 h-4 text-[#635BFF]" />
              <span>Request a Demo</span>
            </button>

            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-bold text-sm sm:text-base transition-all flex items-center justify-center min-h-[50px] focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            >
              <span>{secondaryCta}</span>
            </Link>
          </div>
        </div>

        {/* Sophisticated Interactive Dashboard Preview */}
        <div className="mt-14 sm:mt-20 relative">
          {/* Floating Live Notification 1 (Top Left) */}
          <div className="hidden lg:flex items-center gap-3 absolute -top-6 -left-6 z-20 px-4 py-3 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 animate-float">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Invoice #INV-2026-084 Paid</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500">GST Invoice reconciled automatically</p>
            </div>
          </div>

          {/* Floating Live Notification 2 (Bottom Right) */}
          <div className="hidden lg:flex items-center gap-3 absolute -bottom-6 -right-6 z-20 px-4 py-3 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 animate-float-reverse">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#635BFF]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Check-in Verified</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0EEFF] text-[#635BFF] font-semibold">
                  Branch Radar
                </span>
              </div>
              <p className="text-[11px] text-slate-500">GPS within 100m geofence + selfie verified</p>
            </div>
          </div>

          {/* Main Dashboard Surface */}
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl border border-slate-200/80 shadow-[0_24px_70px_rgba(15,23,42,0.12)] p-4 sm:p-7 space-y-6">
            {/* Top Workspace Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="h-4 w-px bg-slate-200 mx-1" />
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#635BFF]" />
                  Prism Enterprise Console
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                  workspace.prismcrm.internal
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  All Systems Operational
                </span>
                <span className="px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-semibold hidden sm:inline-flex">
                  Dedicated Tenant Isolated
                </span>
              </div>
            </div>

            {/* Simulated Live KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-150 shadow-2xs hover:border-[#635BFF]/30 transition-colors">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold">Quarterly Revenue</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">₹42.8 Lakhs</div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
                  <span>+18.4% vs last Q</span>
                  <span className="text-slate-400 font-normal">reconciled</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-150 shadow-2xs hover:border-[#635BFF]/30 transition-colors">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold">Active Leads Pipeline</span>
                  <Users className="w-4 h-4 text-[#635BFF]" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">128 Leads</div>
                <div className="flex items-center gap-1 text-[11px] text-[#635BFF] font-semibold mt-1">
                  <span>24 Proposals Sent</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-150 shadow-2xs hover:border-[#635BFF]/30 transition-colors">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold">Sprint Tasks & Projects</span>
                  <FolderKanban className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">18 Active</div>
                <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold mt-1">
                  <span>92% Milestone Velocity</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-150 shadow-2xs hover:border-[#635BFF]/30 transition-colors">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold">Staff Today (Geofenced)</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">96.4% On Time</div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-normal mt-1">
                  <MapPin className="w-3 h-3 text-emerald-600 inline" />
                  <span>Verified across 3 branches</span>
                </div>
              </div>
            </div>

            {/* Split Panel: Lead Stages Pipeline & Active Project Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Pipeline Visualization (2 cols) */}
              <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-50/70 border border-slate-150 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Live Lead Pipeline Stages
                    </h3>
                    <p className="text-xs text-slate-700 font-semibold">Conversion Workflow & Assigned Leads</p>
                  </div>
                  <span className="text-[11px] font-bold text-[#635BFF] bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    Auto-Synced
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">New Leads</span>
                    <div className="text-base font-black text-slate-800">42</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="bg-[#635BFF] h-full w-[85%]" />
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Quoted</span>
                    <div className="text-base font-black text-slate-800">31</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="bg-[#00D4B2] h-full w-[65%]" />
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Negotiating</span>
                    <div className="text-base font-black text-slate-800">19</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="bg-amber-400 h-full w-[45%]" />
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Closed Won</span>
                    <div className="text-base font-black text-emerald-600">36</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[90%]" />
                    </div>
                  </div>
                </div>

                {/* Micro task timeline */}
                <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#635BFF]" />
                    <span className="font-semibold text-slate-800">Enterprise CRM License</span>
                    <span className="text-slate-400">• Quote #QUO-802 approved</span>
                  </div>
                  <span className="font-bold text-emerald-600">Converted to Project →</span>
                </div>
              </div>

              {/* Attendance & Compliance Verification Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/50 via-white to-slate-50 border border-[#D8D4FF]/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#635BFF]" />
                    Smart Geofence Hub
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    GPS Locked
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Mumbai Tech Park</div>
                      <div className="text-[11px] text-slate-500">Radius: 100m • 42 Punches</div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Pune Tech Hub</div>
                      <div className="text-[11px] text-slate-500">Radius: 75m • 28 Punches</div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 text-center pt-1 font-medium">
                  *Illustrative preview of genuine company workspace capabilities
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
