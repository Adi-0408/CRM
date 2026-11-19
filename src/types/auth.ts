export type UserRole =
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
 * Demo user credentials for all 9 organizational roles
 */
export const DEMO_CREDENTIALS = [
  {
    role: 'admin_manager' as UserRole,
    roleTitle: 'Admin (Manager)',
    displayRole: 'admin',
    name: 'Aditya Varma',
    email: 'admin@crm.com',
    altEmail: 'admin@gmail.com',
    password: 'pass123',
    baseSalary: 100000,
    department: 'Executive Management',
    icon: 'Shield',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    accentColor: '#635BFF',
    badgeBg: 'bg-[#F0EEFF]',
    badgeText: 'text-[#635BFF]',
  },
  {
    role: 'team_lead' as UserRole,
    roleTitle: 'Team Lead / PM',
    displayRole: 'lead',
    name: 'Vikram Malhotra',
    email: 'lead@crm.com',
    password: 'pass123',
    baseSalary: 75000,
    department: 'Project Management',
    icon: 'Briefcase',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    accentColor: '#4F46E5',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
  },
  {
    role: 'hr' as UserRole,
    roleTitle: 'HR Manager',
    displayRole: 'hr',
    name: 'Pooja Sharma',
    email: 'hr@crm.com',
    password: 'pass123',
    baseSalary: 55000,
    department: 'Human Resources',
    icon: 'Users',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    accentColor: '#059669',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
  },
  {
    role: 'accounts' as UserRole,
    roleTitle: 'Accounts & Finance',
    displayRole: 'accounts',
    name: 'Rohan Mehta',
    email: 'accounts@crm.com',
    password: 'pass123',
    baseSalary: 50000,
    department: 'Finance & Accounts',
    icon: 'IndianRupee',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    accentColor: '#2563EB',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
  },
  {
    role: 'sales' as UserRole,
    roleTitle: 'Sales Representative',
    displayRole: 'sales',
    name: 'Siddharth Rao',
    email: 'sales@crm.com',
    password: 'pass123',
    baseSalary: 45000,
    department: 'Sales & Marketing',
    icon: 'Target',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    accentColor: '#D97706',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
  },
  {
    role: 'web_developer' as UserRole,
    roleTitle: 'Web Developer',
    displayRole: 'web',
    name: 'Aarav Patel',
    email: 'web@crm.com',
    password: 'pass123',
    baseSalary: 60000,
    department: 'Web Engineering',
    icon: 'Code',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    accentColor: '#0891B2',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-800',
  },
  {
    role: 'android_developer' as UserRole,
    roleTitle: 'Android Developer',
    displayRole: 'android',
    name: 'Neha Kulkarni',
    email: 'android@crm.com',
    password: 'pass123',
    baseSalary: 60000,
    department: 'Mobile Engineering',
    icon: 'Smartphone',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    accentColor: '#0D9488',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-800',
  },
  {
    role: 'tech_support' as UserRole,
    roleTitle: 'Tech Support Engineer',
    displayRole: 'support',
    name: 'Kunal Joshi',
    email: 'support@crm.com',
    password: 'pass123',
    baseSalary: 35000,
    department: 'Customer Support',
    icon: 'HelpCircle',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
    accentColor: '#4F46E5',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
  },
  {
    role: 'intern' as UserRole,
    roleTitle: 'Intern (Training)',
    displayRole: 'intern',
    name: 'Ananya Sen',
    email: 'intern@crm.com',
    password: 'pass123',
    baseSalary: 15000,
    department: 'Training & Development',
    icon: 'GraduationCap',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    accentColor: '#7C3AED',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-800',
  },
];
