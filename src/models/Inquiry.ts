import { createFirestoreModel } from '@/lib/firestoreModel';

export interface IInquiry {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  teamSize?: '1-10' | '11-50' | '51-200' | '200+';
  interest?: string;
  message: string;
  status: 'new' | 'contacted' | 'closed';
  adminNotes?: string;
  source: 'landing_page';
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const Inquiry = createFirestoreModel<IInquiry>('inquiries');
export default Inquiry;
