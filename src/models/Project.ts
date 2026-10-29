import { createFirestoreModel } from '@/lib/firestoreModel';

export interface IProject {
  _id?: string;
  id?: string;
  title: string;
  client: string;
  description?: string;
  budget?: number;
  status?: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold';
  progress?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  deadline: Date | string;
  teamMembers?: any[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const Project = createFirestoreModel<IProject>('projects');
export default Project;
