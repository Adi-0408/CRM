import { createFirestoreModel } from '@/lib/firestoreModel';

export interface ILandingContent {
  _id?: string;
  id?: string;
  hero: {
    badgeText: string;
    headline: string;
    subheadline: string;
    primaryCtaText: string;
    secondaryCtaText: string;
  };
  features: {
    sectionBadge: string;
    sectionTitle: string;
    sectionSubtitle: string;
    multiTenantBannerTitle: string;
    multiTenantBannerSubtitle: string;
  };
  howItWorks: {
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  updatedAt?: string;
}

export const DEFAULT_LANDING_CONTENT: ILandingContent = {
  id: 'landing_content',
  hero: {
    badgeText: 'Complete Multi-Tenant CRM & Operations Platform',
    headline: 'One Platform. Every Team. Complete Business Control.',
    subheadline:
      'Manage your entire business with PrismCRM. Unify sales, finance, projects, HR, attendance, payroll, and customer support in one intelligent, secure, company-specific workspace.',
    primaryCtaText: 'Explore Features',
    secondaryCtaText: 'Sign In',
  },
  features: {
    sectionBadge: 'Built-in Capabilities',
    sectionTitle: 'Everything Your Business Needs. One Connected Platform.',
    sectionSubtitle:
      'Engineered as a cohesive ecosystem — eliminating scattered SaaS subscriptions and disconnected databases.',
    multiTenantBannerTitle: 'Dedicated Workspaces with Custom Branding & Branch Isolation',
    multiTenantBannerSubtitle:
      'Every company tenant operates inside a strictly isolated boundary with custom logos, brand color themes, branch coordinates, and company-specific administrator logins.',
  },
  howItWorks: {
    step1Title: 'Request Your Workspace',
    step1Desc:
      'Submit your organization details and operational requirements.',
    step2Title: 'Workspace Configuration',
    step2Desc:
      'The PrismCRM platform team reviews the request and configures the company workspace.',
    step3Title: 'Start Managing Your Business',
    step3Desc:
      'Receive access to your dedicated company portal and configure employees, branches, and permissions.',
  },
  contact: {
    email: 'contact@prismcrm.com',
    phone: '+91 98765 43210',
    address: 'PrismCRM Headquarters, India',
  },
};

export const LandingContent = createFirestoreModel<ILandingContent>('landing_settings');
export default LandingContent;
