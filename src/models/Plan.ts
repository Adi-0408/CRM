import { createFirestoreModel } from '@/lib/firestoreModel';

export interface IPlan {
  _id?: string;
  id?: string;
  name: string;             // e.g. "Starter", "Growth", "Enterprise"
  description?: string;
  price: number;            // In INR (paisa stored as integer optional)
  billingCycle: 'monthly' | 'yearly';
  maxUsers: number;         // -1 = unlimited
  maxLeads: number;         // -1 = unlimited
  storageLimit: number;     // In MB, -1 = unlimited
  enabledModules: string[]; // e.g. ["tasks","leads","payroll","attendance"]
  isActive: boolean;
  sortOrder?: number;       // Display order on pricing page
  createdAt?: string;
  updatedAt?: string;
}

export const Plan = createFirestoreModel<IPlan>('plans');
export default Plan;
