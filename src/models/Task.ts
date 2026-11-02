import { createFirestoreModel } from '@/lib/firestoreModel';

export interface ITask {
  _id?: string;
  id?: string;
  title: string;
  project?: any;
  assignedTo?: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'new' | 'in_progress' | 'completed' | 'todo';
  dueDate?: Date | string;
  description?: string;
  attachmentUrl?: string;
  completedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const Task = createFirestoreModel<ITask>('tasks');
export default Task;
