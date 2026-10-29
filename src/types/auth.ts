export type UserRole =
  | 'admin_manager'
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
  admin_manager: {
    role: 'admin_manager',
    label: 'Admin (Manager)',
    shortLabel: 'Admin',
    description: 'Executive management, team delegation, organization oversight & full system control',
    badgeBg: 'bg-[#F0EEFF]',
    badgeText: 'text-[#635BFF]',
    badgeBorder: 'border-purple-200',
    sidebarTabs: [
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

  hr: {
    role: 'hr',
    label: 'HR Manager',
    shortLabel: 'HR',
    description: 'Employee onboarding, credential management, staff attendance & leave administration',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    sidebarTabs: ['dashboard', 'employees', 'attendance', 'leave', 'tasks'],
    biNavTabs: ['overview', 'employees', 'attendance', 'tasks'],
    allowedViews: ['overview', 'dashboard', 'employees', 'attendance', 'leave', 'tasks'],
  },

  accounts: {
    role: 'accounts',
    label: 'Accounts & Finance',
    shortLabel: 'Accounts',
    description: 'Payroll calculation, salary adjustments, monthly disbursals & financial accounting',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    sidebarTabs: ['dashboard', 'payroll', 'attendance', 'leave'],
    biNavTabs: ['overview', 'payroll', 'attendance'],
    allowedViews: ['overview', 'dashboard', 'payroll', 'attendance', 'leave'],
  },

  sales: {
    role: 'sales',
    label: 'Sales Representative',
    shortLabel: 'Sales',
    description: 'Lead generation, sales pipeline conversion, client proposals & personal workspace',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    sidebarTabs: ['dashboard', 'leads', 'tasks', 'attendance', 'leave', 'payroll'],
    biNavTabs: ['overview', 'leads', 'tasks', 'attendance', 'payroll'],
    allowedViews: ['overview', 'dashboard', 'leads', 'tasks', 'attendance', 'leave', 'payroll'],
  },

  web_developer: {
    role: 'web_developer',
    label: 'Web Developer',
    shortLabel: 'Web Dev',
    description: 'Web applications, frontend/backend deliverables, code reviews & engineering tasks',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-200',
    sidebarTabs: ['dashboard', 'projects', 'tasks', 'attendance', 'leave', 'payroll'],
    biNavTabs: ['overview', 'projects', 'tasks', 'attendance', 'payroll'],
    allowedViews: ['overview', 'dashboard', 'projects', 'tasks', 'attendance', 'leave', 'payroll'],
  },

  android_developer: {
    role: 'android_developer',
    label: 'Android Developer',
    shortLabel: 'Android Dev',
    description: 'Mobile applications, APK releases, Android SDK integrations & testing',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-800',
    badgeBorder: 'border-teal-200',
    sidebarTabs: ['dashboard', 'projects', 'tasks', 'attendance', 'leave', 'payroll'],
    biNavTabs: ['overview', 'projects', 'tasks', 'attendance', 'payroll'],
    allowedViews: ['overview', 'dashboard', 'projects', 'tasks', 'attendance', 'leave', 'payroll'],
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
    sidebarTabs: ['dashboard', 'tasks', 'support', 'attendance', 'leave', 'payroll'],
    biNavTabs: ['overview', 'tasks', 'support', 'attendance', 'payroll'],
    allowedViews: ['overview', 'dashboard', 'tasks', 'support', 'attendance', 'leave', 'payroll'],
  },
};

/**
 * The single default admin user account
 */
export const DEMO_CREDENTIALS = [
  {
    role: 'admin_manager' as UserRole,
    roleTitle: 'Super Admin',
    displayRole: 'admin',
    name: 'admin',
    email: 'admin@gmail.com',
    password: 'admin123',
    baseSalary: 100000,
    department: 'Executive Management',
    icon: 'Shield',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    accentColor: '#635BFF',
    badgeBg: 'bg-[#F0EEFF]',
    badgeText: 'text-[#635BFF]',
  },
];
