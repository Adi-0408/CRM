import { createFirestoreModel } from '@/lib/firestoreModel';

export interface IInvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface IInvoice {
  _id?: string;
  id?: string;
  invoiceNumber: string;
  projectId?: any;
  projectTitle?: string;
  leadId?: any;
  clientName: string;
  clientEmail?: string;
  clientCompany: string;
  items: IInvoiceLineItem[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  issueDate: Date | string;
  dueDate: Date | string;
  paidAt?: Date | string | null;
  paymentMethod?: string;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const Invoice = createFirestoreModel<IInvoice>('invoices');
export default Invoice;
