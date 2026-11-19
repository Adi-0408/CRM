import { createFirestoreModel } from '@/lib/firestoreModel';

export interface IAuditLog {
  _id?: string;
  id?: string;
  actorUid: string;
  actorName?: string;
  companyId?: string;        // null for platform-level actions
  action: string;            // e.g. "company.created", "employee.deleted", "login.failed"
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;         // ISO string
}

export const AuditLog = createFirestoreModel<IAuditLog>('auditLogs');
export default AuditLog;
