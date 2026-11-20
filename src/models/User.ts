import { createFirestoreModel } from '@/lib/firestoreModel';
import { UserRole } from '@/types/auth';

export interface IUser {
  _id?: string;
  id?: string;
  company_id?: string | null;
  name: string;
  email: string;
  password?: string;
  role: UserRole | string;
  department: string;
  designation?: string;
  phone?: string;
  avatar?: any;
  status?: string;
  must_change_password?: boolean;
  joiningDate?: Date | string;
  baseSalary?: number;
  salary?: any;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const User = createFirestoreModel<IUser>('users');
export default User;
