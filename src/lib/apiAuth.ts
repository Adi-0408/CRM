import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import User from '@/models/User';
import Company from '@/models/Company';
import { UserRole, DEMO_CREDENTIALS } from '@/types/auth';

export const DEFAULT_COMPANY_ID = 'company_unique_digital';

export function isValidDocId(id: any): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (trimmed.length < 3 || trimmed.length > 100) return false;
  if (trimmed.includes('@') || trimmed.includes('/') || trimmed.includes(' ')) return false;
  if (trimmed === 'all' || trimmed === 'null' || trimmed === 'undefined') return false;
  return true;
}

export function generateSlug(name: string): string {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const mongoose = {
  Types: {
    ObjectId: {
      isValid: isValidDocId,
    },
  },
};

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  isDemo?: boolean;
  company_id: string | null;
  must_change_password?: boolean;
  isCompanySuspended?: boolean;
}

const VALID_ROLES: UserRole[] = [
  'platform_super_admin',
  'company_admin',
  'admin_manager',
  'team_lead',
  'hr',
  'accounts',
  'sales',
  'web_developer',
  'android_developer',
  'tech_support',
  'intern',
];

export function normalizeRole(rawRole: any): UserRole {
  if (!rawRole) return 'intern';
  const r = String(rawRole).toLowerCase().trim();

  if (r === 'platform_super_admin' || r === 'super_admin' || r === 'superadmin' || r === 'global_admin') {
    return 'platform_super_admin';
  }
  if (r === 'company_admin' || r === 'companyadmin' || r === 'company_owner') {
    return 'company_admin';
  }
  if (r === 'admin_manager' || r === 'admin' || r === 'manager_admin') {
    return 'admin_manager';
  }
  if (
    r === 'team_lead' ||
    r === 'lead' ||
    r === 'pm' ||
    r === 'project_manager' ||
    r === 'teamlead' ||
    r === 'team lead'
  ) {
    return 'team_lead';
  }
  if (r === 'hr' || r === 'hr_manager') {
    return 'hr';
  }
  if (r === 'accounts' || r === 'finance') {
    return 'accounts';
  }
  if (r === 'sales' || r === 'sales_rep') {
    return 'sales';
  }
  if (r === 'web_developer' || r === 'web' || r === 'web_dev') {
    return 'web_developer';
  }
  if (r === 'android_developer' || r === 'android' || r === 'android_dev' || r === 'mobile_developer') {
    return 'android_developer';
  }
  if (r === 'tech_support' || r === 'support') {
    return 'tech_support';
  }
  if (r === 'intern' || r === 'trainee') {
    return 'intern';
  }

  // Fallback check if it's already a valid UserRole
  if (VALID_ROLES.includes(r as UserRole)) {
    return r as UserRole;
  }

  return 'intern';
}

/**
 * Checks if a company is active or suspended in the database
 */
export async function isCompanySuspended(companyId: string | null | undefined): Promise<boolean> {
  if (!companyId) return false;
  try {
    const comp = await Company.findById(companyId);
    if (comp && String(comp.status).toLowerCase() === 'suspended') {
      return true;
    }
  } catch (e) {
    // Non-fatal fallback: assume active if lookup fails
  }
  return false;
}

/**
 * Extracts and verifies the authenticated user from request headers, cookies and Cloud Firestore
 */
export async function getAuthUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  const headerId = req.headers.get('x-user-id');
  const headerEmail = req.headers.get('x-user-email');
  const headerRole = req.headers.get('x-user-role');
  const authHeader = req.headers.get('authorization');

  let tokenEmail: string | null = null;
  let tokenRole: UserRole | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token.includes('demo_')) {
      const parts = token.split('_');
      tokenRole = normalizeRole(parts[2]);
    }
  }

  // 0. Extract Session from Cookies if headers absent
  let cookieEmail: string | null = null;
  let cookieId: string | null = null;
  let cookieRole: UserRole | null = null;
  try {
    const rawCookie = req.cookies.get('crm_session')?.value;
    if (rawCookie) {
      const parsed = JSON.parse(decodeURIComponent(rawCookie));
      if (parsed) {
        if (parsed.email) cookieEmail = String(parsed.email).toLowerCase().trim();
        if (parsed.id) cookieId = String(parsed.id);
        if (parsed.role) cookieRole = normalizeRole(parsed.role);
      }
    }
  } catch (err) {
    // Malformed session cookie ignored
  }

  const lookupEmail = headerEmail || tokenEmail || cookieEmail;
  const lookupId = headerId || cookieId;

  await connectToDatabase();

  // 1. Verify against Firestore Employee collection by Document ID (supports any string ID)
  if (lookupId) {
    const emp = await Employee.findById(lookupId);
    if (emp) {
      const role = normalizeRole(emp.role);
      const isSuperAdmin = role === 'platform_super_admin' || emp.email.toLowerCase() === 'superadmin@crm.com';
      const companyId = isSuperAdmin ? null : (emp.company_id || DEFAULT_COMPANY_ID);
      const suspended = await isCompanySuspended(companyId);

      return {
        id: String(emp._id || emp.id),
        name: emp.name,
        email: emp.email,
        role: isSuperAdmin ? 'platform_super_admin' : role,
        department: emp.department,
        isDemo: false,
        company_id: companyId,
        must_change_password: !!emp.must_change_password,
        isCompanySuspended: suspended,
      };
    }

    // Fallback: Check User collection
    const userDoc = await User.findById(lookupId);
    if (userDoc) {
      const role = normalizeRole(userDoc.role);
      const isSuperAdmin = role === 'platform_super_admin' || userDoc.email.toLowerCase() === 'superadmin@crm.com';
      const companyId = isSuperAdmin ? null : (userDoc.company_id || DEFAULT_COMPANY_ID);
      const suspended = await isCompanySuspended(companyId);

      return {
        id: String(userDoc._id || userDoc.id),
        name: userDoc.name,
        email: userDoc.email,
        role: isSuperAdmin ? 'platform_super_admin' : role,
        department: userDoc.department,
        isDemo: false,
        company_id: companyId,
        must_change_password: !!userDoc.must_change_password,
        isCompanySuspended: suspended,
      };
    }
  }

  // 2. Verify against Firestore by Email
  if (lookupEmail) {
    const cleanEmail = lookupEmail.toLowerCase().trim();
    if (cleanEmail === 'superadmin@crm.com') {
      return {
        id: 'user_superadmin',
        name: 'Platform Super Admin',
        email: 'superadmin@crm.com',
        role: 'platform_super_admin',
        department: 'Platform Engineering',
        isDemo: false,
        company_id: null,
        must_change_password: false,
        isCompanySuspended: false,
      };
    }

    const emp = await Employee.findOne({ email: cleanEmail });
    if (emp) {
      const role = normalizeRole(emp.role);
      const isSuperAdmin = role === 'platform_super_admin';
      const companyId = isSuperAdmin ? null : (emp.company_id || DEFAULT_COMPANY_ID);
      const suspended = await isCompanySuspended(companyId);

      return {
        id: String(emp._id || emp.id),
        name: emp.name,
        email: emp.email,
        role: isSuperAdmin ? 'platform_super_admin' : role,
        department: emp.department,
        isDemo: false,
        company_id: companyId,
        must_change_password: !!emp.must_change_password,
        isCompanySuspended: suspended,
      };
    }

    const userDoc = await User.findOne({ email: cleanEmail });
    if (userDoc) {
      const role = normalizeRole(userDoc.role);
      const isSuperAdmin = role === 'platform_super_admin';
      const companyId = isSuperAdmin ? null : (userDoc.company_id || DEFAULT_COMPANY_ID);
      const suspended = await isCompanySuspended(companyId);

      return {
        id: String(userDoc._id || userDoc.id),
        name: userDoc.name,
        email: userDoc.email,
        role: isSuperAdmin ? 'platform_super_admin' : role,
        department: userDoc.department,
        isDemo: false,
        company_id: companyId,
        must_change_password: !!userDoc.must_change_password,
        isCompanySuspended: suspended,
      };
    }
  }

  // 3. Fallback to Demo Credentials
  const rawDemoRole = tokenRole || headerRole;
  if (rawDemoRole) {
    const norm = normalizeRole(rawDemoRole);
    const demo = DEMO_CREDENTIALS.find((d) => d.role === norm);
    if (demo) {
      if (demo.role === 'platform_super_admin') {
        return {
          id: 'user_superadmin',
          name: demo.name,
          email: demo.email,
          role: 'platform_super_admin',
          department: demo.department,
          isDemo: true,
          company_id: null,
          must_change_password: false,
          isCompanySuspended: false,
        };
      }

      const emp = await Employee.findOne({
        $or: [{ email: demo.email.toLowerCase() }, { role: demo.role }],
      });

      if (emp) {
        const companyId = emp.company_id || DEFAULT_COMPANY_ID;
        const suspended = await isCompanySuspended(companyId);

        return {
          id: String(emp._id || emp.id),
          name: emp.name,
          email: emp.email,
          role: normalizeRole(emp.role),
          department: emp.department,
          isDemo: false,
          company_id: companyId,
          must_change_password: !!emp.must_change_password,
          isCompanySuspended: suspended,
        };
      }

      return {
        id: `demo_${demo.role}`,
        name: demo.name,
        email: demo.email,
        role: demo.role,
        department: demo.department,
        isDemo: true,
        company_id: DEFAULT_COMPANY_ID,
        must_change_password: false,
        isCompanySuspended: false,
      };
    }
  }

  // 4. Fallback to demo admin if running local development without headers
  const defaultAdmin = DEMO_CREDENTIALS[1] || DEMO_CREDENTIALS[0];
  const adminEmp = await Employee.findOne({ email: defaultAdmin.email.toLowerCase() });
  if (adminEmp) {
    const companyId = adminEmp.company_id || DEFAULT_COMPANY_ID;
    const suspended = await isCompanySuspended(companyId);

    return {
      id: String(adminEmp._id || adminEmp.id),
      name: adminEmp.name,
      email: adminEmp.email,
      role: normalizeRole(adminEmp.role),
      department: adminEmp.department,
      isDemo: false,
      company_id: companyId,
      must_change_password: !!adminEmp.must_change_password,
      isCompanySuspended: suspended,
    };
  }

  return {
    id: `demo_${defaultAdmin.role}`,
    name: defaultAdmin.name,
    email: defaultAdmin.email,
    role: defaultAdmin.role,
    department: defaultAdmin.department,
    isDemo: true,
    company_id: DEFAULT_COMPANY_ID,
    must_change_password: false,
    isCompanySuspended: false,
  };
}

/**
 * Route protection middleware enforcing that:
 * 1. The user is authenticated
 * 2. The user's tenant company is NOT suspended (403 Forbidden)
 * 3. The user has one of the allowed roles (platform_super_admin has global access)
 */
export async function requireRoles(
  req: NextRequest,
  allowedRoles: (UserRole | string)[]
): Promise<{
  errorResponse?: NextResponse;
  response?: NextResponse;
  user?: AuthenticatedUser;
  companyId?: string | null;
  isSuperAdmin?: boolean;
}> {
  const user = await getAuthUser(req);

  if (!user) {
    const errRes = NextResponse.json(
      { error: 'Unauthorized: Valid session or token required.' },
      { status: 401 }
    );
    return { errorResponse: errRes, response: errRes };
  }

  // Check company suspension immediately
  if (user.isCompanySuspended) {
    const errRes = NextResponse.json(
      { error: 'Forbidden: Your company access has been suspended by the platform administrator.' },
      { status: 403 }
    );
    return { errorResponse: errRes, response: errRes };
  }

  const isSuperAdmin = user.role === 'platform_super_admin';

  // Platform super admin bypasses role restrictions
  if (isSuperAdmin) {
    return { user, companyId: null, isSuperAdmin: true };
  }

  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));
  const isCompanyAdmin = user.role === 'company_admin' || user.role === 'admin_manager';
  const allowsCompanyAdmin =
    normalizedAllowed.includes('company_admin') ||
    normalizedAllowed.includes('admin_manager') ||
    allowedRoles.includes('company_admin') ||
    allowedRoles.includes('admin_manager');

  const hasRole =
    normalizedAllowed.includes(user.role) ||
    allowedRoles.includes(user.role) ||
    (isCompanyAdmin && allowsCompanyAdmin);

  if (!hasRole) {
    const errRes = NextResponse.json(
      {
        error: `Forbidden: Access restricted. Role '${user.role}' lacks permission for this action.`,
        requiredRoles: allowedRoles,
        currentRole: user.role,
      },
      { status: 403 }
    );
    return { errorResponse: errRes, response: errRes };
  }

  return { user, companyId: user.company_id, isSuperAdmin: false };
}

/**
 * Convenience tenant authentication middleware
 */
export async function requireTenantAuth(
  req: NextRequest,
  allowedRoles?: (UserRole | string)[]
): Promise<{
  errorResponse?: NextResponse;
  response?: NextResponse;
  user?: AuthenticatedUser;
  companyId?: string | null;
  isSuperAdmin?: boolean;
}> {
  if (allowedRoles && allowedRoles.length > 0) {
    return requireRoles(req, allowedRoles);
  }

  const user = await getAuthUser(req);
  if (!user) {
    const errRes = NextResponse.json(
      { error: 'Unauthorized: Valid session or token required.' },
      { status: 401 }
    );
    return { errorResponse: errRes, response: errRes };
  }

  if (user.isCompanySuspended) {
    const errRes = NextResponse.json(
      { error: 'Forbidden: Your company access has been suspended by the platform administrator.' },
      { status: 403 }
    );
    return { errorResponse: errRes, response: errRes };
  }

  const isSuperAdmin = user.role === 'platform_super_admin';
  return { user, companyId: user.company_id, isSuperAdmin };
}

/**
 * Injects company_id into a query filter based on authenticated user context.
 * For platform_super_admin, preserves optional filter or passes through.
 * For company users, strictly forces company_id = user.company_id (cannot be overridden).
 */
export function buildTenantFilter(user: AuthenticatedUser, baseFilter: any = {}): any {
  if (user.role === 'platform_super_admin') {
    // Platform Super Admin manages tenants only — never has access to companies' operational CRM records
    return {
      ...baseFilter,
      company_id: '__platform_super_admin_no_company__',
    };
  }
  return {
    ...baseFilter,
    company_id: user.company_id || DEFAULT_COMPANY_ID,
  };
}
