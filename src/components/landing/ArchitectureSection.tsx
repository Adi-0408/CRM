'use client';

import React from 'react';
import {
  Server,
  Building,
  ShieldAlert,
  ShieldCheck,
  Palette,
  MapPin,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function ArchitectureSection() {
  const tenants = [
    {
      name: 'Alpha Enterprises',
      slug: 'alpha',
      subdomain: 'alpha.prismcrm.com',
      theme: 'from-blue-600 to-indigo-600',
      branches: '3 Branches',
      status: 'Tenant Isolated',
    },
    {
      name: 'Beta Global Tech',
      slug: 'beta',
      subdomain: 'beta.prismcrm.com',
      theme: 'from-emerald-600 to-teal-600',
      branches: '5 Branches',
      status: 'Tenant Isolated',
    },
    {
      name: 'Gamma Industries',
      slug: 'gamma',
      subdomain: 'gamma.prismcrm.com',
      theme: 'from-purple-600 to-pink-600',
      branches: '2 Branches',
      status: 'Tenant Isolated',
    },
  ];

  return (
    <section id="architecture" className="py-20 sm:py-28 bg-[#0F172A] text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-[#635BFF]/20 via-[#00D4B2]/10 to-indigo-500/20 blur-3xl pointer-events-none -z-0 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[#00D4B2] text-xs font-bold uppercase tracking-wider">
            <Server className="w-3.5 h-3.5 text-[#00D4B2]" />
            <span>Multi-Tenant Architecture</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Independent Workspaces. Strict Tenant Isolation.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Every organization runs within its own secure operational partition. Backend authorization guarantees zero cross-tenant data leakage while delivering custom branding and branch coordinates.
          </p>
        </div>

        {/* Visual Architecture Tree Diagram */}
        <div className="mt-16 max-w-4xl mx-auto">
          {/* Platform Node */}
          <div className="flex flex-col items-center">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#635BFF] to-[#5249EC] border border-purple-400/40 shadow-xl shadow-purple-900/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-purple-200">PrismCRM Platform Engine</div>
                <div className="text-base font-extrabold text-white">Central Super Admin & Ingestion Layer</div>
              </div>
            </div>

            {/* Connecting Vertical Trunk */}
            <div className="w-0.5 h-10 bg-gradient-to-b from-[#635BFF] to-slate-700" />
            <div className="w-full max-w-2xl h-0.5 bg-slate-700 relative">
              {/* Branch connecting lines */}
              <div className="absolute left-1/6 w-0.5 h-8 bg-slate-700 -bottom-8" />
              <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-8 bg-slate-700 -bottom-8" />
              <div className="absolute right-1/6 w-0.5 h-8 bg-slate-700 -bottom-8" />
            </div>
            <div className="h-8" />
          </div>

          {/* Tenant Workspaces Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
            {tenants.map((tenant, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl hover:border-[#635BFF]/60 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${tenant.theme} flex items-center justify-center shadow-md`}>
                      <Building className="w-4 h-4 text-white" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                      <Lock className="w-2.5 h-2.5" />
                      {tenant.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{tenant.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{tenant.subdomain}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Custom Branding:</span>
                      <span className="text-[#00D4B2] font-semibold">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Branch Geofences:</span>
                      <span className="text-white font-semibold">{tenant.branches}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Data Boundary:</span>
                      <span className="text-purple-300 font-mono text-[11px]">Strict ID Scoped</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Architectural Guarantee Callout */}
          <div className="mt-10 p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-[#00D4B2] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <span className="font-bold text-white">Cryptographically & Logically Isolated: </span>
              Tenant segregation is enforced at the server API layer via token verification and company-scoped database filters. No company user can read, query, or mutate records outside their authorized organization.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
