'use client';

import React, { useState } from 'react';
import { X, Printer, CheckCircle2, Building2, Calendar, Mail, FileText, Check } from 'lucide-react';
import { IInvoice } from '@/models/Invoice';
import { authFetch } from '@/lib/apiClient';

interface InvoiceReceiptModalProps {
  invoice: IInvoice | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: () => void;
  canManage?: boolean;
}

export default function InvoiceReceiptModal({
  invoice,
  isOpen,
  onClose,
  onStatusUpdate,
  canManage = true,
}: InvoiceReceiptModalProps) {
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !invoice) return null;

  const invoiceId = invoice._id || invoice.id;

  const handlePrint = () => {
    window.print();
  };

  const handleMarkAsPaid = async () => {
    if (!invoiceId) return;
    setUpdating(true);
    try {
      const res = await authFetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          paidAt: new Date().toISOString(),
          paymentMethod: 'Bank Transfer / Wire',
        }),
      });
      if (res.ok) {
        if (onStatusUpdate) onStatusUpdate();
        onClose();
      }
    } catch (err) {
      console.error('Failed to mark invoice as paid', err);
    } finally {
      setUpdating(false);
    }
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

  const isPaid = invoice.status === 'paid';
  const isOverdue = invoice.status === 'overdue' || (!isPaid && new Date(invoice.dueDate) < new Date());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 print:hidden">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#635BFF]" />
            <span className="text-xs font-bold text-slate-800">
              Receipt Preview: {invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white print:p-0">
          {/* Document Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#635BFF] flex items-center justify-center text-white font-black text-sm">
                  P
                </div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">PrismCRM</h1>
              </div>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                ITPL Solutions Pvt. Ltd.
              </p>
              <p className="text-xs text-slate-500 mt-0.5">finance@prismcrm.io • +91 (800) 123-4567</p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-slate-900 tracking-tight">INVOICE</div>
              <p className="text-xs font-mono font-bold text-indigo-600 mt-0.5">
                {invoice.invoiceNumber}
              </p>
              <div className="mt-2 inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border">
                {isPaid ? (
                  <span className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Check className="w-3 h-3" /> Paid In Full
                  </span>
                ) : isOverdue ? (
                  <span className="bg-rose-50 text-rose-700 border-rose-200 px-2 py-0.5 rounded-full">
                    Payment Overdue
                  </span>
                ) : (
                  <span className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5 rounded-full">
                    Payment Pending
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Client & Metadata Grid */}
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Billed To
              </span>
              <p className="text-sm font-black text-slate-900">{invoice.clientCompany}</p>
              {invoice.clientName && (
                <p className="font-semibold text-slate-700 mt-0.5">Attn: {invoice.clientName}</p>
              )}
              {invoice.clientEmail && (
                <p className="text-slate-500 mt-0.5">{invoice.clientEmail}</p>
              )}
              {invoice.projectTitle && (
                <div className="mt-2 inline-flex items-center space-x-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-semibold">
                  <span>Project: {invoice.projectTitle}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-right">
              <div className="flex justify-between md:justify-end md:space-x-4">
                <span className="text-slate-400 font-semibold">Issue Date:</span>
                <span className="text-slate-800 font-bold">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between md:justify-end md:space-x-4">
                <span className="text-slate-400 font-semibold">Due Date:</span>
                <span className="text-slate-800 font-bold">{formatDate(invoice.dueDate)}</span>
              </div>
              {isPaid && invoice.paidAt && (
                <div className="flex justify-between md:justify-end md:space-x-4 text-emerald-700 font-bold">
                  <span>Paid On:</span>
                  <span>{formatDate(invoice.paidAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-left">
                  <th className="py-2.5 px-4">Item & Description</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Rate</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {(invoice.items || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {item.description}
                    </td>
                    <td className="py-3 px-3 text-right">{item.quantity}</td>
                    <td className="py-3 px-4 text-right">₹{item.rate.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ₹{item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600 font-semibold">
                <span>Subtotal</span>
                <span className="text-slate-900 font-bold">₹{invoice.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600 font-semibold">
                <span>Tax ({invoice.taxPercent}%)</span>
                <span className="text-slate-900 font-bold">₹{invoice.taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-black text-slate-900">
                <span>Total Due</span>
                <span className="text-base text-[#635BFF]">₹{invoice.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Notes */}
          {invoice.notes && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600">
              <span className="font-bold text-slate-700 block mb-1">Payment Instructions:</span>
              <p className="whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/60 print:hidden">
          <div className="text-xs text-slate-400">
            {isPaid ? (
              <span className="text-emerald-600 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Marked as Paid in Accounting Ledger</span>
              </span>
            ) : (
              <span>Status: Awaiting client settlement</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!isPaid && canManage && (
              <button
                onClick={handleMarkAsPaid}
                disabled={updating}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-95 transition inline-flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{updating ? 'Updating...' : 'Mark as Paid'}</span>
              </button>
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
