import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';
import Employee from '@/models/Employee';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Ticket from '@/models/Ticket';
import Lead from '@/models/Lead';
import Attendance from '@/models/Attendance';

export async function GET() {
  try {
    await connectToDatabase();

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Execute consolidated queries in parallel via Promise.all
    const [
      totalEmployees,
      todayAttendance,
      topPerformers,
      allProjects,
      recentTickets,
      allLeads,
      allTasks,
    ] = await Promise.all([
      Employee.countDocuments(),
      Attendance.find({ date: todayStr }),
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
      Task.find().populate('project', 'status').select('status project'),
    ]);

    const presentToday = todayAttendance.filter((a: any) => a.status === 'present').length;
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t: any) => t.status === 'completed').length;
    const inProgressTasks = allTasks.filter(
      (t: any) => t.status === 'in_progress' && t.project?.status !== 'on_hold'
    ).length;
    const onHoldTasks = allTasks.filter(
      (t: any) => t.status === 'on_hold' || t.project?.status === 'on_hold'
    ).length;
    const newTasks = allTasks.filter(
      (t: any) => (t.status === 'new' || t.status === 'todo') && t.project?.status !== 'on_hold'
    ).length;

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
      new: 0,
      in_progress: 0,
      completed: 0,
    };
    allProjects.forEach((p: any) => {
      let st = String(p.status || 'new').toLowerCase();
      if (st === 'planning') st = 'new';
      if (statusMap[st] !== undefined) {
        statusMap[st]++;
      } else {
        statusMap.new++;
      }
    });

    const projectStatusDistribution = [
      { name: 'New', value: statusMap.new, color: '#38bdf8' },
      { name: 'In Progress', value: statusMap.in_progress, color: '#6366f1' },
      { name: 'Completed', value: statusMap.completed, color: '#10b981' },
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
        onHoldTasks,
        newTasks,
        todoTasks: newTasks,
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
