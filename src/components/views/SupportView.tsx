'use client';

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Mail,
  Trash2,
  Tag,
  Wrench,
  Bug,
  Server,
  Terminal,
  Cpu,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import CustomSelect from '@/components/common/CustomSelect';
import { TicketCategory } from '@/models/Ticket';
import { useAuth } from '@/context/AuthContext';

interface SupportViewProps {
  tickets: any[];
  employees: any[];
  onRefresh: () => void;
}

const TECH_CATEGORIES: TicketCategory[] = [
  'Bug / Defect',
  'API & Integration',
  'Server & Performance',
  'System Crash / Downtime',
  'Technical Inquiry',
];

export default function SupportView({
  tickets,
  employees,
  onRefresh,
}: SupportViewProps) {
  const { user, role } = useAuth();
  const canManageTickets = role === 'admin_manager' || role === 'tech_support';

  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TicketCategory>('Bug / Defect');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showModal]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      onRefresh();
    } catch (err) {
      console.error('Error updating ticket:', err);
    }
  };

  const deleteTicket = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error('Error deleting ticket:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          customerName: user?.name || 'Staff Member',
          customerEmail: user?.email || 'staff@company.com',
          category,
          priority,
          assignedTo: assignedTo || undefined,
          description,
        }),
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
      setCategory('Bug / Defect');
      onRefresh();
    } catch (err) {
      console.error('Error creating ticket:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter(
    (t) => filter === 'all' || t.status === filter
  );

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'System Crash / Downtime':
        return {
          icon: <AlertTriangle className="w-3 h-3 text-rose-600" />,
          classes: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'Bug / Defect':
        return {
          icon: <Bug className="w-3 h-3 text-amber-600" />,
          classes: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'API & Integration':
        return {
          icon: <Terminal className="w-3 h-3 text-purple-600" />,
          classes: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'Server & Performance':
        return {
          icon: <Cpu className="w-3 h-3 text-indigo-600" />,
          classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'Technical Inquiry':
      case 'Technical':
      default:
        return {
          icon: <Wrench className="w-3 h-3 text-cyan-600" />,
          classes: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        };
    }
  };



  // Only Technical Support employees can be assigned to technical support tickets
  const assignableEmployees = employees.filter((e) => {
    const r = (e.role || '').toLowerCase().trim();
    const d = (e.department || '').toLowerCase().trim();
    return r === 'tech_support' || r.includes('support') || d.includes('support');
  });

  return (
    <div className="space-y-6">
      {/* Top Filter & Action Bar */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/80 p-5 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.12),0_6px_16px_-3px_rgba(15,23,42,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto p-1 bg-slate-100/80 border border-slate-200/50 rounded-full">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                filter === st
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full">
            <Wrench className="w-3.5 h-3.5 text-[#635BFF]" />
            <span>Tech Support Desk • Bug &amp; Incident Tracker</span>
          </span>

          <button
            onClick={() => setShowModal(true)}
            className="whitespace-nowrap shrink-0 px-4 py-2 text-xs sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-bold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm hover:shadow-md hover:shadow-indigo-500/20 active:scale-95 transition-all w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Raise Tech Ticket</span>
          </button>
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-3">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((t) => {
            const badge = getCategoryBadge(t.category);
            return (
              <div
                key={t._id}
                className="glass-card p-5 border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-200 transition-all"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                      {t.ticketNumber || 'TCK-TECH'}
                    </span>

                    {/* Technical Category Badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${badge.classes}`}
                    >
                      {badge.icon}
                      <span>{t.category || 'Technical'}</span>
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        t.priority === 'urgent' || t.priority === 'high'
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : t.priority === 'medium'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-slate-900">{t.title}</h4>
                  {t.description && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      {t.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2.5">
                    <span>
                      Reported by: <strong className="text-slate-800">{t.customerName}</strong> ({t.customerEmail})
                    </span>
                    {t.assignedTo && (
                      <span className="inline-flex items-center gap-1">
                        • Assigned Engineer:{' '}
                        <strong className="text-indigo-700 font-bold">
                          {typeof t.assignedTo === 'object'
                            ? t.assignedTo.name
                            : employees.find((e) => (e._id || e.id) === t.assignedTo)?.name || t.assignedTo}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end md:self-center">
                  {canManageTickets ? (
                    <>
                      <CustomSelect
                        value={t.status}
                        onChange={(val) => updateStatus(t._id, val)}
                        size="xs"
                        buttonClassName={`uppercase font-bold ${
                          t.status === 'resolved' || t.status === 'closed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                        options={[
                          { value: 'open', label: 'OPEN' },
                          { value: 'in_progress', label: 'IN PROGRESS' },
                          { value: 'resolved', label: 'RESOLVED' },
                          { value: 'closed', label: 'CLOSED' },
                        ]}
                      />

                      <button
                        onClick={() => deleteTicket(t._id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-xl hover:bg-rose-50"
                        title="Delete ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span
                      className={`text-[11px] font-bold uppercase px-3 py-1.5 rounded-xl border ${
                        t.status === 'resolved' || t.status === 'closed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : t.status === 'in_progress'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-card p-12 text-center border-slate-100 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#635BFF] flex items-center justify-center mx-auto mb-2">
              <Wrench className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Technical Tickets Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Customer technical support issues, bugs, API rate limits, and server incidents will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Raise Technical Support Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="my-auto w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-8 relative">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 pb-4 mb-4 border-b border-slate-100 pr-8">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#635BFF] flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Raise Tech Support Ticket</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Log customer software bugs, API defects, or server downtime incidents
                </p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Technical Issue Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 504 Gateway Timeout on bulk batch sync endpoint"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200/60 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-2 font-medium truncate mr-2">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">
                    Reported by: <strong className="text-slate-800 font-semibold">{user?.name || 'Staff Member'}</strong> ({user?.email || 'Internal Staff'})
                  </span>
                </span>
                <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 shrink-0">
                  Staff Member
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Technical Category
                  </label>
                  <CustomSelect
                    value={category}
                    onChange={(val) => setCategory(val as any)}
                    size="sm"
                    options={TECH_CATEGORIES.map((c) => ({ value: c, label: c }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Severity / Priority
                  </label>
                  <CustomSelect
                    value={priority}
                    onChange={(val) => setPriority(val as any)}
                    size="sm"
                    options={[
                      { value: 'low', label: 'Low Priority' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'urgent', label: 'Urgent / Blocker' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Technical Assignee
                  </label>
                  <CustomSelect
                    value={assignedTo}
                    onChange={setAssignedTo}
                    size="sm"
                    placeholder="-- Unassigned --"
                    options={[
                      { value: '', label: '-- Unassigned --' },
                      ...assignableEmployees.map((e) => ({
                        value: e._id || e.id,
                        label: `${e.name} (Tech Support)`,
                      })),
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Stack Trace / Error Logs / Steps to Reproduce
                </label>
                <textarea
                  rows={3}
                  placeholder="Paste error logs, HTTP response codes, device details, or reproduction steps..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none font-mono text-xs text-slate-700 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm hover:shadow-md hover:shadow-indigo-500/20 rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Create Tech Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
