'use client';

import React from 'react';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  MapPin,
  EyeOff,
  Server,
  FileCheck,
  Sparkles,
} from 'lucide-react';

export default function SecuritySection() {
  const securityPillars = [
    {
      icon: KeyRound,
      title: 'Firebase Authentication & Token Verification',
      desc: 'Industry-standard authentication verifying JSON Web Tokens on protected API endpoints. No unverified sessions can execute backend functions.',
      badge: 'Auth Verified',
    },
    {
      icon: Lock,
      title: 'Server-Side Role Authorization (RBAC)',
      desc: 'Every protected route executes requireRoles checks. Users are strictly constrained to actions authorized by their assigned organizational role.',
      badge: 'Zero Trust',
    },
    {
      icon: Server,
      title: 'Tenant-Level Data Boundary Isolation',
      desc: 'All queries are automatically filtered by companyId at the database model layer. Multi-tenant partitioning guarantees zero cross-organization leakage.',
      badge: 'Isolated Tenants',
    },
    {
      icon: MapPin,
      title: 'Physical Branch Geofencing & Photo Proof',
      desc: 'Mobile attendance verification matches real-time GPS coordinates against branch perimeters and verifies selfie snapshots to prevent proxy clock-ins.',
      badge: 'Anti-Spoofing',
    },
  ];

  return (
    <section id="security" className="py-20 sm:py-28 relative overflow-hidden bg-white border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Platform Security</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Enterprise Security Built Into Every Layer.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Your business operations, employee data, and financial transactions are shielded by multi-layered server authorization, tenant isolation, and cryptographic session protection.
          </p>
        </div>

        {/* Security Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-14 sm:mt-18 max-w-5xl mx-auto">
          {securityPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="p-7 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-emerald-500/40 hover:bg-white hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-emerald-700">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {pillar.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {pillar.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/70 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Enforced directly in backend API routes</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
