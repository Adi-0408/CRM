'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Zap,
  Shield,
  Layers,
  ArrowRight,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

export default function WhyChooseSection() {
  const comparisons = [
    {
      feature: 'Tool Sprawl vs. Unified Hub',
      traditional: '5-8 disconnected SaaS tools (Slack, Jira, Trello, Keka, Zoho, Invoicing app)',
      prism: 'One unified operational platform covering leads, tasks, attendance, payroll, and tickets',
    },
    {
      feature: 'Data Consistency & Handoffs',
      traditional: 'Manual CSV exports and re-typing client data from sales proposals into invoices',
      prism: 'Approved quotations automatically transition into active project tasks and GST invoices',
    },
    {
      feature: 'Attendance & Integrity',
      traditional: 'Biometric fingerprint queues or easily spoofed web logins without physical verification',
      prism: 'Dynamic GPS branch geofencing radius checks paired with live selfie camera verification',
    },
    {
      feature: 'Workspace & Branding',
      traditional: 'Generic vendor-branded portals with fixed theme colors and generic domains',
      prism: 'Dedicated organization workspace with company logo, custom color palette, and multi-branch setup',
    },
    {
      feature: 'Security & Access Control',
      traditional: 'Vague admin-or-user permissions with frequent credential sharing',
      prism: '8 granular authenticated roles with server-enforced route and action permissions',
    },
  ];

  return (
    <section id="why-us" className="py-20 sm:py-28 relative overflow-hidden bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F0EEFF] border border-[#D8D4FF] text-[#635BFF] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#00D4B2]" />
            <span>The PrismCRM Advantage</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Engineered for Clarity, Security, and Scalability.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            See how consolidating your business operations into PrismCRM eliminates administrative overhead and drives measurable execution speed.
          </p>
        </div>

        {/* High-Contrast Comparison Table */}
        <div className="mt-14 max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 bg-slate-100/70 border-b border-slate-200 text-xs font-bold uppercase tracking-wider p-4 sm:px-8 text-slate-500">
            <div className="hidden md:flex items-center gap-2 text-rose-700">
              <XCircle className="w-4 h-4 text-rose-500" />
              <span>Fragmented SaaS Subscriptions</span>
            </div>
            <div className="flex items-center gap-2 text-[#635BFF]">
              <CheckCircle2 className="w-4 h-4 text-[#635BFF]" />
              <span>PrismCRM Unified Workspace</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {comparisons.map((row, idx) => (
              <div key={idx} className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                {/* Traditional */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase md:hidden">Traditional Approach</div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="text-slate-400 font-mono text-xs">0{idx + 1}.</span>
                    <span>{row.feature}</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed flex items-start gap-1.5 pt-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{row.traditional}</span>
                  </p>
                </div>

                {/* PrismCRM */}
                <div className="p-3.5 rounded-2xl bg-[#F0EEFF]/40 border border-[#D8D4FF]/60 space-y-1">
                  <div className="text-[11px] font-bold text-[#635BFF] uppercase md:hidden">PrismCRM Advantage</div>
                  <p className="text-slate-800 font-medium text-xs sm:text-sm leading-relaxed flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{row.prism}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
