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
  LayoutGrid,
  List,
  FolderKanban,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  Target,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/apiClient';
import CustomSelect from '@/components/common/CustomSelect';
import QuotationsTab from '@/components/quotations/QuotationsTab';
import CreateQuotationModal from '@/components/quotations/CreateQuotationModal';
import EditClientRequirementsModal from '@/components/modals/EditClientRequirementsModal';
import SalesTargetsTab from '@/components/sales/SalesTargetsTab';
import { canSalesEditProject } from '@/lib/permissions';

interface LeadsViewProps {
  leads: any[];
  projects?: any[];
  employees?: any[];
  initialSection?: 'leads' | 'quotations' | 'targets';
  onOpenAddLead: () => void;
  onOpenCreateProject?: (prefill?: { client?: string; budget?: number; title?: string; leadId?: string }) => void;
  onNavigateTab?: (tab: string) => void;
  onRefresh: () => void;
}

export default function LeadsView({
  leads,
  projects = [],
  employees = [],
  initialSection = 'leads',
  onOpenAddLead,
  onOpenCreateProject,
  onNavigateTab,
  onRefresh,
}: LeadsViewProps) {
  const { user, role } = useAuth();
  const isAdminOrManager = role === 'admin_manager' || role === 'sales';

  const [selectedStage, setSelectedStage] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [salesSection, setSalesSection] = useState<'leads' | 'quotations' | 'targets'>(initialSection);
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState<any | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [editRequirementsProject, setEditRequirementsProject] = useState<any>(null);

  React.useEffect(() => {
    if (initialSection) {
      setSalesSection(initialSection);
    }
  }, [initialSection]);

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

  // Helper: Find linked project for a client/lead
  const getLinkedProject = (lead: any) => {
    if (!lead || !Array.isArray(projects)) return null;
    const leadId = String(lead._id || lead.id || '');
    const company = lead.company?.trim().toLowerCase();
    const name = lead.name?.trim().toLowerCase();

    return projects.find((p) => {
      if (lead.projectId && (String(p._id) === String(lead.projectId) || String(p.id) === String(lead.projectId))) {
        return true;
      }
      if (p.leadId && String(p.leadId) === leadId) return true;
      const pClient = typeof p.client === 'object' ? String(p.client?.name || p.client?.company || '') : String(p.client || '');
      const pClientLower = pClient.toLowerCase().trim();
      if (leadId && pClient === leadId) return true;
      if (company && pClientLower === company) return true;
      if (name && pClientLower === name) return true;
      return false;
    });
  };

  const projectStages = [
    { key: 'new', label: 'New' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      {/* 0. Top Sales Switcher: Leads & Pipeline vs Quotations & Proposals */}
      <div className="bg-white rounded-2xl border border-slate-100 p-2 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          <button
            onClick={() => setSalesSection('leads')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 flex-1 sm:flex-initial ${
              salesSection === 'leads'
                ? 'bg-[#635BFF] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users2 className="w-3.5 h-3.5" />
            <span>Leads & Sales Pipeline</span>
          </button>
          <button
            onClick={() => setSalesSection('quotations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 flex-1 sm:flex-initial ${
              salesSection === 'quotations'
                ? 'bg-[#635BFF] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Quotations & Commercial Proposals</span>
          </button>
          <button
            onClick={() => setSalesSection('targets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 flex-1 sm:flex-initial ${
              salesSection === 'targets'
                ? 'bg-[#635BFF] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Commission & Target Tracking</span>
          </button>
        </div>
        <span className="text-[11px] font-bold text-slate-400 mr-2 hidden md:inline-block">
          Sales & Client Engagement Hub
        </span>
      </div>

      {salesSection === 'quotations' ? (
        <QuotationsTab leads={leads} onRefreshParent={onRefresh} />
      ) : salesSection === 'targets' ? (
        <SalesTargetsTab
          leads={leads}
          employees={employees}
          projects={projects}
          onRefreshParent={onRefresh}
        />
      ) : (
        <>
          {/* 1. Pipeline Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-6 flex items-center justify-between shadow-[0_10px_28px_-4px_rgba(15,23,42,0.09),0_2px_8px_-1px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_42px_-6px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 transition-all duration-300">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Pipeline Value
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              ₹{totalValue.toLocaleString()}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#F0EEFF] text-[#635BFF] flex items-center justify-center font-bold flex-shrink-0">
            ₹
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
              ₹{wonValue.toLocaleString()}
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

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          {/* View Toggle: Cards vs Table */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Cards View (with Live Project Status)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Add Lead button */}
          {isAdminOrManager && (
            <button
              onClick={onOpenAddLead}
              className="whitespace-nowrap shrink-0 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-semibold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm hover:shadow-md hover:shadow-indigo-500/15 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Add Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Content: Cards View (Default) or Table View */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => {
              const isWon = lead.status === 'won';
              const linkedProject = isWon ? getLinkedProject(lead) : null;

              return (
                <div
                  key={lead._id}
                  className={`bg-white rounded-3xl border p-5 flex flex-col justify-between transition-all duration-300 ${
                    isWon
                      ? 'border-emerald-200/90 shadow-[0_12px_32px_-4px_rgba(16,185,129,0.12)] hover:border-emerald-300 hover:shadow-[0_16px_36px_-4px_rgba(16,185,129,0.18)]'
                      : 'border-slate-100 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] hover:border-slate-200 hover:shadow-[0_12px_28px_-4px_rgba(15,23,42,0.08)]'
                  }`}
                >
                  <div>
                    {/* Top Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 tracking-tight">
                          {lead.name}
                        </h4>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium mt-0.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{lead.company}</span>
                        </div>
                        {lead.quotationNumber && (
                          <div className="mt-1">
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <FileSpreadsheet className="w-3 h-3" />
                              <span>{lead.quotationNumber}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-extrabold text-slate-900 font-mono block">
                          ₹{(lead.value || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {lead.source || 'Website'}
                        </span>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center space-x-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* LIVE PROJECT STATUS WIDGET (For Won Leads) */}
                    {isWon && (
                      <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-slate-50 border border-emerald-200/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">
                              Live Project Status
                            </span>
                          </div>
                          {linkedProject && (
                            <button
                              onClick={() => onNavigateTab && onNavigateTab('projects')}
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-0.5"
                            >
                              <span>View Project</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {linkedProject ? (
                          <>
                            {/* Project Title */}
                            <div>
                              <h5 className="text-xs font-bold text-slate-900 truncate">
                                {linkedProject.title}
                              </h5>
                              <p className="text-[10px] text-slate-500">
                                Budget: <span className="font-semibold text-slate-700">₹{(linkedProject.budget || 0).toLocaleString()}</span>
                              </p>
                            </div>

                            {/* 1. Progress Bar (0-100%) */}
                            <div>
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                                <span>Deliverable Progress</span>
                                <span className="text-emerald-700 font-extrabold">{linkedProject.progress || 0}%</span>
                              </div>
                              <div className="w-full h-2.5 bg-emerald-200/50 rounded-full overflow-hidden p-0.5">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 shadow-xs"
                                  style={{ width: `${linkedProject.progress || 0}%` }}
                                />
                              </div>
                            </div>

                            {/* 2. Current Stage Stepper (New ➔ In Progress ➔ Completed) */}
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                Stage Progression
                              </span>
                              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold text-center">
                                {projectStages.map((ps, idx) => {
                                  const normalizedStatus =
                                    linkedProject.status === 'planning'
                                      ? 'new'
                                      : linkedProject.status;
                                  const currentIdx = projectStages.findIndex(
                                    (s) => s.key === normalizedStatus
                                  );
                                  const isPast = idx < currentIdx;
                                  const isCurrent = idx === currentIdx;

                                  return (
                                    <div
                                      key={ps.key}
                                      className={`py-1 px-1 rounded-lg border transition-all ${
                                        isCurrent
                                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-105'
                                          : isPast
                                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                          : 'bg-white/80 text-slate-400 border-slate-200/70'
                                      }`}
                                    >
                                      {ps.label}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* 3. Target Deadline & Days Remaining */}
                            <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px]">
                              <div className="flex items-center space-x-1.5 text-slate-600">
                                <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>
                                  {new Date(linkedProject.deadline).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                              {(() => {
                                const now = new Date();
                                const dl = new Date(linkedProject.deadline);
                                const diffDays = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                return (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      diffDays < 0
                                        ? 'bg-rose-100 text-rose-700'
                                        : diffDays <= 7
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {diffDays < 0 ? `Overdue ${Math.abs(diffDays)}d` : diffDays === 0 ? 'Due Today' : `${diffDays}d left`}
                                  </span>
                                );
                              })()}
                            </div>

                            {/* 4. Assigned Developers / Interns Badges */}
                            {Array.isArray(linkedProject.teamMembers) && linkedProject.teamMembers.length > 0 && (
                              <div className="flex items-center space-x-1.5 pt-1">
                                <span className="text-[10px] text-slate-400 font-semibold">Devs:</span>
                                <div className="flex -space-x-1.5 overflow-hidden">
                                  {linkedProject.teamMembers.map((m: any, mIdx: number) => (
                                    <div
                                      key={m._id || mIdx}
                                      className="w-5 h-5 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-700 uppercase"
                                      title={m.name || 'Developer'}
                                    >
                                      {m.name ? m.name[0] : 'D'}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 5. What Client Wants / Scope notes */}
                            {linkedProject.clientRequirements ? (
                              <div className="mt-2.5 p-2 rounded-xl bg-amber-50/80 border border-amber-200/70 text-[11px] space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-[9px] text-amber-900 uppercase tracking-wider flex items-center space-x-1">
                                    <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                    <span>Client Requirements</span>
                                  </span>
                                  {canSalesEditProject(user, linkedProject, lead) && (
                                    <button
                                      onClick={() => setEditRequirementsProject(linkedProject)}
                                      className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline"
                                    >
                                      Edit
                                    </button>
                                  )}
                                </div>
                                <p className="text-slate-700 italic line-clamp-2">
                                  "{linkedProject.clientRequirements}"
                                </p>
                              </div>
                            ) : canSalesEditProject(user, linkedProject, lead) ? (
                              <button
                                onClick={() => setEditRequirementsProject(linkedProject)}
                                className="mt-2 w-full py-1.5 px-2.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/40 hover:bg-amber-50 text-amber-800 text-[11px] font-bold flex items-center justify-center space-x-1 transition-all"
                              >
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>+ Specify What Client Wants</span>
                              </button>
                            ) : null}
                          </>
                        ) : (
                          /* Prompt when Lead is Won but no Project initialized */
                          <div className="text-center py-2 space-y-2">
                            <p className="text-xs text-emerald-900 font-medium">
                              Client contract won! No project deliverable initialized yet.
                            </p>
                            {onOpenCreateProject && isAdminOrManager && (
                              <button
                                onClick={() =>
                                  onOpenCreateProject({
                                    client: lead.company,
                                    budget: lead.value,
                                    title: `${lead.company} Platform`,
                                    leadId: lead._id,
                                  })
                                }
                                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all inline-flex items-center justify-center space-x-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Launch Project for {lead.company}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stage Dropdown & Actions Footer */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex-1">
                      {isAdminOrManager ? (
                        <CustomSelect
                          value={lead.status}
                          onChange={(newStatus) => updateLeadStage(lead._id, newStatus)}
                          size="xs"
                          buttonClassName={`uppercase font-bold w-full ${
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
                    </div>

                    {isAdminOrManager && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setSelectedLeadForQuote(lead);
                            setShowQuoteModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-amber-600 transition-colors rounded-xl hover:bg-amber-50"
                          title="Generate Pricing Quotation"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteLead(lead._id)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-xl hover:bg-rose-50"
                          title="Delete lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">
              No leads found for this stage.
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] overflow-hidden">
          <div className="overflow-x-auto min-h-[220px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Contact & Company</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Deal Value</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Project Status</th>
                  {isAdminOrManager && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => {
                    const isWon = lead.status === 'won';
                    const linkedProject = isWon ? getLinkedProject(lead) : null;

                    return (
                      <tr key={lead._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                            <span>{lead.name}</span>
                            {lead.quotationNumber && (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
                                <FileSpreadsheet className="w-2.5 h-2.5" />
                                <span>{lead.quotationNumber}</span>
                              </span>
                            )}
                          </div>
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
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 font-mono">
                          ₹{(lead.value || 0).toLocaleString()}
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
                        <td className="py-3.5 px-4">
                          {isWon ? (
                            linkedProject ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-16 h-2 bg-emerald-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${linkedProject.progress || 0}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-extrabold text-emerald-700">
                                  {linkedProject.progress || 0}% ({linkedProject.status})
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  onOpenCreateProject &&
                                  onOpenCreateProject({
                                    client: lead.company,
                                    budget: lead.value,
                                    title: `${lead.company} Platform`,
                                    leadId: lead._id,
                                  })
                                }
                                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline"
                              >
                                + Start Project
                              </button>
                            )
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        {isAdminOrManager && (
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => {
                                  setSelectedLeadForQuote(lead);
                                  setShowQuoteModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50"
                                title="Generate Pricing Quotation"
                              >
                                <FileSpreadsheet className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteLead(lead._id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                                title="Delete lead"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isAdminOrManager ? 7 : 6} className="text-center py-10 text-slate-400">
                      No leads found for this stage.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {/* Quotation Creation Modal */}
      <CreateQuotationModal
        isOpen={showQuoteModal}
        onClose={() => {
          setShowQuoteModal(false);
          setSelectedLeadForQuote(null);
        }}
        onSuccess={onRefresh}
        leads={leads}
        initialLead={selectedLeadForQuote}
      />

      {/* Edit Client Requirements / Scope Modal */}
      {editRequirementsProject && (
        <EditClientRequirementsModal
          isOpen={!!editRequirementsProject}
          onClose={() => setEditRequirementsProject(null)}
          onSuccess={onRefresh}
          project={editRequirementsProject}
        />
      )}
    </div>
  );
}
