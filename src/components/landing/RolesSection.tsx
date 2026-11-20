'use client';

import React from 'react';
import {
  ShieldAlert,
  Users2,
  FileSpreadsheet,
  Coins,
  TrendingUp,
  Code2,
  Headphones,
  GraduationCap,
  Sparkles,
  Lock,
} from 'lucide-react';

export default function RolesSection() {
  const roles = [
    {
      icon: ShieldAlert,
      title: 'Company Administrator',
      responsibilities: 'Complete governance over company settings, logo/branding, branch geofences, employee lifecycle, and financial dashboards.',
      accessBadge: 'Full Tenant Authority',
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
    },
    {
      icon: Users2,
      title: 'Team Lead / Admin Manager',
      responsibilities: 'Supervise daily sprint tasks, assign project milestones, monitor team attendance rates, and manage operational delivery.',
      accessBadge: 'Project Oversight',
      badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
    {
      icon: FileSpreadsheet,
      title: 'HR Manager',
      responsibilities: 'Manage employee records, oversee department assignments, approve leave requests, and verify geofenced attendance logs.',
      accessBadge: 'People Operations',
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
    },
    {
      icon: Coins,
      title: 'Accounts & Finance',
      responsibilities: 'Issue GST-compliant invoices, track client payment reconciliation, calculate attendance-linked payroll, and generate payslips.',
      accessBadge: 'Billing & Ledger',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      icon: TrendingUp,
      title: 'Sales Executive',
      responsibilities: 'Manage prospect pipelines, log sales touches, advance quotation stages, and convert won proposals into trackable projects.',
      accessBadge: 'Pipeline & Proposals',
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    {
      icon: Code2,
      title: 'Developer (Web / Android)',
      responsibilities: 'Execute technical sprint tasks, log progress on Kanban boards, check in via branch geofence, and update delivery tickets.',
      accessBadge: 'Sprint Execution',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      icon: Headphones,
      title: 'Technical Support',
      responsibilities: 'Manage client issue tickets, monitor SLA countdowns, diagnose reported defects, and update customer resolution status.',
      accessBadge: 'Support Desk',
      badgeColor: 'text-cyan-700 bg-cyan-50 border-cyan-200',
    },
    {
      icon: GraduationCap,
      title: 'Intern',
      responsibilities: 'Verified clock-in and clock-out via mobile selfie camera, complete assigned learning tasks, and update work logs.',
      accessBadge: 'Supervised Access',
      badgeColor: 'text-slate-700 bg-slate-100 border-slate-200',
    },
  ];

  return (
    <section id="roles" className="py-20 sm:py-28 relative overflow-hidden bg-slate-50/70 border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F0EEFF] border border-[#D8D4FF] text-[#635BFF] text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-[#00D4B2]" />
            <span>Role-Based Access Control</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Tailored Access for Every Organizational Member.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Every user receives a focused, uncluttered workspace matching their exact duties. Sensitive operations remain restricted by strict server-side authorization.
          </p>
        </div>

        {/* 8 Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-14 sm:mt-18">
          {roles.map((role, idx) => {
            const Icon = role.icon;
            return (
              <div
                key={idx}
                className="group p-6 rounded-3xl bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(99,91,255,0.15)] hover:border-[#635BFF]/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#F0EEFF] border border-[#D8D4FF] flex items-center justify-center text-[#635BFF] group-hover:scale-110 group-hover:bg-[#635BFF] group-hover:text-white transition-all duration-300 shadow-2xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${role.badgeColor}`}>
                      {role.accessBadge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#635BFF] transition-colors">
                    {role.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {role.responsibilities}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <Lock className="w-3 h-3 text-emerald-500" />
                  <span>Enforced via server tokens</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
