'use client';

import React from 'react';
import {
  Building2,
  Workflow,
  ShieldCheck,
  MapPin,
  Users2,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface TrustSectionProps {
  sectionTitle?: string;
}

export default function TrustSection({
  sectionTitle = 'Everything Your Business Needs. One Connected Platform.',
}: TrustSectionProps) {
  const pillars = [
    {
      icon: Workflow,
      title: 'Unified Business Operations',
      desc: 'Consolidate sales pipelines, project delivery, billing, and team rosters into a single responsive system. Zero scattered SaaS tools.',
      badge: 'Integrated Ecosystem',
      color: 'text-[#635BFF] bg-purple-50 border-purple-200',
    },
    {
      icon: Building2,
      title: 'Company-Specific Workspaces',
      desc: 'Each organization operates inside a dedicated, isolated workspace with custom subdomains, tailored themes, and private databases.',
      badge: 'Complete Isolation',
      color: 'text-[#00D4B2] bg-teal-50 border-teal-200',
    },
    {
      icon: Cpu,
      title: 'Centralized Platform Oversight',
      desc: 'Super admins manage tenants, monitor system-wide inquiries, and configure workspace instances effortlessly.',
      badge: 'Zero Overhead',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      icon: ShieldCheck,
      title: 'Granular Role-Based Access',
      desc: 'Strict authorization matrices from Company Admin to HR, Sales, Developers, Support, and Interns with automated path protection.',
      badge: '8 Defined Roles',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      icon: Layers,
      title: 'Seamless Cross-Department Flow',
      desc: 'Approved quotations automatically convert to trackable client projects, generate GST invoices, and inform payroll accounting.',
      badge: 'End-to-End Flow',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      icon: MapPin,
      title: 'Multi-Branch Geofenced Governance',
      desc: 'Configure unlimited physical office branches with independent GPS coordinates, custom geofence radii, and live verification.',
      badge: 'Branch Control',
      color: 'text-rose-600 bg-rose-50 border-rose-200',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white/60 border-y border-slate-200/70 backdrop-blur-md relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
            <span>Built For Growing Enterprises</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {sectionTitle}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Eliminate fragmented subscriptions, disconnected data silos, and endless manual syncs. PrismCRM is engineered to bring your entire operational workflow together.
          </p>
        </div>

        {/* 6 Core Value Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="group relative p-7 rounded-3xl bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_40px_-8px_rgba(99,91,255,0.12)] hover:border-[#635BFF]/40 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 group-hover:scale-110 group-hover:text-[#635BFF] transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${pillar.color}`}>
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#635BFF] transition-colors">
                    {pillar.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {pillar.desc}
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-[#635BFF] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span>Explore capability</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
