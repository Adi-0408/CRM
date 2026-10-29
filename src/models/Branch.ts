import { createFirestoreModel } from '@/lib/firestoreModel';

export interface IBranch {
  _id?: string;
  id?: string;
  name: string;
  city: string;
  address: string;
  manager: string;
  email?: string;
  phone?: string;
  activeEmployees?: string;
  status?: 'Head Office' | 'Branch Office' | 'Regional Hub' | 'Development Hub' | 'Sales Hub';
  isHeadOffice?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const Branch = createFirestoreModel<IBranch>('branches');
export default Branch;
