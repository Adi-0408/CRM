import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Task from '@/models/Task';
import Employee from '@/models/Employee';
import { getAuthUser, requireRoles } from '@/lib/apiAuth';
import { recalculateProjectProgress } from '@/lib/projectEngine';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }
    if (authUser.isCompanySuspended) {
      return NextResponse.json({ error: 'Forbidden: Organization suspended' }, { status: 403 });
    }

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(context.params);
    const oldTask = await Task.findById(resolvedParams.id);
    if (!oldTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // IDOR Protection: Tenant boundary check
    if (!authUser.isDemo && authUser.role !== 'platform_super_admin' && oldTask.company_id && oldTask.company_id !== authUser.company_id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await req.json();
    delete body.company_id;

    if (body.status === 'todo') {
      body.status = 'new';
    }

    const isPrivileged =
      authUser.role === 'admin_manager' ||
      authUser.role === 'company_admin' ||
      authUser.role === 'platform_super_admin' ||
      authUser.role === 'team_lead';

    // Role check: Non-admin & Non-TeamLead users can ONLY update status on their assigned task
    if (!isPrivileged) {
      const isAssigned =
        oldTask.assignedTo?.toString() === authUser.id ||
        (authUser.email && (oldTask as any).assignedTo?.email === authUser.email);

      if (!isAssigned) {
        return NextResponse.json(
          { error: 'Forbidden: You can only update the status of tasks assigned to you.' },
          { status: 403 }
        );
      }

      const safeUpdate: any = {};
      if (body.status) safeUpdate.status = body.status;
      if (body.status === 'completed') safeUpdate.completedAt = new Date();
      else if (body.status && body.status !== 'completed') safeUpdate.completedAt = null;

      const updated = await Task.findByIdAndUpdate(resolvedParams.id, safeUpdate, { new: true })
        .populate('assignedTo', 'name email avatar role')
        .populate('project', 'title client status');

      if (oldTask.project) {
        await recalculateProjectProgress(String(oldTask.project));
      }

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

    const updated = await Task.findByIdAndUpdate(resolvedParams.id, body, {
      new: true,
      runValidators: true,
    })
      .populate('assignedTo', 'name email avatar role')
      .populate('project', 'title client status');

    if (updated?.project) {
      await recalculateProjectProgress(String(updated.project));
    }
    if (oldTask.project && String(oldTask.project) !== String(updated?.project)) {
      await recalculateProjectProgress(String(oldTask.project));
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
): Promise<NextResponse> {
  try {
    const authResult = await requireRoles(req, ['admin_manager', 'company_admin', 'team_lead', 'platform_super_admin']);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();
    const resolvedParams = await Promise.resolve(context.params);
    const task = await Task.findById(resolvedParams.id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // IDOR Protection: Tenant boundary check
    if (!authResult.isSuperAdmin && task.company_id && task.company_id !== authResult.companyId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.status === 'completed' && task.assignedTo) {
      await Employee.findByIdAndUpdate(task.assignedTo, {
        $inc: { completedTasksCount: -1 },
      });
    }

    await Task.findByIdAndDelete(resolvedParams.id);

    if (task.project) {
      await recalculateProjectProgress(String(task.project));
    }

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
