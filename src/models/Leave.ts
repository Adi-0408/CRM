import { createFirestoreModel } from '@/lib/firestoreModel';

export interface ILeave {
  _id?: string;
  id?: string;
  employee: any;
  type: 'casual' | 'sick' | 'annual' | 'unpaid';
  startDate: Date | string;
  endDate: Date | string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  approvedBy?: any;
  remarks?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const Leave = createFirestoreModel<ILeave>('leaves');
export default Leave;
