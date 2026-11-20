'use client';

import React from 'react';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Building2,
  Briefcase,
  ShieldCheck,
  Layers,
} from 'lucide-react';

export default function PricingSection() {
  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="pricing" className="py-20 sm:py-28 relative overflow-hidden bg-slate-50/70 border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F0EEFF] border border-[#D8D4FF] text-[#635BFF] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#00D4B2]" />
            <span>Deployment Options</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Transparent Deployment for Growing Teams.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Every organization has unique operational requirements. We configure tailored workspaces scaled to your specific employee count, branch footprint, and module needs.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-14 max-w-4xl mx-auto">
          {/* Plan 1: Standard Workspace */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_25px_-5px_rgba(15,23,42,0.06)] hover:border-[#635BFF]/40 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Essential Operations</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">Single Branch</span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900">Standard Organization</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Ideal for businesses unifying their sales, tasks, and team attendance.</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-extrabold text-slate-900">Custom Quote</span>
                <span className="text-xs text-slate-500 ml-2">based on active team size</span>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs sm:text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Lead Pipeline & Quotation Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Interactive Kanban Task Boards</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Smart Geofenced Attendance (1 Branch)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Employee Records & Leave Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Customer Support Desk</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={scrollToContact}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Request Workspace Quote</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Plan 2: Enterprise Multi-Branch (Featured) */}
          <div className="relative p-8 rounded-3xl bg-gradient-to-br from-white via-purple-50/20 to-white border-2 border-[#635BFF] shadow-xl shadow-[#635BFF]/10 hover:shadow-2xl hover:shadow-[#635BFF]/20 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-6">
            {/* Featured Badge */}
            <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#635BFF] to-[#00D4B2] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md">
              Most Popular
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#635BFF]">Complete Enterprise Suite</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F0EEFF] text-[#635BFF] border border-[#D8D4FF]">Multi-Branch</span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900">Enterprise Multi-Branch</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">For multi-location companies requiring custom branding, payroll, and GST invoicing.</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-extrabold text-slate-900">Custom Plan</span>
                <span className="text-xs text-slate-500 ml-2">tailored for full operations</span>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs sm:text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#635BFF] shrink-0" />
                  <span className="font-semibold text-slate-900">Everything in Standard Plan, plus:</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Unlimited Branch Locations with Custom GPS Radii</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>GST-Compliant Invoicing & Tax Ledger</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Automated Payroll & Downloadable Payslips</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Custom Company Branding & Palette Theme</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Dedicated Super Admin Onboarding & Priority SLA</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={scrollToContact}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#635BFF] to-[#5249EC] hover:from-[#5249EC] hover:to-[#4338ca] text-white font-bold text-sm shadow-lg shadow-[#635BFF]/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Request Custom Enterprise Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
