import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';
import Employee from '@/models/Employee';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Ticket from '@/models/Ticket';
import Lead from '@/models/Lead';
import Attendance from '@/models/Attendance';
import { seedDatabase } from '@/lib/seedData';

export async function GET() {
  try {
    await connectToDatabase();

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Execute independent queries in parallel via Promise.all
    const [
      totalEmployees,
      presentToday,
      topPerformers,
      allProjects,
      recentTickets,
      allLeads,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
    ] = await Promise.all([
      Employee.countDocuments(),
      Attendance.countDocuments({ date: todayStr, status: 'present' }),
      Employee.find({ completedTasksCount: { $gt: 0 } })
        .sort({ completedTasksCount: -1, createdAt: 1 })
        .limit(5)
        .select('name role department avatar completedTasksCount'),
      Project.find(),
      Ticket.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('assignedTo', 'name avatar'),
      Lead.find(),
      Task.countDocuments(),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({ status: 'in_progress' }),
      Task.countDocuments({ status: 'todo' }),
    ]);

    const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

    // Derived from allProjects (avoids redundant roundtrips)
    const activeProjects = allProjects.filter((p: any) => p.status !== 'completed').length;

    // Upcoming Deadlines (Projects)
    const sortedProjects = [...allProjects].sort((a: any, b: any) => {
      const tA = new Date(a.deadline || 0).getTime();
      const tB = new Date(b.deadline || 0).getTime();
      return tA - tB;
    });
    const upcomingDeadlines = sortedProjects.slice(0, 6).map((p: any) => {
      const deadlineDate = new Date(p.deadline);
      const diffTime = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        _id: p._id,
        title: p.title,
        client: p.client,
        deadline: p.deadline,
        diffDays,
        status: p.status,
        priority: p.priority,
        progress: p.progress,
      };
    });

    // Project Status Distribution
    const statusMap: Record<string, number> = {
      planning: 0,
      in_progress: 0,
      review: 0,
      completed: 0,
      on_hold: 0,
    };
    allProjects.forEach((p: any) => {
      const st = String(p.status || 'planning').toLowerCase();
      if (statusMap[st] !== undefined) {
        statusMap[st]++;
      }
    });

    const projectStatusDistribution = [
      { name: 'In Progress', value: statusMap.in_progress, color: '#6366f1' },
      { name: 'Planning', value: statusMap.planning, color: '#38bdf8' },
      { name: 'Review', value: statusMap.review, color: '#f59e0b' },
      { name: 'Completed', value: statusMap.completed, color: '#10b981' },
      { name: 'On Hold', value: statusMap.on_hold, color: '#ef4444' },
    ];

    // Leads Summary derived from allLeads
    const totalLeads = allLeads.length;
    let totalPipelineValue = 0;
    const leadStageMap: Record<string, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal: 0,
      won: 0,
    };
    allLeads.forEach((l: any) => {
      totalPipelineValue += Number(l.value) || 0;
      const st = String(l.status || 'new').toLowerCase();
      if (leadStageMap[st] !== undefined) {
        leadStageMap[st]++;
      }
    });

    const leadPipeline = [
      { stage: 'New', count: leadStageMap.new, fill: '#635BFF' },
      { stage: 'Contacted', count: leadStageMap.contacted, fill: '#3B82F6' },
      { stage: 'Qualified', count: leadStageMap.qualified, fill: '#10B981' },
      { stage: 'Proposal', count: leadStageMap.proposal, fill: '#F59E0B' },
      { stage: 'Won', count: leadStageMap.won, fill: '#059669' },
    ];

    return NextResponse.json({
      stats: {
        totalEmployees,
        activeProjects,
        attendanceRate,
        totalLeads,
        totalPipelineValue,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
      },
      leadPipeline,
      topPerformers,
      upcomingDeadlines,
      projectStatusDistribution,
      recentTickets,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
