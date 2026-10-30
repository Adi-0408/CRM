'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import CustomSelect from '@/components/common/CustomSelect';

interface SupportViewProps {
  tickets: any[];
  employees: any[];
  onRefresh: () => void;
}

export default function SupportView({
  tickets,
  employees,
  onRefresh,
}: SupportViewProps) {
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [category, setCategory] = useState<'Technical' | 'Billing' | 'Feature Request' | 'General'>('Technical');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    if (!title.trim() || !customerName.trim() || !customerEmail.trim()) return;

    try {
      setSubmitting(true);
      await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          customerName,
          customerEmail,
          category,
          priority,
          assignedTo: assignedTo || undefined,
          description,
        }),
      });
      setShowModal(false);
      setTitle('');
      setCustomerName('');
      setCustomerEmail('');
      setDescription('');
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

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/80 p-5 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.12),0_6px_16px_-3px_rgba(15,23,42,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto p-1 bg-slate-100/80 border border-slate-200/50 rounded-full">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                filter === st
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="whitespace-nowrap shrink-0 px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm rounded-full inline-flex items-center justify-center gap-1.5 font-semibold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm hover:shadow-md hover:shadow-indigo-500/15 active:scale-95 transition-all w-full sm:w-auto"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>Raise Ticket</span>
        </button>
      </div>

      {/* Ticket List */}
      <div className="space-y-3">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((t) => (
            <div
              key={t._id}
              className="glass-card p-5 border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-200 transition-all"
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {t.ticketNumber}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {t.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
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

                <h4 className="text-sm font-bold text-slate-900">{t.title}</h4>
                {t.description && (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {t.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                  <span>
                    Client: <strong className="text-slate-800">{t.customerName}</strong> ({t.customerEmail})
                  </span>
                  {t.assignedTo && (
                    <span>
                      • Assigned to: <strong className="text-slate-800">{t.assignedTo.name}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end md:self-center">
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
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                  title="Delete ticket"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-12 text-center border-slate-100">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No tickets found</h4>
            <p className="text-xs text-slate-400 mt-1">
              Customer support issues and tickets will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Raise Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Raise Support Ticket</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Issue Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Export report generates error 500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Customer Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Category
                  </label>
                  <CustomSelect
                    value={category}
                    onChange={(val) => setCategory(val as any)}
                    size="sm"
                    options={['Technical', 'Billing', 'Feature Request', 'General']}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Priority
                  </label>
                  <CustomSelect
                    value={priority}
                    onChange={(val) => setPriority(val as any)}
                    size="sm"
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'urgent', label: 'Urgent' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Assignee
                  </label>
                  <CustomSelect
                    value={assignedTo}
                    onChange={setAssignedTo}
                    size="sm"
                    placeholder="-- Unassigned --"
                    options={[
                      { value: '', label: '-- Unassigned --' },
                      ...employees.map((e) => ({
                        value: e._id,
                        label: e.name,
                      })),
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
