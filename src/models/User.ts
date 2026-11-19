import { createFirestoreModel } from '@/lib/firestoreModel';

export type PlatformRole = 'super_admin' | 'support' | 'user';

export interface IUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  platformRole: PlatformRole;  // Platform-level role (super_admin, etc.)
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const User = createFirestoreModel<IUser>('users');
export default User;
