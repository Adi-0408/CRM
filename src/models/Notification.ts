import { createFirestoreModel } from '@/lib/firestoreModel';

export interface INotification {
  _id?: string;
  id?: string;
  userId?: string; // Recipient employee ID or email; 'all' for company-wide
  title: string;
  message: string;
  type:
    | 'task_assigned'
    | 'project_status'
    | 'leave_status'
    | 'ticket_updated'
    | 'lead_won'
    | 'standup_digest'
    | 'general';
  linkTab?: string; // Tab to navigate to e.g. 'tasks', 'projects', 'leave', 'support', 'leads'
  isRead?: boolean;
  metadata?: any;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const Notification = createFirestoreModel<INotification>('notifications');
export default Notification;
