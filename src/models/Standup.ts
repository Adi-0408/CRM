import { createFirestoreModel } from '@/lib/firestoreModel';

export interface IStandup {
  _id?: string;
  id?: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeRole?: string;
  employeeAvatar?: string;
  date: string; // YYYY-MM-DD
  completedToday: string;
  plannedTomorrow: string;
  blockers?: string;
  hasBlockers: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const Standup = createFirestoreModel<IStandup>('standups');
export default Standup;
