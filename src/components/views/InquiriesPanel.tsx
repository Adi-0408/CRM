'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Inbox,
  Sparkles,
  PhoneCall,
  CheckCheck,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  Users,
  Compass,
  Clock,
  Trash2,
  X,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';

export interface InquiryItem {
  id: string;
  _id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  teamSize?: string;
  interest?: string;
  message: string;
  status: 'new' | 'contacted' | 'closed';
  adminNotes?: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface InquiriesResponse {
  inquiries: InquiryItem[];
  counts: {
    total: number;
    new: number;
    contacted: number;
    closed: number;
  };
}

interface InquiriesPanelProps {
  onCountChange?: (newCount: number) => void;
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Unknown';
  }
}

export default function InquiriesPanel({ onCountChange }: InquiriesPanelProps) {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [counts, setCounts] = useState({ total: 0, new: 0, contacted: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'closed'>('all');

  // Selected Inquiry for Slide-over Drawer
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Delete Confirmation State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);

  const fetchInquiries = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setRefreshing(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await authFetch(`/api/super-admin/inquiries?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Super Admin access required.');
        }
        throw new Error('Failed to load inquiries.');
      }

      const data: InquiriesResponse = await res.json();
      setInquiries(data.inquiries || []);
      setCounts(data.counts || { total: 0, new: 0, contacted: 0, closed: 0 });

      if (onCountChange && data.counts) {
        onCountChange(data.counts.new || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching inquiries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, search, onCountChange]);

  // Initial fetch and dependency trigger
  useEffect(() => {
    fetchInquiries(false);
  }, [fetchInquiries]);

  // Auto-polling every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchInquiries(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchInquiries]);

  // Sync selected inquiry notes when opened
  useEffect(() => {
    if (selectedInquiry) {
      setAdminNotes(selectedInquiry.adminNotes || '');
      setNotesSavedSuccess(false);
      setCopiedEmail(false);
      setCopiedPhone(false);
      setConfirmDeleteId(null);
    }
  }, [selectedInquiry]);

  // Close drawer on Escape key or Click Outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedInquiry(null);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setSelectedInquiry(null);
      }
    };

    if (selectedInquiry) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedInquiry]);

  // Optimistic Status Update
  const handleUpdateStatus = async (inquiryId: string, newStatus: 'new' | 'contacted' | 'closed') => {
    const prevInquiries = [...inquiries];
    const prevSelected = selectedInquiry;

    // Optimistically update local state
    setInquiries((prev) =>
      prev.map((item) => (item.id === inquiryId || item._id === inquiryId ? { ...item, status: newStatus } : item))
    );
    if (selectedInquiry && (selectedInquiry.id === inquiryId || selectedInquiry._id === inquiryId)) {
      setSelectedInquiry({ ...selectedInquiry, status: newStatus });
    }

    try {
      const res = await authFetch(`/api/super-admin/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update inquiry status');
      }

      // Re-fetch counts in background
      fetchInquiries(true);
    } catch (err: any) {
      // Rollback on failure
      setInquiries(prevInquiries);
      setSelectedInquiry(prevSelected);
      alert(err.message || 'Error updating inquiry status');
    }
  };

  // Save Admin Notes
  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    const targetId = selectedInquiry.id || selectedInquiry._id;

    try {
      setSavingNotes(true);
      const res = await authFetch(`/api/super-admin/inquiries/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });

      if (!res.ok) {
        throw new Error('Failed to save notes');
      }

      setInquiries((prev) =>
        prev.map((item) => (item.id === targetId || item._id === targetId ? { ...item, adminNotes } : item))
      );
      setSelectedInquiry((prev) => (prev ? { ...prev, adminNotes } : null));
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Error saving notes');
    } finally {
      setSavingNotes(false);
    }
  };

  // Delete Inquiry
  const handleDeleteInquiry = async (inquiryId: string) => {
    try {
      setDeleting(true);
      const res = await authFetch(`/api/super-admin/inquiries/${inquiryId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete inquiry');
      }

      setInquiries((prev) => prev.filter((item) => item.id !== inquiryId && item._id !== inquiryId));
      if (selectedInquiry && (selectedInquiry.id === inquiryId || selectedInquiry._id === inquiryId)) {
        setSelectedInquiry(null);
      }
      setConfirmDeleteId(null);
      fetchInquiries(true);
    } catch (err: any) {
      alert(err.message || 'Error deleting inquiry');
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const copyPhoneToClipboard = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inquiries */}
        <div className="bg-white rounded-2xl border border-slate-150 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Inquiries</span>
            <Inbox className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {counts.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">All recorded inquiries</div>
        </div>

        {/* New / Unread */}
        <div className="bg-white rounded-2xl border border-slate-150 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">New Submissions</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-700 tracking-tight">
            {counts.new}
          </div>
          <div className="text-[11px] text-purple-600 mt-1 font-medium">Requires initial contact</div>
        </div>

        {/* Contacted */}
        <div className="bg-white rounded-2xl border border-slate-150 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Contacted</span>
            <PhoneCall className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
            {counts.contacted}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">In discussion with team</div>
        </div>

        {/* Closed */}
        <div className="bg-white rounded-2xl border border-slate-150 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Closed</span>
            <CheckCheck className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {counts.closed}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Completed or converted</div>
        </div>
      </div>

      {/* Search, Filter & Refresh Bar */}
      <div className="bg-white rounded-2xl border border-slate-150 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'new', 'contacted', 'closed'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  statusFilter === filter
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={() => fetchInquiries(false)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all active:scale-95 shadow-2xs"
            title="Refresh inquiries"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchInquiries(false)}
            className="px-3 py-1 bg-white rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-100/50 text-xs font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Inquiries Content (Table on Desktop / Stacked Cards on Mobile) */}
      <div className="bg-white rounded-3xl border border-slate-150 shadow-xs overflow-hidden">
        {loading ? (
          /* Loading Skeletons */
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-48" />
                  <div className="h-3 bg-slate-200 rounded w-64" />
                </div>
                <div className="h-6 bg-slate-200 rounded-full w-20" />
              </div>
            ))}
          </div>
        ) : inquiries.length === 0 ? (
          /* Empty / No Results State */
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {search.trim() ? 'No matching inquiries found' : 'No inquiries yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search.trim()
                ? 'Try adjusting your search terms or filters.'
                : 'Share your landing page link to start receiving workspace inquiries directly from visitors.'}
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-150 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-5">Prospect / Company</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Requirements</th>
                    <th className="py-3.5 px-5">Message Preview</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {inquiries.map((inq) => {
                    const targetId = inq.id || inq._id;
                    const isNew = inq.status === 'new';
                    return (
                      <tr
                        key={targetId}
                        onClick={() => setSelectedInquiry(inq)}
                        className={`hover:bg-purple-50/40 cursor-pointer transition-colors ${
                          isNew ? 'bg-purple-50/20 font-medium' : ''
                        }`}
                      >
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-slate-900">{inq.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {inq.companyName || 'Individual / Founder'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 space-y-0.5">
                          <div className="text-slate-800">{inq.email}</div>
                          {inq.phone && <div className="text-[11px] text-slate-400 font-mono">{inq.phone}</div>}
                        </td>
                        <td className="py-3.5 px-4 space-y-0.5">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {inq.interest || 'Everything'}
                          </span>
                          {inq.teamSize && (
                            <div className="text-[10px] text-slate-400">{inq.teamSize} Team</div>
                          )}
                        </td>
                        <td className="py-3.5 px-5 max-w-xs">
                          <p className="line-clamp-2 text-slate-600 text-xs leading-relaxed">
                            {inq.message}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                              inq.status === 'new'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : inq.status === 'contacted'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {inq.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {formatRelativeTime(inq.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards View */}
            <div className="md:hidden divide-y divide-slate-150">
              {inquiries.map((inq) => {
                const targetId = inq.id || inq._id;
                return (
                  <div
                    key={targetId}
                    onClick={() => setSelectedInquiry(inq)}
                    className="p-4 space-y-2.5 active:bg-slate-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-slate-900">{inq.name}</div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          inq.status === 'new'
                            ? 'bg-purple-100 text-purple-800'
                            : inq.status === 'contacted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {inq.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {inq.companyName || 'Individual'} &bull; {inq.email}
                    </div>
                    <p className="line-clamp-2 text-xs text-slate-600">{inq.message}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>{inq.interest || 'Everything'}</span>
                      <span>{formatRelativeTime(inq.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Detail Drawer / Modal */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-inquiry-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedInquiry(null);
          }}
        >
          <div
            ref={drawerRef}
            className="w-full max-w-lg sm:max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250 border-l border-slate-200"
          >
            {/* Drawer Header */}
            <div className="shrink-0 p-5 sm:p-6 border-b border-slate-100 bg-white/95 backdrop-blur-sm z-10 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200/50">
                    Inquiry Detail
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    &bull; {formatRelativeTime(selectedInquiry.createdAt)}
                  </span>
                </div>
                <h3 id="drawer-inquiry-title" className="text-xl font-bold text-slate-900 leading-tight">
                  {selectedInquiry.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedInquiry.companyName || 'Individual Prospect'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500 shrink-0"
                aria-label="Close detail drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body (Scrollable with ample bottom clearance) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 pb-24">
              {/* Status Segmented Lifecycle Control */}
              <div className="bg-slate-50/80 p-2 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between px-1.5 pb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Status Lifecycle
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">Click to update status</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedInquiry.id || selectedInquiry._id, 'new')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      selectedInquiry.status === 'new'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white hover:bg-purple-50 text-slate-600 hover:text-purple-700 border border-slate-200/60'
                    }`}
                  >
                    {selectedInquiry.status === 'new' && <Check className="w-3.5 h-3.5 text-white" />}
                    <span>New</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedInquiry.id || selectedInquiry._id, 'contacted')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      selectedInquiry.status === 'contacted'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200/60'
                    }`}
                  >
                    {selectedInquiry.status === 'contacted' && <Check className="w-3.5 h-3.5 text-white" />}
                    <span>Contacted</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedInquiry.id || selectedInquiry._id, 'closed')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      selectedInquiry.status === 'closed'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200/60'
                    }`}
                  >
                    {selectedInquiry.status === 'closed' && <Check className="w-3.5 h-3.5 text-white" />}
                    <span>Closed</span>
                  </button>
                </div>
              </div>

              {/* Quick Outreach Actions */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quick Outreach
                </span>
                <div className={`grid gap-2 ${selectedInquiry.phone ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
                  {/* Email */}
                  <a
                    href={`mailto:${selectedInquiry.email}?subject=Re:%20your%20PrismCRM%20inquiry`}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/60 text-slate-700 hover:text-purple-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
                    title="Send Email"
                  >
                    <Mail className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Email</span>
                  </a>

                  {/* Call */}
                  {selectedInquiry.phone && (
                    <a
                      href={`tel:${selectedInquiry.phone}`}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/60 text-slate-700 hover:text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
                      title="Make phone call"
                    >
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Call</span>
                    </a>
                  )}

                  {/* WhatsApp */}
                  {selectedInquiry.phone && (
                    <a
                      href={`https://wa.me/91${selectedInquiry.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/60 text-slate-700 hover:text-teal-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
                      title="Open WhatsApp chat"
                    >
                      <ExternalLink className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {/* Copy Email */}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedInquiry.email)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
                    title="Copy Email Address"
                  >
                    {copiedEmail ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <Copy className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span>{copiedEmail ? 'Copied' : 'Copy Email'}</span>
                  </button>
                </div>
              </div>

              {/* Sender Metadata Specs */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Prospect Metadata
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Email */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                        <Mail className="w-3 h-3 text-purple-500" /> Email Address
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedInquiry.email)}
                        className="text-slate-400 hover:text-purple-600 p-0.5 rounded transition-colors"
                        title="Copy email"
                      >
                        {copiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <span className="text-slate-800 font-semibold break-all text-xs">{selectedInquiry.email}</span>
                  </div>

                  {/* Phone */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-500" /> Mobile Phone
                      </span>
                      {selectedInquiry.phone && (
                        <button
                          type="button"
                          onClick={() => copyPhoneToClipboard(selectedInquiry.phone || '')}
                          className="text-slate-400 hover:text-emerald-600 p-0.5 rounded transition-colors"
                          title="Copy phone"
                        >
                          {copiedPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                    <span className="text-slate-800 font-semibold text-xs">
                      {selectedInquiry.phone || <span className="text-slate-400 italic font-normal">Not provided</span>}
                    </span>
                  </div>

                  {/* Team Scope */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-500" /> Team Scope
                    </span>
                    <span className="inline-flex items-center text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                      {selectedInquiry.teamSize || '1-10'} Employees
                    </span>
                  </div>

                  {/* Interest Area */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1 flex items-center gap-1">
                      <Compass className="w-3 h-3 text-indigo-500" /> Interest Area
                    </span>
                    <span className="inline-flex items-center text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded-md">
                      {selectedInquiry.interest || 'Everything'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inquiry Message */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                  <span>Prospect Message</span>
                </div>
                <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/30 border border-purple-100 border-l-4 border-l-purple-500 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap shadow-2xs font-normal">
                  {selectedInquiry.message || <span className="text-slate-400 italic">No message provided.</span>}
                </div>
              </div>

              {/* Admin Notes Section */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Internal Admin Notes
                    </span>
                    <span className="text-[11px] text-slate-400">Call summaries, lead qualification, or quote notes</span>
                  </div>
                  {notesSavedSuccess && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <Check className="w-3.5 h-3.5" /> Saved!
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record call summaries, qualification notes, or assigned quote numbers..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 placeholder:text-slate-400 resize-y transition-all"
                />
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs active:scale-95 transition-all shadow-2xs disabled:bg-slate-300 flex items-center gap-1.5"
                >
                  {savingNotes ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving notes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Notes</span>
                    </>
                  )}
                </button>
              </div>

              {/* Delete Inquiry Action */}
              <div className="pt-4 border-t border-slate-150">
                {confirmDeleteId === (selectedInquiry.id || selectedInquiry._id) ? (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2.5">
                    <p className="text-xs text-rose-800 font-semibold">
                      Are you sure you want to permanently delete this inquiry? This action cannot be undone.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteInquiry(selectedInquiry.id || selectedInquiry._id)}
                        disabled={deleting}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-95"
                      >
                        {deleting ? 'Deleting...' : 'Yes, Permanently Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(selectedInquiry.id || selectedInquiry._id)}
                      className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete inquiry</span>
                    </button>
                    <span className="text-[10px] text-slate-400">
                      ID: {(selectedInquiry.id || selectedInquiry._id).slice(-8)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
