import { createFirestoreModel } from '@/lib/firestoreModel';

export type CompanyStatus = 'active' | 'suspended' | 'pending' | 'trial';

export interface ICompany {
  _id?: string;
  id?: string;
  companyName: string;
  slug: string;             // URL-safe identifier used in subpaths
  logo?: string;            // Cloudinary URL
  ownerUid: string;         // Firebase Auth UID of the company admin
  status: CompanyStatus;
  planId?: string;
  subscriptionStatus?: 'active' | 'trial' | 'grace_period' | 'expired' | 'cancelled';
  trialEndsAt?: string;     // ISO string
  primaryColor?: string;    // Brand color hex
  website?: string;
  industry?: string;
  employeeCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const Company = createFirestoreModel<ICompany>('companies');
export default Company;
