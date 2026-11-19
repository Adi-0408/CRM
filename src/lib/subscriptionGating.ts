import { Company } from '@/models/Company';
import { Subscription } from '@/models/Subscription';
import { Plan } from '@/models/Plan';
import { AuthenticatedUser } from '@/lib/apiAuth';
import { DEFAULT_COMPANY_ID } from '@/lib/tenantScope';
import { connectToDatabase } from '@/lib/db';

export interface SubscriptionCheckResult {
  allowed: boolean;
  reason?: 'active' | 'trial' | 'grace_period' | 'expired' | 'suspended' | 'cancelled' | 'not_found';
  message?: string;
  plan?: any;
}

/**
 * Validates whether a tenant company currently has an active subscription or valid trial.
 */
export async function checkCompanySubscription(user: AuthenticatedUser | null): Promise<SubscriptionCheckResult> {
  if (!user) {
    return { allowed: false, reason: 'not_found', message: 'User not authenticated.' };
  }

  // Super admins always bypass subscription checks
  if (user.platformRole === 'super_admin') {
    return { allowed: true, reason: 'active' };
  }

  const companyId = user.companyId || DEFAULT_COMPANY_ID;

  // Default company always allowed for baseline continuity
  if (companyId === DEFAULT_COMPANY_ID) {
    return { allowed: true, reason: 'active' };
  }

  await connectToDatabase();
  const company = await Company.findById(companyId);

  if (!company) {
    return { allowed: false, reason: 'not_found', message: 'Tenant company not found.' };
  }

  if (company.status === 'suspended') {
    return {
      allowed: false,
      reason: 'suspended',
      message: 'Your company workspace has been suspended by platform administration.',
    };
  }

  // Check subscription record
  const sub = await Subscription.findOne({ companyId });
  if (sub) {
    const now = new Date();
    const end = new Date(sub.endDate);

    if (sub.status === 'cancelled') {
      return { allowed: false, reason: 'cancelled', message: 'Subscription has been cancelled.' };
    }

    if (now > end && sub.status !== 'grace_period') {
      // Check grace period (default 7 days)
      const graceEnd = sub.gracePeriodEnd ? new Date(sub.gracePeriodEnd) : new Date(end.getTime() + 7 * 86400000);
      if (now <= graceEnd) {
        return { allowed: true, reason: 'grace_period', message: 'Account is in subscription grace period.' };
      }
      return { allowed: false, reason: 'expired', message: 'Subscription expired. Please renew your plan.' };
    }
  }

  return { allowed: true, reason: 'active' };
}

/**
 * Verifies if the company has room to add more items under their plan limit.
 */
export async function checkPlanLimit(
  user: AuthenticatedUser | null,
  limitType: 'users' | 'leads',
  currentCount: number
): Promise<{ allowed: boolean; maxAllowed: number; error?: string }> {
  if (!user || user.platformRole === 'super_admin') {
    return { allowed: true, maxAllowed: -1 };
  }

  const companyId = user.companyId || DEFAULT_COMPANY_ID;
  if (companyId === DEFAULT_COMPANY_ID) {
    return { allowed: true, maxAllowed: -1 };
  }

  await connectToDatabase();
  const company = await Company.findById(companyId);
  const planId = company?.planId || 'plan-enterprise';
  const plan = await Plan.findById(planId);

  if (!plan) {
    return { allowed: true, maxAllowed: -1 };
  }

  if (limitType === 'users') {
    const max = plan.maxUsers ?? -1;
    if (max !== -1 && currentCount >= max) {
      return {
        allowed: false,
        maxAllowed: max,
        error: `User limit reached for your ${plan.name} plan (${max} users). Upgrade to add more team members.`,
      };
    }
    return { allowed: true, maxAllowed: max };
  }

  if (limitType === 'leads') {
    const max = plan.maxLeads ?? -1;
    if (max !== -1 && currentCount >= max) {
      return {
        allowed: false,
        maxAllowed: max,
        error: `Lead limit reached for your ${plan.name} plan (${max} leads). Upgrade to add more leads.`,
      };
    }
    return { allowed: true, maxAllowed: max };
  }

  return { allowed: true, maxAllowed: -1 };
}
