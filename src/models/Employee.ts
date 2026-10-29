import { createFirestoreModel } from '@/lib/firestoreModel';
import { UserRole } from '@/types/auth';

export interface IEmployee {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: UserRole | string;
  department: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'on_leave' | 'suspended' | 'Active' | 'Suspended';
  salary: number;
  baseSalary: number;
  joinDate?: Date | string;
  completedTasksCount?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const Employee = createFirestoreModel<IEmployee>('employees');
export default Employee;
