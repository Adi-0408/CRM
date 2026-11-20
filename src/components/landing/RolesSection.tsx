'use client';

import React from 'react';
import { ShieldCheck, UserCheck } from 'lucide-react';

export default function RolesSection() {
  const roles = [
    { title: 'Company Admin', desc: 'Full tenant authority, employee invites, branch management & branding' },
    { title: 'Team Lead', desc: 'Project oversight, milestone tracking, and task delegation' },
    { title: 'HR Manager', desc: 'Attendance audits, leave approval chains, and staff records' },
    { title: 'Accounts & Finance', desc: 'Payroll execution, invoice tracking, and revenue telemetry' },
    { title: 'Sales Executive', desc: 'Inbound lead pipelines, quotation generation, and conversion' },
    { title: 'Developers (Web & Mobile)', desc: 'Assigned task boards, sprint deliverables, and daily updates' },
    { title: 'Tech Support', desc: 'SLA ticket triage, customer issue resolutions, and tracking' },
    { title: 'Intern', desc: 'Supervised task execution with read-only operational boundaries' },
  ];

  return (
    <section className="py-14 sm:py-20 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-8">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Role-Based Access Control</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Built for every department in your company
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every staff member gets a tailored view based on their exact responsibilities — ensuring strict
              operational focus and zero unauthorized data exposure.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {roles.map((r, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-150 hover:border-slate-300 transition-colors space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#635BFF]" />
                  <span className="font-bold text-xs sm:text-sm text-slate-900">{r.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-normal">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
