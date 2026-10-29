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
import { DEMO_CREDENTIALS } from '@/types/auth';
import { getLocalTodayStr } from '@/lib/attendanceEngine';

export async function wipeAndSeedDatabase() {
  await connectToDatabase();

  // 1. Complete Data Wipe across all collections
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
  ]);

  // 2. Seed strictly the single admin account
  const adminCred = DEMO_CREDENTIALS[0] || {
    name: 'admin',
    email: 'admin@gmail.com',
    password: 'admin123',
    role: 'admin_manager',
    department: 'Executive Management',
    roleTitle: 'Super Admin',
    baseSalary: 100000,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  };

  const admin = await Employee.create({
    _id: 'admin',
    name: 'admin',
    email: 'admin@gmail.com',
    password: 'admin123',
    role: 'admin_manager',
    department: 'Executive Management',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    salary: 100000,
    baseSalary: 100000,
    status: 'active',
    phone: '+91 98200 12345',
    joinDate: new Date('2026-01-15').toISOString(),
    completedTasksCount: 0,
  });

  // Mirror to User collection
  await User.create({
    _id: 'admin',
    name: 'admin',
    email: 'admin@gmail.com',
    password: 'admin123',
    role: 'admin_manager',
    department: 'Executive Management',
    designation: 'Super Admin',
    baseSalary: 100000,
    salary: { basic: 70000, allowances: 30000 },
    status: 'active',
  });

  // 3. Seed Today's Attendance Record for Admin (09:10 am -> 06:00 pm, 2 Sessions, Full Day)
  const todayStr = getLocalTodayStr();
  const makeTodayIso = (hours: number, minutes: number) => {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  await Attendance.create({
    _id: `admin_${todayStr}`,
    employee: 'admin',
    date: todayStr,
    sessions: [
      {
        checkIn: makeTodayIso(9, 10),
        checkOut: makeTodayIso(13, 10),
        durationMinutes: 240,
        notes: 'Morning executive planning session',
      },
      {
        checkIn: makeTodayIso(13, 55),
        checkOut: makeTodayIso(18, 0),
        durationMinutes: 245,
        notes: 'Afternoon operations review',
      },
    ],
    totalMinutes: 485,
    effectiveMinutes: 485,
    isLate: false,
    lateByMinutes: 0,
    status: 'full_day',
  });

  // 4. Seed Monthly Payroll Record for Admin
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const base = 100000;
  const dailyRate = Math.round(base / 30);
  const halfDayRate = Math.round(dailyRate * 0.5);

  await Payroll.create({
    _id: `admin_${currentMonth}`,
    employeeId: admin._id,
    month: currentMonth,
    baseSalary: base,
    dailyRate,
    halfDayRate,
    approvedLeaves: 0,
    unapprovedLeaves: 0,
    halfDays: 0,
    unpaidLeaveDeduction: 0,
    halfDayDeduction: 0,
    totalDeductions: 0,
    netSalary: base,
    status: 'Pending',
  });

  return {
    success: true,
    message: 'All other users removed. Single admin account (name: admin, email: admin@gmail.com, pass: admin123) successfully created in Firebase Firestore.',
    admin: {
      id: String(admin._id),
      name: 'admin',
      email: 'admin@gmail.com',
      role: 'admin_manager',
    },
  };
}

export const seedDatabase = wipeAndSeedDatabase;
