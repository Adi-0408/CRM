import { createFirestoreModel } from '@/lib/firestoreModel';

export interface ILead {
  _id?: string;
  id?: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  value?: number;
  status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  source?: string;
  assignedTo?: any;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const Lead = createFirestoreModel<ILead>('leads');
export default Lead;
