import { createFirestoreModel } from '@/lib/firestoreModel';

export interface ICompany {
  _id?: string;
  id?: string;
  name: string;
  slug: string; // unique slug e.g. 'unique-digital-services'
  status: 'active' | 'suspended';
  brand_name: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string; // hex color e.g. '#635BFF'
  accent_color?: string; // hex color e.g. '#00D4B2'
  currency_code: string; // e.g. 'INR', 'USD'
  currency_symbol: string; // e.g. '₹', '$'
  timezone: string; // e.g. 'Asia/Kolkata'
  support_email?: string;
  phone?: string;
  address?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const Company = createFirestoreModel<ICompany>('companies');
export default Company;
