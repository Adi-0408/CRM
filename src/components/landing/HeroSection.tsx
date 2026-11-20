'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  FolderKanban,
  Receipt,
  Headphones,
  Users,
  Camera,
} from 'lucide-react';
import { ILandingContent, DEFAULT_LANDING_CONTENT } from '@/models/LandingContent';

interface HeroSectionProps {
  hero?: ILandingContent['hero'];
}

export default function HeroSection({ hero = DEFAULT_LANDING_CONTENT.hero }: HeroSectionProps) {
  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const badgeText = hero?.badgeText || DEFAULT_LANDING_CONTENT.hero.badgeText;
  const headline = hero?.headline || DEFAULT_LANDING_CONTENT.hero.headline;
  const subheadline = hero?.subheadline || DEFAULT_LANDING_CONTENT.hero.subheadline;
  const primaryCta = hero?.primaryCtaText || DEFAULT_LANDING_CONTENT.hero.primaryCtaText;
  const secondaryCta = hero?.secondaryCtaText || DEFAULT_LANDING_CONTENT.hero.secondaryCtaText;

  return (
    <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top Centered Hero Copy */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0EEFF] border border-[#D8D4FF] text-[#635BFF] text-xs font-semibold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#635BFF]" />
            <span>{badgeText}</span>
          </div>

          {/* Single H1 */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            {headline}
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            {subheadline}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={scrollToContact}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#635BFF] hover:bg-[#5249EC] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#635BFF]/30 hover:shadow-xl hover:shadow-[#635BFF]/40 active:scale-95 transition-all flex items-center justify-center gap-2.5 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635BFF]"
            >
              <span>{primaryCta}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm sm:text-base shadow-xs hover:shadow-md active:scale-95 transition-all flex items-center justify-center min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
            >
              {secondaryCta}
            </Link>
          </div>
        </div>

        {/* Decorative Realistic Mock Dashboard Preview Card (Tailwind only, no external images, no fake stats) */}
        <div className="mt-14 sm:mt-18 relative">
          {/* Subtle Ambient Glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#635BFF]/15 via-[#00D4B2]/10 to-[#5249EC]/15 rounded-3xl blur-2xl -z-10 pointer-events-none" />

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.08)] p-5 sm:p-8 space-y-6">
            {/* Mock Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-150 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-slate-500 ml-2">Prism Workspace Console</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  System Active
                </span>
                <span className="px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
                  Custom Branding
                </span>
              </div>
            </div>

            {/* Mock Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Module 1: Lead & Quotation Lifecycle */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-150 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <TrendingUp className="w-4 h-4 text-[#635BFF]" />
                    <span>Lead Pipeline</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">Quotation Ready</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-150 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">Commercial Contract</p>
                      <p className="text-[10px] text-slate-400">Negotiation Stage</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                      Proposal
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-[#635BFF] h-1.5 rounded-full w-3/4" />
                  </div>
                </div>
              </div>

              {/* Module 2: Geofenced Attendance */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-150 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Dynamic Geofence</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    Photo Verified
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-150 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Assigned Branch</span>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Within Perimeter
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Punch in & out authenticated via camera preview</p>
                </div>
              </div>

              {/* Module 3: Support SLA & Invoicing */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-150 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Receipt className="w-4 h-4 text-amber-600" />
                    <span>Invoices & SLA</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">Auto Generated</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-150 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">GST Invoice Ready</p>
                    <p className="text-[10px] text-slate-400">Support Ticket Resolved</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                    Paid
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
