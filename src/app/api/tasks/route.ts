import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Task from '@/models/Task';
import Employee from '@/models/Employee';
import Project from '@/models/Project';
import { getAuthUser, requireRoles, isValidDocId } from '@/lib/apiAuth';
import { recalculateProjectProgress } from '@/lib/projectEngine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const authUser = await getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');

    const query: any = {};
    if (status && status !== 'all') {
      if (status === 'new') {
        query.status = { $in: ['new', 'todo'] };
      } else {
        query.status = status;
      }
    }
    if (projectId) query.project = projectId;

    // DATA SCOPING: Admin (Manager) sees all tasks; others see only tasks assigned to them
    if (authUser && authUser.role !== 'admin_manager') {
      if (isValidDocId(authUser.id)) {
        query.assignedTo = authUser.id;
      } else {
        const found = await Employee.findOne({ email: authUser.email.toLowerCase() });
        if (found) query.assignedTo = found._id;
      }
    }

    const tasks = await Task.find(query)
      .sort({ dueDate: 1, createdAt: -1 })
      .populate('assignedTo', 'name email avatar role')
      .populate('project', 'title client status');

    const normalizedTasks = tasks.map((t: any) => {
      const obj = t.toObject ? t.toObject() : { ...t };
      if (obj.status === 'todo') {
        obj.status = 'new';
        Task.findByIdAndUpdate(obj._id || obj.id, { status: 'new' }).catch(() => {});
      }
      // If linked project is on hold and task is not completed, sync task to on_hold
      if (obj.project?.status === 'on_hold' && obj.status !== 'completed' && obj.status !== 'on_hold') {
        obj.status = 'on_hold';
        Task.findByIdAndUpdate(obj._id || obj.id, { status: 'on_hold' }).catch(() => {});
      }
      return obj;
    });

    return NextResponse.json(normalizedTasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Admin (Manager) and Team Leads can create and delegate tasks
    const authResult = await requireRoles(req, ['admin_manager', 'team_lead']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const body = await req.json();

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!body.status || body.status === 'todo') {
      body.status = 'new';
    }

    // If parent project is on hold and task is not completed, automatically assign to on_hold
    if (body.project && body.status !== 'completed') {
      const parentProject = await Project.findById(body.project);
      if (parentProject && parentProject.status === 'on_hold') {
        body.status = 'on_hold';
      }
    }

    if (body.status === 'completed' && !body.completedAt) {
      body.completedAt = new Date();
    }

    const newTask = await Task.create(body);

    if (body.status === 'completed' && body.assignedTo) {
      await Employee.findByIdAndUpdate(body.assignedTo, {
        $inc: { completedTasksCount: 1 },
      });
    }

    // Auto-calculate dynamic project progress
    if (newTask.project) {
      await recalculateProjectProgress(String(newTask.project));
    }

    const populated = await Task.findById(newTask._id)
      .populate('assignedTo', 'name email avatar role')
      .populate('project', 'title client status');

    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
