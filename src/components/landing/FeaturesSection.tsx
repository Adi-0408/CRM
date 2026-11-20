'use client';

import React from 'react';
import {
  TrendingUp,
  Receipt,
  FolderKanban,
  CheckSquare,
  Users,
  Camera,
  Coins,
  Headphones,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ILandingContent, DEFAULT_LANDING_CONTENT } from '@/models/LandingContent';

interface FeaturesSectionProps {
  features?: ILandingContent['features'];
}

export default function FeaturesSection({
  features = DEFAULT_LANDING_CONTENT.features,
}: FeaturesSectionProps) {
  const modules = [
    {
      icon: TrendingUp,
      title: 'Sales & Pipeline Management',
      desc: 'Capture leads, track prospect status across customizable pipeline stages, assign sales owners, and generate professional client quotations.',
      capabilities: ['Lead Ingestion & Assignment', 'Pipeline Stage Analytics', 'Quotation Engine', 'Client Interaction History'],
      accent: 'from-blue-500/10 via-indigo-500/5 to-transparent',
      badgeColor: 'text-[#635BFF] bg-purple-50 border-purple-200',
    },
    {
      icon: Receipt,
      title: 'Finance & GST Invoicing',
      desc: 'Automate compliant invoice creation with auto-calculated CGST, SGST, and IGST breakdowns, payment tracking, and real-time revenue summaries.',
      capabilities: ['Split GST Tax Breakdowns', 'Payment Reconciliation', 'PDF Invoicing Ledger', 'Overdue Tracking & Alerts'],
      accent: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      icon: FolderKanban,
      title: 'Project Delivery & Milestones',
      desc: 'Seamlessly transition won client proposals into active projects. Allocate team members, monitor budget consumption, and deliver milestones.',
      capabilities: ['Milestone Delivery Tracking', 'Team Resource Allocation', 'Budget P&L Monitoring', 'Client Deliverable Reviews'],
      accent: 'from-purple-500/10 via-violet-500/5 to-transparent',
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
    },
    {
      icon: CheckSquare,
      title: 'Task Management & Kanban',
      desc: 'Collaborative task execution with visual Kanban status boards, priority flags, deadline management, checklists, and subtask dependencies.',
      capabilities: ['Drag-and-Drop Kanban Boards', 'Priority & Due Date Triggers', 'Subtasks & Checklists', 'Cross-Functional Collaboration'],
      accent: 'from-amber-500/10 via-orange-500/5 to-transparent',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      icon: Users,
      title: 'HR & Personnel Records',
      desc: 'Complete employee lifecycle administration: digitized personnel files, department assignments, leave requests, and role privileges.',
      capabilities: ['Digital Employee Directory', 'Departmental Organization', 'Leave Request Workflow', 'Role Access Management'],
      accent: 'from-rose-500/10 via-pink-500/5 to-transparent',
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
    },
    {
      icon: Camera,
      title: 'Smart GPS & Selfie Attendance',
      desc: 'Anti-spoofing field and office attendance verified via real-time branch GPS geofencing and live camera selfie capture.',
      capabilities: ['Branch Coordinate Radius Check', 'Live Selfie Image Verification', 'Clock-In / Clock-Out Logs', 'Late & Absence Tracking'],
      accent: 'from-teal-500/10 via-cyan-500/5 to-transparent',
      badgeColor: 'text-[#00D4B2] bg-teal-50 border-teal-200',
    },
    {
      icon: Coins,
      title: 'Automated Payroll & Slips',
      desc: 'Calculate payroll accurately with base salaries, customized allowances, attendance deductions, and downloadable PDF payslips.',
      capabilities: ['Attendance-Linked Calculations', 'Allowances & Deductions', 'Digital Payslip Generation', 'Disbursement Audit Records'],
      accent: 'from-indigo-500/10 via-blue-500/5 to-transparent',
      badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
    {
      icon: Headphones,
      title: 'Customer Tech Support Desk',
      desc: 'Provide first-class post-sale customer support with prioritized issue ticketing, SLA countdowns, and assigned support engineers.',
      capabilities: ['Priority Incident Ticketing', 'SLA Response Tracking', 'Customer Support History', 'Resolution Status Updates'],
      accent: 'from-cyan-500/10 via-sky-500/5 to-transparent',
      badgeColor: 'text-cyan-700 bg-cyan-50 border-cyan-200',
    },
  ];

  const sectionBadge = features?.sectionBadge || DEFAULT_LANDING_CONTENT.features.sectionBadge;
  const sectionTitle = features?.sectionTitle || DEFAULT_LANDING_CONTENT.features.sectionTitle;
  const sectionSubtitle = features?.sectionSubtitle || DEFAULT_LANDING_CONTENT.features.sectionSubtitle;

  return (
    <section id="features" className="py-20 sm:py-28 relative overflow-hidden">
      {/* Background Decor */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F0EEFF] border border-[#D8D4FF] text-[#635BFF] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#00D4B2]" />
            <span>{sectionBadge}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {sectionTitle}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            {sectionSubtitle}
          </p>
        </div>

        {/* 8 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-14 sm:mt-18">
          {modules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <div
                key={idx}
                className="group relative p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_25px_-5px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_45px_-10px_rgba(99,91,255,0.15)] hover:border-[#635BFF]/50 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Subtle Hover Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${mod.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                />

                <div className="relative z-10 space-y-4">
                  {/* Icon & Badge */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#F0EEFF] border border-[#D8D4FF] flex items-center justify-center text-[#635BFF] group-hover:scale-110 group-hover:bg-[#635BFF] group-hover:text-white transition-all duration-300 shadow-sm">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">0{idx + 1}</span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#635BFF] transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2 font-normal">
                      {mod.desc}
                    </p>
                  </div>

                  {/* Capabilities List */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                    {mod.capabilities.map((cap, capIdx) => (
                      <div key={capIdx} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
