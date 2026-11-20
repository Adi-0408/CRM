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
    headline: 'The unified operating system for modern enterprise teams',
    subheadline:
      'Unify your leads, quotations, project workflows, attendance with dynamic geofencing, payroll, invoicing, and support desk inside an isolated, custom-branded workspace.',
    primaryCtaText: 'Send an inquiry',
    secondaryCtaText: 'Sign in to workspace',
  },
  features: {
    sectionBadge: 'Built-in Capabilities',
    sectionTitle: 'Everything your organization needs to execute',
    sectionSubtitle:
      'Engineered as a cohesive ecosystem — eliminating scattered SaaS subscriptions and disconnected databases.',
    multiTenantBannerTitle: 'Dedicated Workspaces with Custom Branding & Branch Isolation',
    multiTenantBannerSubtitle:
      'Every company tenant operates inside a strictly isolated boundary with custom logos, brand color themes, branch coordinates, and company-specific administrator logins.',
  },
  howItWorks: {
    step1Title: 'Send an inquiry',
    step1Desc:
      'Submit the inquiry form below with your company name, team size, and operational requirements.',
    step2Title: 'We contact you',
    step2Desc:
      'Our platform engineering team reviews your needs, schedules an alignment call, and configures your tenant instance.',
    step3Title: 'Get your workspace',
    step3Desc:
      'Receive your dedicated company portal URL, initial administrator credentials, and set up your branch geofences and staff.',
  },
  contact: {
    email: 'contact@prismcrm.com',
    phone: '+91 98765 43210',
    address: 'PrismCRM Headquarters, India',
  },
};

export const LandingContent = createFirestoreModel<ILandingContent>('landing_settings');
export default LandingContent;
