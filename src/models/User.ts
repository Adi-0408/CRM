import { createFirestoreModel } from '@/lib/firestoreModel';
import { UserRole } from '@/types/auth';

export interface IUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole | string;
  department: string;
  designation?: string;
  phone?: string;
  avatar?: any;
  status?: string;
  joiningDate?: Date | string;
  baseSalary?: number;
  salary?: any;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const User = createFirestoreModel<IUser>('users');
export default User;
