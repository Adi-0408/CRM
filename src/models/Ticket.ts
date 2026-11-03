import { createFirestoreModel } from '@/lib/firestoreModel';

export type TicketCategory =
  | 'Bug / Defect'
  | 'API & Integration'
  | 'Server & Performance'
  | 'System Crash / Downtime'
  | 'Technical Inquiry'
  | 'Technical'; // Legacy backward-compatibility

export interface ITicket {
  _id?: string;
  id?: string;
  ticketNumber?: string;
  title: string;
  customerName: string;
  customerEmail: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  category?: TicketCategory | string;
  assignedTo?: any;
  description?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const Ticket = createFirestoreModel<ITicket>('tickets');
export default Ticket;
