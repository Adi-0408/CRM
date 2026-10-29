import { NextResponse } from 'next/server';
import { wipeAndSeedDatabase } from '@/lib/seedData';
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

export const dynamic = 'force-dynamic';

export async function GET() {
  return POST();
}

export async function POST() {
  try {
    const result = await wipeAndSeedDatabase();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed database' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await connectToDatabase();
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
    ]);
    return NextResponse.json({
      success: true,
      message: 'All database collections successfully wiped clean.',
    });
  } catch (error: any) {
    console.error('Error clearing database:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear database' },
      { status: 500 }
    );
  }
}
