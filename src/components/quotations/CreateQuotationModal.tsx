'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileSpreadsheet,
  Building2,
  Calendar,
  AlertCircle,
  Percent,
  Sparkles,
  Layers,
  Smartphone,
  Globe,
  Palette,
  Cloud,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leads?: any[];
  initialLead?: any;
}

const PACKAGE_PRESETS = [
  {
    name: 'Full-Stack Web Suite',
    icon: Globe,
    badge: 'Popular',
    items: [
      {
        description: 'Custom Web Application Frontend (Next.js 14, Tailwind CSS, Responsive UI)',
        quantity: 1,
        rate: 150000,
      },
      {
        description: 'Scalable REST / GraphQL API Services (Node.js, Express, Microservices)',
        quantity: 1,
        rate: 120000,
      },
      {
        description: 'Database Architecture, Redis Caching & Cloud CI/CD Automated Pipelines',
        quantity: 1,
        rate: 55000,
      },
    ],
    terms: '1. 40% advance mobilization, 40% milestone beta delivery, 20% final sign-off.\n2. Includes 60 days of warranty and zero-downtime deployment assistance.',
  },
  {
    name: 'Mobile App (Android/iOS)',
    icon: Smartphone,
    badge: 'High Demand',
    items: [
      {
        description: 'Native Android Application (Kotlin, Jetpack Compose, Offline SQLite Sync)',
        quantity: 1,
        rate: 180000,
      },
      {
        description: 'Secure Backend Gateway, Push Notifications & Token Authentication',
        quantity: 1,
        rate: 85000,
      },
      {
        description: 'Google Play Store Release & Production Device Testing',
        quantity: 1,
        rate: 35000,
      },
    ],
    terms: '1. 50% mobilization advance on contract signing.\n2. 50% upon successful APK acceptance & Play Store approval.',
  },
  {
    name: 'UI/UX & Branding',
    icon: Palette,
    badge: 'Design',
    items: [
      {
        description: 'High-Fidelity Interactive Figma Prototype & User Journey Mapping',
        quantity: 1,
        rate: 55000,
      },
      {
        description: 'Atomic Design System, Brand Identity Tokens & Component Library',
        quantity: 1,
        rate: 35000,
      },
    ],
    terms: '1. 50% advance before design sprint initiation, 50% upon full Figma asset hand-off.',
  },
  {
    name: 'Cloud & Cyber Security',
    icon: Cloud,
    badge: 'Enterprise',
    items: [
      {
        description: 'Cloud Infrastructure Setup (AWS/GCP), Docker Containerization & Auto-scaling',
        quantity: 1,
        rate: 80000,
      },
      {
        description: 'Comprehensive VAPT Security Audit, SSL Hardening & Penetration Testing',
        quantity: 1,
        rate: 45000,
      },
    ],
    terms: '1. 100% upon delivery of verified security certificate and architecture audit report.',
  },
];

export default function CreateQuotationModal({
  isOpen,
  onClose,
  onSuccess,
  leads = [],
  initialLead,
}: CreateQuotationModalProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  const [issueDate, setIssueDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const [items, setItems] = useState<LineItem[]>([
    {
      id: 'item-1',
      description: 'Custom Software Architecture & Production Web Platform',
      quantity: 1,
      rate: 150000,
      amount: 150000,
    },
    {
      id: 'item-2',
      description: 'API Integration & Cloud Infrastructure Setup',
      quantity: 1,
      rate: 45000,
      amount: 45000,
    },
  ]);

  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(18);
  const [notes, setNotes] = useState(
    'Includes 30 days of complimentary deployment support, security audits, and dedicated technical assistance.'
  );
  const [terms, setTerms] = useState(
    '1. 40% mobilization advance on contract signing.\n2. 40% upon beta milestone delivery.\n3. 20% on final acceptance testing & production deployment.\n4. Proposal valid for 30 calendar days from issue.'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initial lead or dropdown lead
  useEffect(() => {
    if (initialLead) {
      const lId = initialLead._id || initialLead.id || '';
      setSelectedLeadId(lId);
      setClientCompany(initialLead.company || '');
      setClientName(initialLead.name || '');
      setClientEmail(initialLead.email || '');
      setClientPhone(initialLead.phone || '');
      if (initialLead.value && initialLead.value > 0) {
        setItems([
          {
            id: 'item-1',
            description: `Project Execution & Engineering Deliverables for ${initialLead.company}`,
            quantity: 1,
            rate: initialLead.value,
            amount: initialLead.value,
          },
        ]);
      }
    }
  }, [initialLead, isOpen]);

  if (!isOpen) return null;

  const handleLeadSelect = (lId: string) => {
    setSelectedLeadId(lId);
    if (!lId) return;

    const found = leads.find((l) => (l._id || l.id) === lId);
    if (found) {
      setClientCompany(found.company || '');
      setClientName(found.name || '');
      setClientEmail(found.email || '');
      setClientPhone(found.phone || '');
      if (found.value && found.value > 0) {
        setItems([
          {
            id: 'item-1',
            description: `Project Scope for ${found.company}`,
            quantity: 1,
            rate: found.value,
            amount: found.value,
          },
        ]);
      }
    }
  };

  const applyPackagePreset = (preset: typeof PACKAGE_PRESETS[0]) => {
    const formatted = preset.items.map((it, idx) => ({
      id: `preset-item-${Date.now()}-${idx}`,
      description: it.description,
      quantity: it.quantity,
      rate: it.rate,
      amount: it.quantity * it.rate,
    }));
    setItems(formatted);
    if (preset.terms) {
      setTerms(preset.terms);
    }
  };

  const handleItemChange = (
    index: number,
    field: 'description' | 'quantity' | 'rate',
    value: any
  ) => {
    setItems((prev) => {
      const next = [...prev];
      const current = { ...next[index] };

      if (field === 'description') {
        current.description = value;
      } else if (field === 'quantity') {
        current.quantity = Math.max(1, Number(value) || 1);
        current.amount = current.quantity * current.rate;
      } else if (field === 'rate') {
        current.rate = Math.max(0, Number(value) || 0);
        current.amount = current.quantity * current.rate;
      }

      next[index] = current;
      return next;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: '',
        quantity: 1,
        rate: 25000,
        amount: 25000,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((discountedSubtotal * taxPercent) / 100);
  const totalAmount = discountedSubtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientCompany.trim()) {
      setError('Client company name is required');
      return;
    }
    if (items.length === 0 || items.some((it) => !it.description.trim())) {
      setError('Please provide a description for all deliverables');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        clientCompany: clientCompany.trim(),
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        leadId: selectedLeadId || undefined,
        issueDate,
        validUntil,
        items,
        subtotal,
        discountPercent,
        discountAmount,
        taxPercent,
        taxAmount,
        totalAmount,
        notes: notes.trim(),
        terms: terms.trim(),
        status: 'sent',
      };

      const res = await authFetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate quotation');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm shadow-amber-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Generate Commercial Quotation
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Sales Proposal
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Structure realistic milestone deliverables, apply commercial rates, and send to prospects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2 text-xs font-semibold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Package Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Click Deliverable Presets (Realistic Market Rates)</span>
              </span>
              <span className="text-[11px] text-slate-400">Select to pre-fill deliverables</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PACKAGE_PRESETS.map((pkg) => {
                const Icon = pkg.icon;
                return (
                  <button
                    key={pkg.name}
                    type="button"
                    onClick={() => applyPackagePreset(pkg)}
                    className="p-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-amber-50/60 hover:border-amber-300 text-left transition-all group active:scale-95 shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Icon className="w-4 h-4 text-slate-500 group-hover:text-amber-600 transition" />
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-white border border-slate-200/80 text-slate-600 group-hover:border-amber-200 group-hover:text-amber-700">
                        {pkg.badge}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-amber-900 transition">
                      {pkg.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prospect Selection & Client Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Link to Existing CRM Lead
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => handleLeadSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              >
                <option value="">Custom Prospect (New Company)</option>
                {leads.map((l) => {
                  const id = l._id || l.id;
                  return (
                    <option key={id} value={id}>
                      {l.company} — {l.name} (₹{(l.value || 0).toLocaleString()})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Client Company Name *
              </label>
              <input
                type="text"
                required
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                placeholder="e.g. Apex Dynamics Pvt Ltd"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Attention / Contact Person
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Rahul Sen"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Client Email
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="rahul@apexdynamics.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Proposal Issue Date
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Proposal Valid Until (30 Days)
              </label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Deliverables & Commercial Rates Breakdown *
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Itemized scope with units, deliverables and realistic professional fees
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center space-x-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition active:scale-95 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
              <div className="grid grid-cols-12 gap-2 p-3 bg-slate-100/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <span className="col-span-6">Scope & Deliverable Description</span>
                <span className="col-span-2 text-right">Qty / Sprints</span>
                <span className="col-span-2 text-right">Rate (₹)</span>
                <span className="col-span-2 text-right">Amount (₹)</span>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 p-3 items-center bg-white">
                    <div className="col-span-6">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Custom Android Mobile App (Kotlin / Compose)"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 text-right bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        required
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        className="w-full px-2 py-1.5 text-right bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-end space-x-1.5">
                      <span className="text-xs font-bold text-slate-800">
                        ₹{(item.amount || 0).toLocaleString()}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-300 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing & Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Scope Inclusions & Technical Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Deployment notes, included revisions, third-party API credentials..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Commercial Milestone Schedule & Terms
                </label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Payment milestones (e.g. 40% Kickoff, 40% Beta, 20% Sign-off)..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs flex flex-col justify-center">
              <div className="flex justify-between items-center text-slate-600 font-semibold">
                <span>Subtotal Gross Fee:</span>
                <span className="text-slate-900 font-bold">₹{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600 font-semibold">
                <span className="flex items-center space-x-1.5">
                  <span>Special Discount:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
                    className="w-12 px-1.5 py-0.5 text-right bg-white border border-slate-200 rounded text-xs font-bold text-slate-900"
                  />
                  <span>%</span>
                </span>
                <span className="text-rose-600 font-bold">-₹{discountAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600 font-semibold">
                <span className="flex items-center space-x-1.5">
                  <span>GST / Tax Compliance:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value) || 0)}
                    className="w-12 px-1.5 py-0.5 text-right bg-white border border-slate-200 rounded text-xs font-bold text-slate-900"
                  />
                  <span>%</span>
                </span>
                <span className="text-slate-900 font-bold">₹{taxAmount.toLocaleString()}</span>
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total Quotation Payable:</span>
                <span className="text-amber-600 text-base font-black">
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Standard ITPL Commercial Protocol</span>
            </span>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-500/20 active:scale-95 transition disabled:opacity-50 inline-flex items-center space-x-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{loading ? 'Generating...' : 'Issue Commercial Quotation'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
