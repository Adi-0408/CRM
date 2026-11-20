'use client';

import React from 'react';
import {
  TrendingUp,
  Receipt,
  FolderKanban,
  CheckSquare,
  Camera,
  Banknote,
  Calendar,
  Headphones,
  Sparkles,
  Building2,
  Lock,
} from 'lucide-react';
import { ILandingContent, DEFAULT_LANDING_CONTENT } from '@/models/LandingContent';

interface FeaturesSectionProps {
  features?: ILandingContent['features'];
}

export default function FeaturesSection({ features = DEFAULT_LANDING_CONTENT.features }: FeaturesSectionProps) {
  const sectionBadge = features?.sectionBadge || DEFAULT_LANDING_CONTENT.features.sectionBadge;
  const sectionTitle = features?.sectionTitle || DEFAULT_LANDING_CONTENT.features.sectionTitle;
  const sectionSubtitle = features?.sectionSubtitle || DEFAULT_LANDING_CONTENT.features.sectionSubtitle;
  const bannerTitle = features?.multiTenantBannerTitle || DEFAULT_LANDING_CONTENT.features.multiTenantBannerTitle;
  const bannerSubtitle = features?.multiTenantBannerSubtitle || DEFAULT_LANDING_CONTENT.features.multiTenantBannerSubtitle;
  const modules = [
    {
      icon: TrendingUp,
      title: 'Leads & Quotations',
      description:
        'Capture leads across inbound channels, track pipeline stages, assign sales reps, and generate compliant quotations with line items and taxes.',
      tag: 'Sales',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200/60',
    },
    {
      icon: Receipt,
      title: 'Invoices & Billing',
      description:
        'Create professional multi-currency invoices, track paid, pending, and overdue balances, and monitor cashflow with GST breakdowns.',
      tag: 'Finance',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
    },
    {
      icon: FolderKanban,
      title: 'Project Management',
      description:
        'Structure deliverables into phases, track budget limits, assign cross-functional teams, and maintain project milestone progress.',
      tag: 'Delivery',
      color: 'text-blue-600 bg-blue-50 border-blue-200/60',
    },
    {
      icon: CheckSquare,
      title: 'Tasks & Kanban',
      description:
        'Organize workflows with prioritized tasks, due dates, assignee alerts, status columns, and granular subtask completions.',
      tag: 'Productivity',
      color: 'text-purple-600 bg-purple-50 border-purple-200/60',
    },
    {
      icon: Camera,
      title: 'Smart Attendance',
      description:
        'Facial photo verification paired with dynamic GPS geofencing. Employees punch in and out only within assigned office perimeters.',
      tag: 'HR & Operations',
      color: 'text-teal-600 bg-teal-50 border-teal-200/60',
    },
    {
      icon: Banknote,
      title: 'Payroll & Compensation',
      description:
        'Compute monthly payroll with allowances, deductions, net salary disbursements, payment records, and downloadable employee payslips.',
      tag: 'Payroll',
      color: 'text-amber-600 bg-amber-50 border-amber-200/60',
    },
    {
      icon: Calendar,
      title: 'Leave & Absence Tracking',
      description:
        'Submit paid, sick, or casual leave requests, track remaining annual quotas, and route requests through department approval chains.',
      tag: 'HR',
      color: 'text-rose-600 bg-rose-50 border-rose-200/60',
    },
    {
      icon: Headphones,
      title: 'Support Tickets & Helpdesk',
      description:
        'Deliver prompt customer and internal technical support with ticket priorities, SLA timers, customer links, and status resolution audit trails.',
      tag: 'Customer Support',
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200/60',
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 relative scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[#635BFF] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{sectionBadge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {sectionTitle}
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            {sectionSubtitle}
          </p>
        </div>

        {/* 8 Features Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {modules.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-150 p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-2xs ${m.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {m.tag}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-[#635BFF] transition-colors">
                      {m.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                      {m.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Multi-Company & Custom Branding Highlight Box */}
        <div className="mt-8 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-semibold backdrop-blur-md">
              <Building2 className="w-3.5 h-3.5 text-purple-300" />
              <span>Multi-Company Tenant Architecture</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              {bannerTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {bannerSubtitle}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-xs font-semibold text-white">
              <Lock className="w-4 h-4 text-[#00D4B2]" />
              <span>Zero Cross-Tenant Leakage</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
