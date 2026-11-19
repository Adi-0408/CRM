/**
 * Tenant Scoping Utilities
 *
 * Ensures all database reads, writes, and queries are strictly scoped to the tenant company.
 * Never trust `companyId` provided directly in the request body from client.
 */
import { AuthenticatedUser } from '@/lib/apiAuth';

export const DEFAULT_COMPANY_ID = 'itpl-default';

/**
 * Returns a filter object to scope database queries to the user's company.
 * For users in the default company ('itpl-default'), it also matches legacy
 * records where `companyId` is not yet populated (pre-migration).
 */
export function getTenantFilter(user: AuthenticatedUser | null): Record<string, any> {
  if (!user) {
    return {
      $or: [
        { companyId: DEFAULT_COMPANY_ID },
        { companyId: null },
        { companyId: undefined },
      ],
    };
  }

  // Platform super admins can query globally or across tenants
  if (user.platformRole === 'super_admin') {
    return {};
  }

  const userCompanyId = user.companyId || DEFAULT_COMPANY_ID;

  if (userCompanyId === DEFAULT_COMPANY_ID) {
    // For default company, match both explicitly tagged and legacy records
    return {
      $or: [
        { companyId: DEFAULT_COMPANY_ID },
        { companyId: null },
        { companyId: undefined },
      ],
    };
  }

  // Strictly isolate non-default companies to only their own records
  return { companyId: userCompanyId };
}

/**
 * Merges a business query with the tenant isolation filter.
 */
export function withTenantScope(query: Record<string, any>, user: AuthenticatedUser | null): Record<string, any> {
  const tenantFilter = getTenantFilter(user);

  // If super admin and no filter, return original query
  if (Object.keys(tenantFilter).length === 0) {
    return query;
  }

  // If query is empty, return tenant filter directly
  if (Object.keys(query).length === 0) {
    return tenantFilter;
  }

  // If tenantFilter has $or, merge using $and
  if (tenantFilter.$or) {
    return {
      $and: [
        query,
        { $or: tenantFilter.$or },
      ],
    };
  }

  return {
    ...query,
    ...tenantFilter,
  };
}

/**
 * Stamps a new data payload with the authenticated user's companyId.
 */
export function stampTenantPayload(payload: any, user: AuthenticatedUser | null): any {
  const companyId = user?.companyId || DEFAULT_COMPANY_ID;
  return {
    ...payload,
    companyId,
  };
}
