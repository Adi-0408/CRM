import { AuthUser, UserRole } from '@/types/auth';

export function isUserAdminManager(user: AuthUser | null): boolean {
  return user?.role === 'admin_manager';
}

export function isUserHR(user: AuthUser | null): boolean {
  return user?.role === 'hr';
}

export function isUserAdminOrHR(user: AuthUser | null): boolean {
  return user?.role === 'admin_manager' || user?.role === 'hr';
}

export function isUserAccounts(user: AuthUser | null): boolean {
  return user?.role === 'accounts';
}

export function isUserSales(user: AuthUser | null): boolean {
  return user?.role === 'sales';
}

export function isUserWebDev(user: AuthUser | null): boolean {
  return user?.role === 'web_developer';
}

export function isUserAndroidDev(user: AuthUser | null): boolean {
  return user?.role === 'android_developer';
}

export function isUserTechSupport(user: AuthUser | null): boolean {
  return user?.role === 'tech_support';
}

export function isUserIntern(user: AuthUser | null): boolean {
  return user?.role === 'intern';
}

/**
 * Checks if a record belongs to the current user (by ID or Email)
 */
export function isRecordOwner(user: AuthUser | null, record: any): boolean {
  if (!user || !record) return false;

  const currentId = String(user.id || (user as any)._id || '');
  const userIds = [currentId, currentId.replace('demo_', ''), currentId.replace('user_', '')];
  const userEmail = user.email?.toLowerCase().trim();

  // Check direct employeeId field
  const recordEmpId =
    record.employeeId ||
    record.employee?._id ||
    record.employee?.id ||
    record.employee ||
    record.assignedTo?._id ||
    record.assignedTo?.id ||
    record.assignedTo;

  if (recordEmpId) {
    const recIdStr = String(recordEmpId);
    if (userIds.includes(recIdStr)) return true;
  }

  // Check email
  const recordEmail = record.employee?.email || record.email || record.assignedTo?.email;
  if (recordEmail && recordEmail.toLowerCase().trim() === userEmail) {
    return true;
  }

  // Check name match if email is missing
  const recordName = record.employee?.name || record.name || record.assignedTo?.name;
  if (recordName && recordName.toLowerCase().trim() === user.name?.toLowerCase().trim()) {
    return true;
  }

  return false;
}

/**
 * Permission checker for Leave approvals:
 * - admin_manager: Can approve all leaves (including HR leaves)
 * - hr: Can approve leaves for all employees EXCEPT their own personal leave
 * - All other roles: Cannot approve/reject leaves
 */
export function canApproveLeave(user: AuthUser | null, leave?: any): boolean {
  if (!user) return false;
  if (user.role === 'admin_manager') return true;

  if (user.role === 'hr') {
    if (leave && isRecordOwner(user, leave)) {
      return false; // HR cannot approve own leave
    }
    return true;
  }

  return false;
}

/**
 * Permission checker for Leave cancellation:
 * - Can only cancel if status is 'pending'
 * - Only the owner, HR, or admin_manager can cancel
 */
export function canCancelLeave(user: AuthUser | null, leave: any): boolean {
  if (!user || !leave) return false;
  const status = String(leave.status || '').toLowerCase();
  if (status !== 'pending') return false;

  return (
    isRecordOwner(user, leave) ||
    user.role === 'admin_manager' ||
    user.role === 'hr'
  );
}

/**
 * Permission checker for Payroll editing and disbursal
 * - Strictly admin_manager & accounts
 */
export function canManagePayroll(user: AuthUser | null): boolean {
  return user?.role === 'admin_manager' || user?.role === 'accounts';
}

/**
 * Permission checker for Attendance regularization & overrides
 * - Strictly admin_manager & hr
 */
export function canRegularizeAttendance(user: AuthUser | null): boolean {
  return user?.role === 'admin_manager' || user?.role === 'hr';
}

/**
 * Permission checker for creating & deleting projects
 * - Strictly admin_manager
 */
export function canManageProjects(user: AuthUser | null): boolean {
  return user?.role === 'admin_manager';
}

/**
 * Permission checker for creating and delegating tasks
 * - admin_manager & team_lead
 */
export function canManageTasks(user: AuthUser | null): boolean {
  return user?.role === 'admin_manager' || user?.role === 'team_lead';
}

/**
 * Permission checker for managing Invoices & Client Receivables
 * - Strictly admin_manager & accounts
 */
export function canManageInvoices(user: AuthUser | null): boolean {
  return user?.role === 'admin_manager' || user?.role === 'accounts';
}

/**
 * Permission checker for Leads management (Add Leads, delete, pipeline stages)
 * - Strictly admin_manager & sales
 */
export function canManageLeads(user: AuthUser | null): boolean {
  return user?.role === 'admin_manager' || user?.role === 'sales';
}

/**
 * Permission checker for managing Tech Support Tickets
 * - Strictly admin_manager & tech_support
 */
export function canManageTickets(user: AuthUser | null): boolean {
  return user?.role === 'admin_manager' || user?.role === 'tech_support';
}

/**
 * Permission checker for managing employee credentials & passwords
 * - Strictly admin_manager & hr
 */
export function canManageCredentials(user: AuthUser | null): boolean {
  return user?.role === 'admin_manager' || user?.role === 'hr';
}

/**
 * Permission checker for deleting employee accounts
 * - Strictly admin_manager
 */
export function canDeleteEmployee(user: AuthUser | null): boolean {
  return user?.role === 'admin_manager';
}
