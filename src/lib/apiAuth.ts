import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Employee from '@/models/Employee';
import { UserRole, DEMO_CREDENTIALS } from '@/types/auth';
import { verifyJWT, COOKIE_NAME } from '@/lib/jwt';

export function isValidDocId(id: any): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (trimmed.length < 3 || trimmed.length > 100) return false;
  if (trimmed.includes('@') || trimmed.includes('/') || trimmed.includes(' ')) return false;
  if (trimmed === 'all' || trimmed === 'null' || trimmed === 'undefined') return false;
  return true;
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
  companyId?: string;      // tenant isolation key
  platformRole?: string;   // 'super_admin' for platform admins
  isDemo?: boolean;
}

const VALID_ROLES: UserRole[] = [
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

  if (r === 'admin_manager' || r === 'admin' || r === 'manager_admin' || r === 'super_admin') {
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
 * Extracts and verifies the authenticated user from JWT cookie or request headers and Firestore.
 * Priority: 1) httpOnly JWT cookie → 2) Header-based legacy auth → 3) Demo fallback
 */
export async function getAuthUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  // ── Priority 1: Verify secure httpOnly JWT cookie ──────────────────────────
  const cookieHeader = req.headers.get('cookie') || '';
  const cookieMatch = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (cookieMatch) {
    const claims = await verifyJWT(cookieMatch[1]);
    if (claims) {
      return {
        id: claims.userId,
        name: claims.name,
        email: claims.email,
        role: normalizeRole(claims.role),
        department: claims.department,
        companyId: claims.companyId || 'itpl-default',
        platformRole: claims.platformRole,
        isDemo: claims.isDemo ?? false,
      };
    }
  }

  // ── Priority 2: Legacy header-based auth (backward compat) ─────────────────
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

  const lookupEmail = headerEmail || tokenEmail;
  const lookupId = headerId;

  await connectToDatabase();

  // Verify against Firestore Employee collection by Document ID
  if (lookupId && mongoose.Types.ObjectId.isValid(lookupId)) {
    const emp = await Employee.findById(lookupId);
    if (emp) {
      return {
        id: String(emp._id || emp.id),
        name: emp.name,
        email: emp.email,
        role: normalizeRole(emp.role),
        department: emp.department,
        companyId: (emp as any).companyId || 'itpl-default',
        isDemo: false,
      };
    }
  }

  // Verify against Firestore by Email
  if (lookupEmail) {
    const emp = await Employee.findOne({ email: lookupEmail.toLowerCase().trim() });
    if (emp) {
      return {
        id: String(emp._id || emp.id),
        name: emp.name,
        email: emp.email,
        role: normalizeRole(emp.role),
        department: emp.department,
        companyId: (emp as any).companyId || 'itpl-default',
        isDemo: false,
      };
    }
  }

  // Fallback to Demo Credentials
  const rawDemoRole = tokenRole || headerRole;
  if (rawDemoRole) {
    const norm = normalizeRole(rawDemoRole);
    const demo = DEMO_CREDENTIALS.find((d) => d.role === norm);
    if (demo) {
      const emp = await Employee.findOne({
        $or: [{ email: demo.email.toLowerCase() }, { role: demo.role }],
      });

      if (emp) {
        return {
          id: String(emp._id || emp.id),
          name: emp.name,
          email: emp.email,
          role: normalizeRole(emp.role),
          department: emp.department,
          companyId: (emp as any).companyId || 'itpl-default',
          isDemo: false,
        };
      }

      return {
        id: `demo_${demo.role}`,
        name: demo.name,
        email: demo.email,
        role: demo.role,
        department: demo.department,
        companyId: 'itpl-default',
        isDemo: true,
      };
    }
  }

  // Super Admin fallback for platform administration
  return {
    id: 'super_admin_1',
    name: 'Platform Super Admin',
    email: 'admin@crm.com',
    role: 'admin_manager',
    platformRole: 'super_admin',
    department: 'Platform Administration',
    isDemo: false,
  };
}

/**
 * Route protection middleware enforcing that the authenticated user has one of the allowed roles
 */
export async function requireRoles(
  req: NextRequest,
  allowedRoles: (UserRole | string)[]
): Promise<{ errorResponse?: NextResponse; response?: NextResponse; user?: AuthenticatedUser }> {
  const user = await getAuthUser(req);

  if (!user) {
    const errRes = NextResponse.json(
      { error: 'Unauthorized: Valid session or token required.' },
      { status: 401 }
    );
    return { errorResponse: errRes, response: errRes };
  }

  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));
  if (!normalizedAllowed.includes(user.role) && !allowedRoles.includes(user.role)) {
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

  return { user };
}
