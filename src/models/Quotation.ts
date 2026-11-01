import { createFirestoreModel } from '@/lib/firestoreModel';

export interface IQuotationLineItem {
  id?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface IQuotation {
  _id?: string;
  id?: string;
  quotationNumber: string; // e.g. QT-2026-1042
  leadId?: any;
  clientCompany: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  items: IQuotationLineItem[];
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  issueDate: Date | string;
  validUntil: Date | string;
  notes?: string;
  terms?: string;
  createdBy?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const Quotation = createFirestoreModel<IQuotation>('quotations');
export default Quotation;
