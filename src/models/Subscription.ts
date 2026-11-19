import { createFirestoreModel } from '@/lib/firestoreModel';

export type SubscriptionStatus = 'trial' | 'active' | 'grace_period' | 'expired' | 'cancelled';

export interface ISubscription {
  _id?: string;
  id?: string;
  companyId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;         // ISO string
  endDate: string;           // ISO string
  gracePeriodEnd?: string;   // ISO string — X days after endDate
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  razorpaySubscriptionId?: string;
  autoRenew?: boolean;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const Subscription = createFirestoreModel<ISubscription>('subscriptions');
export default Subscription;
