import { createFirestoreModel } from '@/lib/firestoreModel';

export type PaymentStatus = 'pending' | 'captured' | 'failed' | 'refunded';

export interface IPayment {
  _id?: string;
  id?: string;
  companyId: string;
  subscriptionId?: string;
  amount: number;            // In INR
  currency: string;          // e.g. "INR"
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: PaymentStatus;
  method?: string;           // e.g. "card", "upi", "netbanking"
  description?: string;
  paidAt?: string;           // ISO string
  createdAt?: string;
  updatedAt?: string;
}

export const Payment = createFirestoreModel<IPayment>('payments');
export default Payment;
