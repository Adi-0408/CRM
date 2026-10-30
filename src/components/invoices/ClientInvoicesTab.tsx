'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  IndianRupee,
  RefreshCw,
  Printer,
  Trash2,
  Check,
  Building2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { IInvoice } from '@/models/Invoice';
import { useAuth } from '@/context/AuthContext';
import { canManageInvoices } from '@/lib/permissions';
import { authFetch } from '@/lib/apiClient';
import CreateInvoiceModal from './CreateInvoiceModal';
import InvoiceReceiptModal from './InvoiceReceiptModal';

interface ClientInvoicesTabProps {
  projects?: any[];
}

export default function ClientInvoicesTab({ projects = [] }: ClientInvoicesTabProps) {
  const { user } = useAuth();
  const canManage = canManageInvoices(user);

  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'issued' | 'paid' | 'overdue'>('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<IInvoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/invoices');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setInvoices(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    const now = new Date();

    invoices.forEach((inv) => {
      const total = inv.totalAmount || 0;
      totalInvoiced += total;

      const isPaid = inv.status === 'paid';
      const isOverdue = !isPaid && (inv.status === 'overdue' || new Date(inv.dueDate) < now);

      if (isPaid) {
        totalCollected += total;
      } else {
        totalPending += total;
        if (isOverdue) {
          overdueCount++;
          overdueAmount += total;
        }
      }
    });

    return {
      totalInvoiced,
      totalCollected,
      totalPending,
      overdueCount,
      overdueAmount,
    };
  }, [invoices]);

  // Quick 1-click Mark as Paid
  const handleQuickMarkPaid = async (inv: IInvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    const id = inv._id || inv.id;
    if (!id || inv.status === 'paid') return;

    setUpdatingId(id);
    try {
      const res = await authFetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          paidAt: new Date().toISOString(),
          paymentMethod: 'Direct Payment / Wire',
        }),
      });
      if (res.ok) {
        setInvoices((prev) =>
          prev.map((item) =>
            (item._id || item.id) === id
              ? { ...item, status: 'paid', paidAt: new Date().toISOString() }
              : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark invoice as paid', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = async (inv: IInvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    const id = inv._id || inv.id;
    if (!id) return;
    if (!confirm(`Are you sure you want to delete invoice ${inv.invoiceNumber}?`)) return;

    try {
      const res = await authFetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setInvoices((prev) => prev.filter((item) => (item._id || item.id) !== id));
      }
    } catch (err) {
      console.error('Failed to delete invoice', err);
    }
  };

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const now = new Date();

    return invoices.filter((inv) => {
      const isPaid = inv.status === 'paid';
      const isOverdue = !isPaid && (inv.status === 'overdue' || new Date(inv.dueDate) < now);

      if (statusFilter === 'paid' && !isPaid) return false;
      if (statusFilter === 'issued' && (isPaid || isOverdue)) return false;
      if (statusFilter === 'overdue' && !isOverdue) return false;

      if (!q) return true;

      const number = (inv.invoiceNumber || '').toLowerCase();
      const company = (inv.clientCompany || '').toLowerCase();
      const name = (inv.clientName || '').toLowerCase();
      const project = (inv.projectTitle || '').toLowerCase();

      return (
        number.includes(q) ||
        company.includes(q) ||
        name.includes(q) ||
        project.includes(q)
      );
    });
  }, [invoices, searchQuery, statusFilter]);

  const formatDate = (d?: Date | string | null) => {
    if (!d) return '—';
    try {
      const parsed = new Date(d);
      return parsed.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(d);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900">
              Client Invoicing & Accounts Receivable
            </h3>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              Receivables Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Milestone billing, payment tracking & printable client invoices
          </p>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={fetchInvoices}
            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm active:scale-95 transition inline-flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Four Receivable KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Invoiced */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Invoiced
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#635BFF] flex items-center justify-center font-bold text-xs">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
            ₹{metrics.totalInvoiced.toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Across all project contracts</p>
        </div>

        {/* KPI 2: Collected Revenue */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Collected Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 tracking-tight mt-2">
            ₹{metrics.totalCollected.toLocaleString()}
          </h3>
          <p className="text-[11px] text-emerald-600/80 font-medium mt-1">Settled & deposited</p>
        </div>

        {/* KPI 3: Outstanding Receivables */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Outstanding Due
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-blue-600 tracking-tight mt-2">
            ₹{metrics.totalPending.toLocaleString()}
          </h3>
          <p className="text-[11px] text-blue-600/80 font-medium mt-1">Awaiting client payment</p>
        </div>

        {/* KPI 4: Overdue Invoices */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Overdue Receivables
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-600 tracking-tight mt-2">
            ₹{metrics.overdueAmount.toLocaleString()}
          </h3>
          <p className="text-[11px] text-rose-600/80 font-medium mt-1">
            {metrics.overdueCount} {metrics.overdueCount === 1 ? 'invoice' : 'invoices'} past due
          </p>
        </div>
      </div>

      {/* 3. Search and Status Filter Pill Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, invoice # or project..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] transition"
          />
        </div>

        <div className="flex items-center space-x-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
          {(
            [
              { key: 'all', label: 'All Invoices' },
              { key: 'issued', label: 'Pending Due' },
              { key: 'paid', label: 'Paid' },
              { key: 'overdue', label: 'Overdue' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#635BFF]" />
            <p>Loading invoice records...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No client invoices found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters or search keywords.'
                  : 'Generate your first project milestone invoice to track revenue.'}
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5249EC] shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Invoice</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5">Invoice #</th>
                  <th className="py-3 px-5">Client & Contact</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredInvoices.map((inv) => {
                  const id = inv._id || inv.id;
                  const isPaid = inv.status === 'paid';
                  const isOverdue =
                    !isPaid && (inv.status === 'overdue' || new Date(inv.dueDate) < new Date());

                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-50/60 transition cursor-pointer"
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setShowReceiptModal(true);
                      }}
                    >
                      {/* Invoice Number */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="font-mono font-bold text-slate-900">
                            {inv.invoiceNumber}
                          </span>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{inv.clientCompany}</div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          {inv.clientName && <span>{inv.clientName}</span>}
                          {inv.clientEmail && <span>• {inv.clientEmail}</span>}
                        </div>
                      </td>

                      {/* Project */}
                      <td className="py-3.5 px-4">
                        {inv.projectTitle ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {inv.projectTitle}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Direct / Custom</span>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 text-[11px]">
                          Issued: <span className="font-semibold">{formatDate(inv.issueDate)}</span>
                        </div>
                        <div
                          className={`text-[11px] mt-0.5 ${
                            isOverdue ? 'text-rose-600 font-bold' : 'text-slate-400'
                          }`}
                        >
                          Due: {formatDate(inv.dueDate)}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-black text-slate-900 text-sm">
                          ₹{(inv.totalAmount || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Sub: ₹{(inv.subtotal || 0).toLocaleString()} + {inv.taxPercent || 0}% tax
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isOverdue
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Issued'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowReceiptModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="View / Print Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {!isPaid && canManage && (
                            <button
                              onClick={(e) => handleQuickMarkPaid(inv, e)}
                              disabled={updatingId === id}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition inline-flex items-center space-x-1 active:scale-95 shadow-2xs"
                              title="Mark as Paid"
                            >
                              {updatingId === id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              <span>Paid</span>
                            </button>
                          )}

                          {canManage && (
                            <button
                              onClick={(e) => handleDeleteInvoice(inv, e)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete Invoice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchInvoices}
        projects={projects}
      />

      <InvoiceReceiptModal
        invoice={selectedInvoice}
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedInvoice(null);
        }}
        onStatusUpdate={fetchInvoices}
        canManage={canManage}
      />
    </div>
  );
}
