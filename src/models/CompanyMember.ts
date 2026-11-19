import { createFirestoreModel } from '@/lib/firestoreModel';
import { UserRole } from '@/types/auth';

export interface ICompanyMember {
  _id?: string;
  id?: string;
  companyId: string;
  uid: string;              // Firebase Auth UID
  employeeId?: string;      // Link to employees/{id} document
  role: UserRole | 'company_admin';
  permissions?: string[];
  isActive: boolean;
  invitedBy?: string;       // UID of the person who added them
  joinedAt?: string;        // ISO string
  createdAt?: string;
  updatedAt?: string;
}

export const CompanyMember = createFirestoreModel<ICompanyMember>('companyMembers');
export default CompanyMember;
