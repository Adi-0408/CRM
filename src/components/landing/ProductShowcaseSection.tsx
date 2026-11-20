'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  FolderKanban,
  Camera,
  Receipt,
  Headphones,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export default function ProductShowcaseSection() {
  const [activeTab, setActiveTab] = useState<'sales' | 'projects' | 'attendance' | 'finance' | 'support'>('sales');

  const tabs = [
    { id: 'sales', label: 'Sales & Pipeline', icon: TrendingUp },
    { id: 'projects', label: 'Projects & Tasks', icon: FolderKanban },
    { id: 'attendance', label: 'Smart Attendance', icon: Camera },
    { id: 'finance', label: 'Finance & Invoices', icon: Receipt },
    { id: 'support', label: 'Tech Support Desk', icon: Headphones },
  ] as const;

  return (
    <section id="solutions" className="py-20 sm:py-28 bg-gradient-to-b from-white via-slate-50/60 to-white relative overflow-hidden border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interactive Workspace Preview</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Experience Your Entire Business in One Dashboard.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Switch between modules to see how seamlessly operations flow across departments inside your company workspace.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 shadow-2xs ${
                  isActive
                    ? 'bg-[#635BFF] text-white shadow-md shadow-[#635BFF]/30 scale-105'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Preview Stage */}
        <div className="mt-12 max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)] p-6 sm:p-10 transition-all duration-300">
            {/* Sales Tab */}
            {activeTab === 'sales' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Sales Pipeline & Commercial Proposals</h3>
                    <p className="text-xs text-slate-500">Track prospective clients from discovery to deal closure with instant quotation generation.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold w-fit">
                    Lead Engine Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Proposal: Cloud Suite</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Approved</span>
                    </div>
                    <div className="text-lg font-black text-slate-900">₹3,40,000</div>
                    <p className="text-xs text-slate-500">Client: Nexus Retail Ltd • Auto-converted to active project</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Proposal: Mobile App</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">In Review</span>
                    </div>
                    <div className="text-lg font-black text-slate-900">₹5,80,000</div>
                    <p className="text-xs text-slate-500">Client: Zenith Logistics • 18% GST itemized</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Lead: FinTech API</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">Negotiation</span>
                    </div>
                    <div className="text-lg font-black text-slate-900">₹8,50,000</div>
                    <p className="text-xs text-slate-500">Assigned to: Senior Sales Executive</p>
                  </div>
                </div>
              </div>
            )}

            {/* Projects & Tasks Tab */}
            {activeTab === 'projects' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Visual Kanban Boards & Sprint Velocity</h3>
                    <p className="text-xs text-slate-500">Coordinate engineering, sales, and design teams with drag-and-drop task priorities.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-purple-50 text-[#635BFF] border border-purple-200 text-xs font-bold w-fit">
                    Sprint Active (Week 47)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                      <span>To Do (4)</span>
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs text-xs space-y-1">
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">High Priority</span>
                      <div className="font-bold text-slate-800">API Gateway Rate Limiter</div>
                      <div className="text-slate-400 text-[11px]">Milestone: Core Architecture</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                      <span>In Progress (6)</span>
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs text-xs space-y-1">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Sprint #3</span>
                      <div className="font-bold text-slate-800">Dynamic Geofence Verification</div>
                      <div className="text-slate-400 text-[11px]">Assignee: Web Developer</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                      <span>Done & Shipped (18)</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs text-xs space-y-1">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Verified</span>
                      <div className="font-bold text-slate-800">Company Theme Color Engine</div>
                      <div className="text-slate-400 text-[11px]">Closed by: Platform Lead</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Smart Attendance Tab */}
            {activeTab === 'attendance' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Branch Geofence Radar & Anti-Spoofing</h3>
                    <p className="text-xs text-slate-500">Live distance triangulation verifies staff are physically inside branch perimeters with selfie proof.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold w-fit">
                    GPS Accurate (±4m)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#635BFF]" />
                        Active Branch: Head Office Mumbai
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-600">32m from center</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[32%]" />
                    </div>
                    <p className="text-xs text-slate-500">Allowed Radius: 100 meters • Status: VALID (Inside Geofence)</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-[#00D4B2]" />
                        Photo Verification Capture
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-600">Timestamp Stamped</span>
                    </div>
                    <p className="text-xs text-slate-600">Selfie snapshot uploaded securely to cloud storage with tamper-resistant coordinates watermark.</p>
                    <div className="text-[11px] text-slate-400 font-mono">LAT: 19.0760 | LNG: 72.8777 | ACC: 3.2m</div>
                  </div>
                </div>
              </div>
            )}

            {/* Finance Tab */}
            {activeTab === 'finance' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">GST Invoices & Automatic Ledger Reconciliations</h3>
                    <p className="text-xs text-slate-500">Generate GST-compliant tax invoices with automatic CGST, SGST, and IGST tax calculations.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold w-fit">
                    GST Compliant
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800">INVOICE: #INV-2026-0042</span>
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">PAID IN FULL</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Base Amount:</span>
                    <span>₹2,50,000.00</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (9%) + SGST (9%):</span>
                    <span>₹45,000.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                    <span>Total Reconciled Amount:</span>
                    <span>₹2,95,000.00</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tech Support Desk Tab */}
            {activeTab === 'support' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Customer Support Desk & SLA Compliance</h3>
                    <p className="text-xs text-slate-500">Triage client issues with priority indicators, SLA timers, and automated customer notifications.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold w-fit">
                    99.2% SLA Met
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">Urgent</span>
                        <span className="font-bold text-slate-900">#TCK-901: API Webhook delivery timeout</span>
                      </div>
                      <div className="text-slate-500">Reported by: FinTech Corp • Assigned to Support Lead</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        SLA: 1h 45m left
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#635BFF] text-white font-bold">Resolve</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
