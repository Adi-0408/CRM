import { connectToDatabase } from '@/lib/db';
import Company from '@/models/Company';
import Employee from '@/models/Employee';
import User from '@/models/User';
import Lead from '@/models/Lead';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Ticket from '@/models/Ticket';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';
import Payroll from '@/models/Payroll';
import Branch from '@/models/Branch';
import Invoice from '@/models/Invoice';
import Quotation from '@/models/Quotation';
import Notification from '@/models/Notification';
import Standup from '@/models/Standup';
import { DEFAULT_COMPANY_ID } from '@/lib/apiAuth';
import { invalidatePayrollCache } from '@/lib/payrollEngine';

export const DEFAULT_COMPANY = {
  _id: DEFAULT_COMPANY_ID,
  id: DEFAULT_COMPANY_ID,
  name: 'Unique Digital Services',
  slug: 'unique-digital-services',
  status: 'active' as const,
  brand_name: 'Unique Digital Services',
  logo_url: '',
  favicon_url: '',
  primary_color: '#635BFF',
  accent_color: '#00D4B2',
  currency_code: 'INR',
  currency_symbol: '₹',
  timezone: 'Asia/Kolkata',
  support_email: 'support@uniquedigital.com',
  phone: '+91 98200 12345',
  address: 'Pearl Enclave, MSEB Rd, Vishrambag, Sangli, Maharashtra 416415',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

/**
 * Seeds or reseeds tenant data with strict tenant isolation.
 * If targetCompanyId is specified, wipes and seeds ONLY records for that company.
 * If isPlatformWipe is true, also initializes/refreshes the default company and Platform Super Admin.
 */
export async function wipeAndSeedDatabase(targetCompanyId: string = DEFAULT_COMPANY_ID, isPlatformWipe: boolean = true) {
  await connectToDatabase();

  const filter = { company_id: targetCompanyId };

  // 1. Wipe collections scoped strictly to targetCompanyId
  await Promise.all([
    Employee.deleteMany(filter),
    User.deleteMany(filter),
    Lead.deleteMany(filter),
    Project.deleteMany(filter),
    Task.deleteMany(filter),
    Ticket.deleteMany(filter),
    Attendance.deleteMany(filter),
    Leave.deleteMany(filter),
    Payroll.deleteMany(filter),
    Branch.deleteMany(filter),
    Invoice.deleteMany(filter),
    Quotation.deleteMany(filter),
    Notification.deleteMany(filter),
    Standup.deleteMany(filter),
  ]);

  if (isPlatformWipe) {
    // Delete any previous global superadmin before recreating
    await User.deleteMany({ email: 'superadmin@crm.com' });
    await Employee.deleteMany({ email: 'superadmin@crm.com' });
  }

  try {
    invalidatePayrollCache();
  } catch (e) {
    // Non-fatal if cache already clear
  }

  // 2. Ensure default Company exists
  const existingCompany = await Company.findById(targetCompanyId);
  if (!existingCompany) {
    await Company.create({
      ...DEFAULT_COMPANY,
      _id: targetCompanyId,
      id: targetCompanyId,
    });
  }

  // 3. Seed Platform Super Admin Account (Global, company_id = null)
  if (isPlatformWipe) {
    await User.create({
      _id: 'user_superadmin',
      id: 'user_superadmin',
      name: 'Platform Super Admin',
      email: 'superadmin@crm.com',
      password: 'pass123',
      role: 'platform_super_admin',
      department: 'Platform Engineering',
      company_id: null,
      must_change_password: false,
      status: 'active',
      phone: '+91 99999 00000',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await Employee.create({
      _id: 'emp_superadmin',
      id: 'emp_superadmin',
      name: 'Platform Super Admin',
      email: 'superadmin@crm.com',
      password: 'pass123',
      role: 'platform_super_admin',
      department: 'Platform Engineering',
      company_id: null,
      must_change_password: false,
      status: 'active',
      salary: 150000,
      baseSalary: 150000,
      phone: '+91 99999 00000',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      joinDate: '2026-01-01T00:00:00.000Z',
    });
  }

  // 4. Seed single central HQ Branch with GPS geofence
  await Branch.create({
    _id: `branch_sangli_hq_${targetCompanyId}`,
    id: `branch_sangli_hq_${targetCompanyId}`,
    company_id: targetCompanyId,
    name: 'Sangli Central HQ',
    city: 'Sangli',
    address: 'IT Park, Miraj Road, Sangli - 416416',
    manager: 'Aditya Varma',
    email: 'hq@crm.com',
    phone: '+91 98200 12345',
    activeEmployees: '9 active staff',
    status: 'Head Office',
    isHeadOffice: true,
    lat: 16.84582,
    lng: 74.60055,
    radius_meters: 250,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });

  // 5. Seed exactly 9 employees - 1 for each role
  const seedEmployeeList = [
    {
      _id: `emp_admin_${targetCompanyId}`,
      id: `emp_admin_${targetCompanyId}`,
      company_id: targetCompanyId,
      name: 'Aditya Varma',
      email: 'admin@crm.com',
      password: 'pass123',
      role: 'admin_manager',
      department: 'Executive Management',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      salary: 100000,
      baseSalary: 100000,
      status: 'active' as const,
      phone: '+91 98200 12345',
      must_change_password: false,
      joinDate: '2026-01-15T00:00:00.000Z',
    },
    {
      _id: `emp_lead_${targetCompanyId}`,
      id: `emp_lead_${targetCompanyId}`,
      company_id: targetCompanyId,
      name: 'Vikram Malhotra',
      email: 'lead@crm.com',
      password: 'pass123',
      role: 'team_lead',
      department: 'Project Management',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      salary: 75000,
      baseSalary: 75000,
      status: 'active' as const,
      phone: '+91 98200 12346',
      must_change_password: false,
      joinDate: '2026-02-01T00:00:00.000Z',
    },
    {
      _id: `emp_hr_${targetCompanyId}`,
      id: `emp_hr_${targetCompanyId}`,
      company_id: targetCompanyId,
      name: 'Pooja Sharma',
      email: 'hr@crm.com',
      password: 'pass123',
      role: 'hr',
      department: 'Human Resources',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      salary: 55000,
      baseSalary: 55000,
      status: 'active' as const,
      phone: '+91 98200 12347',
      must_change_password: false,
      joinDate: '2026-03-01T00:00:00.000Z',
    },
    {
      _id: `emp_accounts_${targetCompanyId}`,
      id: `emp_accounts_${targetCompanyId}`,
      company_id: targetCompanyId,
      name: 'Rohan Mehta',
      email: 'accounts@crm.com',
      password: 'pass123',
      role: 'accounts',
      department: 'Finance & Accounts',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      salary: 50000,
      baseSalary: 50000,
      status: 'active' as const,
      phone: '+91 98200 12348',
      must_change_password: false,
      joinDate: '2026-03-15T00:00:00.000Z',
    },
    {
      _id: `emp_sales_${targetCompanyId}`,
      id: `emp_sales_${targetCompanyId}`,
      company_id: targetCompanyId,
      name: 'Siddharth Rao',
      email: 'sales@crm.com',
      password: 'pass123',
      role: 'sales',
      department: 'Sales & Marketing',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      salary: 45000,
      baseSalary: 45000,
      status: 'active' as const,
      phone: '+91 98200 12349',
      must_change_password: false,
      joinDate: '2026-04-01T00:00:00.000Z',
    },
    {
      _id: `emp_web_${targetCompanyId}`,
      id: `emp_web_${targetCompanyId}`,
      company_id: targetCompanyId,
      name: 'Aarav Patel',
      email: 'web@crm.com',
      password: 'pass123',
      role: 'web_developer',
      department: 'Web Engineering',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
      salary: 60000,
      baseSalary: 60000,
      status: 'active' as const,
      phone: '+91 98200 12350',
      must_change_password: false,
      joinDate: '2026-05-01T00:00:00.000Z',
    },
    {
      _id: `emp_android_${targetCompanyId}`,
      id: `emp_android_${targetCompanyId}`,
      company_id: targetCompanyId,
      name: 'Neha Kulkarni',
      email: 'android@crm.com',
      password: 'pass123',
      role: 'android_developer',
      department: 'Mobile Engineering',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
      salary: 60000,
      baseSalary: 60000,
      status: 'active' as const,
      phone: '+91 98200 12351',
      must_change_password: false,
      joinDate: '2026-05-15T00:00:00.000Z',
    },
    {
      _id: `emp_support_${targetCompanyId}`,
      id: `emp_support_${targetCompanyId}`,
      company_id: targetCompanyId,
      name: 'Kunal Joshi',
      email: 'support@crm.com',
      password: 'pass123',
      role: 'tech_support',
      department: 'Customer Support',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
      salary: 35000,
      baseSalary: 35000,
      status: 'active' as const,
      phone: '+91 98200 12352',
      must_change_password: false,
      joinDate: '2026-06-01T00:00:00.000Z',
    },
    {
      _id: `emp_intern_${targetCompanyId}`,
      id: `emp_intern_${targetCompanyId}`,
      company_id: targetCompanyId,
      name: 'Ananya Sen',
      email: 'intern@crm.com',
      password: 'pass123',
      role: 'intern',
      department: 'Training & Development',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      salary: 15000,
      baseSalary: 15000,
      status: 'active' as const,
      phone: '+91 98200 12353',
      must_change_password: false,
      joinDate: '2026-11-15T00:00:00.000Z',
    },
  ];

  for (const empData of seedEmployeeList) {
    await Employee.create(empData);
    await User.create({
      _id: empData._id,
      id: empData._id,
      company_id: targetCompanyId,
      name: empData.name,
      email: empData.email,
      role: empData.role,
      department: empData.department,
      avatar: empData.avatar,
      salary: empData.salary,
      baseSalary: empData.baseSalary,
      status: 'active',
      must_change_password: false,
      createdAt: empData.joinDate,
    });
  }

  // Also support admin@gmail.com login alias for default company
  if (targetCompanyId === DEFAULT_COMPANY_ID) {
    await User.create({
      _id: `emp_admin_alias_${targetCompanyId}`,
      id: `emp_admin_alias_${targetCompanyId}`,
      company_id: targetCompanyId,
      name: 'Aditya Varma',
      email: 'admin@gmail.com',
      role: 'admin_manager',
      department: 'Executive Management',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      salary: 100000,
      baseSalary: 100000,
      status: 'active',
      must_change_password: false,
      createdAt: '2026-01-15T00:00:00.000Z',
    });
  }

  const leadEmpId = `emp_lead_${targetCompanyId}`;
  const webEmpId = `emp_web_${targetCompanyId}`;
  const androidEmpId = `emp_android_${targetCompanyId}`;
  const supportEmpId = `emp_support_${targetCompanyId}`;
  const salesEmpId = `emp_sales_${targetCompanyId}`;
  const internEmpId = `emp_intern_${targetCompanyId}`;
  const hrEmpId = `emp_hr_${targetCompanyId}`;

  // 6. Seed 2 Focused Projects
  const project1 = await Project.create({
    _id: `proj_enterprise_web_${targetCompanyId}`,
    id: `proj_enterprise_web_${targetCompanyId}`,
    company_id: targetCompanyId,
    title: 'Enterprise Web Portal',
    client: 'Phoenix Logistics',
    description: 'Modern B2B supply chain dashboard with real-time tracking.',
    budget: 350000,
    status: 'in_progress',
    progress: 65,
    priority: 'high',
    deadline: new Date('2026-12-15T00:00:00.000Z'),
    projectLead: leadEmpId,
    teamMembers: [leadEmpId, webEmpId],
    clientRequirements:
      'Client requested real-time GPS fleet tracking, driver dispatch console, and automated Excel audit reports for monthly GST filing.',
    salesRep: salesEmpId,
    leadId: `lead_phoenix_${targetCompanyId}`,
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
  });

  const project2 = await Project.create({
    _id: `proj_mobile_crm_${targetCompanyId}`,
    id: `proj_mobile_crm_${targetCompanyId}`,
    company_id: targetCompanyId,
    title: 'Mobile CRM App v2',
    client: 'Nexus Health Labs',
    description: 'Cross-platform mobile CRM app for healthcare reps.',
    budget: 280000,
    status: 'on_hold',
    progress: 25,
    priority: 'medium',
    deadline: new Date('2026-12-30T00:00:00.000Z'),
    projectLead: leadEmpId,
    leadId: `lead_nexus_${targetCompanyId}`,
    salesRep: salesEmpId,
    clientRequirements:
      'Client requires offline visit logging, biometric check-in for clinic visits, and drug sample inventory barcode scanning.',
    teamMembers: [leadEmpId, androidEmpId, internEmpId],
    createdAt: new Date('2026-10-15T00:00:00.000Z'),
  });

  // 7. Seed 4 Tasks
  await Task.create({
    _id: `task_auth_redesign_${targetCompanyId}`,
    id: `task_auth_redesign_${targetCompanyId}`,
    company_id: targetCompanyId,
    title: 'Redesign Authentication & RBAC Gateways',
    project: project1._id,
    assignedTo: webEmpId,
    priority: 'high',
    status: 'in_progress',
    dueDate: new Date('2026-11-20T00:00:00.000Z'),
    description: 'Implement glassmorphism navigation & fixed header styling.',
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
  });

  await Task.create({
    _id: `task_offline_sync_${targetCompanyId}`,
    id: `task_offline_sync_${targetCompanyId}`,
    company_id: targetCompanyId,
    title: 'Implement Room DB Offline Cache in Compose',
    project: project2._id,
    assignedTo: androidEmpId,
    priority: 'urgent',
    status: 'on_hold',
    dueDate: new Date('2026-11-22T00:00:00.000Z'),
    description: 'Cache patient visitation logs when device is offline.',
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
  });

  await Task.create({
    _id: `task_sla_monitor_${targetCompanyId}`,
    id: `task_sla_monitor_${targetCompanyId}`,
    company_id: targetCompanyId,
    title: 'Resolve Customer SLA Warnings',
    project: project1._id,
    assignedTo: supportEmpId,
    priority: 'medium',
    status: 'new',
    dueDate: new Date('2026-11-18T00:00:00.000Z'),
    description: 'Audit ticket response times for Gold-tier accounts.',
    createdAt: new Date('2026-11-02T00:00:00.000Z'),
  });

  await Task.create({
    _id: `task_onboarding_docs_${targetCompanyId}`,
    id: `task_onboarding_docs_${targetCompanyId}`,
    company_id: targetCompanyId,
    title: 'Complete Onboarding & Environment Setup',
    project: project2._id,
    assignedTo: internEmpId,
    priority: 'low',
    status: 'completed',
    completedAt: new Date('2026-11-16T10:00:00.000Z'),
    dueDate: new Date('2026-11-17T00:00:00.000Z'),
    description: 'Clone repository, build Android APK, and complete codebase overview.',
    createdAt: new Date('2026-11-15T00:00:00.000Z'),
  });

  // 8. Seed 2 Leads
  await Lead.create({
    _id: `lead_phoenix_${targetCompanyId}`,
    id: `lead_phoenix_${targetCompanyId}`,
    company_id: targetCompanyId,
    name: 'Rajesh Singhania',
    company: 'Phoenix Logistics',
    email: 'rajesh@phoenixlogistics.com',
    phone: '+91 98211 44556',
    value: 350000,
    status: 'won',
    source: 'Website',
    assignedTo: salesEmpId,
    notes: 'Approved proposal for supply chain portal.',
    projectId: project1._id,
    projectTitle: 'Enterprise Web Portal',
    createdAt: new Date('2026-10-10T00:00:00.000Z'),
  });

  await Lead.create({
    _id: `lead_nexus_${targetCompanyId}`,
    id: `lead_nexus_${targetCompanyId}`,
    company_id: targetCompanyId,
    name: 'Dr. Sunita Rao',
    company: 'Nexus Health Labs',
    email: 'sunita@nexushealth.org',
    phone: '+91 98222 77889',
    value: 280000,
    status: 'proposal',
    source: 'Referral',
    assignedTo: salesEmpId,
    notes: 'Discussed requirements for mobile field representative tracking.',
    quotationId: `quot_qt_101_${targetCompanyId}`,
    quotationNumber: 'QT-2026-101',
    projectId: project2._id,
    projectTitle: 'Mobile CRM App v2',
    createdAt: new Date('2026-10-25T00:00:00.000Z'),
  });

  // 9. Seed 1 Quotation
  await Quotation.create({
    _id: `quot_qt_101_${targetCompanyId}`,
    id: `quot_qt_101_${targetCompanyId}`,
    company_id: targetCompanyId,
    quotationNumber: 'QT-2026-101',
    leadId: `lead_nexus_${targetCompanyId}`,
    clientCompany: 'Nexus Health Labs',
    clientName: 'Dr. Sunita Rao',
    clientEmail: 'sunita@nexushealth.org',
    clientPhone: '+91 98222 77889',
    items: [
      {
        id: 'item_1',
        description: 'Custom Mobile CRM App MVP',
        quantity: 1,
        rate: 250000,
        amount: 250000,
      },
      {
        id: 'item_2',
        description: 'Annual Cloud Maintenance & Support',
        quantity: 1,
        rate: 30000,
        amount: 30000,
      },
    ],
    subtotal: 280000,
    discountPercent: 0,
    discountAmount: 0,
    taxPercent: 18,
    taxAmount: 50400,
    totalAmount: 330400,
    status: 'sent',
    issueDate: new Date('2026-11-01T00:00:00.000Z'),
    validUntil: new Date('2026-11-30T00:00:00.000Z'),
    notes: 'Includes 90 days hypercare support following store deployment.',
    createdBy: 'Siddharth Rao',
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
  });

  // 10. Seed 1 Invoice (Paid)
  await Invoice.create({
    _id: `inv_2026_001_${targetCompanyId}`,
    id: `inv_2026_001_${targetCompanyId}`,
    company_id: targetCompanyId,
    invoiceNumber: 'INV-2026-001',
    projectId: project1._id,
    projectTitle: 'Enterprise Web Portal',
    leadId: `lead_phoenix_${targetCompanyId}`,
    clientName: 'Rajesh Singhania',
    clientEmail: 'rajesh@phoenixlogistics.com',
    clientCompany: 'Phoenix Logistics',
    items: [
      {
        id: 'inv_item_1',
        description: 'Phase 1 Milestone - Architecture, Auth & Prototype',
        quantity: 1,
        rate: 150000,
        amount: 150000,
      },
    ],
    subtotal: 150000,
    taxPercent: 18,
    taxAmount: 27000,
    totalAmount: 177000,
    status: 'paid',
    issueDate: new Date('2026-11-01T00:00:00.000Z'),
    dueDate: new Date('2026-11-15T00:00:00.000Z'),
    paidAt: new Date('2026-11-02T14:30:00.000Z'),
    paymentMethod: 'Bank Transfer (NEFT)',
    notes: 'Received with thanks.',
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
  });

  // 11. Seed 2 Support Tickets
  await Ticket.create({
    _id: `tick_2026_081_${targetCompanyId}`,
    id: `tick_2026_081_${targetCompanyId}`,
    company_id: targetCompanyId,
    ticketNumber: 'TCK-2026-081',
    title: 'API Rate limit exceeded on batch sync',
    customerName: 'Rajesh Singhania',
    customerEmail: 'rajesh@phoenixlogistics.com',
    priority: 'high',
    status: 'in_progress',
    category: 'API & Integration',
    assignedTo: supportEmpId,
    description: 'Sync webhook is getting HTTP 429 when processing more than 100 shipment manifests.',
    createdAt: new Date('2026-11-02T08:30:00.000Z'),
  });

  await Ticket.create({
    _id: `tick_2026_082_${targetCompanyId}`,
    id: `tick_2026_082_${targetCompanyId}`,
    company_id: targetCompanyId,
    ticketNumber: 'TCK-2026-082',
    title: 'PostgreSQL connection pool exhausted on reports query',
    customerName: 'Dr. Sunita Rao',
    customerEmail: 'sunita@nexushealth.org',
    priority: 'urgent',
    status: 'open',
    category: 'Server & Performance',
    assignedTo: supportEmpId,
    description: 'Concurrent export queries causing connection pool starvation and 504 Gateway Timeouts.',
    createdAt: new Date('2026-11-02T11:15:00.000Z'),
  });

  // 12. Seed 1 Approved Leave
  await Leave.create({
    _id: `leave_2026_01_${targetCompanyId}`,
    id: `leave_2026_01_${targetCompanyId}`,
    company_id: targetCompanyId,
    employee: webEmpId,
    type: 'casual',
    startDate: new Date('2026-11-25T00:00:00.000Z'),
    endDate: new Date('2026-11-26T00:00:00.000Z'),
    days: 2,
    reason: 'Attending family wedding.',
    status: 'approved',
    approvedBy: hrEmpId,
    remarks: 'Approved. Ensure sprint tasks are handed over.',
    createdAt: new Date('2026-11-02T09:00:00.000Z'),
  });

  // 13. Seed Attendance Records
  const attendanceLogs = [
    { empId: `emp_admin_${targetCompanyId}`, inHour: '09:15', outHour: '18:30', mins: 555 },
    { empId: `emp_lead_${targetCompanyId}`, inHour: '09:20', outHour: '18:35', mins: 555 },
    { empId: `emp_web_${targetCompanyId}`, inHour: '09:25', outHour: '18:40', mins: 555 },
    { empId: `emp_android_${targetCompanyId}`, inHour: '09:18', outHour: '18:32', mins: 554 },
  ];

  for (const log of attendanceLogs) {
    await Attendance.create({
      _id: `att_${log.empId}_20261102`,
      id: `att_${log.empId}_20261102`,
      company_id: targetCompanyId,
      employee: log.empId,
      date: '2026-11-02',
      checkIn: new Date(`2026-11-02T${log.inHour}:00.000Z`),
      checkOut: new Date(`2026-11-02T${log.outHour}:00.000Z`),
      sessions: [
        {
          _id: `sess_${log.empId}_1`,
          checkIn: new Date(`2026-11-02T${log.inHour}:00.000Z`),
          checkOut: new Date(`2026-11-02T${log.outHour}:00.000Z`),
          durationMinutes: log.mins,
        },
      ],
      totalMinutes: log.mins,
      effectiveMinutes: log.mins,
      isLate: false,
      lateByMinutes: 0,
      status: 'full_day',
      createdAt: new Date(`2026-11-02T${log.inHour}:00.000Z`),
    });
  }

  // 14. Seed November 2026 Payroll for all 9 Employees
  for (const emp of seedEmployeeList) {
    const isIntern = emp.role === 'intern';
    const isProrated = isIntern;
    const baseSal = emp.baseSalary;
    const netSal = isProrated ? 8000 : baseSal;

    await Payroll.create({
      _id: `pay_${emp._id}_2026_11`,
      id: `pay_${emp._id}_2026_11`,
      company_id: targetCompanyId,
      employeeId: emp._id,
      employee: emp._id,
      month: '2026-11',
      baseSalary: netSal,
      approvedLeaves: 0,
      unapprovedLeaves: 0,
      halfDays: 0,
      totalDeductions: 0,
      netSalary: netSal,
      status: 'Pending',
      distributionDate: '2026-12-01',
      distributionSchedule: '1st of the month',
      isProrated,
      fullBaseSalary: isProrated ? baseSal : undefined,
      proratedDays: isProrated ? 16 : undefined,
      totalDaysInMonth: isProrated ? 30 : undefined,
      joinDate: emp.joinDate,
      notes: isProrated
        ? 'Prorated salary for mid-month joining (Nov 15). Disbursal on 1st Dec.'
        : 'Regular monthly salary. Disbursal on 1st Dec.',
      createdAt: new Date('2026-11-01T00:00:00.000Z'),
    });
  }

  // 15. Seed Sample In-App Notifications
  await Notification.create({
    company_id: targetCompanyId,
    userId: 'all',
    title: 'Project On Hold: Mobile CRM App v2',
    message: 'Nexus Health Labs CRM app has been put on hold pending client API integration specs.',
    type: 'project_status',
    linkTab: 'projects',
    isRead: false,
    createdAt: new Date('2026-11-03T10:00:00.000Z'),
  });

  await Notification.create({
    company_id: targetCompanyId,
    userId: 'all',
    title: 'Deal Won: Phoenix Logistics',
    message: 'Aditya Patil closed Enterprise Web Portal deal worth ₹3,50,000!',
    type: 'lead_won',
    linkTab: 'leads',
    isRead: false,
    createdAt: new Date('2026-11-03T09:30:00.000Z'),
  });

  // 16. Seed Daily EOD Standups
  await Standup.create({
    company_id: targetCompanyId,
    employeeId: webEmpId,
    employeeName: 'Aarav Patel',
    employeeEmail: 'web@crm.com',
    employeeRole: 'Web Developer',
    employeeAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    date: '2026-11-03',
    completedToday: '• Built glassmorphic navigation header\n• Integrated real-time notification drawer with unread badges',
    plannedTomorrow: '• Implement Quotation PDF direct export\n• Unit test leave request approvals',
    hasBlockers: false,
    blockers: 'None',
    createdAt: new Date('2026-11-03T16:30:00.000Z'),
  });

  return {
    success: true,
    company_id: targetCompanyId,
    message: `Database cleanly wiped and seeded for tenant '${targetCompanyId}'.`,
    counts: {
      companies: 1,
      branches: 1,
      employees: 9,
      users: targetCompanyId === DEFAULT_COMPANY_ID ? 10 : 9,
      projects: 2,
      tasks: 4,
      leads: 2,
      quotations: 1,
      invoices: 1,
      tickets: 2,
      leaves: 1,
      attendance: 4,
      payroll: 9,
      notifications: 2,
      standups: 1,
    },
  };
}

export const seedDatabase = wipeAndSeedDatabase;
