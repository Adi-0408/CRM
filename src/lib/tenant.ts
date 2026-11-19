/**
 * Tenant Resolution Utility
 *
 * Resolves a company slug to its full company record.
 * Used by API routes and pages to validate tenant context.
 *
 * SECURITY: Never trust the slug from the client alone.
 * Always validate against Firestore and check company status.
 */
import { CompanyDomain } from '@/models/CompanyDomain';
import { Company, ICompany } from '@/models/Company';
import { connectToDatabase } from '@/lib/db';

export interface TenantContext {
  companyId: string;
  slug: string;
  companyName: string;
  status: ICompany['status'];
  subscriptionStatus?: ICompany['subscriptionStatus'];
  logo?: string;
  primaryColor?: string;
}

export type TenantResolutionResult =
  | { success: true; tenant: TenantContext }
  | { success: false; reason: 'not_found' | 'suspended' | 'expired' | 'error'; message: string };

/**
 * Resolve a slug to a tenant context. Returns error if company not found, suspended, etc.
 */
export async function resolveTenant(slug: string): Promise<TenantResolutionResult> {
  if (!slug || typeof slug !== 'string') {
    return { success: false, reason: 'not_found', message: 'No tenant slug provided.' };
  }

  try {
    await connectToDatabase();

    // Look up company domain registry
    const domainRecord = await CompanyDomain.findOne({ slug: slug.toLowerCase(), isActive: true });
    if (!domainRecord) {
      // Fallback: look up company directly by slug
      const company = await Company.findOne({ slug: slug.toLowerCase() });
      if (!company) {
        return { success: false, reason: 'not_found', message: `No company found for slug: "${slug}".` };
      }
      return buildTenantResult(company);
    }

    const company = await Company.findById(domainRecord.companyId);
    if (!company) {
      return { success: false, reason: 'not_found', message: 'Company record missing.' };
    }

    return buildTenantResult(company);
  } catch (err: any) {
    console.error('[resolveTenant] Error:', err);
    return { success: false, reason: 'error', message: 'Could not resolve tenant.' };
  }
}

function buildTenantResult(company: any): TenantResolutionResult {
  if (company.status === 'suspended') {
    return {
      success: false,
      reason: 'suspended',
      message: `The company "${company.companyName}" has been suspended. Contact support.`,
    };
  }

  if (
    company.subscriptionStatus === 'expired' ||
    company.subscriptionStatus === 'cancelled'
  ) {
    return {
      success: false,
      reason: 'expired',
      message: `The subscription for "${company.companyName}" has expired. Please renew.`,
    };
  }

  return {
    success: true,
    tenant: {
      companyId: String(company._id || company.id),
      slug: company.slug,
      companyName: company.companyName,
      status: company.status,
      subscriptionStatus: company.subscriptionStatus,
      logo: company.logo,
      primaryColor: company.primaryColor,
    },
  };
}
