'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  MapPin,
  Shield,
  Layers,
  Plus,
  Edit3,
  Trash2,
  X,
  Phone,
  Mail,
  Users,
} from 'lucide-react';

interface ManagementViewProps {
  onRefresh: () => void;
}

interface BranchItem {
  _id?: string;
  name: string;
  city: string;
  address: string;
  manager: string;
  email: string;
  phone: string;
  activeEmployees: string;
  status: 'Head Office' | 'Branch Office' | 'Regional Hub' | 'Development Hub' | 'Sales Hub';
  isHeadOffice: boolean;
}

const emptyForm: BranchItem = {
  name: '',
  city: '',
  address: '',
  manager: '',
  email: '',
  phone: '',
  activeEmployees: '1 Staff',
  status: 'Branch Office',
  isHeadOffice: false,
};

export default function ManagementView({ onRefresh }: ManagementViewProps) {
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState('');

  // Branch CRUD State
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [formData, setFormData] = useState<BranchItem>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      const res = await fetch('/api/branches');
      const data = await res.json();
      if (Array.isArray(data)) {
        setBranches(data);
      }
    } catch (err: any) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const handleOpenEdit = (branch: BranchItem) => {
    setEditingBranch(branch);
    setFormData(branch);
    setShowModal(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : '';
    if (cleanPhone && cleanPhone.length !== 10) {
      setMessage('❌ Phone number must be exactly 10 digits (no more, no less).');
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      const payload = { ...formData, phone: cleanPhone };
      if (editingBranch && editingBranch._id) {
        // Update existing
        const res = await fetch(`/api/branches/${editingBranch._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage(`✅ "${formData.name}" updated successfully!`);
          setShowModal(false);
          await fetchBranches();
        } else {
          setMessage(`❌ ${data.error || 'Failed to update'}`);
        }
      } else {
        // Create new
        const res = await fetch('/api/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage(`✅ New branch "${formData.name}" created successfully!`);
          setShowModal(false);
          await fetchBranches();
        } else {
          setMessage(`❌ ${data.error || 'Failed to create branch'}`);
        }
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBranch = async (id?: string, name?: string) => {
    if (!id) return;
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Branch "${name}" deleted.`);
        await fetchBranches();
      } else {
        setMessage(`❌ ${data.error || 'Failed to delete'}`);
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to delete all database records?')) return;
    try {
      setClearing(true);
      setMessage('');
      const res = await fetch('/api/seed', { method: 'DELETE' });
      const data = await res.json();
      setMessage(data.message || 'All records cleared');
      onRefresh();
    } catch (err: any) {
      setMessage(err.message || 'Error clearing database');
    } finally {
      setClearing(false);
    }
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      setMessage('');
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      setMessage(data.message || 'Seeded successfully');
      onRefresh();
      await fetchBranches();
    } catch (err: any) {
      setMessage(err.message || 'Error seeding database');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Organization Card */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/80 p-6 sm:p-7 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.12),0_6px_16px_-3px_rgba(15,23,42,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F0EEFF] flex items-center justify-center text-[#635BFF] font-extrabold text-2xl shadow-sm flex-shrink-0">
            UD
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">
                Unique Digital Services
              </h3>
              <span className="text-xs bg-[#EEF2FF] text-[#635BFF] font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Registered Multi-Tenant Organization • CRM Domain: <code className="text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">uniquedigital.crm.io</code>
            </p>
          </div>
        </div>

        {/* Database Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleClear}
            disabled={clearing}
            className="px-4 py-2 rounded-full text-xs font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-100 border border-rose-200/80 active:scale-95 transition-all disabled:opacity-50"
          >
            {clearing ? 'Clearing...' : 'Clear All Data'}
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm hover:shadow-md hover:shadow-indigo-500/15 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Populating...' : 'Seed Sample Data'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-indigo-50/80 border border-indigo-100 text-indigo-900 text-xs font-medium rounded-2xl flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Office & Branch Locations Directory (Editable, Deletable & Addable) */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/80 p-6 sm:p-7 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.12),0_6px_16px_-3px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h4 className="text-base font-bold tracking-tight text-slate-900 flex items-center space-x-2">
              <span>Office &amp; Branch Locations</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {branches.length}
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage corporate headquarters, regional offices, and branch operations
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="whitespace-nowrap shrink-0 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-semibold bg-[#635BFF] hover:bg-[#5249EC] text-white shadow-sm transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Add Branch</span>
          </button>
        </div>

        {loadingBranches ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
            Loading office locations...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {branches.map((b) => {
              const isHQ = b.isHeadOffice || b.status === 'Head Office';
              return (
                <div
                  key={b._id || b.name}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isHQ
                      ? 'bg-gradient-to-br from-indigo-50/50 via-slate-50 to-purple-50/30 border-indigo-200/80 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Top Status & Actions */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isHQ
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isHQ ? 'Primary Head Office' : b.status}
                      </span>

                      {/* Edit / Delete Buttons */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Edit branch details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(b._id, b.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete branch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Name & City */}
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isHQ
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-900 leading-snug">{b.name}</h5>
                        <p className="text-xs text-slate-500">{b.city}</p>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start space-x-2 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{b.address}</span>
                    </div>

                    {/* Contact Details */}
                    {(b.email || b.phone) && (
                      <div className="mt-2.5 space-y-1 text-xs text-slate-500">
                        {b.email && (
                          <div className="flex items-center space-x-1.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{b.email}</span>
                          </div>
                        )}
                        {b.phone && (
                          <div className="flex items-center space-x-1.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{b.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Manager info */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="text-slate-500">
                      Manager: <strong className="text-slate-800">{b.manager || 'Unassigned'}</strong>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {b.activeEmployees}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Modal: Add / Edit Branch */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingBranch ? 'Edit Office / Branch' : 'Add New Branch'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Branch / Office Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sangli Head Office (Central HQ)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Office Type *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => {
                      const status = e.target.value as any;
                      setFormData({
                        ...formData,
                        status,
                        isHeadOffice: status === 'Head Office',
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Head Office">Head Office (HQ)</option>
                    <option value="Branch Office">Branch Office</option>
                    <option value="Regional Hub">Regional Hub</option>
                    <option value="Development Hub">Development Hub</option>
                    <option value="Sales Hub">Sales Hub</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    City &amp; State *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sangli, Maharashtra"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Street Address *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. IT Park Road, Chandani Chowk, Sangli, Maharashtra 416416"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Branch Manager / Lead *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aditya Patil"
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Staff / Team Allocation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4 Staff or All Core Staff"
                    value={formData.activeEmployees}
                    onChange={(e) => setFormData({ ...formData, activeEmployees: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="e.g. sangli@uniquedigital.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Phone</label>
                    <span className={`text-[10px] font-mono ${formData.phone.replace(/\D/g, '').length === 10 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      {formData.phone.replace(/\D/g, '').length}/10 digits
                    </span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    placeholder="10-digit phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingBranch ? 'Update Location' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
