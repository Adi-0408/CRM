import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Task from '@/models/Task';
import Employee from '@/models/Employee';
import { getAuthUser, requireRoles } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    await connectToDatabase();
    const body = await req.json();

    const oldTask = await Task.findById(params.id);
    if (!oldTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Role check: Non-admin users can ONLY update status on their assigned task
    if (authUser && authUser.role !== 'admin_manager') {
      const isAssigned =
        oldTask.assignedTo?.toString() === authUser.id ||
        (authUser.email && (oldTask as any).assignedTo?.email === authUser.email);

      if (!isAssigned) {
        return NextResponse.json(
          { error: 'Forbidden: You can only update the status of tasks assigned to you.' },
          { status: 403 }
        );
      }

      // Disallow reassigning task or changing project/title by non-admin
      const safeUpdate: any = {};
      if (body.status) safeUpdate.status = body.status;
      if (body.status === 'completed') safeUpdate.completedAt = new Date();
      else if (body.status && body.status !== 'completed') safeUpdate.completedAt = null;

      const updated = await Task.findByIdAndUpdate(params.id, safeUpdate, { new: true })
        .populate('assignedTo', 'name email avatar role')
        .populate('project', 'title client status');

      return NextResponse.json(updated);
    }

    // Manager / Admin update flow
    if (body.status === 'completed' && oldTask.status !== 'completed') {
      body.completedAt = new Date();
      if (oldTask.assignedTo) {
        await Employee.findByIdAndUpdate(oldTask.assignedTo, {
          $inc: { completedTasksCount: 1 },
        });
      }
    } else if (body.status && body.status !== 'completed' && oldTask.status === 'completed') {
      body.completedAt = null;
      if (oldTask.assignedTo) {
        await Employee.findByIdAndUpdate(oldTask.assignedTo, {
          $inc: { completedTasksCount: -1 },
        });
      }
    }

    const updated = await Task.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    })
      .populate('assignedTo', 'name email avatar role')
      .populate('project', 'title client status');

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Only Admin (Manager) can delete tasks
    const authResult = await requireRoles(req, ['admin_manager']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const task = await Task.findById(params.id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.status === 'completed' && task.assignedTo) {
      await Employee.findByIdAndUpdate(task.assignedTo, {
        $inc: { completedTasksCount: -1 },
      });
    }

    await Task.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
