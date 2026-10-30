'use client';

import React, { useState } from 'react';
import {
  Users2,
  Plus,
  DollarSign,
  TrendingUp,
  Mail,
  Phone,
  Building,
  Trash2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/apiClient';
import CustomSelect from '@/components/common/CustomSelect';

interface LeadsViewProps {
  leads: any[];
  onOpenAddLead: () => void;
  onRefresh: () => void;
}

export default function LeadsView({
  leads,
  onOpenAddLead,
  onRefresh,
}: LeadsViewProps) {
  const { role } = useAuth();
  const isAdminOrManager = role === 'admin_manager' || role === 'sales';

  const [selectedStage, setSelectedStage] = useState('all');

  const updateLeadStage = async (id: string, newStage: string) => {
    if (!isAdminOrManager) return;
    try {
      await authFetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStage }),
      });
      onRefresh();
    } catch (err) {
      console.error('Error updating lead stage:', err);
    }
  };

  const deleteLead = async (id: string) => {
    if (!isAdminOrManager) return;
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await authFetch(`/api/leads/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  const totalValue = leads.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const wonLeads = leads.filter((l) => l.status === 'won');
  const wonValue = wonLeads.reduce((acc, curr) => acc + (curr.value || 0), 0);

  const filteredLeads = leads.filter(
    (l) => selectedStage === 'all' || l.status === selectedStage
  );

  const stages = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

  return (
    <div className="space-y-6">
      {/* 1. Pipeline Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-6 flex items-center justify-between shadow-[0_10px_28px_-4px_rgba(15,23,42,0.09),0_2px_8px_-1px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_42px_-6px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 transition-all duration-300">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Pipeline Value
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              ${totalValue.toLocaleString()}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#F0EEFF] text-[#635BFF] flex items-center justify-center font-bold flex-shrink-0">
            $
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-6 flex items-center justify-between shadow-[0_10px_28px_-4px_rgba(15,23,42,0.09),0_2px_8px_-1px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_42px_-6px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 transition-all duration-300">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Prospects
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              {leads.length}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#EEF2FF] text-[#3B82F6] flex items-center justify-center flex-shrink-0">
            <Users2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-6 flex items-center justify-between shadow-[0_10px_28px_-4px_rgba(15,23,42,0.09),0_2px_8px_-1px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_42px_-6px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 transition-all duration-300">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Won Revenue
            </p>
            <h3 className="text-2xl font-extrabold text-emerald-600 tracking-tight mt-1.5">
              ${wonValue.toLocaleString()}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#E6F7F0] text-[#10B981] flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Filter & Actions Bar */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-5 shadow-[0_10px_28px_-4px_rgba(15,23,42,0.08)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto p-1 bg-slate-100/80 border border-slate-200/50 rounded-full">
          <button
            onClick={() => setSelectedStage('all')}
            className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedStage === 'all'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Leads ({leads.length})
          </button>
          {stages.map((st) => {
            const count = leads.filter((l) => l.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setSelectedStage(st)}
                className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                  selectedStage === st
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>

        {/* Add Lead button: only visible to Admin & Manager */}
        {isAdminOrManager && (
          <button
            onClick={onOpenAddLead}
            className="whitespace-nowrap shrink-0 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-semibold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm hover:shadow-md hover:shadow-indigo-500/15 active:scale-95 transition-all w-full md:w-auto"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Add Lead</span>
          </button>
        )}
      </div>

      {/* 3. Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Contact & Company</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Deal Value</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Stage</th>
                {isAdminOrManager && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{lead.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium flex items-center space-x-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{lead.company}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1 text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center space-x-1 text-slate-500 text-[11px] mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      ${(lead.value || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200">
                        {lead.source || 'Website'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {isAdminOrManager ? (
                        <CustomSelect
                          value={lead.status}
                          onChange={(newStatus) => updateLeadStage(lead._id, newStatus)}
                          size="xs"
                          buttonClassName={`uppercase font-bold ${
                            lead.status === 'won'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : lead.status === 'lost'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : lead.status === 'qualified' || lead.status === 'proposal'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                          options={stages.map((s) => ({ value: s, label: s.toUpperCase() }))}
                        />
                      ) : (
                        <span
                          className={`text-xs font-bold uppercase rounded-lg px-2.5 py-1 border inline-block ${
                            lead.status === 'won'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : lead.status === 'lost'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : lead.status === 'qualified' || lead.status === 'proposal'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {lead.status}
                        </span>
                      )}
                    </td>
                    {isAdminOrManager && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => deleteLead(lead._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                          title="Delete lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdminOrManager ? 6 : 5} className="text-center py-10 text-slate-400">
                    No leads found for this stage.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
