import { createFirestoreModel } from '@/lib/firestoreModel';

export interface IAttendanceLocation {
  latitude: number;
  longitude: number;
  distanceMeters: number;
  address?: string;
  isWithinPerimeter?: boolean;
  calibratedOffice?: {
    latitude: number;
    longitude: number;
  };
}

export interface IAttendanceSession {
  _id?: string;
  id?: string;
  checkIn: Date | string;
  checkOut?: Date | string | null;
  durationMinutes?: number;
  notes?: string;
  isAutoClockOut?: boolean;
  checkInPhoto?: string;
  checkInPhotoPublicId?: string;
  checkInPhotoExpiresAt?: Date | string;
  checkOutPhoto?: string;
  checkOutPhotoPublicId?: string;
  checkOutPhotoExpiresAt?: Date | string;
  isPhotoExpired?: boolean;
  checkInLocation?: IAttendanceLocation;
  checkOutLocation?: IAttendanceLocation;
}

export interface IAttendance {
  _id?: string;
  id?: string;
  employee: any;
  date: string; // YYYY-MM-DD
  checkIn?: Date | string;
  checkOut?: Date | string;
  sessions: IAttendanceSession[];
  totalMinutes?: number;
  effectiveMinutes?: number;
  isLate?: boolean;
  lateByMinutes?: number;
  status: 'full_day' | 'half_day' | 'working' | 'present' | 'absent' | 'late';
  isAutoClockOut?: boolean;
  autoClockOutReason?: string;
  overriddenBy?: any;
  overrideReason?: string;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export const Attendance = createFirestoreModel<IAttendance>('attendance');
export default Attendance;
