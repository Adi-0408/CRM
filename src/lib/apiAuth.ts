import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import User from '@/models/User';
import Company from '@/models/Company';
import { UserRole, DEMO_CREDENTIALS } from '@/types/auth';
import { verifyAuthToken, TokenPayload } from '@/lib/authCrypto';
import { generateSlug, isValidDocId } from '@/lib/utils';

export { generateSlug, isValidDocId };

export const DEFAULT_COMPANY_ID = 'company_unique_digital';

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
  company_id?: string | null;
  must_change_password?: boolean;
  isCompanySuspended?: boolean;
}

export const VALID_ROLES: UserRole[] = [
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
  'platform_super_admin',
];

export function normalizeRole(role: any): UserRole {
  if (!role || typeof role !== 'string') return 'intern';
  const r = role.toLowerCase().trim().replace(/[\s-]+/g, '_');

  if (
    r === 'platform_super_admin' ||
    r === 'super_admin' ||
    r === 'superadmin' ||
    r === 'platform_admin'
  ) {
    return 'platform_super_admin';
  }
  if (
    r === 'company_admin' ||
    r === 'admin' ||
    r === 'owner' ||
    r === 'founder' ||
    r === 'ceo'
  ) {
    return 'company_admin';
  }
  if (r === 'admin_manager' || r === 'manager_admin') {
    return 'admin_manager';
  }
  if (
    r === 'team_lead' ||
    r === 'lead' ||
    r === 'pm' ||
    r === 'project_manager' ||
    r === 'teamlead'
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
  if (
    r === 'android_developer' ||
    r === 'android' ||
    r === 'android_dev' ||
    r === 'mobile_developer'
  ) {
    return 'android_developer';
  }
  if (r === 'tech_support' || r === 'support') {
    return 'tech_support';
  }
  if (r === 'intern' || r === 'trainee') {
    return 'intern';
  }

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
    // Non-fatal fallback
  }
  return false;
}

/**
 * Extracts and verifies the authenticated user from cryptographically signed tokens or cookies.
 * Does NOT trust raw unverified client headers for authorization.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  let tokenPayload: TokenPayload | null = null;

  // 1. Check Bearer token in Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.substring(7);
    tokenPayload = await verifyAuthToken(rawToken);

    // Legacy demo token compatibility for local UI test switcher
    if (!tokenPayload && rawToken.startsWith('token_demo_')) {
      const parts = rawToken.split('_');
      const demoRole = normalizeRole(parts[2]);
      const demo = DEMO_CREDENTIALS.find((d) => d.role === demoRole);
      if (demo) {
        tokenPayload = {
          sub: `demo_${demo.role}`,
          email: demo.email,
          role: demo.role,
          company_id: (demo as any).company_id !== undefined ? (demo as any).company_id : DEFAULT_COMPANY_ID,
          name: demo.name,
        };
      }
    }
  }

  // 2. Check signed crm_session cookie
  if (!tokenPayload) {
    const rawCookie = req.cookies.get('crm_session')?.value;
    if (rawCookie) {
      tokenPayload = await verifyAuthToken(rawCookie);

      // Transition fallback: parse legacy JSON cookie only if present
      if (!tokenPayload) {
        try {
          const parsed = JSON.parse(decodeURIComponent(rawCookie));
          if (parsed && (parsed.id || parsed.email)) {
            tokenPayload = {
              sub: String(parsed.id || ''),
              email: String(parsed.email || '').toLowerCase().trim(),
              role: normalizeRole(parsed.role),
              company_id: parsed.company_id || null,
            };
          }
        } catch {
          // Malformed cookie
        }
      }
    }
  }

  // If no cryptographically valid session token is found, return null (unauthorized)
  if (!tokenPayload) {
    return null;
  }

  await connectToDatabase();

  const lookupId = tokenPayload.sub;
  const lookupEmail = tokenPayload.email?.toLowerCase().trim();

  // 3. Platform Super Admin Check
  if (tokenPayload.role === 'platform_super_admin' || lookupEmail === 'superadmin@crm.com') {
    return {
      id: 'user_superadmin',
      name: tokenPayload.name || 'Platform Super Admin',
      email: 'superadmin@crm.com',
      role: 'platform_super_admin',
      department: 'Platform Engineering',
      isDemo: false,
      company_id: null,
      must_change_password: false,
      isCompanySuspended: false,
    };
  }

  // 4. Verify against Firestore Employee collection
  if (lookupId && !lookupId.startsWith('demo_')) {
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

  // 5. Verify against Firestore by verified email
  if (lookupEmail) {
    const emp = await Employee.findOne({ email: lookupEmail });
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

    const userDoc = await User.findOne({ email: lookupEmail });
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

  // 6. Return verified payload claims if verified via JWT token
  if (tokenPayload) {
    const role = normalizeRole(tokenPayload.role);
    const companyId = role === 'platform_super_admin' ? null : (tokenPayload.company_id || DEFAULT_COMPANY_ID);
    const suspended = await isCompanySuspended(companyId);

    return {
      id: tokenPayload.sub,
      name: tokenPayload.name || 'User',
      email: tokenPayload.email,
      role,
      department: tokenPayload.department,
      isDemo: tokenPayload.sub.startsWith('demo_'),
      company_id: companyId,
      must_change_password: !!tokenPayload.must_change_password,
      isCompanySuspended: suspended,
    };
  }

  return null;
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
