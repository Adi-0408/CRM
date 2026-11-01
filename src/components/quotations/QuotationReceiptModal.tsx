'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Send,
  CheckCircle2,
  Calendar,
  Mail,
  Building2,
  FileSpreadsheet,
  Check,
  Ban,
  Clock,
  Sparkles,
  Phone,
  ShieldCheck,
  Copy,
  ExternalLink,
  ChevronRight,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { IQuotation } from '@/models/Quotation';
import { authFetch } from '@/lib/apiClient';

interface QuotationReceiptModalProps {
  quotation: IQuotation | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: () => void;
  canManage?: boolean;
}

export default function QuotationReceiptModal({
  quotation,
  isOpen,
  onClose,
  onStatusUpdate,
  canManage = true,
}: QuotationReceiptModalProps) {
  const [updating, setUpdating] = useState(false);
  const [showSendDrawer, setShowSendDrawer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  if (!isOpen || !quotation) return null;

  const quoteId = quotation._id || quotation.id;

  const handleDownloadPdf = () => {
    const originalTitle = document.title;
    const cleanCompany = (quotation.clientCompany || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
    document.title = `${quotation.quotationNumber}_${cleanCompany}_Commercial_Proposal`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  const handleUpdateStatus = async (
    newStatus: 'accepted' | 'rejected' | 'sent'
  ) => {
    if (!quoteId) return;
    setUpdating(true);
    try {
      const res = await authFetch(`/api/quotations/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
        }),
      });
      if (res.ok) {
        if (onStatusUpdate) onStatusUpdate();
        if (newStatus !== 'sent') {
          onClose();
        }
      }
    } catch (err) {
      console.error('Failed to update quotation status', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyProposalText = () => {
    const text = `=========================================
COMMERCIAL PROPOSAL: ${quotation.quotationNumber}
ISSUED BY: ITPL Solutions Pvt. Ltd.
PREPARED FOR: ${quotation.clientCompany} (Attn: ${quotation.clientName || 'Representative'})
=========================================

Total Quoted Fee: ₹${(quotation.totalAmount || 0).toLocaleString()} (incl. GST)
Proposal Valid Until: ${formatDate(quotation.validUntil)}

SCOPE & DELIVERABLES:
${(quotation.items || []).map((it, idx) => `${idx + 1}. ${it.description} — ₹${(it.amount || 0).toLocaleString()}`).join('\n')}

MILESTONE SCHEDULE:
- Phase 1 (40% Mobilization): ₹${Math.round((quotation.totalAmount || 0) * 0.4).toLocaleString()}
- Phase 2 (40% Beta Demo): ₹${Math.round((quotation.totalAmount || 0) * 0.4).toLocaleString()}
- Phase 3 (20% Production Sign-off): ₹${Math.round((quotation.totalAmount || 0) * 0.2).toLocaleString()}

For inquiries or approval, please contact proposals@prismcrm.io or reply to this notice.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendEmail = async () => {
    await handleUpdateStatus('sent');
    setSendSuccess(true);

    const subject = encodeURIComponent(
      `Commercial Proposal: ${quotation.quotationNumber} - ITPL Solutions`
    );
    const body = encodeURIComponent(
      `Dear ${quotation.clientName || quotation.clientCompany},\n\nPlease find attached our commercial proposal (${quotation.quotationNumber}) for your upcoming software deliverable.\n\nProject Deliverable Total: ₹${(quotation.totalAmount || 0).toLocaleString()} (inclusive of taxes)\nProposal Validity: ${formatDate(quotation.validUntil)}\n\nKindly review the scope and milestone schedule at your earliest convenience.\n\nWarm regards,\nITPL Commercials & Solutions Team\nproposals@prismcrm.io`
    );
    window.open(`mailto:${quotation.clientEmail || ''}?subject=${subject}&body=${body}`, '_blank');
  };

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

  const isAccepted = quotation.status === 'accepted';
  const isRejected = quotation.status === 'rejected';
  const isExpired =
    quotation.status === 'expired' ||
    (!isAccepted && new Date(quotation.validUntil) < new Date());

  const subtotal = quotation.subtotal || 0;
  const discountAmount = quotation.discountAmount || 0;
  const taxAmount = quotation.taxAmount || 0;
  const totalAmount = quotation.totalAmount || 0;

  // Milestone schedule breakdown (40% / 40% / 20%)
  const milestoneAdvance = Math.round(totalAmount * 0.4);
  const milestoneMid = Math.round(totalAmount * 0.4);
  const milestoneFinal = totalAmount - milestoneAdvance - milestoneMid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 print-modal-active">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden print-document">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 print-hide">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-800">
                  {quotation.quotationNumber}
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80">
                  Commercial Proposal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Client: {quotation.clientCompany}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-xs active:scale-95 cursor-pointer"
              title="Download or Print PDF Proposal"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {/* Send to Client Action */}
            <button
              onClick={() => setShowSendDrawer(!showSendDrawer)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition shadow-2xs active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-amber-700" />
              <span>Send to Client</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Send to Client Drawer Overlay (Hidden on print) */}
        {showSendDrawer && (
          <div className="bg-amber-50/90 border-b border-amber-200 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-150 print-hide">
            <div>
              <span className="font-bold text-amber-900 flex items-center space-x-1.5">
                <Send className="w-3.5 h-3.5 text-amber-600" />
                <span>Send Proposal Directly to {quotation.clientCompany}</span>
              </span>
              <p className="text-amber-700 text-[11px] mt-0.5">
                Recipient Email:{' '}
                <span className="font-bold underline">{quotation.clientEmail || 'No email specified'}</span>
              </p>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleCopyProposalText}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition inline-flex items-center space-x-1"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>{copied ? 'Copied ✓' : 'Copy Text'}</span>
              </button>

              <button
                onClick={handleSendEmail}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition inline-flex items-center space-x-1.5 shadow-xs active:scale-95"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Dispatch Email (mailto)</span>
              </button>
            </div>
          </div>
        )}

        {/* Printable Executive Commercial Proposal Document Body */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-8 bg-white print:p-0 print:overflow-visible">
          
          {/* Top Decorative Header Accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-[#635BFF] to-indigo-600 rounded-full mb-6 print:mb-4" />

          {/* Letterhead & Corporate Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-100 pb-7">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-black text-base shadow-sm shadow-amber-500/20">
                  P
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">PrismCRM</h1>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#635BFF] block -mt-1">
                    ITPL Solutions Pvt. Ltd.
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-2">
                Corporate Reg: ITPL-MH-2024-88412 • GSTIN: 27AABCT1330L1ZT
              </p>
              <p className="text-xs text-slate-500">
                proposals@prismcrm.io • +91 (800) 123-4567 • Pune & Mumbai Tech Hub
              </p>
            </div>

            <div className="sm:text-right">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                COMMERCIAL PROPOSAL
              </div>
              <p className="text-sm font-mono font-bold text-amber-600 mt-0.5">
                {quotation.quotationNumber}
              </p>

              <div className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border">
                {isAccepted ? (
                  <span className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Client Accepted
                  </span>
                ) : isRejected ? (
                  <span className="bg-rose-50 text-rose-700 border-rose-200 px-2.5 py-0.5 rounded-full">
                    Declined
                  </span>
                ) : isExpired ? (
                  <span className="bg-amber-50 text-amber-700 border-amber-200 px-2.5 py-0.5 rounded-full">
                    Proposal Expired
                  </span>
                ) : (
                  <span className="bg-blue-50 text-blue-700 border-blue-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span>Active Commercial Offer</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Client & Vendor Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Left: Prepared For Client */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
              <span className="font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 text-[10px]">
                Proposal Prepared For
              </span>
              <p className="text-base font-black text-slate-900">{quotation.clientCompany}</p>
              {quotation.clientName && (
                <p className="font-bold text-slate-700 mt-1">
                  Attention: {quotation.clientName}
                </p>
              )}
              {quotation.clientEmail && (
                <p className="text-slate-500 mt-1 flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{quotation.clientEmail}</span>
                </p>
              )}
              {quotation.clientPhone && (
                <p className="text-slate-500 mt-1 flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>+91 {quotation.clientPhone}</span>
                </p>
              )}
            </div>

            {/* Right: Dates & Proposal Metadata */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-2 flex flex-col justify-center">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Proposal Issue Date:</span>
                <span className="text-slate-900 font-bold">{formatDate(quotation.issueDate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Proposal Valid Until:</span>
                <span className="text-amber-700 font-bold">{formatDate(quotation.validUntil)}</span>
              </div>
              {quotation.createdBy && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400 font-semibold">Commercial Account Lead:</span>
                  <span className="font-bold text-slate-800">{quotation.createdBy}</span>
                </div>
              )}
            </div>
          </div>

          {/* Scope & Deliverables Table */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              1. Itemized Deliverables & Scope of Work
            </span>
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-left">
                    <th className="py-3 px-4">Deliverable Scope & Description</th>
                    <th className="py-3 px-3 text-right">Units / Sprints</th>
                    <th className="py-3 px-4 text-right">Rate (₹)</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {(quotation.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {item.description}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono">{item.quantity}</td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        ₹{item.rate.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                        ₹{item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end page-break-inside-avoid">
            <div className="w-80 space-y-2.5 text-xs bg-slate-50/90 p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60 text-slate-600 font-semibold">
                <span>Subtotal Gross Fee</span>
                <span className="text-slate-900 font-bold font-mono">₹{subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-200/60 text-rose-600 font-semibold">
                  <span>Special Client Discount ({quotation.discountPercent}%)</span>
                  <span className="font-mono">-₹{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-200/60 text-slate-600 font-semibold">
                <span>GST Compliance ({quotation.taxPercent}%)</span>
                <span className="text-slate-900 font-bold font-mono">₹{taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-black text-slate-900">
                <span>Net Proposal Amount</span>
                <span className="text-base text-amber-600 font-mono">
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Recommended Milestone Schedule */}
          <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200/80 text-xs page-break-inside-avoid">
            <span className="font-bold text-amber-900 block mb-2.5 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>2. Commercial Milestone Billing Schedule</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Phase 1 (40% Mobilization)
                </span>
                <div className="text-base font-black text-slate-900 mt-0.5 font-mono">
                  ₹{milestoneAdvance.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Kickoff sprint & architecture setup</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Phase 2 (40% Beta Demo)
                </span>
                <div className="text-base font-black text-slate-900 mt-0.5 font-mono">
                  ₹{milestoneMid.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Staging build & functional demo approval</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Phase 3 (20% Handover)
                </span>
                <div className="text-base font-black text-slate-900 mt-0.5 font-mono">
                  ₹{milestoneFinal.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Final production launch & code handover</p>
              </div>
            </div>
          </div>

          {/* Scope Notes & Commercial Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 page-break-inside-avoid">
            {quotation.notes && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600">
                <span className="font-bold text-slate-800 block mb-1">
                  Scope Inclusions & Technical Notes:
                </span>
                <p className="whitespace-pre-line leading-relaxed">{quotation.notes}</p>
              </div>
            )}
            {quotation.terms && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600">
                <span className="font-bold text-slate-800 block mb-1">
                  Commercial Terms & Acceptance:
                </span>
                <p className="whitespace-pre-line leading-relaxed">{quotation.terms}</p>
              </div>
            )}
          </div>

          {/* Official Signatures Section */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs page-break-inside-avoid">
            <div>
              <div className="h-12 border-b border-dashed border-slate-300 flex items-end pb-1">
                <span className="font-serif italic text-slate-800 text-sm font-bold">
                  {quotation.createdBy || 'Authorized Account Officer'}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-700 mt-1">Authorized Agency Signatory</p>
              <p className="text-[10px] text-slate-400">ITPL Commercials & Solutions</p>
            </div>

            <div>
              <div className="h-12 border-b border-dashed border-slate-300 flex items-end pb-1">
                {isAccepted ? (
                  <span className="text-emerald-700 font-bold text-xs flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Digitally Approved by {quotation.clientName || quotation.clientCompany}</span>
                  </span>
                ) : (
                  <span className="text-slate-300 italic text-[11px]">Client Signature / Company Seal</span>
                )}
              </div>
              <p className="text-[11px] font-bold text-slate-700 mt-1">Client Acceptance Signatory</p>
              <p className="text-[10px] text-slate-400">Representative of {quotation.clientCompany}</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer (Hidden on print) */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/80 print-hide">
          <div className="text-xs text-slate-500">
            {isAccepted ? (
              <span className="text-emerald-600 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Client Accepted • Synchronized with Won Sales Pipeline</span>
              </span>
            ) : (
              <span>Valid through {formatDate(quotation.validUntil)}</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition inline-flex items-center space-x-1.5 active:scale-95 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {!isAccepted && canManage && (
              <>
                <button
                  onClick={() => handleUpdateStatus('accepted')}
                  disabled={updating}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-95 transition inline-flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{updating ? 'Updating...' : 'Accept Quote (Won Deal)'}</span>
                </button>
                <button
                  onClick={() => handleUpdateStatus('rejected')}
                  disabled={updating}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition inline-flex items-center space-x-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Decline</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
