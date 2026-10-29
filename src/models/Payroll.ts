import { createFirestoreModel } from '@/lib/firestoreModel';

export interface IPayroll {
  _id?: string;
  id?: string;
  employeeId: any;
  employee?: any;
  month: string; // Format: YYYY-MM
  baseSalary: number;
  approvedLeaves?: number;
  unapprovedLeaves?: number;
  halfDays?: number;
  unapprovedLeavesOverride?: number;
  halfDaysOverride?: number;
  totalDeductions?: number;
  netSalary: number;
  status?: 'Pending' | 'Paid' | 'pending' | 'paid';
  paidAt?: Date | string;
  bonus?: number;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const Payroll = createFirestoreModel<IPayroll>('payroll');
export default Payroll;
