import { createFirestoreModel } from '@/lib/firestoreModel';

export interface ICompanyDomain {
  _id?: string;
  id?: string;
  companyId: string;
  slug: string;             // e.g. "acme" in acme.yourcrm.com
  hostname?: string;        // Custom domain if any (e.g. crm.acme.com)
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const CompanyDomain = createFirestoreModel<ICompanyDomain>('companyDomains');
export default CompanyDomain;
