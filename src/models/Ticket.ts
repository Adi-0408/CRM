import { createFirestoreModel } from '@/lib/firestoreModel';

export interface ITicket {
  _id?: string;
  id?: string;
  ticketNumber?: string;
  title: string;
  customerName: string;
  customerEmail: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  category?: 'Technical' | 'Billing' | 'Feature Request' | 'General';
  assignedTo?: any;
  description?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const Ticket = createFirestoreModel<ITicket>('tickets');
export default Ticket;
