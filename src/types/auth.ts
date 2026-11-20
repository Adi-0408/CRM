export type UserRole =
  | 'platform_super_admin'
  | 'company_admin'
  | 'admin_manager'
  | 'team_lead'
  | 'hr'
  | 'accounts'
  | 'sales'
  | 'web_developer'
  | 'android_developer'
  | 'tech_support'
  | 'intern';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
  phone?: string;
  salary?: number;
  baseSalary?: number;
  company_id?: string | null;
  must_change_password?: boolean;
}

export interface RoleConfig {
  role: UserRole;
  label: string;
  shortLabel: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  sidebarTabs: string[];
  biNavTabs: string[];
  allowedViews: string[];
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  platform_super_admin: {
    role: 'platform_super_admin',
    label: 'Platform Super Admin',
    shortLabel: 'Super Admin',
    description: 'Global SaaS platform owner, tenant management & cross-organization oversight',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900',
    badgeBorder: 'border-purple-300',
    sidebarTabs: [
      'organizations',
      'inquiries',
      'landing_cms',
    ],
    biNavTabs: [
      'organizations',
      'inquiries',
      'landing_cms',
    ],
    allowedViews: [
      'super_admin',
      'organizations',
      'inquiries',
      'landing_cms',
    ],
  },

  company_admin: {
    role: 'company_admin',
    label: 'Company Admin',
    shortLabel: 'Admin',
    description: 'Company owner, executive management, team delegation, organization oversight & full tenant control',
    badgeBg: 'bg-[#F0EEFF]',
    badgeText: 'text-[#635BFF]',
    badgeBorder: 'border-purple-200',
    sidebarTabs: [
      'super_admin',
      'dashboard',
      'tasks',
      'leads',
      'projects',
      'attendance',
      'payroll',
      'leave',
      'support',
      'employees',
      'management',
    ],
    biNavTabs: [
      'super_admin',
      'overview',
      'tasks',
      'leads',
      'projects',
      'attendance',
      'support',
      'payroll',
      'employees',
      'branches',
    ],
    allowedViews: [
      'super_admin',
      'overview',
      'dashboard',
      'tasks',
      'leads',
      'projects',
      'attendance',
      'branches',
      'support',
      'payroll',
      'leave',
      'employees',
      'management',
    ],
  },

  admin_manager: {
    role: 'admin_manager',
    label: 'Admin (Manager)',
    shortLabel: 'Admin',
    description: 'Executive management, team delegation, organization oversight & full system control',
    badgeBg: 'bg-[#F0EEFF]',
    badgeText: 'text-[#635BFF]',
    badgeBorder: 'border-purple-200',
    sidebarTabs: [
      'super_admin',
      'dashboard',
      'tasks',
      'leads',
      'projects',
      'attendance',
      'payroll',
      'leave',
      'support',
      'employees',
      'management',
    ],
    biNavTabs: [
      'super_admin',
      'overview',
      'tasks',
      'leads',
      'projects',
      'attendance',
      'support',
      'payroll',
      'employees',
      'branches',
    ],
    allowedViews: [
      'super_admin',
      'overview',
      'dashboard',
      'tasks',
      'leads',
      'projects',
      'attendance',
      'branches',
      'support',
      'payroll',
      'leave',
      'employees',
      'management',
    ],
  },

  team_lead: {
    role: 'team_lead',
    label: 'Team Lead / PM',
    shortLabel: 'Team Lead',
    description: 'Project deliverable oversight, task delegation to developers & milestone tracking',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    sidebarTabs: ['dashboard', 'projects', 'tasks', 'support', 'attendance', 'leave', 'payroll'],
    biNavTabs: ['overview', 'projects', 'tasks', 'support', 'attendance', 'payroll'],
    allowedViews: ['overview', 'dashboard', 'projects', 'tasks', 'support', 'attendance', 'leave', 'payroll'],
  },

  hr: {
    role: 'hr',
    label: 'HR Manager',
    shortLabel: 'HR',
    description: 'Employee onboarding, credential management, staff attendance & leave administration',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    sidebarTabs: ['dashboard', 'employees', 'support', 'attendance', 'leave', 'tasks'],
    biNavTabs: ['overview', 'employees', 'support', 'attendance', 'tasks'],
    allowedViews: ['overview', 'dashboard', 'employees', 'support', 'attendance', 'leave', 'tasks'],
  },

  accounts: {
    role: 'accounts',
    label: 'Accounts & Finance',
    shortLabel: 'Accounts',
    description: 'Payroll calculation, salary adjustments, monthly disbursals & financial accounting',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    sidebarTabs: ['dashboard', 'payroll', 'support', 'attendance', 'leave'],
    biNavTabs: ['overview', 'payroll', 'support', 'attendance'],
    allowedViews: ['overview', 'dashboard', 'payroll', 'support', 'attendance', 'leave'],
  },

  sales: {
    role: 'sales',
    label: 'Sales Representative',
    shortLabel: 'Sales',
    description: 'Lead generation, sales pipeline conversion, client proposals & personal workspace',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    sidebarTabs: ['dashboard', 'leads', 'projects', 'tasks', 'support', 'attendance', 'leave', 'payroll'],
    biNavTabs: ['overview', 'leads', 'projects', 'tasks', 'support', 'attendance', 'payroll'],
    allowedViews: ['overview', 'dashboard', 'leads', 'projects', 'tasks', 'support', 'attendance', 'leave', 'payroll'],
  },

  web_developer: {
    role: 'web_developer',
    label: 'Web Developer',
    shortLabel: 'Web Dev',
    description: 'Web applications, frontend/backend deliverables, code reviews & engineering tasks',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-200',
    sidebarTabs: ['dashboard', 'projects', 'tasks', 'support', 'attendance', 'leave', 'payroll'],
    biNavTabs: ['overview', 'projects', 'tasks', 'support', 'attendance', 'payroll'],
    allowedViews: ['overview', 'dashboard', 'projects', 'tasks', 'support', 'attendance', 'leave', 'payroll'],
  },

  android_developer: {
    role: 'android_developer',
    label: 'Android Developer',
    shortLabel: 'Android Dev',
    description: 'Mobile applications, APK releases, Android SDK integrations & testing',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-800',
    badgeBorder: 'border-teal-200',
    sidebarTabs: ['dashboard', 'projects', 'tasks', 'support', 'attendance', 'leave', 'payroll'],
    biNavTabs: ['overview', 'projects', 'tasks', 'support', 'attendance', 'payroll'],
    allowedViews: ['overview', 'dashboard', 'projects', 'tasks', 'support', 'attendance', 'leave', 'payroll'],
  },

  tech_support: {
    role: 'tech_support',
    label: 'Tech Support Engineer',
    shortLabel: 'Support',
    description: 'Customer ticket resolution, technical troubleshooting, incident SLAs & support desk',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
    sidebarTabs: ['dashboard', 'support', 'tasks', 'attendance', 'leave', 'payroll'],
    biNavTabs: ['overview', 'support', 'tasks', 'attendance', 'payroll'],
    allowedViews: ['overview', 'dashboard', 'support', 'tasks', 'attendance', 'leave', 'payroll'],
  },

  intern: {
    role: 'intern',
    label: 'Intern (Training)',
    shortLabel: 'Intern',
    description: 'Training curriculum, practical assignments, review submissions & monthly stipend',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-800',
    badgeBorder: 'border-violet-200',
    sidebarTabs: ['dashboard', 'projects', 'tasks', 'support', 'attendance', 'leave', 'payroll'],
    biNavTabs: ['overview', 'projects', 'tasks', 'support', 'attendance', 'payroll'],
    allowedViews: ['overview', 'dashboard', 'projects', 'tasks', 'support', 'attendance', 'leave', 'payroll'],
  },
};

/**
 * Demo user credentials for all organizational roles
 */
export const DEMO_CREDENTIALS = [
  {
    role: 'platform_super_admin' as UserRole,
    roleTitle: 'Platform Super Admin',
    displayRole: 'superadmin',
    name: 'Platform Super Admin',
    email: 'superadmin@crm.com',
    password: 'pass123',
    baseSalary: 150000,
    department: 'Platform Engineering',
    icon: 'Shield',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    accentColor: '#7C3AED',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900',
    company_id: null,
  },
];
