'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Printer,
  Download,
  Trash2,
  Check,
  Building2,
  Calendar,
  Sparkles,
  TrendingUp,
  LayoutGrid,
  List,
  Mail,
  ChevronRight,
  ArrowUpRight,
  IndianRupee,
  Layers,
} from 'lucide-react';
import { IQuotation } from '@/models/Quotation';
import { useAuth } from '@/context/AuthContext';
import { canManageQuotations } from '@/lib/permissions';
import { authFetch } from '@/lib/apiClient';
import CreateQuotationModal from './CreateQuotationModal';
import QuotationReceiptModal from './QuotationReceiptModal';

interface QuotationsTabProps {
  leads?: any[];
  onRefreshParent?: () => void;
}

export default function QuotationsTab({
  leads = [],
  onRefreshParent,
}: QuotationsTabProps) {
  const { user } = useAuth();
  const canManage = canManageQuotations(user);

  const [quotations, setQuotations] = useState<IQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'draft'
  >('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<IQuotation | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/quotations');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setQuotations(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalValue = 0;
    let acceptedValue = 0;
    let pendingValue = 0;
    let acceptedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    const now = new Date();

    quotations.forEach((q) => {
      const total = q.totalAmount || 0;
      totalValue += total;

      const isAccepted = q.status === 'accepted';
      const isRejected = q.status === 'rejected';
      const isExpired =
        q.status === 'expired' || (!isAccepted && new Date(q.validUntil) < now);

      if (isAccepted) {
        acceptedValue += total;
        acceptedCount++;
      } else if (isRejected) {
        rejectedCount++;
      } else if (!isExpired) {
        pendingValue += total;
        pendingCount++;
      }
    });

    const totalDecided = acceptedCount + rejectedCount;
    const winRate =
      totalDecided > 0 ? Math.round((acceptedCount / totalDecided) * 100) : 0;

    return {
      totalValue,
      acceptedValue,
      pendingValue,
      acceptedCount,
      pendingCount,
      winRate,
    };
  }, [quotations]);

  // 1-Click Quick Accept (Converts to Won Deal)
  const handleQuickAccept = async (q: IQuotation, e: React.MouseEvent) => {
    e.stopPropagation();
    const id = q._id || q.id;
    if (!id || q.status === 'accepted') return;

    setUpdatingId(id);
    try {
      const res = await authFetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'accepted',
        }),
      });
      if (res.ok) {
        setQuotations((prev) =>
          prev.map((item) =>
            (item._id || item.id) === id ? { ...item, status: 'accepted' } : item
          )
        );
        if (onRefreshParent) onRefreshParent();
      }
    } catch (err) {
      console.error('Failed to accept quotation', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete Quotation
  const handleDeleteQuotation = async (q: IQuotation, e: React.MouseEvent) => {
    e.stopPropagation();
    const id = q._id || q.id;
    if (!id) return;
    if (!confirm(`Are you sure you want to delete quotation ${q.quotationNumber}?`))
      return;

    try {
      const res = await authFetch(`/api/quotations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setQuotations((prev) =>
          prev.filter((item) => (item._id || item.id) !== id)
        );
      }
    } catch (err) {
      console.error('Failed to delete quotation', err);
    }
  };

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const now = new Date();

    return quotations.filter((q) => {
      const isAccepted = q.status === 'accepted';
      const isRejected = q.status === 'rejected';
      const isExpired =
        q.status === 'expired' || (!isAccepted && new Date(q.validUntil) < now);

      if (statusFilter === 'accepted' && !isAccepted) return false;
      if (statusFilter === 'rejected' && !isRejected) return false;
      if (statusFilter === 'expired' && !isExpired) return false;
      if (
        statusFilter === 'sent' &&
        (isAccepted || isRejected || isExpired || q.status === 'draft')
      )
        return false;
      if (statusFilter === 'draft' && q.status !== 'draft') return false;

      if (!query) return true;

      const num = (q.quotationNumber || '').toLowerCase();
      const company = (q.clientCompany || '').toLowerCase();
      const name = (q.clientName || '').toLowerCase();
      const email = (q.clientEmail || '').toLowerCase();

      return (
        num.includes(query) ||
        company.includes(query) ||
        name.includes(query) ||
        email.includes(query)
      );
    });
  }, [quotations, searchQuery, statusFilter]);

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
      {/* 1. Top Action Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Sales Quotations & Commercial Proposals
            </h3>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Agency Commercial Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Deliver structured milestone pricing, generate client proposals & convert bids to won deals
          </p>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-amber-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Proposal Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-amber-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Commercial Ledger Table"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              fetchQuotations();
              if (onRefreshParent) onRefreshParent();
            }}
            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
            title="Refresh Quotations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm active:scale-95 transition inline-flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Quotation</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 4 Proposal Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Quotations */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-5 shadow-[0_10px_28px_-4px_rgba(15,23,42,0.09),0_2px_8px_-1px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_42px_-6px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Quoted Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
            ₹{metrics.totalValue.toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {quotations.length} total generated bids
          </p>
        </div>

        {/* KPI 2: Won Proposals */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-5 shadow-[0_10px_28px_-4px_rgba(15,23,42,0.09),0_2px_8px_-1px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_42px_-6px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Accepted Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 tracking-tight mt-2">
            ₹{metrics.acceptedValue.toLocaleString()}
          </h3>
          <p className="text-[11px] text-emerald-600/80 font-medium mt-1">
            {metrics.acceptedCount} contracts won & signed
          </p>
        </div>

        {/* KPI 3: Active In-Flight Proposals */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-5 shadow-[0_10px_28px_-4px_rgba(15,23,42,0.09),0_2px_8px_-1px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_42px_-6px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Negotiations
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-blue-600 tracking-tight mt-2">
            ₹{metrics.pendingValue.toLocaleString()}
          </h3>
          <p className="text-[11px] text-blue-600/80 font-medium mt-1">
            {metrics.pendingCount} proposals under client evaluation
          </p>
        </div>

        {/* KPI 4: Proposal Win Rate */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/80 p-5 shadow-[0_10px_28px_-4px_rgba(15,23,42,0.09),0_2px_8px_-1px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_42px_-6px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Proposal Win Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-purple-600 tracking-tight mt-2">
            {metrics.winRate}%
          </h3>
          <p className="text-[11px] text-purple-600/80 font-medium mt-1">
            Conversion ratio across closed bids
          </p>
        </div>
      </div>

      {/* 3. Search and Status Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by quote #, company, or contact..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
          />
        </div>

        <div className="flex items-center space-x-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
          {(
            [
              { key: 'all', label: 'All Quotes' },
              { key: 'sent', label: 'Active Proposals' },
              { key: 'accepted', label: 'Accepted (Won)' },
              { key: 'rejected', label: 'Declined' },
              { key: 'expired', label: 'Expired' },
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

      {/* 4. Main Body: Cards View vs Table View */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs font-medium space-y-2 bg-white rounded-3xl border border-slate-100">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-600" />
          <p>Loading commercial proposals...</p>
        </div>
      ) : filteredQuotations.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">No commercial proposals found</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {searchQuery || statusFilter !== 'all'
                ? 'Try clearing filters or search keywords.'
                : 'Structure an itemized pricing quote for your leads to close deals faster.'}
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Commercial Proposal</span>
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards / Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuotations.map((q) => {
            const id = q._id || q.id;
            const isAccepted = q.status === 'accepted';
            const isRejected = q.status === 'rejected';
            const isExpired =
              q.status === 'expired' || (!isAccepted && new Date(q.validUntil) < new Date());

            return (
              <div
                key={id}
                onClick={() => {
                  setSelectedQuotation(q);
                  setShowReceiptModal(true);
                }}
                className={`bg-white rounded-3xl border p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                  isAccepted
                    ? 'border-emerald-200/90 shadow-[0_12px_32px_-4px_rgba(16,185,129,0.12)] hover:border-emerald-300'
                    : isExpired
                    ? 'border-amber-200/80 shadow-[0_6px_24px_-4px_rgba(245,158,11,0.08)]'
                    : 'border-slate-100 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] hover:border-slate-200 hover:shadow-[0_12px_28px_-4px_rgba(15,23,42,0.08)]'
                }`}
              >
                <div>
                  {/* Top Quote Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80">
                          {q.quotationNumber}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isAccepted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isRejected
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isExpired
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isAccepted ? 'Accepted' : isRejected ? 'Declined' : isExpired ? 'Expired' : 'Active Proposal'}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 tracking-tight mt-1.5">
                        {q.clientCompany}
                      </h4>
                      {q.clientName && (
                        <p className="text-xs text-slate-400 font-medium">Attn: {q.clientName}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-slate-900">
                        ₹{(q.totalAmount || 0).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400">Total Payable</span>
                    </div>
                  </div>

                  {/* Deliverables Preview Tags */}
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Scope Deliverables ({q.items?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-hidden">
                      {(q.items || []).slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl truncate max-w-[240px]"
                        >
                          {item.description}
                        </span>
                      ))}
                      {(q.items?.length || 0) > 3 && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-xl border border-amber-200">
                          +{q.items.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dates & Timeline */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Issued: {formatDate(q.issueDate)}</span>
                    </div>
                    <div className={isExpired ? 'text-amber-700 font-bold' : 'text-slate-400'}>
                      Valid: {formatDate(q.validUntil)}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div
                  className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedQuotation(q);
                        setShowReceiptModal(true);
                      }}
                      className="text-xs font-bold text-slate-700 hover:text-amber-700 flex items-center space-x-1"
                    >
                      <span>View Proposal</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedQuotation(q);
                        setShowReceiptModal(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                      title="Download PDF Proposal"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {!isAccepted && canManage && (
                      <button
                        onClick={(e) => handleQuickAccept(q, e)}
                        disabled={updatingId === id}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition inline-flex items-center space-x-1 active:scale-95 shadow-2xs"
                        title="Accept Quote (Converts to Won Deal)"
                      >
                        {updatingId === id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>Accept</span>
                      </button>
                    )}

                    {canManage && (
                      <button
                        onClick={(e) => handleDeleteQuotation(q, e)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Delete Proposal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5">Quote #</th>
                  <th className="py-3 px-5">Client & Contact</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4 text-right">Quote Value (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredQuotations.map((q) => {
                  const id = q._id || q.id;
                  const isAccepted = q.status === 'accepted';
                  const isRejected = q.status === 'rejected';
                  const isExpired =
                    q.status === 'expired' || (!isAccepted && new Date(q.validUntil) < new Date());

                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-50/60 transition cursor-pointer"
                      onClick={() => {
                        setSelectedQuotation(q);
                        setShowReceiptModal(true);
                      }}
                    >
                      {/* Quote # */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-2">
                          <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="font-mono font-bold text-slate-900">
                            {q.quotationNumber}
                          </span>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{q.clientCompany}</div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          {q.clientName && <span>{q.clientName}</span>}
                          {q.clientEmail && <span>• {q.clientEmail}</span>}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 text-[11px]">
                          Issued: <span className="font-semibold">{formatDate(q.issueDate)}</span>
                        </div>
                        <div
                          className={`text-[11px] mt-0.5 ${
                            isExpired ? 'text-amber-600 font-bold' : 'text-slate-400'
                          }`}
                        >
                          Valid To: {formatDate(q.validUntil)}
                        </div>
                      </td>

                      {/* Value */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-black text-slate-900 text-sm font-mono">
                          ₹{(q.totalAmount || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Sub: ₹{(q.subtotal || 0).toLocaleString()} + {q.taxPercent || 0}% tax
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isAccepted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isRejected
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isExpired
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isAccepted
                            ? 'Accepted'
                            : isRejected
                            ? 'Declined'
                            : isExpired
                            ? 'Expired'
                            : 'Active Proposal'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setSelectedQuotation(q);
                              setShowReceiptModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                            title="Download PDF Proposal"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {!isAccepted && canManage && (
                            <button
                              onClick={(e) => handleQuickAccept(q, e)}
                              disabled={updatingId === id}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition inline-flex items-center space-x-1 active:scale-95 shadow-2xs"
                              title="Accept Quote (Wins Deal)"
                            >
                              {updatingId === id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              <span>Accept</span>
                            </button>
                          )}

                          {canManage && (
                            <button
                              onClick={(e) => handleDeleteQuotation(q, e)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete Quotation"
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
        </div>
      )}

      {/* Modals */}
      <CreateQuotationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchQuotations();
          if (onRefreshParent) onRefreshParent();
        }}
        leads={leads}
      />

      <QuotationReceiptModal
        quotation={selectedQuotation}
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedQuotation(null);
        }}
        onStatusUpdate={() => {
          fetchQuotations();
          if (onRefreshParent) onRefreshParent();
        }}
        canManage={canManage}
      />
    </div>
  );
}
