import { connectToDatabase } from '@/lib/db';
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
import { DEMO_CREDENTIALS } from '@/types/auth';
import { invalidatePayrollCache } from '@/lib/payrollEngine';

export async function wipeAndSeedDatabase() {
  await connectToDatabase();

  // 1. Wipe all collections completely
  await Promise.all([
    Employee.deleteMany({}),
    User.deleteMany({}),
    Lead.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Ticket.deleteMany({}),
    Attendance.deleteMany({}),
    Leave.deleteMany({}),
    Payroll.deleteMany({}),
    Branch.deleteMany({}),
    Invoice.deleteMany({}),
    Quotation.deleteMany({}),
  ]);

  try {
    invalidatePayrollCache();
  } catch (e) {
    // Non-fatal if cache already clear
  }

  // 2. Seed single central HQ Branch
  const centralBranch = await Branch.create({
    _id: 'branch_sangli_hq',
    id: 'branch_sangli_hq',
    name: 'Sangli Central HQ',
    city: 'Sangli',
    address: 'IT Park, Miraj Road, Sangli - 416416',
    manager: 'Aditya Varma',
    email: 'hq@crm.com',
    phone: '+91 98200 12345',
    activeEmployees: '9 active staff',
    status: 'Head Office',
    isHeadOffice: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });

  // 3. Seed exactly 9 employees - 1 for each role
  const seedEmployeeList = [
    {
      _id: 'emp_admin',
      id: 'emp_admin',
      name: 'Aditya Varma',
      email: 'admin@crm.com',
      password: 'pass123',
      role: 'admin_manager',
      department: 'Executive Management',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      salary: 100000,
      baseSalary: 100000,
      status: 'active',
      phone: '+91 98200 12345',
      joinDate: '2026-01-15T00:00:00.000Z',
    },
    {
      _id: 'emp_lead',
      id: 'emp_lead',
      name: 'Vikram Malhotra',
      email: 'lead@crm.com',
      password: 'pass123',
      role: 'team_lead',
      department: 'Project Management',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      salary: 75000,
      baseSalary: 75000,
      status: 'active',
      phone: '+91 98200 12346',
      joinDate: '2026-02-01T00:00:00.000Z',
    },
    {
      _id: 'emp_hr',
      id: 'emp_hr',
      name: 'Pooja Sharma',
      email: 'hr@crm.com',
      password: 'pass123',
      role: 'hr',
      department: 'Human Resources',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      salary: 55000,
      baseSalary: 55000,
      status: 'active',
      phone: '+91 98200 12347',
      joinDate: '2026-03-01T00:00:00.000Z',
    },
    {
      _id: 'emp_accounts',
      id: 'emp_accounts',
      name: 'Rohan Mehta',
      email: 'accounts@crm.com',
      password: 'pass123',
      role: 'accounts',
      department: 'Finance & Accounts',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      salary: 50000,
      baseSalary: 50000,
      status: 'active',
      phone: '+91 98200 12348',
      joinDate: '2026-03-15T00:00:00.000Z',
    },
    {
      _id: 'emp_sales',
      id: 'emp_sales',
      name: 'Siddharth Rao',
      email: 'sales@crm.com',
      password: 'pass123',
      role: 'sales',
      department: 'Sales & Marketing',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      salary: 45000,
      baseSalary: 45000,
      status: 'active',
      phone: '+91 98200 12349',
      joinDate: '2026-04-01T00:00:00.000Z',
    },
    {
      _id: 'emp_web',
      id: 'emp_web',
      name: 'Aarav Patel',
      email: 'web@crm.com',
      password: 'pass123',
      role: 'web_developer',
      department: 'Web Engineering',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
      salary: 60000,
      baseSalary: 60000,
      status: 'active',
      phone: '+91 98200 12350',
      joinDate: '2026-05-01T00:00:00.000Z',
    },
    {
      _id: 'emp_android',
      id: 'emp_android',
      name: 'Neha Kulkarni',
      email: 'android@crm.com',
      password: 'pass123',
      role: 'android_developer',
      department: 'Mobile Engineering',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
      salary: 60000,
      baseSalary: 60000,
      status: 'active',
      phone: '+91 98200 12351',
      joinDate: '2026-05-15T00:00:00.000Z',
    },
    {
      _id: 'emp_support',
      id: 'emp_support',
      name: 'Kunal Joshi',
      email: 'support@crm.com',
      password: 'pass123',
      role: 'tech_support',
      department: 'Customer Support',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
      salary: 35000,
      baseSalary: 35000,
      status: 'active',
      phone: '+91 98200 12352',
      joinDate: '2026-06-01T00:00:00.000Z',
    },
    {
      _id: 'emp_intern',
      id: 'emp_intern',
      name: 'Ananya Sen',
      email: 'intern@crm.com',
      password: 'pass123',
      role: 'intern',
      department: 'Training & Development',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      salary: 15000,
      baseSalary: 15000,
      status: 'active',
      phone: '+91 98200 12353',
      // Joined mid-month to demo payroll proration!
      joinDate: '2026-11-15T00:00:00.000Z',
    },
  ];

  for (const empData of seedEmployeeList) {
    await Employee.create(empData);
    await User.create({
      _id: empData._id,
      id: empData._id,
      name: empData.name,
      email: empData.email,
      role: empData.role,
      department: empData.department,
      avatar: empData.avatar,
      salary: empData.salary,
      baseSalary: empData.baseSalary,
      status: 'active',
      createdAt: empData.joinDate,
    });
  }

  // Also support admin@gmail.com login alias
  await User.create({
    _id: 'emp_admin_alias',
    id: 'emp_admin_alias',
    name: 'Aditya Varma',
    email: 'admin@gmail.com',
    role: 'admin_manager',
    department: 'Executive Management',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    salary: 100000,
    baseSalary: 100000,
    status: 'active',
    createdAt: '2026-01-15T00:00:00.000Z',
  });

  // 4. Seed 2 Focused Projects
  const project1 = await Project.create({
    _id: 'proj_enterprise_web',
    id: 'proj_enterprise_web',
    title: 'Enterprise Web Portal',
    client: 'Phoenix Logistics',
    description: 'Modern B2B supply chain dashboard with real-time tracking.',
    budget: 350000,
    status: 'in_progress',
    progress: 65,
    priority: 'high',
    deadline: new Date('2026-12-15T00:00:00.000Z'),
    projectLead: 'emp_lead',
    teamMembers: ['emp_lead', 'emp_web'],
    clientRequirements: 'Client requested real-time GPS fleet tracking, driver dispatch console, and automated Excel audit reports for monthly GST filing.',
    salesRep: 'emp_sales',
    leadId: 'lead_phoenix',
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
  });

  const project2 = await Project.create({
    _id: 'proj_mobile_crm',
    id: 'proj_mobile_crm',
    title: 'Mobile CRM App v2',
    client: 'Nexus Health Labs',
    description: 'Cross-platform mobile CRM app for healthcare reps.',
    budget: 280000,
    status: 'on_hold',
    progress: 25,
    priority: 'medium',
    deadline: new Date('2026-12-30T00:00:00.000Z'),
    projectLead: 'emp_lead',
    leadId: 'lead_nexus',
    salesRep: 'emp_sales',
    clientRequirements: 'Client requires offline visit logging, biometric check-in for clinic visits, and drug sample inventory barcode scanning.',
    teamMembers: ['emp_lead', 'emp_android', 'emp_intern'],
    createdAt: new Date('2026-10-15T00:00:00.000Z'),
  });

  // 5. Seed 4 Tasks (covering Web Dev, Android Dev, Support, Intern)
  await Task.create({
    _id: 'task_auth_redesign',
    id: 'task_auth_redesign',
    title: 'Redesign Authentication & RBAC Gateways',
    project: 'proj_enterprise_web',
    assignedTo: 'emp_web',
    priority: 'high',
    status: 'in_progress',
    dueDate: new Date('2026-11-20T00:00:00.000Z'),
    description: 'Implement glassmorphism navigation & fixed header styling.',
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
  });

  await Task.create({
    _id: 'task_offline_sync',
    id: 'task_offline_sync',
    title: 'Implement Room DB Offline Cache in Compose',
    project: 'proj_mobile_crm',
    assignedTo: 'emp_android',
    priority: 'urgent',
    status: 'on_hold',
    dueDate: new Date('2026-11-22T00:00:00.000Z'),
    description: 'Cache patient visitation logs when device is offline.',
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
  });

  await Task.create({
    _id: 'task_sla_monitor',
    id: 'task_sla_monitor',
    title: 'Resolve Customer SLA Warnings',
    project: 'proj_enterprise_web',
    assignedTo: 'emp_support',
    priority: 'medium',
    status: 'new',
    dueDate: new Date('2026-11-18T00:00:00.000Z'),
    description: 'Audit ticket response times for Gold-tier accounts.',
    createdAt: new Date('2026-11-02T00:00:00.000Z'),
  });

  await Task.create({
    _id: 'task_onboarding_docs',
    id: 'task_onboarding_docs',
    title: 'Complete Onboarding & Environment Setup',
    project: 'proj_mobile_crm',
    assignedTo: 'emp_intern',
    priority: 'low',
    status: 'completed',
    completedAt: new Date('2026-11-16T10:00:00.000Z'),
    dueDate: new Date('2026-11-17T00:00:00.000Z'),
    description: 'Clone repository, build Android APK, and complete codebase overview.',
    createdAt: new Date('2026-11-15T00:00:00.000Z'),
  });

  // 6. Seed 2 Leads (for Sales demo)
  await Lead.create({
    _id: 'lead_phoenix',
    id: 'lead_phoenix',
    name: 'Rajesh Singhania',
    company: 'Phoenix Logistics',
    email: 'rajesh@phoenixlogistics.com',
    phone: '+91 98211 44556',
    value: 350000,
    status: 'won',
    source: 'Website',
    assignedTo: 'emp_sales',
    notes: 'Approved proposal for supply chain portal.',
    projectId: 'proj_enterprise_web',
    projectTitle: 'Enterprise Web Portal',
    createdAt: new Date('2026-10-10T00:00:00.000Z'),
  });

  await Lead.create({
    _id: 'lead_nexus',
    id: 'lead_nexus',
    name: 'Dr. Sunita Rao',
    company: 'Nexus Health Labs',
    email: 'sunita@nexushealth.org',
    phone: '+91 98222 77889',
    value: 280000,
    status: 'proposal',
    source: 'Referral',
    assignedTo: 'emp_sales',
    notes: 'Discussed requirements for mobile field representative tracking.',
    quotationId: 'quot_qt_101',
    quotationNumber: 'QT-2026-101',
    projectId: 'proj_mobile_crm',
    projectTitle: 'Mobile CRM App v2',
    createdAt: new Date('2026-10-25T00:00:00.000Z'),
  });

  // 7. Seed 1 Quotation
  await Quotation.create({
    _id: 'quot_qt_101',
    id: 'quot_qt_101',
    quotationNumber: 'QT-2026-101',
    leadId: 'lead_nexus',
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

  // 8. Seed 1 Invoice (Paid)
  await Invoice.create({
    _id: 'inv_2026_001',
    id: 'inv_2026_001',
    invoiceNumber: 'INV-2026-001',
    projectId: 'proj_enterprise_web',
    projectTitle: 'Enterprise Web Portal',
    leadId: 'lead_phoenix',
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

  // 9. Seed 2 Support Tickets (for Tech Support demo)
  await Ticket.create({
    _id: 'tick_2026_081',
    id: 'tick_2026_081',
    ticketNumber: 'TCK-2026-081',
    title: 'API Rate limit exceeded on batch sync',
    customerName: 'Rajesh Singhania',
    customerEmail: 'rajesh@phoenixlogistics.com',
    priority: 'high',
    status: 'in_progress',
    category: 'API & Integration',
    assignedTo: 'emp_support',
    description: 'Sync webhook is getting HTTP 429 when processing more than 100 shipment manifests.',
    createdAt: new Date('2026-11-02T08:30:00.000Z'),
  });

  await Ticket.create({
    _id: 'tick_2026_082',
    id: 'tick_2026_082',
    ticketNumber: 'TCK-2026-082',
    title: 'PostgreSQL connection pool exhausted on reports query',
    customerName: 'Dr. Sunita Rao',
    customerEmail: 'sunita@nexushealth.org',
    priority: 'urgent',
    status: 'open',
    category: 'Server & Performance',
    assignedTo: 'emp_support',
    description: 'Concurrent export queries causing connection pool starvation and 504 Gateway Timeouts.',
    createdAt: new Date('2026-11-02T11:15:00.000Z'),
  });

  // 10. Seed 1 Approved Leave (for HR demo)
  await Leave.create({
    _id: 'leave_2026_01',
    id: 'leave_2026_01',
    employee: 'emp_web',
    type: 'casual',
    startDate: new Date('2026-11-25T00:00:00.000Z'),
    endDate: new Date('2026-11-26T00:00:00.000Z'),
    days: 2,
    reason: 'Attending family wedding.',
    status: 'approved',
    approvedBy: 'emp_hr',
    remarks: 'Approved. Ensure sprint tasks are handed over.',
    createdAt: new Date('2026-11-02T09:00:00.000Z'),
  });

  // 11. Seed 4 Clean Attendance Records (Yesterday's Date)
  const attendanceLogs = [
    { empId: 'emp_admin', inHour: '09:15', outHour: '18:30', mins: 555 },
    { empId: 'emp_lead', inHour: '09:20', outHour: '18:35', mins: 555 },
    { empId: 'emp_web', inHour: '09:25', outHour: '18:40', mins: 555 },
    { empId: 'emp_android', inHour: '09:18', outHour: '18:32', mins: 554 },
  ];

  for (const log of attendanceLogs) {
    await Attendance.create({
      _id: `att_${log.empId}_20261102`,
      id: `att_${log.empId}_20261102`,
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

  // 12. Seed Clean November 2026 Payroll for all 9 Employees
  // Includes Proration Demo for Intern Ananya Sen (joined Nov 15 => ₹8,000 prorated from ₹15,000)
  for (const emp of seedEmployeeList) {
    const isIntern = emp.role === 'intern';
    const isProrated = isIntern;
    const baseSal = emp.baseSalary;
    // For 30 days in Nov, Nov 15 to Nov 30 is 16 days: 15,000 * (16 / 30) = 8,000
    const netSal = isProrated ? 8000 : baseSal;

    await Payroll.create({
      _id: `pay_${emp._id}_2026_11`,
      id: `pay_${emp._id}_2026_11`,
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
      notes: isProrated ? 'Prorated salary for mid-month joining (Nov 15). Disbursal on 1st Dec.' : 'Regular monthly salary. Disbursal on 1st Dec.',
      createdAt: new Date('2026-11-01T00:00:00.000Z'),
    });
  }

  return {
    success: true,
    message: 'Database cleanly wiped and seeded with minimal demo dataset for all 9 roles.',
    counts: {
      branches: 1,
      employees: 9,
      users: 10, // 9 roles + 1 admin@gmail.com alias
      projects: 2,
      tasks: 4,
      leads: 2,
      quotations: 1,
      invoices: 1,
      tickets: 2,
      leaves: 1,
      attendance: 4,
      payroll: 9,
    },
  };
}

export const seedDatabase = wipeAndSeedDatabase;

